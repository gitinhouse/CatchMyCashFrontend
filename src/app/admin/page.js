'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  ClipboardList,
  Clock,
  FileWarning,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { adminFetch } from './_lib/api';
import {
  compactMoney,
  formatDate,
  humanize,
  money,
  number,
  relativeTime,
} from './_lib/format';
import { PageHeader } from './_components/AdminShell';
import {
  Badge,
  Button,
  CaseLink,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Panel,
  ProgressBar,
  Select,
  SeverityBadge,
  StatusBadge,
} from './_components/ui';
import { FunnelChart, StatusDonut, TrendChart } from './_components/charts';

function StatCard({ icon: Icon, label, value, sub, tone = 'neutral', href, trend }) {
  const tones = {
    neutral: 'text-[#4A4A4A] bg-[#F0EEEB]',
    brand: 'text-[#E1261C] bg-[#FCE9E7]',
    success: 'text-[#00785A] bg-[#E6F7F1]',
    warning: 'text-[#9A6400] bg-[#FFF4E0]',
    danger: 'text-[#B11912] bg-[#FCE9E7]',
    info: 'text-[#1B4F9C] bg-[#EAF1FC]',
  };

  const body = (
    <div className="bg-white border border-[#E8E6E3] rounded-xl p-4 shadow-sm h-full transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend !== undefined && trend !== null && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
              trend >= 0 ? 'text-[#00785A]' : 'text-[#B11912]'
            }`}
          >
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-[#0A0A0A] tabular-nums tracking-tight">
        {value}
      </p>
      <p className="text-xs font-medium text-[#4A4A4A] mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-[#B4B0AA] mt-1">{sub}</p>}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangeDays, setRangeDays] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await adminFetch(`/api/admin/stats?range_days=${rangeDays}`);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [rangeDays],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Loading claim analytics…" />
        <LoadingBlock label="Crunching claim data…" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Panel>
          <ErrorState message={error} onRetry={() => load()} />
        </Panel>
      </>
    );
  }

  const t = data.totals;
  const approvedCount =
    data.by_status.find((s) => s.key === 'approved')?.count || 0;
  const failedCount = data.by_status.find((s) => s.key === 'failed')?.count || 0;
  const inFlight = t.cases - approvedCount - failedCount;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Claim operations overview · updated ${relativeTime(
          data.generated_at,
        )}`}
        actions={
          <>
            <Select
              value={rangeDays}
              onChange={(e) => setRangeDays(e.target.value)}
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
                { value: '365', label: 'Last 12 months' },
              ]}
              className="w-40"
            />
            <Button
              icon={RefreshCcw}
              onClick={() => load(true)}
              loading={refreshing}
            >
              Refresh
            </Button>
          </>
        }
      />

      {/* Headline metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        <StatCard
          icon={Users}
          label="Registered users"
          value={number(t.users)}
          sub={`${number(t.accounts?.User || 0)} with login · ${number(
            t.accounts?.Admin || 0,
          )} admin`}
          href="/admin/users"
        />
        <StatCard
          icon={ClipboardList}
          label="Total claims"
          value={number(t.cases)}
          sub={`${number(t.cases_in_range)} in last ${data.range_days} days`}
          trend={t.cases_change_pct}
          tone="brand"
          href="/admin/cases"
        />
        <StatCard
          icon={AlertTriangle}
          label="Need attention"
          value={number(t.needs_attention)}
          sub="Failed, stalled or awaiting review"
          tone="danger"
          href="/admin/attention"
        />
        <StatCard
          icon={Clock}
          label="In progress"
          value={number(inFlight)}
          sub="Neither approved nor failed"
          tone="warning"
          href="/admin/cases?status=processing,docs_pending,in_review"
        />
        <StatCard
          icon={BadgeCheck}
          label="Approved claims"
          value={number(approvedCount)}
          sub={`${compactMoney(t.recovered_value)} recovered`}
          tone="success"
          href="/admin/cases?status=approved"
        />
        <StatCard
          icon={Banknote}
          label="Pipeline value"
          value={compactMoney(t.pipeline_value)}
          sub={`${number(t.properties_selected)} properties selected`}
          tone="info"
        />
      </div>

      {/* Trend + status split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <Panel
          className="xl:col-span-2"
          title="Claim volume"
          subtitle={`Claims started and approved per day over the last ${data.range_days} days`}
        >
          <TrendChart data={data.trend} />
        </Panel>

        <Panel title="Claims by status" subtitle="Live distribution across the pipeline">
          <StatusDonut data={data.by_status} total={t.cases} />
        </Panel>
      </div>

      {/* Funnel + attention breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <Panel
          className="xl:col-span-2"
          title="Lifecycle funnel"
          subtitle="How many claims have reached each stage"
        >
          <FunnelChart steps={data.funnel} />
        </Panel>

        <Panel
          title="What needs admin action"
          subtitle="Grouped by reason, most urgent first"
          bodyClassName="p-0"
        >
          {data.by_attention.every((a) => a.count === 0) ? (
            <EmptyState
              icon={BadgeCheck}
              title="Nothing needs attention"
              message="Every claim is progressing normally."
            />
          ) : (
            <ul className="divide-y divide-[#F0EEEB]">
              {data.by_attention
                .filter((a) => a.count > 0)
                .map((reason) => (
                  <li key={reason.key}>
                    <Link
                      href={`/admin/attention?reason=${reason.key}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#FDF8F7] transition-colors"
                    >
                      <SeverityBadge severity={reason.severity}>
                        {reason.severity}
                      </SeverityBadge>
                      <span className="flex-1 text-sm text-[#4A4A4A]">
                        {reason.label}
                      </span>
                      <span className="text-sm font-bold text-[#0A0A0A] tabular-nums">
                        {reason.count}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#B4B0AA]" />
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Urgent queue + recent claims */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <Panel
          title="Priority queue"
          subtitle="Highest-severity claims waiting on an admin"
          bodyClassName="p-0"
          actions={
            <Link
              href="/admin/attention"
              className="text-xs font-semibold text-[#E1261C] hover:text-[#B11912]"
            >
              View all →
            </Link>
          }
        >
          {data.urgent.length === 0 ? (
            <EmptyState
              icon={BadgeCheck}
              title="Queue is clear"
              message="No claims are currently flagged."
            />
          ) : (
            <ul className="divide-y divide-[#F0EEEB]">
              {data.urgent.map((row) => (
                <li key={row._id} className="px-5 py-3 hover:bg-[#FDF8F7] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CaseLink id={row._id}>{row.case_id}</CaseLink>
                        <StatusBadge status={row.status} label={row.status_label} />
                      </div>
                      <p className="text-xs text-[#888888] mt-1 truncate">
                        {row.applicant.name || 'Unknown applicant'}
                        {row.applicant.email ? ` · ${row.applicant.email}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {row.attention.slice(0, 2).map((a) => (
                          <SeverityBadge key={a.key} severity={a.severity}>
                            {a.label}
                          </SeverityBadge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#0A0A0A] tabular-nums">
                        {money(row.total_value)}
                      </p>
                      <p className="text-[11px] text-[#B4B0AA] mt-0.5">
                        idle {row.days_since_movement}d
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Latest claims"
          subtitle="Most recently created cases"
          bodyClassName="p-0"
          actions={
            <Link
              href="/admin/cases"
              className="text-xs font-semibold text-[#E1261C] hover:text-[#B11912]"
            >
              View all →
            </Link>
          }
        >
          {data.recent_cases.length === 0 ? (
            <EmptyState title="No claims yet" message="New submissions will appear here." />
          ) : (
            <ul className="divide-y divide-[#F0EEEB]">
              {data.recent_cases.map((row) => (
                <li key={row._id} className="px-5 py-3 hover:bg-[#FDF8F7] transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CaseLink id={row._id}>{row.case_id}</CaseLink>
                        <StatusBadge status={row.status} label={row.status_label} />
                      </div>
                      <p className="text-xs text-[#888888] mt-1 truncate">
                        {row.applicant.name || 'Unknown'} · {row.stage_label}
                      </p>
                      <ProgressBar value={row.progress} className="mt-2 max-w-[220px]" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#0A0A0A] tabular-nums">
                        {money(row.total_value)}
                      </p>
                      <p className="text-[11px] text-[#B4B0AA] mt-0.5">
                        {formatDate(row.created_at)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Secondary stats + audit feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Automation health" subtitle="Remote claim processor signals">
          <dl className="space-y-3">
            <MetricRow
              label="Claims with a Claim ID"
              value={`${number(t.with_claim_id)} / ${number(t.cases)}`}
            />
            <MetricRow label="Retries scheduled" value={number(t.retry_pending)} />
            <MetricRow label="Document records" value={number(t.document_records)} />
            <MetricRow label="Signed agreements" value={number(t.signed_agreements)} />
            <MetricRow
              label="Properties claimed"
              value={`${number(t.properties_claimed)} / ${number(
                t.properties_selected,
              )}`}
            />
          </dl>
          <div className="mt-4 pt-4 border-t border-[#F0EEEB]">
            <Link
              href="/admin/automation"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E1261C] hover:text-[#B11912]"
            >
              Open automation monitor <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Panel>

        <Panel title="Failure reasons" subtitle="Reported by the claim processor">
          {data.by_claim_error.length === 0 ? (
            <EmptyState
              icon={BadgeCheck}
              title="No reported failures"
              message="The processor has not returned an error type."
            />
          ) : (
            <ul className="space-y-2.5">
              {data.by_claim_error
                .sort((a, b) => b.count - a.count)
                .map((row) => (
                  <li key={row.key} className="flex items-center gap-3">
                    <FileWarning className="w-3.5 h-3.5 text-[#9A6400] shrink-0" />
                    <span className="flex-1 text-sm text-[#4A4A4A]">
                      {humanize(row.key)}
                    </span>
                    <Badge tone="warning">{row.count}</Badge>
                  </li>
                ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent admin activity"
          subtitle="Audit trail of console actions"
          bodyClassName="p-0"
          actions={
            <Link
              href="/admin/activity"
              className="text-xs font-semibold text-[#E1261C] hover:text-[#B11912]"
            >
              View log →
            </Link>
          }
        >
          {data.recent_activity.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              message="Actions taken in this console will be recorded here."
            />
          ) : (
            <ul className="divide-y divide-[#F0EEEB] max-h-[320px] overflow-y-auto">
              {data.recent_activity.map((entry) => (
                <li key={entry._id} className="px-5 py-3">
                  <div className="flex items-start gap-2.5">
                    <Activity className="w-3.5 h-3.5 text-[#B4B0AA] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#4A4A4A] leading-relaxed">
                        {entry.summary}
                      </p>
                      <p className="text-[11px] text-[#B4B0AA] mt-1">
                        {entry.admin_email} · {relativeTime(entry.created_at)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-sm text-[#4A4A4A]">{label}</dt>
      <dd className="text-sm font-semibold text-[#0A0A0A] tabular-nums">{value}</dd>
    </div>
  );
}
