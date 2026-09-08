import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../../lib/mongodb';
import UserCases from '../../../../../models/userCases';
import CaseNote from '../../../../../models/caseNote';
import AdminActivity from '../../../../../models/adminActivity';
import { withAdmin } from '../../../../../lib/adminAuth';
import { toObjectId } from '../../../../../lib/adminQueries';

export const dynamic = 'force-dynamic';

async function loadCase(id) {
  const oid = toObjectId(id);
  if (oid) {
    const found = await UserCases.findById(oid).select('_id case_id user_id').lean();
    if (found) return found;
  }
  return UserCases.findOne({ $or: [{ case_id: id }, { claim_id: id }] })
    .select('_id case_id user_id')
    .lean();
}

export const GET = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  await connectToDatabase();

  const found = await loadCase(id);
  if (!found) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const notes = await CaseNote.find({ case_id: found._id })
    .sort({ pinned: -1, createdAt: -1 })
    .lean();

  return NextResponse.json({
    data: notes.map((n) => ({
      _id: String(n._id),
      body: n.body,
      pinned: n.pinned,
      admin_email: n.admin_email,
      created_at: n.createdAt,
    })),
  });
});

export const POST = withAdmin(async (req, ctx, admin) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const text = String(body.body || '').trim();

  if (!text) {
    return NextResponse.json({ error: 'Note body is required' }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json(
      { error: 'Note is too long (max 5000 characters)' },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const found = await loadCase(id);
  if (!found) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const note = await CaseNote.create({
    case_id: found._id,
    user_id: found.user_id || null,
    admin_id: admin.id,
    admin_email: admin.email,
    body: text,
    pinned: body.pinned === true,
  });

  await AdminActivity.create({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'note_added',
    summary: `Note added to case ${found.case_id}: ${text.slice(0, 140)}`,
    case_id: found._id,
    case_number: found.case_id,
    user_id: found.user_id || null,
    changes: {},
  });

  return NextResponse.json(
    {
      data: {
        _id: String(note._id),
        body: note.body,
        pinned: note.pinned,
        admin_email: note.admin_email,
        created_at: note.createdAt,
      },
    },
    { status: 201 },
  );
});

export const DELETE = withAdmin(async (req, ctx, admin) => {
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const noteId = toObjectId(searchParams.get('note_id'));

  if (!noteId) {
    return NextResponse.json({ error: 'note_id is required' }, { status: 400 });
  }

  await connectToDatabase();
  const found = await loadCase(id);
  if (!found) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const deleted = await CaseNote.findOneAndDelete({
    _id: noteId,
    case_id: found._id,
  }).lean();

  if (!deleted) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  await AdminActivity.create({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'note_deleted',
    summary: `Note removed from case ${found.case_id}`,
    case_id: found._id,
    case_number: found.case_id,
    user_id: found.user_id || null,
    changes: { body: { from: deleted.body, to: null } },
  });

  return NextResponse.json({ message: 'Note deleted' });
});
