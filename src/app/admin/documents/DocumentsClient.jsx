'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Files,
  RefreshCcw,
} from 'lucide-react';
import { adminFetch, buildQuery } from '../_lib/api';
import { formatDate, humanize, number, relativeTime } from '../_lib/format';
import { PageHeader } from '../_components/AdminShell';
import {
  Badge,
  Button,
  CaseLink,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Mono,
  Pagination,
  Panel,
  Select,
} from '../_components/ui';
import { SearchBox } from '../_components/filters';

const VERIFICATION_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Awaiting verification' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
  { value: 'completed', label: 'Verified' },
];

export default function DocumentsClient() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [verification, setVerification] = useState('');
  const [completeness, setCompleteness] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [result, setResult] = useState(null);
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
        search: debounced,
        verification,
        completeness,
        page,
        limit,
        sign: 'true',
      }),
    [debounced, verification, completeness, page, limit],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await adminFetch(`/api/admin/documents${query}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const s = result?.summary;

  return (
    <>
      <PageHeader
        title="Documents"
        description="Verification backlog across every claim — links expire after one hour"
        actions={
          <Button icon={RefreshCcw} onClick={load}>
            Refresh
          </Button>
        }
      />

      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <Tile label="Awaiting verification" value={number(s.awaiting)} tone="warning" />
          <Tile label="Processing" value={number(s.processing)} tone="info" />
          <Tile label="Failed" value={number(s.failed)} tone="danger" />
          <Tile label="Verified" value={number(s.verified)} tone="success" />
          <Tile label="Files on file" value={number(s.total_files)} />
        </div>
      )}

      <div className="bg-white border border-[#E8E6E3] rounded-xl shadow-sm p-3 mb-4 flex flex-wrap items-center gap-2">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search case, Claim ID or applicant…"
        />
        <div className="inline-flex rounded-lg border border-[#E8E6E3] overflow-hidden">
          {VERIFICATION_TABS.map((t) => (
            <button
              key={t.value || 'all'}
              onClick={() => {
                setVerification(t.value);
                setPage(1);
              }}
              className={`px-3 py-2 text-xs font-semibold border-r border-[#E8E6E3] last:border-r-0 transition-colors ${
                verification === t.value
                  ? 'bg-[#E1261C] text-white'
                  : 'bg-white text-[#4A4A4A] hover:bg-[#F7F5F2]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Select
          value={completeness}
          onChange={(e) => {
            setCompleteness(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Any completeness' },
            { value: 'complete', label: 'All required present' },
            { value: 'incomplete', label: 'Missing required docs' },
          ]}
          className="w-52"
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
          ]}
          className="w-32"
        />
      </div>

      <Panel bodyClassName="p-0">
        {loading ? (
          <LoadingBlock label="Loading documents…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : result.data.length === 0 ? (
          <EmptyState
            icon={Files}
            title="No document sets match"
            message="Try a different verification filter."
          />
        ) : (
          <>
            <ul className="divide-y divide-[#F0EEEB]">
              {result.data.map((row) => (
                <li key={row._id} className="px-5 py-4">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="lg:w-72 shrink-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CaseLink id={row._id}>{row.case_id}</CaseLink>
                        <VerificationBadge status={row.verification_status} />
                      </div>
                      <p className="text-xs text-[#888888] mt-1 truncate">
                        {row.applicant.name || 'Unknown'}
                      </p>
                      <p className="text-[11px] text-[#B4B0AA] truncate">
                        {row.applicant.email || '—'}
                      </p>
                      {row.claim_id && (
                        <Mono className="text-[11px] text-[#888888] block mt-1">
                          Claim {row.claim_id}
                        </Mono>
                      )}
                      <p className="text-[11px] text-[#B4B0AA] mt-1">
                        Uploaded{' '}
                        {row.uploaded_at
                          ? relativeTime(row.uploaded_at)
                          : formatDate(row.created_at)}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      {row.files.length === 0 ? (
                        <p className="text-xs text-[#B4B0AA]">
                          No files uploaded yet.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {row.files.map((file) =>
                            file.url ? (
                              <a
                                key={file.field}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E8E6E3] bg-white text-[11px] font-medium text-[#4A4A4A] hover:border-[#E1261C] hover:text-[#E1261C] transition-colors"
                              >
                                <FileText className="w-3 h-3" />
                                {file.label}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span
                                key={file.field}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E8E6E3] bg-[#F7F5F2] text-[11px] text-[#B4B0AA]"
                              >
                                <FileText className="w-3 h-3" />
                                {file.label}
                              </span>
                            ),
                          )}
                        </div>
                      )}

                      {row.missing.length > 0 && (
                        <p className="inline-flex items-center gap-1.5 text-[11px] text-[#9A6400] mt-2">
                          <AlertTriangle className="w-3 h-3" />
                          Missing: {row.missing.map((m) => m.label).join(', ')}
                        </p>
                      )}
                      {row.missing.length === 0 && row.files.length > 0 && (
                        <p className="inline-flex items-center gap-1.5 text-[11px] text-[#00785A] mt-2">
                          <CheckCircle2 className="w-3 h-3" />
                          All required documents present
                        </p>
                      )}
                      {row.verification_message && (
                        <p className="text-[11px] text-[#B11912] mt-2 line-clamp-2">
                          {row.verification_message}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-[#0A0A0A] tabular-nums">
                        {row.file_count} file{row.file_count === 1 ? '' : 's'}
                      </p>
                      {row.doc_retry.count > 0 && (
                        <p className="text-[11px] text-[#B4B0AA] mt-0.5">
                          {row.doc_retry.count}/{row.doc_retry.max} retries
                        </p>
                      )}
                      {row.doc_retry.error_type && (
                        <Badge tone="warning" className="mt-1">
                          {humanize(row.doc_retry.error_type)}
                        </Badge>
                      )}
                      <Link
                        href={`/admin/cases/${row._id}`}
                        className="block mt-2 text-[11px] font-semibold text-[#E1261C] hover:underline"
                      >
                        Open case →
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
              label="document sets"
            />
          </>
        )}
      </Panel>
    </>
  );
}

function VerificationBadge({ status }) {
  const map = {
    completed: { tone: 'success', label: 'Verified' },
    failed: { tone: 'danger', label: 'Failed' },
    processing: { tone: 'info', label: 'Processing' },
  };
  const meta = map[status] || { tone: 'muted', label: 'Awaiting verification' };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

function Tile({ label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'text-[#0A0A0A]',
    danger: 'text-[#B11912]',
    success: 'text-[#00785A]',
    warning: 'text-[#9A6400]',
    info: 'text-[#1B4F9C]',
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
