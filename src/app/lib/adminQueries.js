import { Types } from 'mongoose';
import { deriveCaseState } from './claimLifecycle';

/**
 * Aggregation stages that attach the applicant, their submitted details,
 * uploaded documents and selected properties to a UserCases document.
 *
 * UserDetails / UserDocs / UserProperty were introduced before cases existed,
 * so older rows carry a null case_id and are matched on user_id instead — the
 * same fallback the public /api/case route uses.
 */
export function caseJoinStages() {
  // `scopeToPropertyIds` narrows the legacy (null case_id) fallback to the
  // property ids this case actually submitted. Without it, every property a
  // claimant ever selected is attached to every one of their cases.
  const scopedLookup = (from, as, scopeToPropertyIds = false) => ({
    $lookup: {
      from,
      let: {
        caseId: '$_id',
        userId: '$user_id',
        propertyIds: { $ifNull: ['$property_ids', []] },
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $or: [
                { $eq: ['$case_id', '$$caseId'] },
                {
                  $and: [
                    { $eq: [{ $ifNull: ['$case_id', null] }, null] },
                    { $eq: ['$user_id', '$$userId'] },
                    ...(scopeToPropertyIds
                      ? [{ $in: ['$property_id', '$$propertyIds'] }]
                      : []),
                  ],
                },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ],
      as,
    },
  });

  return [
    {
      $lookup: {
        from: 'userinformations',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user_info',
      },
    },
    { $unwind: { path: '$user_info', preserveNullAndEmptyArrays: true } },
    scopedLookup('userdetails', 'user_details'),
    scopedLookup('userdocs', 'user_docs'),
    scopedLookup('userproperties', 'user_properties', true),
    {
      $lookup: {
        from: 'userlogins',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'login_account',
      },
    },
    {
      $addFields: {
        details: { $arrayElemAt: ['$user_details', 0] },
        docs: { $arrayElemAt: ['$user_docs', 0] },
        account: { $arrayElemAt: ['$login_account', 0] },
      },
    },
  ];
}

/** Shape one aggregated case into the row the admin list/table renders. */
export function toCaseRow(doc, now = new Date()) {
  const state = deriveCaseState(
    doc,
    {
      details: doc.details,
      docs: doc.docs,
      properties: doc.user_properties || [],
    },
    now,
  );

  const info = doc.user_info || {};
  const details = doc.details || {};

  // The processor files one claim per property, so the state's claim numbers
  // land on the property rows. The case-level claim_id is not always
  // populated, which is why the console used to read "No Claim ID yet" for
  // cases that plainly had claims — fall back to the property numbers.
  const propertyClaimIds = [
    ...new Set(
      (doc.user_properties || [])
        .map((p) => (p.claim_id ? String(p.claim_id).trim() : ''))
        .filter(Boolean),
    ),
  ];

  return {
    _id: String(doc._id),
    case_id: doc.case_id,
    claim_id: doc.claim_id || propertyClaimIds[0] || null,
    // Every distinct state claim number on this case, for cases that cover
    // several properties.
    claim_ids: doc.claim_id
      ? [...new Set([String(doc.claim_id), ...propertyClaimIds])]
      : propertyClaimIds,
    automation_id: doc.automation_id || null,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
    submitted_at: doc.submitted_at || null,
    raw_status: doc.status,

    applicant: {
      user_id: doc.user_id ? String(doc.user_id) : null,
      name:
        details.legal_name ||
        `${info.first_name || ''} ${info.last_name || ''}`.trim() ||
        null,
      email: details.email_id || info.email || null,
      phone: details.contact_no || null,
      city: details.city || info.city || null,
      state: details.state || info.state || null,
      zip_code: details.zip_code || info.zip_code || null,
      has_account: !!doc.account,
      account_type: doc.account?.userType || null,
    },

    property_count:
      (doc.user_properties || []).length || (doc.property_ids || []).length,
    total_value: state.total_value,

    claim_status: doc.claim_status || null,
    claim_message: doc.claim_message || '',
    claim_process_task_status: doc.claim_process_task_status || null,
    claim_process_task_id: doc.claim_process_task_id || null,
    document_upload_task_status: doc.document_upload_task_status || null,
    document_upload_task_id: doc.document_upload_task_id || null,
    document_upload_message: doc.document_upload_message || '',
    claim_process_stage: doc.claim_process_stage ?? null,

    retry: {
      claim_count: doc.claim_retry_count || 0,
      claim_max: doc.claim_max_retries ?? 3,
      claim_retryable: !!doc.claim_retryable,
      claim_exhausted: !!doc.claim_retry_exhausted,
      claim_next_at: doc.claim_next_retry_at || null,
      claim_last_at: doc.claim_last_attempt_at || null,
      claim_error_type: doc.claim_error_type || null,
      claim_error_code: doc.claim_error_code || null,
      claim_failed_stage: doc.claim_failed_stage || null,
      doc_count: doc.document_upload_retry_count || 0,
      doc_max: doc.document_upload_max_retries ?? 3,
      doc_retryable: !!doc.document_upload_retryable,
      doc_exhausted: !!doc.document_upload_retry_exhausted,
      doc_next_at: doc.document_upload_next_retry_at || null,
      doc_last_at: doc.document_upload_last_attempt_at || null,
      doc_error_type: doc.document_upload_error_type || null,
      doc_error_code: doc.document_upload_error_code || null,
      doc_failed_stage: doc.document_upload_failed_stage || null,
    },

    state,
  };
}

/** Parse `?a,b&c` style multi-value query params into a clean array. */
export function parseList(searchParams, key) {
  return (searchParams.getAll(key) || [])
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim())
    .filter(Boolean);
}

export function toObjectId(value) {
  if (!value) return null;
  const str = String(value).trim();
  return Types.ObjectId.isValid(str) ? new Types.ObjectId(str) : null;
}

/** Build a case-insensitive regex match that is safe against user input. */
export function safeRegex(value) {
  const escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $regex: escaped, $options: 'i' };
}

/**
 * The automation server may report its poll endpoint as an absolute URL or as
 * a bare path. A bare path rendered as an href resolves against this site and
 * goes nowhere, so anchor it to EXTENSION_URL instead.
 *
 * @param {string} value Raw `poll_url` from the case record.
 * @returns {string|null} An absolute URL, or null when there is nothing usable.
 */
export function resolvePollUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) return raw;

  const base = process.env.EXTENSION_URL?.replace(/\/$/, '');
  if (!base) return null;

  return `${base}/${raw.replace(/^\/+/, '')}`;
}
