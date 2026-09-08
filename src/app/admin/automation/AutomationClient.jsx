'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Cpu, ExternalLink, RefreshCcw, RotateCcw } from 'lucide-react';
import { adminFetch, buildQuery } from '../_lib/api';
import { formatDateTime, humanize, number, relativeTime } from '../_lib/format';
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
  Table,
  Td,
  Th,
  Toast,
  Tr,
} from '../_components/ui';
import { SearchBox } from '../_components/filters';

export default function AutomationClient() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [pipeline, setPipeline] = useState('');
  const [outcome, setOutcome] = useState('');
  const [retry, setRetry] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useMemo(
    () => buildQuery({ search: debounced, pipeline, outcome, retry, page, limit }),
    [debounced, pipeline, outcome, retry, page, limit],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await adminFetch(`/api/admin/automation${query}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const resetRetry = async (caseId, which) => {
    setBusyId(caseId);
    try {
      await adminFetch(`/api/admin/cases/${caseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ reset_retry: which }),
      });
      notify('Retry state reset');
      await load();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const s = result?.summary;

  return (
    <>
      <PageHeader
        title="Automation & Webhooks"
        description="Task IDs, statuses and retry state reported by the remote claim processor"
        actions={
          <Button icon={RefreshCcw} onClick={load}>
            Refresh
          </Button>
        }
      />

      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Tile label="Retries scheduled" value={number(s.retry_pending)} tone="info" />
          <Tile label="Retries overdue" value={number(s.retry_overdue)} tone="warning" />
          <Tile label="Retries exhausted" value={number(s.retry_exhausted)} tone="danger" />
          <Tile
            label="Filed without Claim ID"
            value={number(s.awaiting_claim_id)}
            tone="warning"
          />
        </div>
      )}

      <div className="bg-white border border-[#E8E6E3] rounded-xl shadow-sm p-3 mb-4 flex flex-wrap items-center gap-2">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search case, Claim ID, automation ID or task ID…"
        />
        <Select
          value={pipeline}
          onChange={(e) => {
            setPipeline(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Both pipelines' },
            { value: 'claim', label: 'Claim submission' },
            { value: 'document', label: 'Document upload' },
          ]}
          className="w-44"
        />
        <Select
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Any outcome' },
            { value: 'queued', label: 'Queued' },
            { value: 'processing', label: 'Processing' },
            { value: 'completed', label: 'Completed' },
            { value: 'failed', label: 'Failed' },
            { value: 'none', label: 'Never ran' },
          ]}
          className="w-40"
        />
        <Select
          value={retry}
          onChange={(e) => {
            setRetry(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Any retry state' },
            { value: 'pending', label: 'Retry scheduled' },
            { value: 'overdue', label: 'Retry overdue' },
            { value: 'exhausted', label: 'Retries exhausted' },
          ]}
          className="w-44"
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
          ]}
          className="w-32"
        />
      </div>

      <Panel bodyClassName="p-0">
        {loading ? (
          <LoadingBlock label="Loading automation state…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : result.data.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title="No automation runs match"
            message="Try clearing the pipeline or outcome filter."
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Case</Th>
                  <Th>Claim submission</Th>
                  <Th>Document upload</Th>
                  <Th>Identifiers</Th>
                  <Th>Last update</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((row) => (
                  <Tr key={row._id}>
                    <Td>
                      <CaseLink id={row._id}>{row.case_id}</CaseLink>
                      <p className="text-[11px] text-[#888888] truncate max-w-[150px]">
                        {row.applicant.name || 'Unknown'}
                      </p>
                    </Td>
                    <Td>
                      <PipelineCell p={row.claim_pipeline} />
                    </Td>
                    <Td>
                      <PipelineCell p={row.document_pipeline} />
                    </Td>
                    <Td>
                      <div className="space-y-0.5 text-[11px]">
                        <IdRow label="Claim" value={row.claim_id} />
                        <IdRow label="Automation" value={row.automation_id} />
                        <IdRow label="Claim task" value={row.claim_pipeline.task_id} />
                        <IdRow label="Doc task" value={row.document_pipeline.task_id} />
                        {row.poll_url && (
                          <a
                            href={row.poll_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#E1261C] hover:underline"
                          >
                            Poll URL <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <span className="text-xs text-[#4A4A4A]">
                        {relativeTime(row.updated_at || row.created_at)}
                      </span>
                      <p className="text-[11px] text-[#B4B0AA]">
                        {formatDateTime(row.updated_at || row.created_at)}
                      </p>
                    </Td>
                    <Td align="right">
                      <div className="flex flex-col gap-1 items-end">
                        <Button
                          size="sm"
                          icon={RotateCcw}
                          loading={busyId === row._id}
                          onClick={() => resetRetry(row._id, 'claim')}
                        >
                          Reset claim
                        </Button>
                        <Button
                          size="sm"
                          icon={RotateCcw}
                          loading={busyId === row._id}
                          onClick={() => resetRetry(row._id, 'document')}
                        >
                          Reset docs
                        </Button>
                      </div>
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
              label="automation runs"
            />
          </>
        )}
      </Panel>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

function PipelineCell({ p }) {
  const tone =
    p.task_status === 'completed'
      ? 'success'
      : p.task_status === 'failed'
        ? 'danger'
        : p.task_status === 'processing' || p.task_status === 'queued'
          ? 'info'
          : 'muted';

  return (
    <div className="min-w-[150px]">
      <Badge tone={tone}>
        {p.task_status ? humanize(p.task_status) : 'Not started'}
      </Badge>
      <div className="mt-1.5 space-y-0.5 text-[11px] text-[#888888]">
        <p>
          Retries {p.retry_count}/{p.retry_max}
          {p.exhausted && (
            <span className="text-[#B11912] font-semibold"> · exhausted</span>
          )}
          {p.retry_overdue && (
            <span className="text-[#9A6400] font-semibold"> · overdue</span>
          )}
        </p>
        {p.error_type && (
          <p className="text-[#9A6400]">{humanize(p.error_type)}</p>
        )}
        {p.next_retry_at && <p>Next {relativeTime(p.next_retry_at)}</p>}
        {p.message && (
          <p className="text-[#B11912] line-clamp-2 max-w-[220px]">{p.message}</p>
        )}
      </div>
    </div>
  );
}

function IdRow({ label, value }) {
  if (!value) return null;
  return (
    <p className="text-[#888888]">
      {label}: <Mono className="text-[11px] text-[#4A4A4A]">{value}</Mono>
    </p>
  );
}

function Tile({ label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'text-[#0A0A0A]',
    danger: 'text-[#B11912]',
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
