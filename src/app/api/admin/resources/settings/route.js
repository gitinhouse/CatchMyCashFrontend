import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import { withAdmin } from '../../../../lib/adminAuth';
import ResourceSettings from '../../../../models/resourceSettings';
import { validateSettings } from '../../../../lib/resources/validate';
import { toSettingsDTO } from '../../../../lib/resources/serialize';
import { DEFAULT_HUB } from '../../../../lib/resources/constants';
import {
  invalid,
  logResourceActivity,
  refreshPublicResources,
} from '../../../../lib/resources/admin';

export const dynamic = 'force-dynamic';

const EMPTY = { heading: '', intro: '', metaTitle: '', metaDescription: '' };

/** The hub's saved text (empty fields fall back to the defaults shown). */
export const GET = withAdmin(async () => {
  await connectToDatabase();
  const doc = await ResourceSettings.findOne({ key: 'hub' }).lean();
  return NextResponse.json({
    settings: doc ? toSettingsDTO(doc, EMPTY) : { ...EMPTY, updatedAt: null },
    defaults: DEFAULT_HUB,
  });
});

export const PUT = withAdmin(async (req, ctx, admin) => {
  const { value, errors } = validateSettings(await req.json());
  if (Object.keys(errors).length) return invalid(errors);
  await connectToDatabase();
  const doc = await ResourceSettings.findOneAndUpdate(
    { key: 'hub' },
    { ...value, key: 'hub', updated_by: admin.email || '' },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  await logResourceActivity(admin, 'resource_settings_updated', 'Updated the Resources hub text and SEO');
  refreshPublicResources();
  return NextResponse.json({ settings: toSettingsDTO(doc, EMPTY), defaults: DEFAULT_HUB });
});
