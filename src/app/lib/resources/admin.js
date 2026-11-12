// Shared by the Resources admin API routes: cache invalidation after a change,
// the audit-log entry for it, and the error shape the editor understands.
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import AdminActivity from '../../models/adminActivity';
import { RESOURCES_CACHE_TAG } from './constants';

/** Make the public pages, sitemap, feed and llms.txt show the change now. */
export function refreshPublicResources() {
  revalidateTag(RESOURCES_CACHE_TAG);
}

/**
 * Record an admin's change in the audit log. A failure to log is reported but
 * does not undo or fail the change itself.
 */
export async function logResourceActivity(admin, action, summary, changes = {}) {
  try {
    await AdminActivity.create({
      admin_id: admin.id,
      admin_email: admin.email || 'admin',
      action,
      summary,
      changes,
    });
  } catch (error) {
    console.error('[resources] could not write audit log entry', action, error.message);
  }
}

/** 400 with the field errors the editor shows beside each input. */
export function invalid(errors, message = 'Some fields need attention.') {
  return NextResponse.json({ error: message, fields: errors }, { status: 400 });
}
