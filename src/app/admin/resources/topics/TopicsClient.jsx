'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminFetch } from '../../_lib/api';
import { PageHeader } from '../../_components/AdminShell';
import { Button, EmptyState, ErrorState, Panel, Table, TableSkeleton, Td, Th, Toast, Tr } from '../../_components/ui';
import ResourcesNav from '../_components/ResourcesNav';
import Modal, { ConfirmDialog } from '../_components/Modal';
import { counterTone } from '../_components/shared';
import { SearchPreview } from '../_components/SeoPanel';
import { LIMITS, SEO_GUIDE, topicPath } from '../../../lib/resources/constants';
import { slugify } from '../../../lib/resources/slug';

const blank = { name: '', slug: '', description: '', order: 0, seo: { metaTitle: '', metaDescription: '' } };

const toBody = (t) => ({
  name: t.name,
  slug: t.slug,
  description: t.description,
  order: Number(t.order) || 0,
  seo: { metaTitle: t.seo.metaTitle, metaDescription: t.seo.metaDescription },
});

function TopicForm({ value, onChange, errors, existing }) {
  const [slugTouched, setSlugTouched] = useState(Boolean(existing));
  const set = (patch) => onChange({ ...value, ...patch });
  const setSeo = (patch) => onChange({ ...value, seo: { ...value.seo, ...patch } });
  const title = value.seo.metaTitle || `${value.name || 'Topic'} guides`;
  const description = value.seo.metaDescription || value.description;
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">Name</span>
        <input
          type="text"
          value={value.name}
          maxLength={LIMITS.topicName}
          onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
          placeholder="e.g. Filing a Claim"
          aria-invalid={Boolean(errors.name)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
        />
        {errors.name && <span className="block mt-1 text-[11px] font-semibold text-[#B11912]">{errors.name}</span>}
      </label>
      <label className="block">
        <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">URL</span>
        <span className="flex items-stretch rounded-lg border border-[#E8E6E3] overflow-hidden focus-within:border-[#E1261C] focus-within:ring-2 focus-within:ring-[#FCE9E7]">
          <span className="hidden sm:flex items-center px-2.5 bg-[#F7F5F2] border-r border-[#E8E6E3] font-['JetBrains_Mono',monospace] text-[11px] text-[#888888]">
            /resources/topic/
          </span>
          <input
            type="text"
            value={value.slug}
            maxLength={LIMITS.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') });
            }}
            onBlur={() => value.slug && set({ slug: slugify(value.slug) })}
            aria-invalid={Boolean(errors.slug)}
            className="flex-1 min-w-0 px-3 py-2 font-['JetBrains_Mono',monospace] text-[12px] focus:outline-none"
          />
        </span>
        {errors.slug && <span className="block mt-1 text-[11px] font-semibold text-[#B11912]">{errors.slug}</span>}
        {existing && value.slug !== existing.slug && !errors.slug && (
          <span className="block mt-1 text-[11px] text-[#9A6400]">Links to the old topic address will stop working.</span>
        )}
      </label>
      <label className="block">
        <span className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[#4A4A4A]">Description</span>
          <span className={`text-[11px] tabular-nums ${counterTone(value.description.length, { limit: LIMITS.topicDescription })}`}>
            {value.description.length}/{LIMITS.topicDescription}
          </span>
        </span>
        <textarea
          rows={2}
          value={value.description}
          maxLength={LIMITS.topicDescription}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="One sentence shown on the topic page and the hub"
          className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7] resize-y"
        />
        {errors.description && <span className="block mt-1 text-[11px] font-semibold text-[#B11912]">{errors.description}</span>}
      </label>

      <div className="pt-3 border-t border-[#E8E6E3] space-y-3">
        <p className="text-xs font-semibold text-[#0A0A0A]">Search engines</p>
        <SearchPreview
          title={`${title} | CatchMyCash`}
          description={description}
          slug={value.slug ? `topic › ${value.slug}` : 'topic'}
        />
        <label className="block">
          <span className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#4A4A4A]">SEO title</span>
            <span className={`text-[11px] tabular-nums ${counterTone(title.length, { ...SEO_GUIDE.metaTitle, limit: LIMITS.metaTitle })}`}>
              {title.length}/{SEO_GUIDE.metaTitle.max}
            </span>
          </span>
          <input
            type="text"
            value={value.seo.metaTitle}
            maxLength={LIMITS.metaTitle}
            onChange={(e) => setSeo({ metaTitle: e.target.value })}
            placeholder={`${value.name || 'Topic'} guides`}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
          />
          {errors['seo.metaTitle'] && <span className="block mt-1 text-[11px] font-semibold text-[#B11912]">{errors['seo.metaTitle']}</span>}
        </label>
        <label className="block">
          <span className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#4A4A4A]">Meta description</span>
            <span className={`text-[11px] tabular-nums ${counterTone(description.length, { ...SEO_GUIDE.metaDescription, limit: LIMITS.metaDescription })}`}>
              {description.length}/{SEO_GUIDE.metaDescription.max}
            </span>
          </span>
          <textarea
            rows={3}
            value={value.seo.metaDescription}
            maxLength={LIMITS.metaDescription}
            onChange={(e) => setSeo({ metaDescription: e.target.value })}
            placeholder={value.description || 'Defaults to the description'}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7] resize-y"
          />
          {errors['seo.metaDescription'] && (
            <span className="block mt-1 text-[11px] font-semibold text-[#B11912]">{errors['seo.metaDescription']}</span>
          )}
        </label>
      </div>
    </div>
  );
}

export default function TopicsClient() {
  const [topics, setTopics] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null); // { existing, value }
  const [formErrors, setFormErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await adminFetch('/api/admin/resources/topics');
      setTopics(data.topics || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const openNew = () => {
    setFormErrors({});
    setEditing({ existing: null, value: { ...blank, seo: { ...blank.seo }, order: (topics?.length || 0) + 1 } });
  };
  const openEdit = (topic) => {
    setFormErrors({});
    setEditing({ existing: topic, value: { ...toBody(topic), seo: { ...topic.seo } } });
  };

  const submit = async () => {
    if (!editing) return;
    setBusy(true);
    setFormErrors({});
    try {
      const { existing, value } = editing;
      if (existing) {
        await adminFetch(`/api/admin/resources/topics/${existing.id}`, { method: 'PUT', body: JSON.stringify(toBody(value)) });
      } else {
        await adminFetch('/api/admin/resources/topics', { method: 'POST', body: JSON.stringify(toBody(value)) });
      }
      setToast({ type: 'success', message: existing ? `Saved “${value.name.trim()}”.` : `Created “${value.name.trim()}”.` });
      setEditing(null);
      load();
    } catch (err) {
      if (err.data?.fields) setFormErrors(err.data.fields);
      else setToast({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  // Reordering renumbers every topic 1..n with the two swapped, and saves
  // only the ones whose number changed.
  const move = async (index, delta) => {
    const list = [...topics];
    const [item] = list.splice(index, 1);
    list.splice(index + delta, 0, item);
    const changed = list.map((t, i) => ({ ...t, order: i + 1 })).filter((t, i) => topics.find((o) => o.id === t.id).order !== i + 1);
    setTopics(list.map((t, i) => ({ ...t, order: i + 1 })));
    try {
      await Promise.all(
        changed.map((t) => adminFetch(`/api/admin/resources/topics/${t.id}`, { method: 'PUT', body: JSON.stringify(toBody(t)) })),
      );
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
    load();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/resources/topics/${pendingDelete.id}`, { method: 'DELETE' });
      setToast({ type: 'success', message: `Deleted “${pendingDelete.name}”.` });
      load();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
      setPendingDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Resources"
        description="Topics group the guides on the Resources hub; each has its own page"
        actions={
          <Button variant="primary" icon={Plus} onClick={openNew}>
            New topic
          </Button>
        }
      />
      <ResourcesNav />

      <Panel bodyClassName="p-0">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !topics ? (
          <TableSkeleton columns={4} rows={4} label="Loading topics…" />
        ) : topics.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No topics yet"
            message="Create topics such as “Filing a Claim” or “Inheritance & Estates”. Every published article needs one."
            action={
              <Button variant="primary" icon={Plus} onClick={openNew}>
                New topic
              </Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-20">Order</Th>
                <Th>Topic</Th>
                <Th>Description</Th>
                <Th align="center">Articles</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic, i) => (
                <Tr key={topic.id}>
                  <Td>
                    <span className="inline-flex items-center gap-0.5">
                      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 rounded text-[#888888] hover:bg-[#F0EEEB] disabled:opacity-30" aria-label={`Move ${topic.name} up`}>
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" disabled={i === topics.length - 1} onClick={() => move(i, 1)} className="p-1 rounded text-[#888888] hover:bg-[#F0EEEB] disabled:opacity-30" aria-label={`Move ${topic.name} down`}>
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </Td>
                  <Td>
                    <button type="button" onClick={() => openEdit(topic)} className="font-semibold text-[#0A0A0A] hover:text-[#E1261C] text-left">
                      {topic.name}
                    </button>
                    <div className="font-['JetBrains_Mono',monospace] text-[12px] text-[#888888]">{topicPath(topic.slug)}</div>
                  </Td>
                  <Td className="max-w-[360px]">
                    <span className="line-clamp-2 text-[13px]">{topic.description || <span className="text-[#B4B0AA]">—</span>}</span>
                  </Td>
                  <Td align="center">
                    <span className="tabular-nums font-semibold text-[#0A0A0A]">{topic.postCount}</span>
                  </Td>
                  <Td align="right">
                    <span className="inline-flex items-center gap-1">
                      <Button size="sm" icon={Pencil} onClick={() => openEdit(topic)}>
                        Edit
                      </Button>
                      <a
                        href={topicPath(topic.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1.5 rounded-lg text-[#888888] hover:bg-[#F0EEEB] hover:text-[#0A0A0A]"
                        aria-label={`View ${topic.name} on the site`}
                        title="View on the site"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(topic)}
                        className="inline-flex items-center px-2 py-1.5 rounded-lg text-[#888888] hover:bg-[#FCE9E7] hover:text-[#B11912]"
                        aria-label={`Delete ${topic.name}`}
                        title={topic.postCount ? 'Move its articles to another topic first' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <Modal
        open={Boolean(editing)}
        title={editing?.existing ? `Edit “${editing.existing.name}”` : 'New topic'}
        onClose={() => setEditing(null)}
        width="max-w-xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-3.5 py-2 text-sm font-semibold rounded-lg border border-[#E8E6E3] bg-white text-[#4A4A4A] hover:bg-[#F7F5F2]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="px-3.5 py-2 text-sm font-semibold rounded-lg bg-[#E1261C] text-white hover:bg-[#B11912] disabled:opacity-60"
            >
              {busy ? 'Saving…' : editing?.existing ? 'Save topic' : 'Create topic'}
            </button>
          </>
        }
      >
        {editing && (
          <form
            className="max-h-[65vh] overflow-y-auto pr-1"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <TopicForm
              key={editing.existing?.id || 'new'}
              value={editing.value}
              existing={editing.existing}
              errors={formErrors}
              onChange={(value) => setEditing((ed) => ({ ...ed, value }))}
            />
            <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete “${pendingDelete?.name || ''}”?`}
        message={
          pendingDelete?.postCount
            ? `${pendingDelete.postCount} article${pendingDelete.postCount === 1 ? ' uses' : 's use'} this topic, so it can’t be deleted yet. Move ${pendingDelete.postCount === 1 ? 'it' : 'them'} to another topic first.`
            : 'The topic page will stop working. This cannot be undone.'
        }
        confirmLabel={pendingDelete?.postCount ? 'OK' : 'Delete topic'}
        danger={!pendingDelete?.postCount}
        busy={busy}
        onConfirm={pendingDelete?.postCount ? () => setPendingDelete(null) : confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
