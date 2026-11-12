'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ExternalLink, EyeOff, Pencil, Plus, RefreshCcw, Star, Trash2 } from 'lucide-react';
import { adminFetch, buildQuery } from '../_lib/api';
import { formatDate, relativeTime } from '../_lib/format';
import { PageHeader } from '../_components/AdminShell';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  Panel,
  Select,
  Table,
  TableSkeleton,
  Td,
  Th,
  Toast,
  Tr,
} from '../_components/ui';
import { SearchBox } from '../_components/filters';
import ResourcesNav from './_components/ResourcesNav';
import { ConfirmDialog } from './_components/Modal';
import { STATE_LABEL, STATE_TONE, postState } from './_components/shared';
import { articlePath } from '../../lib/resources/constants';

const TABS = [
  { value: '', label: 'All', count: 'all' },
  { value: 'published', label: 'Published', count: 'published' },
  { value: 'draft', label: 'Drafts', count: 'draft' },
  { value: 'scheduled', label: 'Scheduled', count: 'scheduled' },
];

const SORTS = [
  { value: 'updated', label: 'Recently edited' },
  { value: 'published', label: 'Publish date' },
  { value: 'title', label: 'Title A–Z' },
];

const LIMIT = 20;

export default function ResourcesClient() {
  const [status, setStatus] = useState('');
  const [topic, setTopic] = useState('');
  const [sort, setSort] = useState('updated');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);

  const [result, setResult] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const query = useMemo(
    () => buildQuery({ status, topic, search: debounced, sort, page, limit: LIMIT }),
    [status, topic, debounced, sort, page],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [posts, topicData] = await Promise.all([
        adminFetch(`/api/admin/resources/posts${query}`),
        adminFetch('/api/admin/resources/topics'),
      ]);
      setResult(posts);
      setTopics(topicData.topics || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/resources/posts/${pendingDelete.id}`, { method: 'DELETE' });
      setToast({ type: 'success', message: `Deleted “${pendingDelete.title}”.` });
      setPendingDelete(null);
      load();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const counts = result?.counts || {};
  const topicOptions = [
    { value: '', label: 'All topics' },
    ...topics.map((t) => ({ value: t.id, label: t.name })),
    { value: 'none', label: 'No topic' },
  ];
  const filtered = Boolean(debounced || topic || status);

  return (
    <>
      <PageHeader
        title="Resources"
        description="Guides published at /resources — write, edit and manage their SEO"
        actions={
          <>
            <Button icon={RefreshCcw} onClick={load}>
              Refresh
            </Button>
            <Link
              href="/admin/resources/new"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg border border-transparent bg-[#E1261C] text-white hover:bg-[#B11912] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New article
            </Link>
          </>
        }
      />
      <ResourcesNav />

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[#E8E6E3]">
          <div role="tablist" aria-label="Status" className="flex flex-wrap gap-1 rounded-lg bg-[#F7F5F2] p-1">
            {TABS.map((tab) => {
              const active = status === tab.value;
              return (
                <button
                  key={tab.value || 'all'}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setStatus(tab.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    active ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-[#888888] hover:text-[#0A0A0A]'
                  }`}
                >
                  {tab.label}
                  {result && (
                    <span className="ml-1.5 text-[11px] tabular-nums text-[#B4B0AA]">{counts[tab.count] ?? 0}</span>
                  )}
                </button>
              );
            })}
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder="Search title, URL, summary or tag…" />
          <Select
            aria-label="Topic"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setPage(1);
            }}
            options={topicOptions}
            className="w-44"
          />
          <Select
            aria-label="Sort"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            options={SORTS}
            className="w-44"
          />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading && !result ? (
          <TableSkeleton columns={5} rows={6} label="Loading articles…" />
        ) : !result?.posts?.length ? (
          <EmptyState
            icon={BookOpen}
            title={filtered ? 'No articles match' : 'No articles yet'}
            message={
              filtered
                ? 'Try another search, topic or status.'
                : 'Write the first guide. It stays a draft until you publish it.'
            }
            action={
              !filtered && (
                <Link
                  href="/admin/resources/new"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-[#E1261C] text-white hover:bg-[#B11912]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New article
                </Link>
              )
            }
          />
        ) : (
          <>
            <Table className={loading ? 'opacity-60 transition-opacity' : ''}>
              <thead>
                <tr>
                  <Th>Article</Th>
                  <Th>Topic</Th>
                  <Th>Status</Th>
                  <Th>Last edited</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {result.posts.map((post) => {
                  const state = postState(post);
                  return (
                    <Tr key={post.id}>
                      <Td className="max-w-[460px]">
                        <Link
                          href={`/admin/resources/${post.id}`}
                          className="font-semibold text-[#0A0A0A] hover:text-[#E1261C] line-clamp-2"
                        >
                          {post.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="font-['JetBrains_Mono',monospace] text-[12px] text-[#888888] truncate max-w-[300px]">
                            {articlePath(post.slug)}
                          </span>
                          {post.featured && (
                            <Badge tone="brand" icon={Star}>
                              Featured
                            </Badge>
                          )}
                          {post.seo?.noindex && (
                            <Badge tone="warning" icon={EyeOff}>
                              Hidden from search
                            </Badge>
                          )}
                        </div>
                      </Td>
                      <Td>{post.topic?.name || <span className="text-[#B4B0AA]">—</span>}</Td>
                      <Td>
                        <Badge tone={STATE_TONE[state]}>{STATE_LABEL[state]}</Badge>
                        {state !== 'draft' && post.publishedAt && (
                          <div className="text-[11px] text-[#888888] mt-1">
                            {state === 'scheduled' ? 'Goes live ' : ''}
                            {formatDate(post.publishedAt, state === 'scheduled')}
                          </div>
                        )}
                      </Td>
                      <Td>
                        <div className="text-[13px] text-[#4A4A4A]" title={post.updatedAt ? new Date(post.updatedAt).toLocaleString() : ''}>
                          {relativeTime(post.updatedAt)}
                        </div>
                        {post.updatedBy && <div className="text-[11px] text-[#888888] truncate max-w-[180px]">{post.updatedBy}</div>}
                      </Td>
                      <Td align="right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/admin/resources/${post.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E8E6E3] bg-white text-[#4A4A4A] hover:bg-[#F7F5F2] hover:text-[#0A0A0A]"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Link>
                          {state === 'published' && (
                            <a
                              href={articlePath(post.slug)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1.5 rounded-lg text-[#888888] hover:bg-[#F0EEEB] hover:text-[#0A0A0A]"
                              aria-label={`View “${post.title}” on the site`}
                              title="View on the site"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setPendingDelete(post)}
                            className="inline-flex items-center px-2 py-1.5 rounded-lg text-[#888888] hover:bg-[#FCE9E7] hover:text-[#B11912]"
                            aria-label={`Delete “${post.title}”`}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              limit={LIMIT}
              onPageChange={setPage}
              label="articles"
            />
          </>
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this article?"
        message={
          pendingDelete
            ? `“${pendingDelete.title}” will be removed for good${
                postState(pendingDelete) === 'published' ? ' and its page will stop working' : ''
              }. To take it off the site but keep it, unpublish it instead.`
            : ''
        }
        confirmLabel="Delete article"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
