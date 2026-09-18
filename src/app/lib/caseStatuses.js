/**
 * The admin-managed case workflow.
 *
 * Distinct from the two statuses already on a case:
 *   - `claim_status` is what the automation reports (Success / Pending / Failed)
 *   - `status` (boolean) is the legacy approval flag
 *
 * This is the human workflow an admin drives, and it is what the claimant sees
 * on their tracking page. No imports here, so both server routes and client
 * components can use it.
 */

export const CASE_STATUS_GROUPS = [
  {
    key: 'review',
    label: 'Review',
    statuses: [
      { key: 'under_review', label: 'Under Review', tone: 'info' },
      {
        key: 'initial_review_completed',
        label: 'Initial Review Completed',
        tone: 'success',
      },
    ],
  },
  {
    key: 'eligibility',
    label: 'Eligibility',
    statuses: [
      {
        key: 'eligibility_verification',
        label: 'Eligibility Verification',
        tone: 'info',
      },
      {
        key: 'eligibility_confirmed',
        label: 'Eligibility Confirmed',
        tone: 'success',
      },
      { key: 'eligibility_failed', label: 'Eligibility Failed', tone: 'danger' },
    ],
  },
  {
    key: 'verification',
    label: 'Verification',
    statuses: [
      {
        key: 'property_verification',
        label: 'Property Verification',
        tone: 'info',
      },
      {
        key: 'ownership_verification',
        label: 'Ownership Verification',
        tone: 'info',
      },
      {
        key: 'document_verification',
        label: 'Document Verification',
        tone: 'info',
      },
    ],
  },
  {
    key: 'documents',
    label: 'Documents',
    statuses: [
      {
        key: 'additional_information_required',
        label: 'Additional Information Required',
        tone: 'warning',
      },
      {
        key: 'documents_requested',
        label: 'Documents Requested',
        tone: 'warning',
      },
      { key: 'documents_received', label: 'Documents Received', tone: 'info' },
      { key: 'documents_approved', label: 'Documents Approved', tone: 'success' },
      { key: 'documents_rejected', label: 'Documents Rejected', tone: 'danger' },
    ],
  },
  {
    key: 'decision',
    label: 'Decision',
    statuses: [
      { key: 'processing_claim', label: 'Processing Claim', tone: 'info' },
      { key: 'claim_approved', label: 'Claim Approved', tone: 'success' },
      { key: 'claim_rejected', label: 'Claim Rejected', tone: 'danger' },
    ],
  },
  {
    key: 'funds',
    label: 'Funds',
    statuses: [
      { key: 'funds_initiated', label: 'Funds Initiated', tone: 'info' },
      { key: 'funds_approved', label: 'Funds Approved', tone: 'success' },
      { key: 'funds_processing', label: 'Funds Processing', tone: 'info' },
      { key: 'funds_transferred', label: 'Funds Transferred', tone: 'success' },
      {
        key: 'payment_completed',
        label: 'Payment Completed',
        tone: 'success',
        terminal: true,
      },
    ],
  },
  {
    key: 'case_management',
    label: 'Case Management',
    statuses: [
      { key: 'action_required', label: 'Action Required', tone: 'warning' },
      { key: 'case_on_hold', label: 'Case On Hold', tone: 'warning' },
      { key: 'case_reopened', label: 'Case Reopened', tone: 'info' },
      {
        key: 'case_cancelled',
        label: 'Case Cancelled',
        tone: 'danger',
        terminal: true,
      },
      {
        key: 'case_closed',
        label: 'Case Closed',
        tone: 'neutral',
        terminal: true,
      },
    ],
  },
];

/** Flat list, in the order they appear in the groups. */
export const CASE_STATUSES = CASE_STATUS_GROUPS.flatMap((g) =>
  g.statuses.map((s) => ({ ...s, group: g.key, groupLabel: g.label })),
);

export const CASE_STATUS_KEYS = CASE_STATUSES.map((s) => s.key);

const BY_KEY = CASE_STATUSES.reduce((acc, s) => {
  acc[s.key] = s;
  return acc;
}, {});

export function getCaseStatus(key) {
  return BY_KEY[key] || null;
}

export function caseStatusLabel(key) {
  return BY_KEY[key]?.label || null;
}

export function caseStatusTone(key) {
  return BY_KEY[key]?.tone || 'neutral';
}

export function isValidCaseStatus(key) {
  return Object.prototype.hasOwnProperty.call(BY_KEY, key);
}

/** Statuses that mean the case needs the claimant to do something. */
export const CLAIMANT_ACTION_STATUSES = [
  'additional_information_required',
  'documents_requested',
  'action_required',
];

export function requiresClaimantAction(key) {
  return CLAIMANT_ACTION_STATUSES.includes(key);
}
