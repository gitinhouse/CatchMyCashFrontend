/**
 * Single source of truth for how a UserCases document maps onto the claim
 * lifecycle. The admin API and the admin UI both import from here so a case
 * never shows one stage on the dashboard and a different one on its detail
 * page.
 *
 * Mirrors the milestone logic the claimant sees in components/CaseTracking.jsx.
 */

/** Ordered pipeline stages. `key` is stable and safe to use in query strings. */
export const PIPELINE_STAGES = [
  { key: 'property_selected', label: 'Property Selected', short: 'Property' },
  { key: 'info_submitted', label: 'Information Provided', short: 'Info' },
  { key: 'claim_filed', label: 'Claim Filed with State', short: 'Filed' },
  { key: 'documents_uploaded', label: 'Documents Uploaded', short: 'Docs Up' },
  { key: 'documents_verified', label: 'Documents Verified', short: 'Verified' },
  { key: 'under_review', label: 'Submitted for State Review', short: 'Review' },
  { key: 'approved', label: 'Claim Approved', short: 'Approved' },
];

export const STAGE_LABELS = PIPELINE_STAGES.reduce((acc, s) => {
  acc[s.key] = s.label;
  return acc;
}, {});

/** Coarse status used for the headline badge and the "claims by status" chart. */
export const CASE_STATUS = {
  APPROVED: 'approved',
  IN_REVIEW: 'in_review',
  DOCS_PENDING: 'docs_pending',
  PROCESSING: 'processing',
  FAILED: 'failed',
  DRAFT: 'draft',
};

export const CASE_STATUS_META = {
  [CASE_STATUS.APPROVED]: { label: 'Approved', tone: 'success' },
  [CASE_STATUS.IN_REVIEW]: { label: 'Under State Review', tone: 'info' },
  [CASE_STATUS.DOCS_PENDING]: { label: 'Awaiting Documents', tone: 'warning' },
  [CASE_STATUS.PROCESSING]: { label: 'Processing', tone: 'neutral' },
  [CASE_STATUS.FAILED]: { label: 'Failed', tone: 'danger' },
  [CASE_STATUS.DRAFT]: { label: 'Draft / Incomplete', tone: 'muted' },
};

/** Reasons a case lands in the admin action queue, most urgent first. */
export const ATTENTION_REASONS = {
  CLAIM_FAILED: {
    key: 'claim_failed',
    label: 'Claim filing failed',
    severity: 'high',
  },
  RETRY_EXHAUSTED: {
    key: 'retry_exhausted',
    label: 'Automatic retries exhausted',
    severity: 'high',
  },
  DOC_UPLOAD_FAILED: {
    key: 'doc_upload_failed',
    label: 'Document verification failed',
    severity: 'high',
  },
  RETRY_OVERDUE: {
    key: 'retry_overdue',
    label: 'Retry overdue',
    severity: 'medium',
  },
  READY_FOR_REVIEW: {
    key: 'ready_for_review',
    label: 'Ready for admin review',
    severity: 'medium',
  },
  STALLED: {
    key: 'stalled',
    label: 'Stalled with no progress',
    severity: 'medium',
  },
  MISSING_CLAIM_ID: {
    key: 'missing_claim_id',
    label: 'Filed but no Claim ID received',
    severity: 'medium',
  },
  MISSING_DOCUMENTS: {
    key: 'missing_documents',
    label: 'Required documents missing',
    severity: 'low',
  },
};

/** A case with no movement for this many days is treated as stalled. */
export const STALLED_AFTER_DAYS = 7;

const REQUIRED_DOC_FIELDS = ['proof_id', 'ssn_id', 'adress_proof'];
export const ALL_DOC_FIELDS = [
  'signed_doc',
  'filled_agreement_doc',
  'agreement_doc',
  'claim_doc',
  'proof_id',
  'ssn_id',
  'adress_proof',
  'brith_proof',
  'employee_proof',
];

export const DOC_LABELS = {
  signed_doc: 'Digital Signature Form',
  filled_agreement_doc: 'Signed Agreement Form',
  agreement_doc: 'Agreement Document',
  claim_doc: 'Claim Form',
  proof_id: 'Government-issued Photo ID',
  ssn_id: 'Social Security Card or W2',
  adress_proof: 'Proof of Address',
  brith_proof: 'Birth Certificate',
  employee_proof: 'Employment Records',
};

const truthyString = (value) =>
  typeof value === 'string' && value.trim() !== '';

/**
 * Derive every status the admin panel needs from a raw case document.
 *
 * @param {object} caseDoc  A UserCases document (lean/plain object).
 * @param {object} [related]
 * @param {object} [related.details] Matching UserDetails document.
 * @param {object} [related.docs]    Matching UserDocs document.
 * @param {Array}  [related.properties] Matching UserProperty documents.
 * @param {Date}   [now]
 */
export function deriveCaseState(caseDoc, related = {}, now = new Date()) {
  const c = caseDoc || {};
  const details = related.details || null;
  const docs = related.docs || null;
  const properties = related.properties || [];

  const claimProcessStatus = (c.claim_process_task_status || '').toLowerCase();
  const uploadStatus = (c.document_upload_task_status || '').toLowerCase();
  const claimStatus = c.claim_status || null;

  const hasProperties =
    properties.length > 0 || (c.property_ids || []).length > 0;
  const hasUserInfo = !!details;

  const claimFiled =
    claimProcessStatus === 'completed' && claimStatus === 'Success';
  const claimFilingFailed =
    claimStatus === 'Failed' || claimProcessStatus === 'failed';

  const uploadCompleted = uploadStatus === 'completed';
  const uploadFailed = uploadStatus === 'failed';
  const uploadProcessing = uploadStatus === 'processing';

  const uploadedDocs = ALL_DOC_FIELDS.filter((f) => truthyString(docs?.[f]));
  const missingRequiredDocs = REQUIRED_DOC_FIELDS.filter(
    (f) => !truthyString(docs?.[f]),
  );
  const hasUploadedDocs = REQUIRED_DOC_FIELDS.some((f) =>
    truthyString(docs?.[f]),
  );

  // `status: false` is how the existing app marks a case approved.
  const isApproved = c.status === false;
  const submittedForReview = Boolean(c.submitted_at) && uploadCompleted;

  // ---- Furthest stage reached -------------------------------------------
  let stage = 'property_selected';
  if (hasProperties) stage = 'property_selected';
  if (hasUserInfo) stage = 'info_submitted';
  if (claimFiled) stage = 'claim_filed';
  if (claimFiled && hasUploadedDocs) stage = 'documents_uploaded';
  if (uploadCompleted) stage = 'documents_verified';
  if (submittedForReview) stage = 'under_review';
  if (isApproved) stage = 'approved';

  const stageIndex = PIPELINE_STAGES.findIndex((s) => s.key === stage);

  // ---- Headline status ---------------------------------------------------
  let status = CASE_STATUS.DRAFT;
  if (isApproved) {
    status = CASE_STATUS.APPROVED;
  } else if (claimFilingFailed || uploadFailed) {
    status = CASE_STATUS.FAILED;
  } else if (submittedForReview || uploadCompleted) {
    status = CASE_STATUS.IN_REVIEW;
  } else if (claimFiled) {
    status = CASE_STATUS.DOCS_PENDING;
  } else if (hasUserInfo || claimProcessStatus || uploadProcessing) {
    status = CASE_STATUS.PROCESSING;
  }

  // ---- Progress (matches the claimant-facing calculation) ----------------
  let progress;
  if (uploadFailed) {
    progress = 75;
  } else {
    const milestones = [
      hasProperties,
      hasUserInfo,
      claimFiled,
      hasUploadedDocs,
      uploadCompleted,
      submittedForReview || isApproved,
      isApproved,
    ];
    const earned = milestones.reduce((sum, done) => sum + (done ? 1 : 0), 0);
    progress = Math.round((earned / milestones.length) * 100);
  }

  // ---- Action queue ------------------------------------------------------
  const lastMovement = new Date(
    c.updatedAt || c.submitted_at || c.createdAt || now,
  );
  const daysSinceMovement = Math.floor(
    (now.getTime() - lastMovement.getTime()) / 86400000,
  );

  const attention = [];
  if (claimFilingFailed) attention.push(ATTENTION_REASONS.CLAIM_FAILED);
  if (uploadFailed) attention.push(ATTENTION_REASONS.DOC_UPLOAD_FAILED);
  if (c.claim_retry_exhausted || c.document_upload_retry_exhausted) {
    attention.push(ATTENTION_REASONS.RETRY_EXHAUSTED);
  }
  if (
    c.claim_retryable &&
    !c.claim_retry_exhausted &&
    c.claim_next_retry_at &&
    new Date(c.claim_next_retry_at) < now
  ) {
    attention.push(ATTENTION_REASONS.RETRY_OVERDUE);
  }
  if (claimFiled && !truthyString(c.claim_id)) {
    attention.push(ATTENTION_REASONS.MISSING_CLAIM_ID);
  }
  if (uploadCompleted && !isApproved) {
    attention.push(ATTENTION_REASONS.READY_FOR_REVIEW);
  }
  if (claimFiled && missingRequiredDocs.length > 0 && !uploadCompleted) {
    attention.push(ATTENTION_REASONS.MISSING_DOCUMENTS);
  }
  if (
    !isApproved &&
    !claimFilingFailed &&
    !uploadFailed &&
    daysSinceMovement >= STALLED_AFTER_DAYS
  ) {
    attention.push(ATTENTION_REASONS.STALLED);
  }

  const severityRank = { high: 0, medium: 1, low: 2 };
  attention.sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );

  const totalValue = properties.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0,
  );

  return {
    stage,
    stage_index: stageIndex,
    stage_label: STAGE_LABELS[stage],
    status,
    status_label: CASE_STATUS_META[status]?.label || status,
    progress,
    is_approved: isApproved,
    claim_filed: claimFiled,
    claim_filing_failed: claimFilingFailed,
    upload_completed: uploadCompleted,
    upload_failed: uploadFailed,
    upload_processing: uploadProcessing,
    submitted_for_review: submittedForReview,
    has_user_info: hasUserInfo,
    has_properties: hasProperties,
    uploaded_docs: uploadedDocs,
    missing_required_docs: missingRequiredDocs,
    document_count: uploadedDocs.length,
    total_value: totalValue,
    days_since_movement: daysSinceMovement,
    last_movement_at: lastMovement,
    attention,
    attention_keys: attention.map((a) => a.key),
    needs_attention: attention.length > 0,
    max_severity: attention[0]?.severity || null,
  };
}

/** Human-friendly label for a raw automation task status. */
export function taskStatusLabel(value) {
  if (!value) return 'Not started';
  const normalized = String(value).toLowerCase();
  const map = {
    queued: 'Queued',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    success: 'Completed',
  };
  return map[normalized] || value;
}
