'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, RefreshCcw, Users as UsersIcon } from 'lucide-react';
import { adminFetch, buildQuery } from '../_lib/api';
import { formatDate, initials, money, number, relativeTime } from '../_lib/format';
import { PageHeader } from '../_components/AdminShell';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Pagination,
  Panel,
  Select,
  Table,
  Td,
  Th,
  Tr,
} from '../_components/ui';
import { ActiveFilters, FilterBar, SearchBox, TriToggle } from '../_components/filters';

const EMPTY_FILTERS = {
  has_account: '',
  has_cases: '',
  account_type: '',
  needs_attention: '',
};

export default function UsersClient() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState({ by: 'created_at', dir: 'desc' });
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
        ...filters,
        sort_by: sort.by,
        sort_dir: sort.dir,
        page,
        limit,
      }),
    [debounced, filters, sort, page, limit],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await adminFetch(`/api/admin/users${query}`));
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
    setFilters((p) => ({ ...p, [key]: value }));
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

  const chips = useMemo(() => {
    const out = [];
    if (filters.has_account)
      out.push({
        key: 'acct',
        label: `Has login: ${filters.has_account}`,
        onRemove: () => setFilter('has_account', ''),
      });
    if (filters.has_cases)
      out.push({
        key: 'cases',
        label: `Has claims: ${filters.has_cases}`,
        onRemove: () => setFilter('has_cases', ''),
      });
    if (filters.account_type)
      out.push({
        key: 'type',
        label: `Role: ${filters.account_type}`,
        onRemove: () => setFilter('account_type', ''),
      });
    if (filters.needs_attention)
      out.push({
        key: 'att',
        label: 'Has flagged claims',
        onRemove: () => setFilter('needs_attention', ''),
      });
    return out;
  }, [filters]);

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who has searched for or claimed a property"
        actions={
          <Button icon={RefreshCcw} onClick={load}>
            Refresh
          </Button>
        }
      />

      {result?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Tile label="Matching users" value={number(result.total)} />
          <Tile label="With a login" value={number(result.summary.with_account)} />
          <Tile label="With claims" value={number(result.summary.with_cases)} />
          <Tile
            label="Have flagged claims"
            value={number(result.summary.needs_attention)}
            tone="danger"
          />
        </div>
      )}

      <FilterBar
        open={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
        activeCount={chips.length}
        controls={
          <>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search name, email, phone, city, case number…"
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
        <TriToggle
          label="Has login account"
          value={filters.has_account}
          onChange={(v) => setFilter('has_account', v)}
        />
        <TriToggle
          label="Has submitted claims"
          value={filters.has_cases}
          onChange={(v) => setFilter('has_cases', v)}
        />
        <TriToggle
          label="Has flagged claims"
          value={filters.needs_attention}
          onChange={(v) => setFilter('needs_attention', v)}
          yesLabel="Flagged"
          noLabel="Clear"
        />
        <Select
          label="Account role"
          value={filters.account_type}
          onChange={(e) => setFilter('account_type', e.target.value)}
          options={[
            { value: '', label: 'Any role' },
            { value: 'User', label: 'User' },
            { value: 'Admin', label: 'Admin' },
          ]}
        />
      </FilterBar>

      <ActiveFilters
        chips={chips}
        onClearAll={() => {
          setFilters({ ...EMPTY_FILTERS });
          setPage(1);
        }}
      />

      <Panel bodyClassName="p-0">
        {loading ? (
          <LoadingBlock label="Loading users…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : result.data.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users match"
            message="Try a different search term or clear the filters."
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th sortKey="name" sort={sort} onSort={handleSort}>
                    User
                  </Th>
                  <Th>Contact</Th>
                  <Th>Location</Th>
                  <Th sortKey="case_count" sort={sort} onSort={handleSort} align="center">
                    Claims
                  </Th>
                  <Th sortKey="total_value" sort={sort} onSort={handleSort} align="right">
                    Value
                  </Th>
                  <Th>Account</Th>
                  <Th sortKey="created_at" sort={sort} onSort={handleSort}>
                    Joined
                  </Th>
                  <Th align="right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((u) => (
                  <Tr key={u._id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#F0EEEB] text-[#4A4A4A] text-[11px] font-bold flex items-center justify-center shrink-0">
                          {initials(u.name || u.email)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/users/${u._id}`}
                            className="text-sm font-semibold text-[#0A0A0A] hover:text-[#E1261C] truncate block max-w-[170px]"
                          >
                            {u.name || 'Unnamed user'}
                          </Link>
                          {u.legal_name && u.legal_name !== u.name && (
                            <p className="text-[11px] text-[#B4B0AA] truncate max-w-[170px]">
                              Legal: {u.legal_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <p className="text-xs text-[#4A4A4A] truncate max-w-[190px]">
                        {u.email || '—'}
                      </p>
                      <p className="text-[11px] text-[#B4B0AA]">{u.phone || '—'}</p>
                    </Td>
                    <Td>
                      <span className="text-xs text-[#4A4A4A]">
                        {[u.city, u.state].filter(Boolean).join(', ') || '—'}
                      </span>
                      <p className="text-[11px] text-[#B4B0AA]">{u.zip_code || ''}</p>
                    </Td>
                    <Td align="center">
                      <span className="text-sm font-semibold text-[#0A0A0A] tabular-nums">
                        {u.case_count}
                      </span>
                      {u.attention_count > 0 && (
                        <Badge tone="danger" className="ml-1.5">
                          {u.attention_count} flagged
                        </Badge>
                      )}
                    </Td>
                    <Td align="right">
                      <span className="text-sm font-semibold text-[#0A0A0A] tabular-nums">
                        {money(u.total_value)}
                      </span>
                      <p className="text-[11px] text-[#B4B0AA]">
                        {u.property_count} propert
                        {u.property_count === 1 ? 'y' : 'ies'}
                      </p>
                    </Td>
                    <Td>
                      {u.has_account ? (
                        <Badge tone={u.account_type === 'Admin' ? 'brand' : 'success'}>
                          {u.account_type}
                        </Badge>
                      ) : (
                        <Badge tone="muted">No login</Badge>
                      )}
                    </Td>
                    <Td>
                      <span className="text-xs text-[#4A4A4A]">
                        {formatDate(u.created_at)}
                      </span>
                      <p className="text-[11px] text-[#B4B0AA]">
                        {relativeTime(u.last_activity)}
                      </p>
                    </Td>
                    <Td align="right">
                      <Link
                        href={`/admin/users/${u._id}`}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-[#FCE9E7] text-[#E1261C] hover:bg-[#E1261C] hover:text-white transition-colors"
                        title="Open user"
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
              label="users"
            />
          </>
        )}
      </Panel>
    </>
  );
}

function Tile({ label, value, tone = 'neutral' }) {
  const tones = { neutral: 'text-[#0A0A0A]', danger: 'text-[#B11912]' };
  return (
    <div className="bg-white border border-[#E8E6E3] rounded-xl px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888]">
        {label}
      </p>
      <p className={`text-xl font-bold tabular-nums mt-1 ${tones[tone]}`}>{value}</p>
    </div>
  );
}
