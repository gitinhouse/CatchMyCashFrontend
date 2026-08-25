// src/app/api/claims/retry-status/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import UserCases from '../../../models/userCases';
import { verifyToken } from '../../../lib/verifyToken';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('case_id');

    if (!caseId) {
      return NextResponse.json(
        { error: 'case_id is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the case by case_id only (no auth required)
    const doc = await UserCases.findOne({ 
      case_id: caseId
    });

    if (!doc) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json({
      claim_retry_count: doc.claim_retry_count || 0,
      claim_max_retries: doc.claim_max_retries || 3,
      claim_retryable: doc.claim_retryable || false,
      claim_retry_exhausted: doc.claim_retry_exhausted || false,
      claim_next_retry_at: doc.claim_next_retry_at,
      claim_error_type: doc.claim_error_type,
      claim_error_code: doc.claim_error_code,
      claim_status: doc.claim_status,
      claim_message: doc.claim_message,
    });

  } catch (error) {
    console.error('Error fetching retry status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch retry status' },
      { status: 500 }
    );
  }
}
