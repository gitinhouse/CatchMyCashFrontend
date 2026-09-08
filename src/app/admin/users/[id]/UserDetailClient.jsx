'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Bell,
  Building2,
  Copy,
  FileText,
  KeyRound,
  RefreshCcw,
  Save,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { adminFetch } from '../../_lib/api';
import {
  formatDate,
  formatDateTime,
  humanize,
  money,
  number,
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
  { key: 'overview', label: 'Overview', icon: UserIcon },
  { key: 'claims', label: 'Claims', icon: FileText },
  { key: 'properties', label: 'Properties', icon: Building2 },
  { key: 'account', label: 'Account & Activity', icon: ShieldCheck },
];

export default function UserDetailClient({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminFetch(`/api/admin/users/${userId}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  if (loading) return <LoadingBlock label="Loading user…" />;
  if (error) {
    return (
      <>
        <PageHeader title="User" />
        <Panel>
          <ErrorState message={error} onRetry={load} />
        </Panel>
      </>
    );
  }

  const u = data.user;
  const s = data.summary;

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#888888] hover:text-[#E1261C]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to users
          </Link>
        }
        title={u.name || 'Unnamed user'}
        description={`Registered ${formatDate(u.created_at)} · ${number(
          s.case_count,
        )} claim${s.case_count === 1 ? '' : 's'}`}
        actions={
          <>
            {data.account ? (
              <Badge tone={data.account.type === 'Admin' ? 'brand' : 'success'}>
                {data.account.type} account
              </Badge>
            ) : (
              <Badge tone="muted">No login account</Badge>
            )}
            <Button icon={RefreshCcw} onClick={load}>
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        <Metric label="Claims" value={number(s.case_count)} />
        <Metric label="Approved" value={number(s.approved_count)} tone="success" />
        <Metric
          label="Flagged"
          value={number(s.attention_count)}
          tone={s.attention_count > 0 ? 'danger' : 'neutral'}
        />
        <Metric label="Properties" value={number(s.property_count)} />
        <Metric label="Total value" value={money(s.total_value)} />
        <Metric label="Recovered" value={money(s.recovered_value)} tone="success" />
      </div>

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
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <OverviewTab data={data} onUpdated={load} notify={notify} />
      )}
      {tab === 'claims' && <ClaimsTab data={data} />}
      {tab === 'properties' && <PropertiesTab data={data} />}
      {tab === 'account' && (
        <AccountTab data={data} onUpdated={load} notify={notify} />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

function Metric({ label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'text-[#0A0A0A]',
    success: 'text-[#00785A]',
    danger: 'text-[#B11912]',
  };
  return (
    <div className="bg-white border border-[#E8E6E3] rounded-xl px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888]">
        {label}
      </p>
      <p className={`text-lg font-bold tabular-nums mt-1 ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function OverviewTab({ data, onUpdated, notify }) {
  const u = data.user;
  const details = data.details[0];
  const [form, setForm] = useState({
    first_name: u.first_name || '',
    last_name: u.last_name || '',
    address: u.address || '',
    city: u.city || '',
    state: u.state || '',
    zip_code: u.zip_code || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/users/${u._id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      notify(
        Object.keys(res.changes || {}).length
          ? 'Profile updated'
          : 'No changes to save',
      );
      await onUpdated();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Panel
        className="xl:col-span-2"
        title="Search profile"
        subtitle="Captured when the user searched for unclaimed property"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            label="First name"
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
          />
          <TextInput
            label="Last name"
            value={form.last_name}
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
          />
          <TextInput
            label="Address"
            className="sm:col-span-2"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          <TextInput
            label="City"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <TextInput
            label="State"
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
          />
          <TextInput
            label="ZIP code"
            value={form.zip_code}
            onChange={(e) => setForm((f) => ({ ...f, zip_code: e.target.value }))}
          />
        </div>
        <div className="mt-4 pt-4 border-t border-[#F0EEEB] flex justify-end">
          <Button variant="primary" icon={Save} loading={saving} onClick={save}>
            Save profile
          </Button>
        </div>
      </Panel>

      <Panel
        title="Latest claim form"
        subtitle="Most recent details submitted with a claim"
      >
        {!details ? (
          <EmptyState
            title="No claim form submitted"
            message="This user has not completed the details step."
          />
        ) : (
          <dl className="space-y-3">
            <Field label="Legal name">{details.legal_name}</Field>
            <Field label="Date of birth">{details.date_of_birth}</Field>
            <Field label="SSN (last 4)" mono>
              {details.ssn_last4 ? `•••-••-${details.ssn_last4}` : null}
            </Field>
            <Field label="Email">{details.email_id}</Field>
            <Field label="Phone">{details.contact_no}</Field>
            <Field label="Address">{details.address}</Field>
            <Field label="City / State / ZIP">
              {[details.city, details.state, details.zip_code]
                .filter(Boolean)
                .join(', ')}
            </Field>
            <Field label="Former employer">{details.formal_employer || null}</Field>
            <Field label="Submitted">{formatDateTime(details.created_at)}</Field>
          </dl>
        )}
        {data.details.length > 1 && (
          <p className="mt-4 pt-4 border-t border-[#F0EEEB] text-xs text-[#888888]">
            {data.details.length} form submissions on file.
          </p>
        )}
      </Panel>
    </div>
  );
}

function ClaimsTab({ data }) {
  return (
    <Panel
      title="Claims"
      subtitle={`${data.cases.length} case${data.cases.length === 1 ? '' : 's'}`}
      bodyClassName="p-0"
    >
      {data.cases.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No claims yet"
          message="This user has not started a claim."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Case</Th>
              <Th>Status</Th>
              <Th>Progress</Th>
              <Th align="right">Value</Th>
              <Th>Flags</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {data.cases.map((c) => (
              <Tr key={c._id}>
                <Td>
                  <Link
                    href={`/admin/cases/${c._id}`}
                    className="font-['JetBrains_Mono',monospace] text-[13px] font-semibold text-[#E1261C] hover:underline"
                  >
                    {c.case_id}
                  </Link>
                  <p className="text-[11px] text-[#B4B0AA]">
                    {c.claim_id ? `Claim ${c.claim_id}` : 'No Claim ID'}
                  </p>
                </Td>
                <Td>
                  <StatusBadge status={c.state.status} label={c.state.status_label} />
                </Td>
                <Td>
                  <div className="w-[150px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-[#888888] truncate">
                        {c.state.stage_label}
                      </span>
                      <span className="text-[11px] font-semibold text-[#4A4A4A] tabular-nums">
                        {c.state.progress}%
                      </span>
                    </div>
                    <ProgressBar
                      value={c.state.progress}
                      tone={
                        c.state.status === 'failed'
                          ? 'danger'
                          : c.state.is_approved
                            ? 'success'
                            : 'brand'
                      }
                    />
                  </div>
                </Td>
                <Td align="right">
                  <span className="font-semibold text-[#0A0A0A] tabular-nums">
                    {money(c.state.total_value)}
                  </span>
                  <p className="text-[11px] text-[#B4B0AA]">
                    {c.property_count} propert{c.property_count === 1 ? 'y' : 'ies'}
                  </p>
                </Td>
                <Td>
                  {c.state.attention.length === 0 ? (
                    <span className="text-[11px] text-[#B4B0AA]">—</span>
                  ) : (
                    <div className="flex flex-col gap-1 max-w-[170px]">
                      {c.state.attention.slice(0, 2).map((a) => (
                        <SeverityBadge key={a.key} severity={a.severity}>
                          {a.label}
                        </SeverityBadge>
                      ))}
                    </div>
                  )}
                </Td>
                <Td>
                  <span className="text-xs text-[#4A4A4A]">
                    {formatDate(c.created_at)}
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Panel>
  );
}

function PropertiesTab({ data }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Panel
        className="xl:col-span-2"
        title="Selected properties"
        subtitle={`${data.properties.length} propert${
          data.properties.length === 1 ? 'y' : 'ies'
        } · ${money(data.summary.total_value)} total`}
        bodyClassName="p-0"
      >
        {data.properties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties"
            message="This user has not selected any properties to claim."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Property ID</Th>
                <Th>Title</Th>
                <Th>Type</Th>
                <Th>Claimed</Th>
                <Th align="right">Amount</Th>
              </tr>
            </thead>
            <tbody>
              {data.properties.map((p) => (
                <Tr key={p._id}>
                  <Td>
                    <Mono className="text-[#E1261C] font-semibold">
                      {p.property_id}
                    </Mono>
                  </Td>
                  <Td>{p.property_title || '—'}</Td>
                  <Td>{p.property_type || '—'}</Td>
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
      </Panel>

      <Panel
        title="Documents on file"
        subtitle={`${data.documents.length} file${
          data.documents.length === 1 ? '' : 's'
        }`}
        bodyClassName="p-0"
      >
        {data.documents.length === 0 ? (
          <EmptyState title="No documents" message="Nothing has been uploaded." />
        ) : (
          <ul className="divide-y divide-[#F0EEEB]">
            {data.documents.map((doc, i) => (
              <li key={`${doc.field}-${i}`} className="flex items-center gap-3 px-5 py-3">
                <FileText className="w-4 h-4 text-[#E1261C] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#0A0A0A]">{doc.label}</p>
                  <p className="text-[11px] text-[#B4B0AA] truncate">
                    {doc.filename}
                  </p>
                </div>
                {doc.case_id && (
                  <Link
                    href={`/admin/cases/${doc.case_id}`}
                    className="text-[11px] font-semibold text-[#E1261C] hover:underline shrink-0"
                  >
                    Open case
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function AccountTab({ data, onUpdated, notify }) {
  const [role, setRole] = useState(data.account?.type || 'User');
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [sending, setSending] = useState(false);

  const changeRole = async () => {
    setSaving(true);
    try {
      await adminFetch(`/api/admin/users/${data.user._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ account_type: role }),
      });
      notify(`Role set to ${role}`);
      await onUpdated();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/users/${data.user._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ reset_password: true }),
      });
      setTempPassword(res.temporary_password);
      notify('Password reset — share the temporary password securely');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendNotification = async () => {
    if (!notifyTitle.trim() || !notifyMessage.trim()) {
      notify('Both a title and a message are required', 'error');
      return;
    }
    setSending(true);
    try {
      await adminFetch('/api/admin/notify', {
        method: 'POST',
        body: JSON.stringify({
          user_id: data.user._id,
          title: notifyTitle,
          message: notifyMessage,
        }),
      });
      setNotifyTitle('');
      setNotifyMessage('');
      notify('Notification sent');
      await onUpdated();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 space-y-4">
        <Panel title="Login account">
          {!data.account ? (
            <EmptyState
              icon={KeyRound}
              title="No login account"
              message="This user was created through the property search and has not been issued portal credentials."
            />
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
                <Field label="Email">{data.account.email}</Field>
                <Field label="Created">{formatDate(data.account.created_at)}</Field>
              </dl>
              <div className="pt-4 border-t border-[#F0EEEB] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Account role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    options={[
                      { value: 'User', label: 'User' },
                      { value: 'Admin', label: 'Admin' },
                    ]}
                  />
                  <Button
                    className="mt-2 w-full"
                    icon={ShieldCheck}
                    disabled={role === data.account.type || saving}
                    onClick={changeRole}
                  >
                    Update role
                  </Button>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#4A4A4A] mb-1.5">
                    Password
                  </p>
                  <Button
                    icon={KeyRound}
                    onClick={resetPassword}
                    loading={saving}
                    className="w-full"
                  >
                    Generate temporary password
                  </Button>
                  {tempPassword && (
                    <div className="mt-2 rounded-lg border border-[#F5C6C1] bg-[#FCE9E7] px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#B11912]">
                        Shown once — copy it now
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm font-['JetBrains_Mono',monospace] text-[#0A0A0A] flex-1 break-all">
                          {tempPassword}
                        </code>
                        <button
                          onClick={() =>
                            navigator.clipboard?.writeText(tempPassword)
                          }
                          className="text-[#B11912] hover:text-[#E1261C] shrink-0"
                          title="Copy"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </Panel>

        <Panel
          title="Admin activity on this user"
          bodyClassName="p-0"
        >
          {data.activity.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No recorded actions"
              message="Console actions affecting this user will appear here."
            />
          ) : (
            <ul className="divide-y divide-[#F0EEEB] max-h-[400px] overflow-y-auto">
              {data.activity.map((a) => (
                <li key={a._id} className="px-5 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="neutral">{humanize(a.action)}</Badge>
                    {a.case_number && (
                      <Mono className="text-[11px] text-[#888888]">
                        {a.case_number}
                      </Mono>
                    )}
                    <span className="text-[11px] text-[#B4B0AA]">
                      {relativeTime(a.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A4A4A] mt-1.5">{a.summary}</p>
                  <p className="text-[11px] text-[#B4B0AA] mt-0.5">{a.admin_email}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel title="Send a notification">
          <div className="space-y-3">
            <TextInput
              label="Title"
              value={notifyTitle}
              onChange={(e) => setNotifyTitle(e.target.value)}
              maxLength={200}
            />
            <TextArea
              label="Message"
              rows={4}
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              maxLength={2000}
            />
            <Button
              variant="primary"
              icon={Bell}
              loading={sending}
              onClick={sendNotification}
              className="w-full"
            >
              Send notification
            </Button>
          </div>
        </Panel>

        <Panel
          title="Notification history"
          subtitle={`${data.summary.unread_notifications} unread`}
          bodyClassName="p-0"
        >
          {data.notifications.length === 0 ? (
            <EmptyState title="No notifications" message="Nothing sent yet." />
          ) : (
            <ul className="divide-y divide-[#F0EEEB] max-h-[360px] overflow-y-auto">
              {data.notifications.map((n) => (
                <li key={n._id} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        n.read ? 'bg-[#D4D4D4]' : 'bg-[#E1261C]'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0A0A0A]">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-[#888888]">{n.message}</p>
                      <p className="text-[10px] text-[#B4B0AA] mt-0.5">
                        {relativeTime(n.created_at)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
