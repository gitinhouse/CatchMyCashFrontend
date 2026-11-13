'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  Eye,
  PenLine,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { adminFetch } from '../../_lib/api';
import { relativeTime } from '../../_lib/format';
import { PageHeader } from '../../_components/AdminShell';
import { Badge, Button, DetailSkeleton, ErrorState, Panel, Toast } from '../../_components/ui';
import RichTextEditor from './RichTextEditor';
import ImageField from './ImageField';
import SeoPanel from './SeoPanel';
import Modal, { ConfirmDialog } from './Modal';
import { analyzeContent } from './analysis';
import {
  STATE_LABEL,
  STATE_TONE,
  counterTone,
  fromLocalInput,
  postState,
  toLocalInput,
  useUnsavedChangesGuard,
} from './shared';
import { DEFAULT_AUTHOR, LIMITS, SEO_GUIDE, articlePath } from '../../../lib/resources/constants';
import { slugify } from '../../../lib/resources/slug';
import { formatArticleDate } from '../../../lib/resources/format';
import { ArticleBody } from '../../../components/resources/ResourceParts';

const SITE_HOST = 'catchmycash.com';
const WPM = 225;

const blankForm = () => ({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  topicId: '',
  tags: [],
  authorName: DEFAULT_AUTHOR,
  coverImage: { url: '', alt: '' },
  faqs: [],
  status: 'draft',
  featured: false,
  publishedAt: '',
  seo: {
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    canonicalUrl: '',
    ogImage: { url: '', alt: '' },
    noindex: false,
  },
});

const formFromPost = (post) => ({
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  content: post.content,
  topicId: post.topicId || '',
  tags: [...post.tags],
  authorName: post.authorName || DEFAULT_AUTHOR,
  coverImage: { url: post.coverImage.url, alt: post.coverImage.alt },
  faqs: post.faqs.map((f) => ({ question: f.question, answer: f.answer })),
  status: post.status,
  featured: post.featured,
  publishedAt: toLocalInput(post.publishedAt),
  seo: {
    metaTitle: post.seo.metaTitle,
    metaDescription: post.seo.metaDescription,
    focusKeyword: post.seo.focusKeyword,
    canonicalUrl: post.seo.canonicalUrl,
    ogImage: { url: post.seo.ogImage.url, alt: post.seo.ogImage.alt },
    noindex: post.seo.noindex,
  },
});

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-[11px] font-semibold text-[#B11912]">
      {children}
    </p>
  );
}

/** Tags typed one at a time: Enter or comma adds, Backspace on empty removes the last. */
function TagInput({ tags, onChange, error }) {
  const [draft, setDraft] = useState('');
  const add = (raw) => {
    const tag = raw.replace(/\s+/g, ' ').trim().slice(0, LIMITS.tag);
    if (!tag || tags.some((t) => t.toLowerCase() === tag.toLowerCase()) || tags.length >= LIMITS.tags) return;
    onChange([...tags, tag]);
  };
  return (
    <div>
      <div
        className={`flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-lg border bg-white min-h-[38px] focus-within:ring-2 focus-within:ring-[#FCE9E7] ${
          error ? 'border-[#E1261C]' : 'border-[#E8E6E3] focus-within:border-[#E1261C]'
        }`}
      >
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-[#F0EEEB] text-[12px] text-[#0A0A0A]">
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="w-4 h-4 inline-flex items-center justify-center rounded-full text-[#888888] hover:bg-[#E0DDD8] hover:text-[#0A0A0A]"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          aria-label="Add a tag"
          onChange={(e) => {
            const value = e.target.value;
            if (value.includes(',')) {
              value.split(',').slice(0, -1).forEach(add);
              setDraft(value.split(',').pop());
            } else {
              setDraft(value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(draft);
              setDraft('');
            } else if (e.key === 'Backspace' && !draft && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (draft.trim()) {
              add(draft);
              setDraft('');
            }
          }}
          placeholder={tags.length >= LIMITS.tags ? '' : tags.length ? 'Add another…' : 'e.g. heirs, timing'}
          disabled={tags.length >= LIMITS.tags}
          className="flex-1 min-w-[90px] px-1 py-0.5 text-sm bg-transparent focus:outline-none"
        />
      </div>
      <p className="mt-1 text-[11px] text-[#888888]">
        Press Enter after each one. Up to {LIMITS.tags}. Visitors can click a tag to find related guides.
      </p>
      <FieldError>{error}</FieldError>
    </div>
  );
}

/**
 * Create or edit one article. `id` is absent for a new article.
 */
export default function ArticleEditor({ id }) {
  const router = useRouter();
  const [post, setPost] = useState(null); // the article as last saved
  const [form, setForm] = useState(blankForm);
  const [baseline, setBaseline] = useState(blankForm);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(null); // 'draft' | 'published' | null
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [conflict, setConflict] = useState(null); // { message, status }
  const [confirm, setConfirm] = useState(null); // 'unpublish' | 'delete'
  const [topicDialog, setTopicDialog] = useState(null); // { name, description, error, busy }
  const [contentText, setContentText] = useState('');
  const postRef = useRef(null);
  postRef.current = post;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [topicData, postData] = await Promise.all([
        adminFetch('/api/admin/resources/topics'),
        id ? adminFetch(`/api/admin/resources/posts/${id}`) : Promise.resolve(null),
      ]);
      setTopics(topicData.topics || []);
      if (postData?.post) {
        const next = formFromPost(postData.post);
        setPost(postData.post);
        setForm(next);
        setBaseline(next);
        setEditorKey((k) => k + 1);
      }
    } catch (err) {
      setLoadError(err.status === 404 ? 'This article does not exist. It may have been deleted.' : err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), toast.type === 'error' ? 8000 : 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const dirty = !loading && JSON.stringify(form) !== JSON.stringify(baseline);
  useUnsavedChangesGuard(dirty);

  const analysis = useMemo(() => analyzeContent(form.content), [form.content]);
  const readingMinutes = Math.max(1, Math.round(analysis.words / WPM));

  const savedState = post ? postState(post) : 'draft';
  const live = savedState !== 'draft';
  const scheduledFor = fromLocalInput(form.publishedAt);
  const willSchedule = Boolean(scheduledFor) && new Date(scheduledFor).getTime() > Date.now();

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setSeo = (patch) => setForm((f) => ({ ...f, seo: { ...f.seo, ...patch } }));
  const clearError = (...keys) =>
    setErrors((e) => {
      if (!keys.some((k) => e[k])) return e;
      const next = { ...e };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  const onTitle = (title) => {
    setForm((f) => ({ ...f, title, ...(slugTouched ? {} : { slug: slugify(title) }) }));
    clearError('title', 'slug');
  };

  // The editor's own rendering of the stored HTML is the starting point, so
  // opening an article and leaving it untouched is not a change.
  const onEditorReady = useCallback((html, text) => {
    setForm((f) => ({ ...f, content: html }));
    setBaseline((b) => ({ ...b, content: html }));
    setContentText(text);
  }, []);
  const onEditorChange = useCallback((html, text) => {
    setForm((f) => ({ ...f, content: html }));
    setContentText(text);
    setErrors((e) => (e.content ? (({ content, ...rest }) => rest)(e) : e));
  }, []);

  const save = async (status, { force = false } = {}) => {
    if (saving) return;
    setSaving(status);
    setErrors({});
    const current = postRef.current;
    // The date field holds minutes; an untouched date keeps its exact value.
    const publishedAt =
      current?.publishedAt && form.publishedAt === toLocalInput(current.publishedAt)
        ? current.publishedAt
        : fromLocalInput(form.publishedAt);
    const payload = {
      ...form,
      status,
      publishedAt,
      ...(current ? { expectedUpdatedAt: current.updatedAt, force } : {}),
    };
    try {
      const data = current
        ? await adminFetch(`/api/admin/resources/posts/${current.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await adminFetch('/api/admin/resources/posts', { method: 'POST', body: JSON.stringify(payload) });
      const saved = data.post;
      const savedForm = formFromPost(saved);
      const sent = form;
      // The baseline is what was sent, with the editor's HTML (the stored copy
      // differs only in what the site adds when it renders: heading anchors,
      // link targets). Anything typed while the save was in flight is kept,
      // and still counts as unsaved.
      setForm((latest) => {
        const merged = { ...savedForm, content: latest.content };
        for (const key of Object.keys(latest)) {
          if (key !== 'content' && JSON.stringify(latest[key]) !== JSON.stringify(sent[key])) merged[key] = latest[key];
        }
        return merged;
      });
      setBaseline({ ...savedForm, content: sent.content });
      setPost(saved);
      setSlugTouched(true);
      setConflict(null);
      const state = postState(saved);
      const verb =
        status === 'draft'
          ? current && postState(current) !== 'draft'
            ? 'Unpublished. The article is a draft again.'
            : 'Draft saved.'
          : state === 'scheduled'
            ? `Scheduled for ${new Date(saved.publishedAt).toLocaleString()}.`
            : current && postState(current) === 'published'
              ? 'Changes published.'
              : 'Published. The article is live.';
      setToast({ type: 'success', message: verb });
      if (!current) {
        // Same screen, now addressed by the article's id (Next keeps its
        // router in step with history.replaceState).
        window.history.replaceState(null, '', `/admin/resources/${saved.id}`);
      }
    } catch (err) {
      if (err.status === 409 && err.data?.conflict) {
        setConflict({ message: err.message, status });
      } else if (err.data?.fields) {
        setErrors(err.data.fields);
        const count = Object.keys(err.data.fields).length;
        setToast({ type: 'error', message: count === 1 ? Object.values(err.data.fields)[0] : `Fix the ${count} highlighted fields, then try again.` });
        requestAnimationFrame(() => {
          const first = document.querySelector('[data-invalid="true"]');
          first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      } else {
        setToast({ type: 'error', message: err.message });
      }
    } finally {
      setSaving(null);
    }
  };

  // Cmd/Ctrl+S saves without changing whether the article is live.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveRef.current(postRef.current?.status === 'published' ? 'published' : 'draft');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const reloadTheirs = async () => {
    setConflict(null);
    await load();
    setToast({ type: 'info', message: 'Loaded the latest saved version.' });
  };

  const remove = async () => {
    if (!post) return;
    setSaving('delete');
    try {
      await adminFetch(`/api/admin/resources/posts/${post.id}`, { method: 'DELETE' });
      router.push('/admin/resources');
    } catch (err) {
      setToast({ type: 'error', message: err.message });
      setSaving(null);
      setConfirm(null);
    }
  };

  const createTopic = async () => {
    const name = (topicDialog?.name || '').trim();
    if (!name) {
      setTopicDialog((d) => ({ ...d, error: 'Name the topic.' }));
      return;
    }
    setTopicDialog((d) => ({ ...d, busy: true, error: '' }));
    try {
      const data = await adminFetch('/api/admin/resources/topics', {
        method: 'POST',
        body: JSON.stringify({ name, description: topicDialog.description || '', order: topics.length + 1 }),
      });
      setTopics((t) => [...t, data.topic]);
      update({ topicId: data.topic.id });
      clearError('topicId');
      setTopicDialog(null);
    } catch (err) {
      setTopicDialog((d) => ({ ...d, busy: false, error: err.data?.fields?.name || err.data?.fields?.slug || err.message }));
    }
  };

  if (loading && !post && !loadError) return <DetailSkeleton label="Loading the article…" />;
  if (loadError) {
    return (
      <Panel>
        <ErrorState message={loadError} onRetry={id ? load : undefined} />
        <div className="text-center -mt-8 pb-8">
          <Link href="/admin/resources" className="text-sm font-semibold text-[#E1261C] hover:underline">
            Back to all articles
          </Link>
        </div>
      </Panel>
    );
  }

  const topic = topics.find((t) => t.id === form.topicId);
  const slugChanged = post && live && form.slug !== post.slug;
  const invalid = (key) => (errors[key] ? { 'data-invalid': 'true' } : {});
  const errorCount = Object.keys(errors).length;
  const previewDate = formatArticleDate(scheduledFor || post?.publishedAt || new Date().toISOString());
  const excerptLength = form.excerpt.trim().length;

  const primaryLabel = live ? 'Update' : willSchedule ? 'Schedule' : 'Publish';

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link href="/admin/resources" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#888888] hover:text-[#E1261C]">
            <ArrowLeft className="w-3.5 h-3.5" />
            All articles
          </Link>
        }
        title={post ? 'Edit article' : 'New article'}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={STATE_TONE[savedState]}>{post ? STATE_LABEL[savedState] : 'Not saved yet'}</Badge>
            {dirty ? (
              <span className="text-[#9A6400] font-semibold">Unsaved changes</span>
            ) : (
              post && <span>Saved {relativeTime(post.updatedAt)}{post.updatedBy ? ` by ${post.updatedBy}` : ''}</span>
            )}
          </span>
        }
        actions={
          <>
            <Button icon={preview ? PenLine : Eye} onClick={() => setPreview((p) => !p)}>
              {preview ? 'Back to editing' : 'Preview'}
            </Button>
            {savedState === 'published' && (
              <a
                href={articlePath(post.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg border border-[#E8E6E3] bg-white text-[#4A4A4A] hover:bg-[#F7F5F2] hover:text-[#0A0A0A]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View live
              </a>
            )}
            {live ? (
              <Button onClick={() => setConfirm('unpublish')} disabled={Boolean(saving)}>
                Unpublish
              </Button>
            ) : (
              <Button onClick={() => save('draft')} loading={saving === 'draft'} disabled={Boolean(saving)}>
                Save draft
              </Button>
            )}
            <Button variant="primary" onClick={() => save('published')} loading={saving === 'published'} disabled={Boolean(saving)}>
              {primaryLabel}
            </Button>
          </>
        }
      />

      {errorCount > 0 && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-[#F5C6C1] bg-[#FCE9E7] px-4 py-3 text-sm text-[#B11912]">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{errorCount === 1 ? 'One thing needs fixing before this can be saved:' : `${errorCount} things need fixing before this can be saved:`}</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {Object.entries(errors).map(([key, message]) => (
                <li key={key}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div className="min-w-0 space-y-6">
          {preview ? (
            <Panel bodyClassName="p-0">
              <div className="px-6 sm:px-10 py-8 sm:py-10 max-w-[820px]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888] mb-6">
                  Preview — how the article will look on {SITE_HOST}
                </p>
                {topic && (
                  <span className="inline-flex rounded-full bg-[#FCE9E7] px-3.5 py-1.5 font-['JetBrains_Mono'] text-[11px] tracking-[0.14em] uppercase text-[#E1261C] mb-5">
                    {topic.name}
                  </span>
                )}
                <h1 className="font-['Fraunces'] text-[clamp(30px,4vw,48px)] font-semibold tracking-[-0.02em] leading-[1.06] text-[#0A0A0A] mb-4">
                  {form.title || 'Untitled article'}
                </h1>
                {form.excerpt && <p className="text-lg leading-relaxed text-[#4A4A4A] mb-6">{form.excerpt}</p>}
                <p className="text-sm text-[#888888] border-t border-[#E8E6E3] pt-4 mb-8">
                  {form.authorName || DEFAULT_AUTHOR} · {previewDate} · {readingMinutes} min read
                </p>
                {form.coverImage.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.coverImage.url} alt={form.coverImage.alt} className="w-full max-h-[420px] object-cover rounded-2xl border border-[#E8E6E3] mb-10" />
                )}
                <ArticleBody html={form.content} />
                {form.faqs.some((f) => f.question && f.answer) && (
                  <section className="mt-12">
                    <h2 className="font-['Fraunces'] text-[28px] font-semibold mb-4">Frequently asked questions</h2>
                    <div className="border-y border-[#E8E6E3] divide-y divide-[#E8E6E3]">
                      {form.faqs
                        .filter((f) => f.question && f.answer)
                        .map((f, i) => (
                          <div key={i} className="py-4">
                            <p className="font-['Fraunces'] text-lg font-semibold text-[#0A0A0A]">{f.question}</p>
                            <p className="mt-2 text-[15px] leading-relaxed text-[#4A4A4A] whitespace-pre-line">{f.answer}</p>
                          </div>
                        ))}
                    </div>
                  </section>
                )}
              </div>
            </Panel>
          ) : null}

          <div className={preview ? 'hidden' : 'space-y-6'}>
            <Panel>
              <div className="space-y-5">
                <div {...invalid('title')}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="article-title" className="text-xs font-semibold text-[#4A4A4A]">
                      Title
                    </label>
                    <span className={`text-[11px] tabular-nums ${counterTone(form.title.length, { limit: LIMITS.title })}`}>
                      {form.title.length}/{LIMITS.title}
                    </span>
                  </div>
                  <input
                    id="article-title"
                    type="text"
                    value={form.title}
                    maxLength={LIMITS.title}
                    onChange={(e) => onTitle(e.target.value)}
                    placeholder="e.g. How long does a California unclaimed property claim take?"
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? 'title-error' : undefined}
                    className={`w-full px-4 py-3 rounded-lg border bg-white text-[22px] sm:text-[26px] font-semibold text-[#0A0A0A] placeholder-[#C9C5BF] focus:outline-none focus:ring-2 focus:ring-[#FCE9E7] ${
                      errors.title ? 'border-[#E1261C]' : 'border-[#E8E6E3] focus:border-[#E1261C]'
                    }`}
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  />
                  <FieldError id="title-error">{errors.title}</FieldError>
                </div>

                <div {...invalid('slug')}>
                  <label htmlFor="article-slug" className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">
                    URL
                  </label>
                  <div
                    className={`flex items-stretch rounded-lg border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#FCE9E7] ${
                      errors.slug ? 'border-[#E1261C]' : 'border-[#E8E6E3] focus-within:border-[#E1261C]'
                    }`}
                  >
                    <span className="hidden sm:flex items-center px-3 bg-[#F7F5F2] border-r border-[#E8E6E3] font-['JetBrains_Mono',monospace] text-[12px] text-[#888888] whitespace-nowrap">
                      {SITE_HOST}/resources/
                    </span>
                    <input
                      id="article-slug"
                      type="text"
                      value={form.slug}
                      maxLength={LIMITS.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        update({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') });
                        clearError('slug');
                      }}
                      onBlur={() => form.slug && update({ slug: slugify(form.slug) })}
                      placeholder="how-long-does-a-claim-take"
                      aria-invalid={Boolean(errors.slug)}
                      className="flex-1 min-w-0 px-3 py-2 font-['JetBrains_Mono',monospace] text-[13px] text-[#0A0A0A] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        update({ slug: slugify(form.title) });
                        clearError('slug');
                      }}
                      className="px-3 text-[11px] font-semibold text-[#4A4A4A] border-l border-[#E8E6E3] hover:bg-[#F7F5F2] whitespace-nowrap"
                    >
                      From title
                    </button>
                  </div>
                  <FieldError>{errors.slug}</FieldError>
                  {slugChanged && !errors.slug && (
                    <p className="mt-1.5 text-[11px] text-[#9A6400] flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      This article is live. Its old address, {articlePath(post.slug)}, will redirect to the new one.
                    </p>
                  )}
                </div>

                <div {...invalid('excerpt')}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="article-excerpt" className="text-xs font-semibold text-[#4A4A4A]">
                      Summary
                    </label>
                    <span className={`text-[11px] tabular-nums ${counterTone(excerptLength, { ...SEO_GUIDE.excerpt, limit: LIMITS.excerpt })}`}>
                      {excerptLength}/{SEO_GUIDE.excerpt.max}
                    </span>
                  </div>
                  <textarea
                    id="article-excerpt"
                    rows={3}
                    value={form.excerpt}
                    maxLength={LIMITS.excerpt}
                    onChange={(e) => {
                      update({ excerpt: e.target.value });
                      clearError('excerpt');
                    }}
                    placeholder="One or two sentences on what the reader will learn. Shown under the title, on cards and in search results."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] bg-white focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7] resize-y"
                  />
                  <p className="mt-1 text-[11px] text-[#888888]">Leave empty to use the article’s opening sentences.</p>
                  <FieldError>{errors.excerpt}</FieldError>
                </div>
              </div>
            </Panel>

            <div {...invalid('content')}>
              <RichTextEditor
                key={editorKey}
                initialHtml={form.content}
                onReady={onEditorReady}
                onChange={onEditorChange}
                onNotice={setToast}
                invalid={Boolean(errors.content)}
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#888888]">
                <span>
                  {analysis.words.toLocaleString()} words · {readingMinutes} min read · {analysis.h2} section
                  {analysis.h2 === 1 ? '' : 's'}
                  {!contentText.trim() && ' · empty'}
                </span>
                <span>Tip: paste from Google Docs or Word keeps headings, lists and links.</span>
              </div>
              <FieldError>{errors.content}</FieldError>
            </div>

            <Panel
              title="Frequently asked questions"
              subtitle="Optional. Shown at the end of the article and marked up for Google as an FAQ."
              actions={
                <Button
                  size="sm"
                  icon={Plus}
                  disabled={form.faqs.length >= LIMITS.faqs}
                  onClick={() => update({ faqs: [...form.faqs, { question: '', answer: '' }] })}
                >
                  Add question
                </Button>
              }
            >
              {form.faqs.length === 0 ? (
                <p className="text-xs text-[#888888]">No questions yet. Add the two or three things readers most often ask about this topic.</p>
              ) : (
                <ol className="space-y-4">
                  {form.faqs.map((faq, i) => {
                    const key = `faqs.${i}`;
                    const move = (delta) => {
                      const faqs = [...form.faqs];
                      const [item] = faqs.splice(i, 1);
                      faqs.splice(i + delta, 0, item);
                      update({ faqs });
                    };
                    const set = (patch) => {
                      update({ faqs: form.faqs.map((f, j) => (j === i ? { ...f, ...patch } : f)) });
                      clearError(key);
                    };
                    return (
                      <li key={i} {...invalid(key)} className={`rounded-lg border p-3 ${errors[key] ? 'border-[#E1261C]' : 'border-[#E8E6E3]'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#888888]">Question {i + 1}</span>
                          <span className="flex items-center gap-0.5">
                            <button type="button" disabled={i === 0} onClick={() => move(-1)} className="p-1 rounded text-[#888888] hover:bg-[#F0EEEB] disabled:opacity-30" aria-label="Move up">
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" disabled={i === form.faqs.length - 1} onClick={() => move(1)} className="p-1 rounded text-[#888888] hover:bg-[#F0EEEB] disabled:opacity-30" aria-label="Move down">
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => update({ faqs: form.faqs.filter((_, j) => j !== i) })}
                              className="p-1 rounded text-[#888888] hover:bg-[#FCE9E7] hover:text-[#B11912]"
                              aria-label={`Remove question ${i + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        </div>
                        <input
                          type="text"
                          value={faq.question}
                          maxLength={LIMITS.faqQuestion}
                          onChange={(e) => set({ question: e.target.value })}
                          placeholder="Question"
                          aria-label={`Question ${i + 1}`}
                          className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-[#E8E6E3] bg-white focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
                        />
                        <textarea
                          rows={3}
                          value={faq.answer}
                          maxLength={LIMITS.faqAnswer}
                          onChange={(e) => set({ answer: e.target.value })}
                          placeholder="Answer — a short, complete reply in plain text"
                          aria-label={`Answer ${i + 1}`}
                          className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] bg-white focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7] resize-y"
                        />
                        <FieldError>{errors[key]}</FieldError>
                      </li>
                    );
                  })}
                </ol>
              )}
              <FieldError>{errors.faqs}</FieldError>
            </Panel>
          </div>
        </div>

        <div className="space-y-6 min-w-0">
          <Panel title="Publishing">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#888888]">Status</span>
                <Badge tone={STATE_TONE[savedState]}>{post ? STATE_LABEL[savedState] : 'Draft (not saved)'}</Badge>
              </div>

              <label className="block" {...invalid('publishedAt')}>
                <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">{live ? 'Publish date' : 'Publish date (optional)'}</span>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => {
                    update({ publishedAt: e.target.value });
                    clearError('publishedAt');
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] bg-white focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
                />
                <span className="block text-[11px] text-[#888888] mt-1 leading-relaxed">
                  {live
                    ? 'Shown on the article. A future date takes it off the site until then.'
                    : 'Leave empty to go live when you publish. Pick a future date to schedule it.'}
                </span>
                <FieldError>{errors.publishedAt}</FieldError>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => update({ featured: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-[#E1261C]"
                />
                <span>
                  <span className="block text-xs font-semibold text-[#0A0A0A]">Feature on the Resources page</span>
                  <span className="block text-[11px] text-[#888888]">The newest featured article leads the hub.</span>
                </span>
              </label>

              {post && (
                <div className="pt-3 border-t border-[#E8E6E3] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-[#888888]">
                    Created {relativeTime(post.createdAt)}
                    {post.previousSlugs?.length ? ` · ${post.previousSlugs.length} old URL${post.previousSlugs.length === 1 ? '' : 's'} redirect here` : ''}
                  </span>
                  <Button size="sm" variant="danger" icon={Trash2} onClick={() => setConfirm('delete')} disabled={Boolean(saving)}>
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Topic and tags">
            <div className="space-y-4">
              <div {...invalid('topicId')}>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="article-topic" className="text-xs font-semibold text-[#4A4A4A]">
                    Topic
                  </label>
                  <button
                    type="button"
                    onClick={() => setTopicDialog({ name: '', description: '', error: '', busy: false })}
                    className="text-[11px] font-semibold text-[#E1261C] hover:underline"
                  >
                    + New topic
                  </button>
                </div>
                <select
                  id="article-topic"
                  value={form.topicId}
                  onChange={(e) => {
                    update({ topicId: e.target.value });
                    clearError('topicId');
                  }}
                  aria-invalid={Boolean(errors.topicId)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#FCE9E7] ${
                    errors.topicId ? 'border-[#E1261C]' : 'border-[#E8E6E3] focus:border-[#E1261C]'
                  }`}
                >
                  <option value="">Choose a topic…</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <FieldError>{errors.topicId}</FieldError>
              </div>

              <div {...invalid('tags')}>
                <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">Tags</span>
                <TagInput
                  tags={form.tags}
                  onChange={(tags) => {
                    update({ tags });
                    clearError('tags');
                  }}
                  error={errors.tags}
                />
              </div>

              <label className="block" {...invalid('authorName')}>
                <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">Author</span>
                <input
                  type="text"
                  value={form.authorName}
                  maxLength={LIMITS.authorName}
                  onChange={(e) => {
                    update({ authorName: e.target.value });
                    clearError('authorName');
                  }}
                  placeholder={DEFAULT_AUTHOR}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] bg-white focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
                />
                <FieldError>{errors.authorName}</FieldError>
              </label>
            </div>
          </Panel>

          <Panel title="Cover image" subtitle="Optional. Without one, the card shows a branded panel with the title.">
            <div {...invalid('coverImage.url')} {...invalid('coverImage.alt')}>
              <ImageField
                label="Image"
                value={form.coverImage}
                onChange={(coverImage) => {
                  update({ coverImage });
                  clearError('coverImage.url', 'coverImage.alt');
                }}
                errors={{ url: errors['coverImage.url'], alt: errors['coverImage.alt'] }}
                emptyText="Upload a cover image"
              />
            </div>
          </Panel>

          <Panel title="Search engine optimisation" subtitle="How the article appears on Google and when shared">
            <SeoPanel form={form} analysis={analysis} errors={errors} setSeo={setSeo} previewDate={previewDate} />
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'unpublish'}
        title="Unpublish this article?"
        message="It comes off the site straight away and becomes a draft. Its address will show “not found” until you publish it again."
        confirmLabel="Unpublish"
        busy={saving === 'draft'}
        onConfirm={async () => {
          setConfirm(null);
          await save('draft');
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this article?"
        message={`“${post?.title || 'This article'}” will be removed for good${live ? ' and its page will stop working' : ''}. To take it off the site but keep it, unpublish it instead.`}
        confirmLabel="Delete article"
        danger
        busy={saving === 'delete'}
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
      />

      <Modal
        open={Boolean(conflict)}
        title="Someone else changed this article"
        onClose={() => setConflict(null)}
        width="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={reloadTheirs}
              className="px-3.5 py-2 text-sm font-semibold rounded-lg border border-[#E8E6E3] bg-white text-[#4A4A4A] hover:bg-[#F7F5F2]"
            >
              Discard mine, load theirs
            </button>
            <button
              type="button"
              onClick={() => save(conflict.status, { force: true })}
              className="px-3.5 py-2 text-sm font-semibold rounded-lg bg-[#B11912] text-white hover:bg-[#8F130E]"
            >
              Overwrite with my version
            </button>
          </>
        }
      >
        <p className="text-sm text-[#4A4A4A] leading-relaxed">
          {conflict?.message} Saving now would replace their changes with yours. You can load the latest version (your unsaved edits
          will be lost), or keep yours and overwrite theirs.
        </p>
      </Modal>

      <Modal
        open={Boolean(topicDialog)}
        title="New topic"
        onClose={() => setTopicDialog(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setTopicDialog(null)}
              className="px-3.5 py-2 text-sm font-semibold rounded-lg border border-[#E8E6E3] bg-white text-[#4A4A4A] hover:bg-[#F7F5F2]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createTopic}
              disabled={topicDialog?.busy}
              className="px-3.5 py-2 text-sm font-semibold rounded-lg bg-[#E1261C] text-white hover:bg-[#B11912] disabled:opacity-60"
            >
              {topicDialog?.busy ? 'Creating…' : 'Create topic'}
            </button>
          </>
        }
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            createTopic();
          }}
        >
          <label className="block">
            <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">Name</span>
            <input
              type="text"
              value={topicDialog?.name || ''}
              maxLength={LIMITS.topicName}
              onChange={(e) => setTopicDialog((d) => ({ ...d, name: e.target.value, error: '' }))}
              placeholder="e.g. Inheritance & Estates"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">Description (optional)</span>
            <textarea
              rows={2}
              value={topicDialog?.description || ''}
              maxLength={LIMITS.topicDescription}
              onChange={(e) => setTopicDialog((d) => ({ ...d, description: e.target.value }))}
              placeholder="One sentence shown on the topic page"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7] resize-y"
            />
          </label>
          {topicDialog?.error && <p className="text-xs font-semibold text-[#B11912]">{topicDialog.error}</p>}
          <p className="text-[11px] text-[#888888]">You can add its SEO title and description later under Topics.</p>
        </form>
      </Modal>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
