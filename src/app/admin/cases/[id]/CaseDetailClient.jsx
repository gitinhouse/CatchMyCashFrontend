'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Cpu,
  ExternalLink,
  FileText,
  Files,
  MessageSquarePlus,
  Pin,
  RefreshCcw,
  RotateCcw,
  Save,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { adminFetch } from '../../_lib/api';
import {
  formatDate,
  formatDateTime,
  humanize,
  money,
  relativeTime,
} from '../../_lib/format';
import { PageHeader } from '../../_components/AdminShell';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  LoadingBlock,
  Mono,
  Panel,
  ProgressBar,
  Select,
  SeverityBadge,
  StatusBadge,
  Table,
  Td,
  TextArea,
  TextInput,
  Th,
  Toast,
  Tr,
} from '../../_components/ui';

const TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'applicant', label: 'Applicant', icon: User },
  { key: 'properties', label: 'Properties', icon: Building2 },
  { key: 'documents', label: 'Documents', icon: Files },
  { key: 'automation', label: 'Automation & Webhooks', icon: Cpu },
  { key: 'notes', label: 'Notes & Audit', icon: MessageSquarePlus },
];

const PIPELINE = [
  { key: 'property_selected', label: 'Property Selected' },
  { key: 'info_submitted', label: 'Info Provided' },
  { key: 'claim_filed', label: 'Claim Filed' },
  { key: 'documents_uploaded', label: 'Docs Uploaded' },
  { key: 'documents_verified', label: 'Docs Verified' },
  { key: 'under_review', label: 'State Review' },
  { key: 'approved', label: 'Approved' },
];

export default function CaseDetailClient({ caseId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminFetch(`/api/admin/cases/${caseId}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  if (loading) return <LoadingBlock label="Loading case…" />;
  if (error) {
    return (
      <>
        <PageHeader title="Case" />
        <Panel>
          <ErrorState message={error} onRetry={load} />
        </Panel>
      </>
    );
  }

  const c = data.case;
  const state = c.state;

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link
            href="/admin/cases"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#888888] hover:text-[#E1261C]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to claims
          </Link>
        }
        title={c.case_id}
        description={
          c.claim_id
            ? `State Claim ID ${c.claim_id} · opened ${formatDate(c.created_at)}`
            : `No Claim ID yet · opened ${formatDate(c.created_at)}`
        }
        actions={
          <>
            <StatusBadge status={state.status} label={state.status_label} />
            <Button icon={RefreshCcw} onClick={load}>
              Refresh
            </Button>
          </>
        }
      />

      {state.attention.length > 0 && (
        <div className="mb-4 rounded-xl border border-[#F5C6C1] bg-[#FCE9E7] px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#B11912] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#B11912]">
                This case needs admin attention
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {state.attention.map((a) => (
                  <SeverityBadge key={a.key} severity={a.severity}>
                    {a.label}
                  </SeverityBadge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <PipelineStrip state={state} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E8E6E3] mb-4 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? 'border-[#E1261C] text-[#E1261C]'
                  : 'border-transparent text-[#888888] hover:text-[#0A0A0A]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.key === 'documents' && data.documents.length > 0 && (
                <Badge tone={active ? 'brand' : 'muted'}>
                  {data.documents.length}
                </Badge>
              )}
              {t.key === 'notes' && data.notes.length > 0 && (
                <Badge tone={active ? 'brand' : 'muted'}>{data.notes.length}</Badge>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <OverviewTab data={data} onUpdated={load} notify={notify} />
      )}
      {tab === 'applicant' && <ApplicantTab data={data} notify={notify} onUpdated={load} />}
      {tab === 'properties' && <PropertiesTab data={data} />}
      {tab === 'documents' && <DocumentsTab data={data} />}
      {tab === 'automation' && <AutomationTab data={data} onUpdated={load} notify={notify} />}
      {tab === 'notes' && <NotesTab data={data} onUpdated={load} notify={notify} />}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Pipeline strip                                                      */
/* ------------------------------------------------------------------ */

function PipelineStrip({ state }) {
  return (
    <div className="bg-white border border-[#E8E6E3] rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#888888]">
          Claim lifecycle
        </p>
        <p className="text-xs font-semibold text-[#4A4A4A] tabular-nums">
          {state.progress}% complete
        </p>
      </div>
      <ProgressBar
        value={state.progress}
        tone={
          state.status === 'failed'
            ? 'danger'
            : state.is_approved
              ? 'success'
              : 'brand'
        }
        className="mb-4"
      />
      <ol className="flex flex-wrap items-center gap-y-3">
        {PIPELINE.map((step, index) => {
          const reached = index <= state.stage_index;
          const isCurrent = index === state.stage_index;
          const failed =
            state.status === 'failed' &&
            isCurrent;

          return (
            <li key={step.key} className="flex items-center">
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    failed
                      ? 'bg-[#E1261C] text-white'
                      : reached
                        ? 'bg-[#00A67A] text-white'
                        : 'bg-[#F0EEEB] text-[#B4B0AA]'
                  }`}
                >
                  {failed ? (
                    <XCircle className="w-3 h-3" />
                  ) : reached ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={`text-xs whitespace-nowrap ${
                    isCurrent
                      ? 'font-semibold text-[#0A0A0A]'
                      : reached
                        ? 'text-[#4A4A4A]'
                        : 'text-[#B4B0AA]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < PIPELINE.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-[#D4D4D4] mx-2" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function OverviewTab({ data, onUpdated, notify }) {
  const c = data.case;
  const state = c.state;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 space-y-4">
        <Panel title="Case summary">
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            <Field label="Case number" mono>
              {c.case_id}
            </Field>
            <Field label="State Claim ID" mono>
              {c.claim_id || null}
            </Field>
            <Field label="Automation ID" mono>
              {c.automation_id || null}
            </Field>
            <Field label="Pipeline status">
              <StatusBadge status={state.status} label={state.status_label} />
            </Field>
            <Field label="Furthest stage">{state.stage_label}</Field>
            <Field label="Progress">{state.progress}%</Field>
            <Field label="Claim value">{money(c.total_value)}</Field>
            <Field label="Properties">{c.property_count}</Field>
            <Field label="Documents on file">{state.document_count}</Field>
            <Field label="Created">{formatDateTime(c.created_at)}</Field>
            <Field label="Submitted to state">
              {c.submitted_at ? formatDateTime(c.submitted_at) : null}
            </Field>
            <Field label="Last movement">
              {relativeTime(state.last_movement_at)} ({state.days_since_movement}d)
            </Field>
          </dl>
        </Panel>

        {(c.claim_message ||
          c.document_upload_message ||
          data.raw_case.claim_process_message) && (
          <Panel title="Messages from the claim processor">
            <div className="space-y-3">
              {c.claim_message && (
                <MessageBlock label="Claim message" text={c.claim_message} />
              )}
              {data.raw_case.claim_process_message && (
                <MessageBlock
                  label="Claim process message"
                  text={data.raw_case.claim_process_message}
                />
              )}
              {c.document_upload_message && (
                <MessageBlock
                  label="Document upload message"
                  text={c.document_upload_message}
                  tone="danger"
                />
              )}
            </div>
          </Panel>
        )}

        {data.other_cases.length > 0 && (
          <Panel
            title="Other cases for this applicant"
            bodyClassName="p-0"
          >
            <Table>
              <thead>
                <tr>
                  <Th>Case</Th>
                  <Th>Claim ID</Th>
                  <Th>Claim status</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {data.other_cases.map((row) => (
                  <Tr key={row._id}>
                    <Td>
                      <Link
                        href={`/admin/cases/${row._id}`}
                        className="font-['JetBrains_Mono',monospace] text-[13px] font-semibold text-[#E1261C] hover:underline"
                      >
                        {row.case_id}
                      </Link>
                    </Td>
                    <Td>
                      <Mono>{row.claim_id || '—'}</Mono>
                    </Td>
                    <Td>
                      <Badge tone={row.approved ? 'success' : 'neutral'}>
                        {row.approved ? 'Approved' : row.claim_status || 'Pending'}
                      </Badge>
                    </Td>
                    <Td>{formatDate(row.created_at)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Panel>
        )}
      </div>

      <div className="space-y-4">
        <AdminActionsPanel data={data} onUpdated={onUpdated} notify={notify} />
        <NotifyPanel data={data} notify={notify} onUpdated={onUpdated} />
      </div>
    </div>
  );
}

function MessageBlock({ label, text, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-[#F7F5F2] border-[#E8E6E3] text-[#4A4A4A]',
    danger: 'bg-[#FCE9E7] border-[#F5C6C1] text-[#B11912]',
  };
  return (
    <div className={`rounded-lg border px-3.5 py-3 ${tones[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-1">
        {label}
      </p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin actions                                                       */
/* ------------------------------------------------------------------ */

function AdminActionsPanel({ data, onUpdated, notify }) {
  const c = data.case;
  const [form, setForm] = useState({
    claim_id: c.claim_id || '',
    claim_status: c.claim_status || '',
    claim_process_stage: c.claim_process_stage ?? '',
  });
  const [saving, setSaving] = useState(false);

  const patch = async (body, successMessage) => {
    setSaving(true);
    try {
      await adminFetch(`/api/admin/cases/${c._id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      notify(successMessage);
      await onUpdated();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const approved = c.state.is_approved;

  return (
    <Panel title="Admin actions" subtitle="Every change is written to the audit log">
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888] mb-2">
            Case decision
          </p>
          <div className="flex gap-2">
            <Button
              variant={approved ? 'secondary' : 'primary'}
              icon={BadgeCheck}
              disabled={approved || saving}
              onClick={() =>
                patch({ status: false }, 'Case marked approved')
              }
              className="flex-1"
            >
              {approved ? 'Approved' : 'Mark approved'}
            </Button>
            <Button
              variant="secondary"
              icon={RotateCcw}
              disabled={!approved || saving}
              onClick={() => patch({ status: true }, 'Case reopened')}
              className="flex-1"
            >
              Reopen
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-[#F0EEEB] space-y-3">
          <TextInput
            label="State Claim ID"
            value={form.claim_id}
            onChange={(e) => setForm((f) => ({ ...f, claim_id: e.target.value }))}
            placeholder="Received from the state webhook"
          />
          <Select
            label="Claim status"
            value={form.claim_status}
            onChange={(e) =>
              setForm((f) => ({ ...f, claim_status: e.target.value }))
            }
            options={[
              { value: '', label: 'Not set' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Success', label: 'Success' },
              { value: 'Failed', label: 'Failed' },
            ]}
          />
          <TextInput
            label="Claim process stage"
            type="number"
            min="0"
            value={form.claim_process_stage}
            onChange={(e) =>
              setForm((f) => ({ ...f, claim_process_stage: e.target.value }))
            }
            hint="Numeric stage reported by the processor (0–4)"
          />
          <Button
            variant="primary"
            icon={Save}
            loading={saving}
            onClick={() =>
              patch(
                {
                  claim_id: form.claim_id,
                  claim_status: form.claim_status || null,
                  claim_process_stage:
                    form.claim_process_stage === ''
                      ? null
                      : form.claim_process_stage,
                },
                'Case details saved',
              )
            }
            className="w-full"
          >
            Save changes
          </Button>
        </div>

        <div className="pt-4 border-t border-[#F0EEEB]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888] mb-2">
            Retry controls
          </p>
          <div className="grid grid-cols-1 gap-2">
            <Button
              icon={RotateCcw}
              disabled={saving}
              onClick={() =>
                patch({ reset_retry: 'claim' }, 'Claim retry counter reset')
              }
            >
              Reset claim retries ({c.retry.claim_count}/{c.retry.claim_max})
            </Button>
            <Button
              icon={RotateCcw}
              disabled={saving}
              onClick={() =>
                patch({ reset_retry: 'document' }, 'Document retry counter reset')
              }
            >
              Reset document retries ({c.retry.doc_count}/{c.retry.doc_max})
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function NotifyPanel({ data, notify, onUpdated }) {
  const c = data.case;
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      notify('Both a title and a message are required', 'error');
      return;
    }
    setSending(true);
    try {
      await adminFetch('/api/admin/notify', {
        method: 'POST',
        body: JSON.stringify({
          user_id: c.applicant.user_id,
          case_id: c._id,
          title,
          message,
        }),
      });
      setTitle('');
      setMessage('');
      notify('Notification sent to the applicant');
      await onUpdated();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  if (!c.applicant.user_id) return null;

  return (
    <Panel
      title="Notify the applicant"
      subtitle="Appears in their dashboard notification feed"
    >
      <div className="space-y-3">
        <TextInput
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Additional document required"
          maxLength={200}
        />
        <TextArea
          label="Message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Explain what the applicant needs to do next…"
          maxLength={2000}
        />
        <Button
          variant="primary"
          icon={Bell}
          loading={sending}
          onClick={send}
          className="w-full"
        >
          Send notification
        </Button>
      </div>

      {data.notifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#F0EEEB]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888] mb-2">
            Recent notifications
          </p>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {data.notifications.slice(0, 6).map((n) => (
              <li key={n._id} className="text-xs">
                <div className="flex items-start gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      n.read ? 'bg-[#D4D4D4]' : 'bg-[#E1261C]'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0A0A0A]">{n.title}</p>
                    <p className="text-[#888888] line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-[#B4B0AA] mt-0.5">
                      {relativeTime(n.created_at)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Applicant                                                           */
/* ------------------------------------------------------------------ */

function ApplicantTab({ data }) {
  const details = data.submitted_details[0];
  const account = data.applicant_account;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Panel
        className="xl:col-span-2"
        title="Submitted claim form"
        subtitle="What the applicant entered in the multi-step form"
      >
        {!details ? (
          <EmptyState
            icon={User}
            title="No form submission yet"
            message="The applicant has not completed the details step."
          />
        ) : (
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            <Field label="Legal name">{details.legal_name}</Field>
            <Field label="Date of birth">{details.date_of_birth}</Field>
            <Field label="SSN (last 4)" mono>
              {details.ssn_last4 ? `•••-••-${details.ssn_last4}` : null}
            </Field>
            <Field label="Email">{details.email_id}</Field>
            <Field label="Phone">{details.contact_no}</Field>
            <Field label="Company">{details.company_name || null}</Field>
            <Field label="Address" className="col-span-2">
              {details.address}
            </Field>
            <Field label="City">{details.city}</Field>
            <Field label="State">{details.state}</Field>
            <Field label="ZIP" mono>
              {details.zip_code}
            </Field>
            <Field label="Former employer">{details.formal_employer || null}</Field>
            <Field label="Previous address" className="col-span-2">
              {details.previous_address || null}
            </Field>
            <Field label="Submitted">{formatDateTime(details.created_at)}</Field>
          </dl>
        )}

        {data.submitted_details.length > 1 && (
          <p className="mt-4 pt-4 border-t border-[#F0EEEB] text-xs text-[#888888]">
            {data.submitted_details.length} form submissions exist for this
            applicant; the most recent is shown.
          </p>
        )}
      </Panel>

      <div className="space-y-4">
        <Panel title="Search profile" subtitle="Captured during property search">
          {!account ? (
            <EmptyState title="No profile" message="No search profile on file." />
          ) : (
            <dl className="space-y-3">
              <Field label="Name">
                {`${account.first_name || ''} ${account.last_name || ''}`.trim()}
              </Field>
              <Field label="Address">{account.address}</Field>
              <Field label="City / State">
                {[account.city, account.state].filter(Boolean).join(', ')}
              </Field>
              <Field label="ZIP" mono>
                {account.zip_code}
              </Field>
              <Field label="Registered">{formatDate(account.created_at)}</Field>
            </dl>
          )}
          {data.case.applicant.user_id && (
            <div className="mt-4 pt-4 border-t border-[#F0EEEB]">
              <Link
                href={`/admin/users/${data.case.applicant.user_id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E1261C] hover:text-[#B11912]"
              >
                Open full user profile <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </Panel>

        <Panel title="Login account">
          {!data.login_account ? (
            <EmptyState
              title="No login account"
              message="This applicant has not been issued portal credentials."
            />
          ) : (
            <dl className="space-y-3">
              <Field label="Email">{data.login_account.email}</Field>
              <Field label="Role">
                <Badge tone={data.login_account.type === 'Admin' ? 'brand' : 'neutral'}>
                  {data.login_account.type}
                </Badge>
              </Field>
              <Field label="Created">{formatDate(data.login_account.created_at)}</Field>
            </dl>
          )}
        </Panel>

        {(data.referrals.link || data.referrals.earned.length > 0) && (
          <Panel title="Referrals">
            <dl className="space-y-3">
              <Field label="Referral code" mono>
                {data.referrals.link?.code || null}
              </Field>
              <Field label="Referred users">{data.referrals.earned.length}</Field>
              <Field label="Total commission">
                {money(
                  data.referrals.earned.reduce(
                    (s, r) => s + (Number(r.commission) || 0),
                    0,
                  ),
                )}
              </Field>
            </dl>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Properties                                                          */
/* ------------------------------------------------------------------ */

function PropertiesTab({ data }) {
  const properties = data.properties;
  const total = properties.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <Panel
      title="Claimed properties"
      subtitle={`${properties.length} propert${
        properties.length === 1 ? 'y' : 'ies'
      } · ${money(total)} total`}
      bodyClassName="p-0"
    >
      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties linked"
          message={
            data.raw_case.property_ids.length > 0
              ? `The case references ${data.raw_case.property_ids.length} property ID(s) but no detail records were found.`
              : 'This case has no selected properties.'
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Property ID</Th>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Reported</Th>
              <Th>Claimed</Th>
              <Th align="right">Amount</Th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <Tr key={p._id}>
                <Td>
                  <Mono className="text-[#E1261C] font-semibold">
                    {p.property_id}
                  </Mono>
                </Td>
                <Td>
                  <span className="text-sm text-[#0A0A0A]">
                    {p.property_title || '—'}
                  </span>
                </Td>
                <Td>{p.property_type || '—'}</Td>
                <Td>{p.reported_date || '—'}</Td>
                <Td>
                  <Badge tone={p.is_claimed ? 'success' : 'muted'}>
                    {p.is_claimed ? 'Claimed' : 'Not claimed'}
                  </Badge>
                </Td>
                <Td align="right">
                  <span className="font-semibold text-[#0A0A0A] tabular-nums">
                    {money(p.amount, true)}
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      {data.raw_case.property_ids.length > 0 && (
        <div className="px-5 py-3 border-t border-[#E8E6E3] bg-[#FCFBFA]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888] mb-1">
            Property IDs sent to the processor
          </p>
          <p className="font-['JetBrains_Mono',monospace] text-[12px] text-[#4A4A4A] break-all">
            {data.raw_case.property_ids.join(', ')}
          </p>
        </div>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

function DocumentsTab({ data }) {
  const c = data.case;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Panel
        className="xl:col-span-2"
        title="Uploaded documents"
        subtitle="Links are signed and expire after one hour"
        bodyClassName="p-0"
      >
        {data.documents.length === 0 ? (
          <EmptyState
            icon={Files}
            title="No documents uploaded"
            message="The applicant has not reached the document upload step."
          />
        ) : (
          <ul className="divide-y divide-[#F0EEEB]">
            {data.documents.map((doc) => (
              <li
                key={doc.field}
                className="flex items-center gap-3 px-5 py-3 hover:bg-[#FDF8F7] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FCE9E7] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#E1261C]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#0A0A0A]">{doc.label}</p>
                  <p className="text-[11px] text-[#888888] truncate">
                    {doc.filename}
                  </p>
                </div>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E8E6E3] text-xs font-semibold text-[#4A4A4A] hover:border-[#E1261C] hover:text-[#E1261C] transition-colors"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <Badge tone="muted">Unavailable</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="space-y-4">
        <Panel title="Verification status">
          <dl className="space-y-3">
            <Field label="Document task status">
              <Badge
                tone={
                  c.document_upload_task_status === 'completed'
                    ? 'success'
                    : c.document_upload_task_status === 'failed'
                      ? 'danger'
                      : c.document_upload_task_status === 'processing'
                        ? 'info'
                        : 'muted'
                }
              >
                {c.document_upload_task_status
                  ? humanize(c.document_upload_task_status)
                  : 'Not started'}
              </Badge>
            </Field>
            <Field label="Task ID" mono>
              {c.document_upload_task_id || null}
            </Field>
            <Field label="Retries">
              {c.retry.doc_count} / {c.retry.doc_max}
              {c.retry.doc_exhausted && (
                <Badge tone="danger" className="ml-2">
                  Exhausted
                </Badge>
              )}
            </Field>
            <Field label="Error type">
              {c.retry.doc_error_type ? humanize(c.retry.doc_error_type) : null}
            </Field>
            <Field label="Last attempt">
              {c.retry.doc_last_at ? formatDateTime(c.retry.doc_last_at) : null}
            </Field>
          </dl>
          {c.document_upload_message && (
            <div className="mt-4">
              <MessageBlock
                label="Processor message"
                text={c.document_upload_message}
                tone="danger"
              />
            </div>
          )}
        </Panel>

        <Panel title="Required document checklist">
          {data.missing_documents.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-[#00785A]">
              <CheckCircle2 className="w-4 h-4" />
              All required documents received
            </div>
          ) : (
            <ul className="space-y-2">
              {data.missing_documents.map((doc) => (
                <li
                  key={doc.field}
                  className="flex items-center gap-2 text-sm text-[#9A6400]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {doc.label}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Automation                                                          */
/* ------------------------------------------------------------------ */

function AutomationTab({ data, onUpdated, notify }) {
  const c = data.case;
  const [saving, setSaving] = useState(false);

  const resetRetry = async (which) => {
    setSaving(true);
    try {
      await adminFetch(`/api/admin/cases/${c._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ reset_retry: which }),
      });
      notify('Retry state reset');
      await onUpdated();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <PipelinePanel
        title="Claim submission pipeline"
        subtitle="First automation run — files the claim with the state"
        taskId={c.claim_process_task_id}
        taskStatus={c.claim_process_task_status}
        extra={[
          ['Claim status', c.claim_status],
          ['Claim ID', c.claim_id],
          ['Reported stage', c.claim_process_stage],
          ['Poll URL', data.raw_case.poll_url],
        ]}
        retry={{
          count: c.retry.claim_count,
          max: c.retry.claim_max,
          retryable: c.retry.claim_retryable,
          exhausted: c.retry.claim_exhausted,
          next: c.retry.claim_next_at,
          last: c.retry.claim_last_at,
          errorType: c.retry.claim_error_type,
          errorCode: c.retry.claim_error_code,
          failedStage: c.retry.claim_failed_stage,
        }}
        message={c.claim_message}
        onReset={() => resetRetry('claim')}
        saving={saving}
      />

      <PipelinePanel
        title="Document upload pipeline"
        subtitle="Second automation run — uploads documents against the Claim ID"
        taskId={c.document_upload_task_id}
        taskStatus={c.document_upload_task_status}
        extra={[['Submitted at', c.submitted_at ? formatDateTime(c.submitted_at) : null]]}
        retry={{
          count: c.retry.doc_count,
          max: c.retry.doc_max,
          retryable: c.retry.doc_retryable,
          exhausted: c.retry.doc_exhausted,
          next: c.retry.doc_next_at,
          last: c.retry.doc_last_at,
          errorType: c.retry.doc_error_type,
          errorCode: c.retry.doc_error_code,
          failedStage: c.retry.doc_failed_stage,
        }}
        message={c.document_upload_message}
        onReset={() => resetRetry('document')}
        saving={saving}
      />
    </div>
  );
}

function PipelinePanel({
  title,
  subtitle,
  taskId,
  taskStatus,
  extra = [],
  retry,
  message,
  onReset,
  saving,
}) {
  const tone =
    taskStatus === 'completed'
      ? 'success'
      : taskStatus === 'failed'
        ? 'danger'
        : taskStatus === 'processing' || taskStatus === 'queued'
          ? 'info'
          : 'muted';

  return (
    <Panel title={title} subtitle={subtitle}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Task status">
          <Badge tone={tone}>{taskStatus ? humanize(taskStatus) : 'Not started'}</Badge>
        </Field>
        <Field label="Task ID" mono>
          {taskId || null}
        </Field>
        {extra.map(([label, value]) => (
          <Field key={label} label={label} mono={label.includes('ID') || label.includes('URL')}>
            {value ? (
              label === 'Poll URL' ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E1261C] hover:underline break-all"
                >
                  {value}
                </a>
              ) : (
                String(value)
              )
            ) : null}
          </Field>
        ))}
      </dl>

      <div className="mt-4 pt-4 border-t border-[#F0EEEB]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888] mb-3">
          Retry state
        </p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Attempts">
            {retry.count} / {retry.max}
          </Field>
          <Field label="Flags">
            <div className="flex flex-wrap gap-1.5">
              {retry.retryable && <Badge tone="info">Retryable</Badge>}
              {retry.exhausted && <Badge tone="danger">Exhausted</Badge>}
              {!retry.retryable && !retry.exhausted && (
                <span className="text-[#B4B0AA]">—</span>
              )}
            </div>
          </Field>
          <Field label="Last attempt">
            {retry.last ? formatDateTime(retry.last) : null}
          </Field>
          <Field label="Next retry">
            {retry.next ? formatDateTime(retry.next) : null}
          </Field>
          <Field label="Error type">
            {retry.errorType ? humanize(retry.errorType) : null}
          </Field>
          <Field label="Error code" mono>
            {retry.errorCode || null}
          </Field>
          <Field label="Failed at stage">{retry.failedStage || null}</Field>
        </dl>

        {message && (
          <div className="mt-4">
            <MessageBlock
              label="Latest webhook message"
              text={message}
              tone={taskStatus === 'failed' ? 'danger' : 'neutral'}
            />
          </div>
        )}

        <Button
          icon={RotateCcw}
          onClick={onReset}
          loading={saving}
          className="mt-4 w-full"
        >
          Reset retry counter
        </Button>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Notes & audit                                                       */
/* ------------------------------------------------------------------ */

function NotesTab({ data, onUpdated, notify }) {
  const c = data.case;
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const addNote = async () => {
    if (!body.trim()) {
      notify('Write something before saving the note', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminFetch(`/api/admin/cases/${c._id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ body, pinned }),
      });
      setBody('');
      setPinned(false);
      notify('Note added');
      await onUpdated();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await adminFetch(`/api/admin/cases/${c._id}/notes?note_id=${noteId}`, {
        method: 'DELETE',
      });
      notify('Note deleted');
      await onUpdated();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Panel title="Internal notes" subtitle="Only visible to admins">
        <div className="space-y-3">
          <TextArea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Record what you checked, who you spoke to, or what happens next…"
            maxLength={5000}
          />
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-[#4A4A4A] cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="accent-[#E1261C]"
              />
              <Pin className="w-3.5 h-3.5" />
              Pin this note
            </label>
            <Button
              variant="primary"
              icon={MessageSquarePlus}
              loading={saving}
              onClick={addNote}
            >
              Add note
            </Button>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-[#F0EEEB]">
          {data.notes.length === 0 ? (
            <EmptyState
              icon={MessageSquarePlus}
              title="No notes yet"
              message="Notes help the next admin pick up where you left off."
            />
          ) : (
            <ul className="space-y-3">
              {data.notes.map((note) => (
                <li
                  key={note._id}
                  className={`rounded-lg border px-3.5 py-3 ${
                    note.pinned
                      ? 'border-[#F5C6C1] bg-[#FDF8F7]'
                      : 'border-[#E8E6E3] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-[#0A0A0A] whitespace-pre-wrap break-words flex-1">
                      {note.body}
                    </p>
                    <button
                      onClick={() => deleteNote(note._id)}
                      className="text-[#B4B0AA] hover:text-[#E1261C] shrink-0"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {note.pinned && (
                      <Badge tone="brand" icon={Pin}>
                        Pinned
                      </Badge>
                    )}
                    <span className="text-[11px] text-[#B4B0AA]">
                      {note.admin_email} · {relativeTime(note.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel
        title="Audit trail"
        subtitle="Every admin action on this case and applicant"
        bodyClassName="p-0"
      >
        {data.activity.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No recorded actions"
            message="Changes made from this console will appear here."
          />
        ) : (
          <ul className="divide-y divide-[#F0EEEB] max-h-[640px] overflow-y-auto">
            {data.activity.map((entry) => (
              <li key={entry._id} className="px-5 py-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#F0EEEB] flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3 h-3 text-[#888888]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone="neutral">{humanize(entry.action)}</Badge>
                      <span className="text-[11px] text-[#B4B0AA]">
                        {relativeTime(entry.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A4A4A] mt-1.5 leading-relaxed break-words">
                      {entry.summary}
                    </p>
                    <p className="text-[11px] text-[#B4B0AA] mt-1">
                      {entry.admin_email} · {formatDateTime(entry.created_at)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
