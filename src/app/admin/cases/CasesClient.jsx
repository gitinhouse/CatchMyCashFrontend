'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Eye, FolderKanban, RefreshCcw } from 'lucide-react';
import { adminDownload, adminFetch, buildQuery } from '../_lib/api';
import { formatDate, money, number, relativeTime } from '../_lib/format';
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
  ProgressBar,
  Select,
  SeverityBadge,
  StatusBadge,
  Table,
  Td,
  Th,
  Tr,
} from '../_components/ui';
import {
  ActiveFilters,
  ChipFilter,
  DateRange,
  FilterBar,
  SearchBox,
  TriToggle,
} from '../_components/filters';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'processing', label: 'Processing' },
  { value: 'docs_pending', label: 'Awaiting Docs' },
  { value: 'in_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'failed', label: 'Failed' },
];

const STAGE_OPTIONS = [
  { value: 'property_selected', label: 'Property Selected' },
  { value: 'info_submitted', label: 'Info Provided' },
  { value: 'claim_filed', label: 'Claim Filed' },
  { value: 'documents_uploaded', label: 'Docs Uploaded' },
  { value: 'documents_verified', label: 'Docs Verified' },
  { value: 'under_review', label: 'State Review' },
  { value: 'approved', label: 'Approved' },
];

const ATTENTION_OPTIONS = [
  { value: 'claim_failed', label: 'Claim failed' },
  { value: 'doc_upload_failed', label: 'Doc verification failed' },
  { value: 'retry_exhausted', label: 'Retries exhausted' },
  { value: 'retry_overdue', label: 'Retry overdue' },
  { value: 'ready_for_review', label: 'Ready for review' },
  { value: 'missing_claim_id', label: 'No Claim ID' },
  { value: 'missing_documents', label: 'Missing documents' },
  { value: 'stalled', label: 'Stalled' },
];

const ERROR_TYPE_OPTIONS = [
  { value: 'technical_failure', label: 'Technical failure' },
  { value: 'missing_value', label: 'Missing value' },
  { value: 'already_claimed', label: 'Already claimed' },
  { value: 'property_not_found', label: 'Property not found' },
  { value: 'invalid_request', label: 'Invalid request' },
  { value: 'submission_uncertain', label: 'Submission uncertain' },
];

const CLAIM_STATUS_OPTIONS = [
  { value: 'Success', label: 'Success' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Failed', label: 'Failed' },
];

const EMPTY_FILTERS = {
  status: [],
  stage: [],
  attention: [],
  claim_status: [],
  error_type: [],
  has_claim_id: '',
  needs_attention: '',
  retry_exhausted: '',
  date_from: '',
  date_to: '',
  min_value: '',
};

export default function CasesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    status: (searchParams.get('status') || '').split(',').filter(Boolean),
    attention: (searchParams.get('attention') || '').split(',').filter(Boolean),
    needs_attention: searchParams.get('needs_attention') || '',
  }));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState({ by: 'created_at', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useMemo(
    () =>
      buildQuery({
        search: debouncedSearch,
        ...filters,
        sort_by: sort.by,
        sort_dir: sort.dir,
        page,
        limit,
      }),
    [debouncedSearch, filters, sort, page, limit],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await adminFetch(`/api/admin/cases${query}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSort = (key) => {
    setSort((prev) =>
      prev.by === key
        ? { by: key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { by: key, dir: 'desc' },
    );
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await adminDownload(
        `/api/admin/export${buildQuery({
          search: debouncedSearch,
          status: filters.status,
          attention: filters.attention,
          needs_attention: filters.needs_attention,
        })}`,
        `claims-export-${new Date().toISOString().slice(0, 10)}.csv`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const activeChips = useMemo(() => {
    const chips = [];
    const push = (key, label, onRemove) => chips.push({ key, label, onRemove });

    filters.status.forEach((v) =>
      push(`status-${v}`, `Status: ${labelOf(STATUS_OPTIONS, v)}`, () =>
        setFilter('status', filters.status.filter((s) => s !== v)),
      ),
    );
    filters.stage.forEach((v) =>
      push(`stage-${v}`, `Stage: ${labelOf(STAGE_OPTIONS, v)}`, () =>
        setFilter('stage', filters.stage.filter((s) => s !== v)),
      ),
    );
    filters.attention.forEach((v) =>
      push(`att-${v}`, labelOf(ATTENTION_OPTIONS, v), () =>
        setFilter('attention', filters.attention.filter((s) => s !== v)),
      ),
    );
    filters.claim_status.forEach((v) =>
      push(`cs-${v}`, `Claim: ${v}`, () =>
        setFilter('claim_status', filters.claim_status.filter((s) => s !== v)),
      ),
    );
    filters.error_type.forEach((v) =>
      push(`err-${v}`, labelOf(ERROR_TYPE_OPTIONS, v), () =>
        setFilter('error_type', filters.error_type.filter((s) => s !== v)),
      ),
    );
    if (filters.needs_attention)
      push('needs', `Needs attention: ${filters.needs_attention}`, () =>
        setFilter('needs_attention', ''),
      );
    if (filters.has_claim_id)
      push('claimid', `Has Claim ID: ${filters.has_claim_id}`, () =>
        setFilter('has_claim_id', ''),
      );
    if (filters.retry_exhausted)
      push('exhausted', 'Retries exhausted', () =>
        setFilter('retry_exhausted', ''),
      );
    if (filters.date_from || filters.date_to)
      push(
        'dates',
        `Created ${filters.date_from || '…'} → ${filters.date_to || '…'}`,
        () => setFilters((p) => ({ ...p, date_from: '', date_to: '' })),
      );
    if (filters.min_value)
      push('minval', `Min value ${money(filters.min_value)}`, () =>
        setFilter('min_value', ''),
      );

    return chips;
  }, [filters]);

  const summary = result?.summary;

  return (
    <>
      <PageHeader
        title="Claims"
        description="Every claim submission, with its live pipeline status"
        actions={
          <>
            <Button icon={Download} onClick={handleExport} loading={exporting}>
              Export CSV
            </Button>
            <Button icon={RefreshCcw} onClick={load}>
              Refresh
            </Button>
          </>
        }
      />

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <SummaryTile label="Matching claims" value={number(result.total)} />
          <SummaryTile label="Combined value" value={money(summary.total_value)} />
          <SummaryTile
            label="Need attention"
            value={number(summary.needs_attention)}
            tone="danger"
          />
          <SummaryTile
            label="Approved"
            value={number(summary.approved)}
            tone="success"
          />
        </div>
      )}

      <FilterBar
        open={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
        activeCount={activeChips.length}
        controls={
          <>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search case number, Claim ID, task ID, name, email or phone…"
            />
            <Select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              options={[
                { value: 20, label: '20 / page' },
                { value: 50, label: '50 / page' },
                { value: 100, label: '100 / page' },
              ]}
              className="w-32"
            />
          </>
        }
      >
        <ChipFilter
          label="Pipeline status"
          options={STATUS_OPTIONS}
          selected={filters.status}
          onChange={(v) => setFilter('status', v)}
        />
        <ChipFilter
          label="Furthest stage reached"
          options={STAGE_OPTIONS}
          selected={filters.stage}
          onChange={(v) => setFilter('stage', v)}
        />
        <ChipFilter
          label="Attention reason"
          options={ATTENTION_OPTIONS}
          selected={filters.attention}
          onChange={(v) => setFilter('attention', v)}
        />
        <ChipFilter
          label="Claim status (raw)"
          options={CLAIM_STATUS_OPTIONS}
          selected={filters.claim_status}
          onChange={(v) => setFilter('claim_status', v)}
        />
        <ChipFilter
          label="Processor error type"
          options={ERROR_TYPE_OPTIONS}
          selected={filters.error_type}
          onChange={(v) => setFilter('error_type', v)}
        />
        <DateRange
          from={filters.date_from}
          to={filters.date_to}
          onChange={({ from, to }) =>
            setFilters((p) => ({ ...p, date_from: from, date_to: to }))
          }
        />
        <TriToggle
          label="Needs attention"
          value={filters.needs_attention}
          onChange={(v) => setFilter('needs_attention', v)}
        />
        <TriToggle
          label="Has Claim ID"
          value={filters.has_claim_id}
          onChange={(v) => setFilter('has_claim_id', v)}
        />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888] mb-2">
            Minimum claim value
          </p>
          <input
            type="number"
            min="0"
            value={filters.min_value}
            onChange={(e) => setFilter('min_value', e.target.value)}
            placeholder="e.g. 1000"
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E8E6E3] bg-white focus:outline-none focus:border-[#E1261C]"
          />
        </div>
      </FilterBar>

      <ActiveFilters
        chips={activeChips}
        onClearAll={() => {
          setFilters({ ...EMPTY_FILTERS });
          setPage(1);
        }}
      />

      <Panel bodyClassName="p-0">
        {loading ? (
          <LoadingBlock label="Loading claims…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : result.data.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No claims match these filters"
            message="Try clearing a filter or widening the date range."
            action={
              <Button onClick={() => setFilters({ ...EMPTY_FILTERS })}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th sortKey="case_id" sort={sort} onSort={handleSort}>
                    Case
                  </Th>
                  <Th sortKey="applicant" sort={sort} onSort={handleSort}>
                    Applicant
                  </Th>
                  <Th>Status</Th>
                  <Th sortKey="stage" sort={sort} onSort={handleSort}>
                    Progress
                  </Th>
                  <Th sortKey="total_value" sort={sort} onSort={handleSort} align="right">
                    Value
                  </Th>
                  <Th>Flags</Th>
                  <Th sortKey="created_at" sort={sort} onSort={handleSort}>
                    Created
                  </Th>
                  <Th align="right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((row) => (
                  <Tr key={row._id}>
                    <Td>
                      <div className="flex flex-col gap-0.5">
                        <CaseLink id={row._id}>{row.case_id}</CaseLink>
                        {row.claim_id ? (
                          <Mono className="text-[11px] text-[#888888]">
                            Claim {row.claim_id}
                          </Mono>
                        ) : (
                          <span className="text-[11px] text-[#B4B0AA]">
                            No Claim ID
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <div className="min-w-0">
                        <p className="text-sm text-[#0A0A0A] font-medium truncate max-w-[180px]">
                          {row.applicant.name || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-[#888888] truncate max-w-[180px]">
                          {row.applicant.email || '—'}
                        </p>
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge
                        status={row.state.status}
                        label={row.state.status_label}
                      />
                    </Td>
                    <Td>
                      <div className="w-[150px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-[#888888] truncate">
                            {row.state.stage_label}
                          </span>
                          <span className="text-[11px] font-semibold text-[#4A4A4A] tabular-nums">
                            {row.state.progress}%
                          </span>
                        </div>
                        <ProgressBar
                          value={row.state.progress}
                          tone={
                            row.state.status === 'failed'
                              ? 'danger'
                              : row.state.is_approved
                                ? 'success'
                                : 'brand'
                          }
                        />
                      </div>
                    </Td>
                    <Td align="right">
                      <span className="text-sm font-semibold text-[#0A0A0A] tabular-nums">
                        {money(row.total_value)}
                      </span>
                      <p className="text-[11px] text-[#B4B0AA]">
                        {row.property_count} propert
                        {row.property_count === 1 ? 'y' : 'ies'}
                      </p>
                    </Td>
                    <Td>
                      {row.state.attention.length === 0 ? (
                        <span className="text-[11px] text-[#B4B0AA]">—</span>
                      ) : (
                        <div className="flex flex-col gap-1 max-w-[170px]">
                          {row.state.attention.slice(0, 2).map((a) => (
                            <SeverityBadge key={a.key} severity={a.severity}>
                              {a.label}
                            </SeverityBadge>
                          ))}
                          {row.state.attention.length > 2 && (
                            <span className="text-[10px] text-[#B4B0AA]">
                              +{row.state.attention.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <span className="text-xs text-[#4A4A4A]">
                        {formatDate(row.created_at)}
                      </span>
                      <p className="text-[11px] text-[#B4B0AA]">
                        {relativeTime(row.state.last_movement_at)}
                      </p>
                    </Td>
                    <Td align="right">
                      <Link
                        href={`/admin/cases/${row._id}`}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-[#FCE9E7] text-[#E1261C] hover:bg-[#E1261C] hover:text-white transition-colors"
                        title="Open case"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              limit={result.limit}
              onPageChange={setPage}
              label="claims"
            />
          </>
        )}
      </Panel>
    </>
  );
}

function labelOf(options, value) {
  return options.find((o) => o.value === value)?.label || value;
}

function SummaryTile({ label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'text-[#0A0A0A]',
    danger: 'text-[#B11912]',
    success: 'text-[#00785A]',
  };
  return (
    <div className="bg-white border border-[#E8E6E3] rounded-xl px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888]">
        {label}
      </p>
      <p className={`text-xl font-bold tabular-nums mt-1 ${tones[tone]}`}>{value}</p>
    </div>
  );
}
