// src/app/api/cron/retry/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import UserCases from '../../../models/userCases';

// Secret key to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here';

export async function GET(req) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const now = new Date();

    // Find pending retries
    const pending = await UserCases.find({
      claim_retryable: true,
      claim_retry_exhausted: false,
      claim_next_retry_at: { $lte: now }
    });

    console.log(`[Retry Cron] Found ${pending.length} claims to retry`);

    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const claim of pending) {
      try {
        const attempt = (claim.claim_retry_count || 0) + 1;
        const maxAttempts = claim.claim_max_retries || 3;
        const exhausted = attempt > maxAttempts;

        // Update DB
        await UserCases.updateOne(
          { _id: claim._id },
          {
            $set: {
              claim_retry_count: attempt,
              claim_last_attempt_at: now,
              claim_retry_exhausted: exhausted,
              claim_retryable: !exhausted
            }
          }
        );

        if (!exhausted) {
          // Call the RDP claim submission API
          const apiBase = process.env.API_BASE_URL || 'http://localhost:5001';
          const response = await fetch(`${apiBase}/api/claim-submission`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              property_ids: claim.property_ids || [],
              user_id: claim.user_id,
              case_id: claim.case_id,
              attempt: attempt,
              form_data: claim.form_data || {}
            })
          });

          if (response.ok) {
            succeeded++;
            console.log(`[Retry Cron] ✅ Retry succeeded for ${claim.case_id} (attempt ${attempt})`);
          } else {
            failed++;
            console.log(`[Retry Cron] ❌ Retry failed for ${claim.case_id} (attempt ${attempt})`);
          }
        } else {
          failed++;
          console.log(`[Retry Cron] ⏹️ Retry exhausted for ${claim.case_id} (attempt ${attempt})`);
        }

        results.push({
          case_id: claim.case_id,
          attempt,
          exhausted,
          success: !exhausted
        });

      } catch (error) {
        failed++;
        console.error(`[Retry Cron] Error for ${claim.case_id}:`, error);
        results.push({
          case_id: claim.case_id,
          error: error.message,
          success: false
        });
      }
    }

    return NextResponse.json({
      processed: pending.length,
      succeeded,
      failed,
      results,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('[Retry Cron] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}