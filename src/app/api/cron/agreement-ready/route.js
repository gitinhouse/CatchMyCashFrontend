import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import { sweepAgreementReadyNotices } from '../../../lib/agreementReady';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here';

// A sweep that mails hundreds of people in one request helps nobody, so it
// works through a batch at a time and says whether more are waiting.
const DEFAULT_BATCH = 50;
const MAX_BATCH = 200;

/**
 * Tell claimants whose agreement has arrived.
 *
 * The agreement PDF is written into the database by the automation server;
 * nothing in this app runs at that moment. Noticing it when the claimant opens
 * the signing step covers only the claimants who happen to be looking, which
 * is why the notice was missed — most agreements land while nobody is on that
 * page. This sweep is the reliable half: run it on a schedule and every
 * agreement that has been saved gets announced, whether or not its claimant is
 * watching.
 *
 * Safe to run as often as you like: each record is stamped when its notice goes
 * out, and the stamp is what this query excludes.
 */
export async function GET(req) {
  return runSweep(req);
}

/** Same work, for schedulers that would rather POST. */
export async function POST(req) {
  return runSweep(req);
}

async function runSweep(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit'), 10) || DEFAULT_BATCH, 1),
      MAX_BATCH,
    );

    await connectToDatabase();

    const summary = await sweepAgreementReadyNotices({ limit });

    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('[cron/agreement-ready] sweep failed', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
