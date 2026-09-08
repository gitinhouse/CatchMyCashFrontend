'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, RefreshCcw } from 'lucide-react';
import { adminFetch, buildQuery } from '../_lib/api';
import { formatDateTime, humanize, number, relativeTime } from '../_lib/format';
import { PageHeader } from '../_components/AdminShell';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Mono,
  Pagination,
  Panel,
  Select,
} from '../_components/ui';
import { DateRange, SearchBox } from '../_components/filters';

const ACTIONS = [
  'case_status_updated',
  'claim_status_updated',
  'claim_id_updated',
  'claim_stage_updated',
  'case_fields_updated',
  'retry_reset',
  'retry_flag_updated',
  'note_added',
  'note_deleted',
  'user_updated',
  'user_role_updated',
  'notification_sent',
  'document_reviewed',
];

export default function ActivityClient() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('');
  const [dates, setDates] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);

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
        action,
        admin_email: actor,
        date_from: dates.from,
        date_to: dates.to,
        page,
        limit,
      }),
    [debounced, action, actor, dates, page, limit],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await adminFetch(`/api/admin/activity${query}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Every action taken from the admin console, newest first"
        actions={
          <Button icon={RefreshCcw} onClick={load}>
            Refresh
          </Button>
        }
      />

      <div className="bg-white border border-[#E8E6E3] rounded-xl shadow-sm p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search summary, case number or admin…"
          />
          <Select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All actions' },
              ...ACTIONS.map((a) => ({ value: a, label: humanize(a) })),
            ]}
            className="w-52"
          />
          <Select
            value={actor}
            onChange={(e) => {
              setActor(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All admins' },
              ...(result?.actors || []).map((a) => ({ value: a, label: a })),
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
              { value: 30, label: '30 / page' },
              { value: 60, label: '60 / page' },
              { value: 100, label: '100 / page' },
            ]}
            className="w-32"
          />
        </div>
        <div className="mt-3 pt-3 border-t border-[#F0EEEB] max-w-sm">
          <DateRange
            from={dates.from}
            to={dates.to}
            onChange={(v) => {
              setDates(v);
              setPage(1);
            }}
          />
        </div>
      </div>

      {result?.action_counts?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {result.action_counts.slice(0, 8).map((a) => (
            <Badge key={a.action} tone="neutral">
              {humanize(a.action)} · {number(a.count)}
            </Badge>
          ))}
        </div>
      )}

      <Panel bodyClassName="p-0">
        {loading ? (
          <LoadingBlock label="Loading audit log…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : result.data.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity recorded"
            message="Admin actions will appear here as they happen."
          />
        ) : (
          <>
            <ul className="divide-y divide-[#F0EEEB]">
              {result.data.map((entry) => (
                <li key={entry._id} className="px-5 py-4 hover:bg-[#FDF8F7] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F0EEEB] flex items-center justify-center shrink-0">
                      <Activity className="w-3.5 h-3.5 text-[#888888]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge tone="neutral">{humanize(entry.action)}</Badge>
                        {entry.case_number && entry.case_id && (
                          <Link
                            href={`/admin/cases/${entry.case_id}`}
                            className="font-['JetBrains_Mono',monospace] text-[12px] font-semibold text-[#E1261C] hover:underline"
                          >
                            {entry.case_number}
                          </Link>
                        )}
                        {entry.user_id && (
                          <Link
                            href={`/admin/users/${entry.user_id}`}
                            className="text-[11px] font-semibold text-[#888888] hover:text-[#E1261C]"
                          >
                            View user
                          </Link>
                        )}
                      </div>
                      <p className="text-sm text-[#4A4A4A] mt-1.5 break-words">
                        {entry.summary}
                      </p>
                      {Object.keys(entry.changes || {}).length > 0 && (
                        <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                          {Object.entries(entry.changes).map(([field, change]) => (
                            <div key={field} className="text-[11px]">
                              <dt className="inline text-[#888888]">{field}: </dt>
                              <dd className="inline">
                                <Mono className="text-[11px] text-[#B11912]">
                                  {formatChangeValue(change?.from)}
                                </Mono>
                                <span className="text-[#B4B0AA] mx-1">→</span>
                                <Mono className="text-[11px] text-[#00785A]">
                                  {formatChangeValue(change?.to)}
                                </Mono>
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-[#4A4A4A]">
                        {entry.admin_email}
                      </p>
                      <p className="text-[11px] text-[#B4B0AA]">
                        {relativeTime(entry.created_at)}
                      </p>
                      <p className="text-[10px] text-[#B4B0AA]">
                        {formatDateTime(entry.created_at)}
                      </p>
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
              label="log entries"
            />
          </>
        )}
      </Panel>
    </>
  );
}

function formatChangeValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value).length > 40 ? `${String(value).slice(0, 39)}…` : String(value);
}
