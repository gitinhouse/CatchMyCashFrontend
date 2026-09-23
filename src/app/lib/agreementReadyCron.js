import cron from 'node-cron';

/**
 * Keep announcing agreements as they arrive.
 *
 * The automation server writes the agreement straight into the database, so
 * there is no request to hang the notice on. Noticing it when a claimant opens
 * the signing step only reaches whoever is looking at the time, and most
 * agreements land while nobody is — which is why the email kept being missed.
 * This runs on its own and closes that gap.
 *
 * Everything it needs is imported inside the tick rather than at module load:
 * the mail client throws on a missing API key, and a misconfiguration should
 * cost a failed sweep, not a server that will not start.
 */
const SCHEDULE = process.env.AGREEMENT_READY_CRON || '*/2 * * * *';

let running = false;

export default function startAgreementReadyCron() {
  if (process.env.AGREEMENT_READY_CRON_DISABLED === 'true') {
    console.log('[agreement-ready-cron] disabled by configuration');
    return null;
  }

  const task = cron.schedule(SCHEDULE, async () => {
    // A slow sweep must not have a second one running over the top of it.
    if (running) {
      console.log('[agreement-ready-cron] previous sweep still running, skipping');
      return;
    }
    running = true;

    try {
      const [{ default: connectToDatabase }, { sweepAgreementReadyNotices }] =
        await Promise.all([
          import('./mongodb.js'),
          import('./agreementReady.js'),
        ]);

      await connectToDatabase();
      await sweepAgreementReadyNotices({ limit: 50 });
    } catch (error) {
      console.error('[agreement-ready-cron] sweep failed:', error.message);
    } finally {
      running = false;
    }
  });

  console.log(`[agreement-ready-cron] scheduled (${SCHEDULE})`);
  return task;
}
