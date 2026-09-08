'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BadgeCheck, ChevronRight, Clock, RefreshCcw } from 'lucide-react';
import { adminFetch, buildQuery } from '../_lib/api';
import { formatDate, money, number } from '../_lib/format';
import { PageHeader } from '../_components/AdminShell';
import {
  Button,
  CaseLink,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Mono,
  Pagination,
  Panel,
  Select,
  SeverityBadge,
  StatusBadge,
} from '../_components/ui';
import { SearchBox } from '../_components/filters';

const REASONS = [
  { value: '', label: 'All reasons', severity: null },
  { value: 'claim_failed', label: 'Claim filing failed', severity: 'high' },
  { value: 'retry_exhausted', label: 'Retries exhausted', severity: 'high' },
  { value: 'doc_upload_failed', label: 'Document verification failed', severity: 'high' },
  { value: 'retry_overdue', label: 'Retry overdue', severity: 'medium' },
  { value: 'ready_for_review', label: 'Ready for admin review', severity: 'medium' },
  { value: 'missing_claim_id', label: 'Filed but no Claim ID', severity: 'medium' },
  { value: 'stalled', label: 'Stalled with no progress', severity: 'medium' },
  { value: 'missing_documents', label: 'Required documents missing', severity: 'low' },
];

export default function AttentionClient() {
  const searchParams = useSearchParams();
  const [reason, setReason] = useState(searchParams.get('reason') || '');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [result, setResult] = useState(null);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useMemo(
    () =>
      buildQuery({
        needs_attention: 'true',
        attention: reason || undefined,
        search: debounced,
        sort_by: 'days_since_movement',
        sort_dir: 'desc',
        page,
        limit,
      }),
    [reason, debounced, page, limit],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, stats] = await Promise.all([
        adminFetch(`/api/admin/cases${query}`),
        adminFetch('/api/admin/stats?range_days=7'),
      ]);
      setResult(rows);
      setCounts(stats.by_attention);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const countFor = (key) =>
    counts?.find((c) => c.key === key)?.count ?? null;

  return (
    <>
      <PageHeader
        title="Action Queue"
        description="Claims that cannot move forward without an admin"
        actions={
          <Button icon={RefreshCcw} onClick={load}>
            Refresh
          </Button>
        }
      />

      {/* Reason selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {REASONS.map((r) => {
          const active = reason === r.value;
          const count = r.value ? countFor(r.value) : result?.total;
          return (
            <button
              key={r.value || 'all'}
              onClick={() => {
                setReason(r.value);
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                active
                  ? 'bg-[#E1261C] border-[#E1261C] text-white'
                  : 'bg-white border-[#E8E6E3] text-[#4A4A4A] hover:border-[#E1261C] hover:text-[#E1261C]'
              }`}
            >
              {r.severity && !active && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    r.severity === 'high'
                      ? 'bg-[#E1261C]'
                      : r.severity === 'medium'
                        ? 'bg-[#E0A030]'
                        : 'bg-[#B4B0AA]'
                  }`}
                />
              )}
              {r.label}
              {count !== null && count !== undefined && (
                <span className={active ? 'text-white/80' : 'text-[#B4B0AA]'}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search case number, Claim ID, applicant…"
        />
        <Select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          options={[
            { value: 25, label: '25 / page' },
            { value: 50, label: '50 / page' },
            { value: 100, label: '100 / page' },
          ]}
          className="w-32"
        />
      </div>

      <Panel bodyClassName="p-0">
        {loading ? (
          <LoadingBlock label="Building the queue…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : result.data.length === 0 ? (
          <EmptyState
            icon={BadgeCheck}
            title="Queue is clear"
            message={
              reason
                ? 'No claims currently match this reason.'
                : 'Every claim is progressing normally — nothing needs an admin right now.'
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-[#F0EEEB]">
              {result.data.map((row) => (
                <li key={row._id} className="px-5 py-4 hover:bg-[#FDF8F7] transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CaseLink id={row._id}>{row.case_id}</CaseLink>
                        <StatusBadge
                          status={row.state.status}
                          label={row.state.status_label}
                        />
                        {row.claim_id && (
                          <Mono className="text-[11px] text-[#888888]">
                            Claim {row.claim_id}
                          </Mono>
                        )}
                      </div>
                      <p className="text-xs text-[#888888] mt-1">
                        {row.applicant.name || 'Unknown applicant'}
                        {row.applicant.email ? ` · ${row.applicant.email}` : ''}
                        {row.applicant.phone ? ` · ${row.applicant.phone}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {row.state.attention.map((a) => (
                          <SeverityBadge key={a.key} severity={a.severity}>
                            {a.label}
                          </SeverityBadge>
                        ))}
                      </div>
                      {(row.claim_message || row.document_upload_message) && (
                        <p className="text-[11px] text-[#B11912] mt-2 line-clamp-2">
                          {row.document_upload_message || row.claim_message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#0A0A0A] tabular-nums">
                          {money(row.total_value)}
                        </p>
                        <p className="text-[11px] text-[#B4B0AA]">
                          {row.property_count} propert
                          {row.property_count === 1 ? 'y' : 'ies'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="inline-flex items-center gap-1 text-xs font-semibold text-[#9A6400]">
                          <Clock className="w-3 h-3" />
                          {row.state.days_since_movement}d idle
                        </p>
                        <p className="text-[11px] text-[#B4B0AA]">
                          {formatDate(row.created_at)}
                        </p>
                      </div>
                      <Link
                        href={`/admin/cases/${row._id}`}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#E1261C] text-white text-xs font-semibold hover:bg-[#B11912] transition-colors"
                      >
                        Resolve
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              limit={result.limit}
              onPageChange={setPage}
              label="flagged claims"
            />
          </>
        )}
      </Panel>
    </>
  );
}
