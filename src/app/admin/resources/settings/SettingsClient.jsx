'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { adminFetch } from '../../_lib/api';
import { relativeTime } from '../../_lib/format';
import { PageHeader } from '../../_components/AdminShell';
import { Button, DetailSkeleton, ErrorState, Panel, Toast } from '../../_components/ui';
import ResourcesNav from '../_components/ResourcesNav';
import { SearchPreview } from '../_components/SeoPanel';
import { counterTone, useUnsavedChangesGuard } from '../_components/shared';
import { LIMITS, SEO_GUIDE } from '../../../lib/resources/constants';

const EMPTY = { heading: '', intro: '', metaTitle: '', metaDescription: '' };
const pick = (s) => ({ heading: s.heading || '', intro: s.intro || '', metaTitle: s.metaTitle || '', metaDescription: s.metaDescription || '' });

function Counter({ length, guide, limit }) {
  return (
    <span className={`text-[11px] tabular-nums ${counterTone(length, { ...(guide || {}), limit })}`}>
      {length}/{guide ? guide.max : limit}
    </span>
  );
}

/** The hub's heading, introduction and search snippet. */
export default function SettingsClient() {
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [defaults, setDefaults] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await adminFetch('/api/admin/resources/settings');
      setForm(pick(data.settings));
      setSaved(pick(data.settings));
      setDefaults(data.defaults);
      setUpdatedAt(data.settings.updatedAt);
    } catch (err) {
      setLoadError(err.message);
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

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  useUnsavedChangesGuard(Boolean(defaults) && dirty);

  const save = async () => {
    setBusy(true);
    setErrors({});
    try {
      const data = await adminFetch('/api/admin/resources/settings', { method: 'PUT', body: JSON.stringify(form) });
      setForm(pick(data.settings));
      setSaved(pick(data.settings));
      setUpdatedAt(data.settings.updatedAt);
      setToast({ type: 'success', message: 'Saved. The Resources page shows the new text now.' });
    } catch (err) {
      if (err.data?.fields) setErrors(err.data.fields);
      setToast({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const effective = (key) => (form[key] || '').trim() || defaults?.[key] || '';

  return (
    <>
      <PageHeader
        title="Resources"
        description={updatedAt ? `The hub page at /resources · last saved ${relativeTime(updatedAt)}` : 'The hub page at /resources'}
        actions={
          <Button variant="primary" icon={Save} onClick={save} loading={busy} disabled={!defaults || !dirty}>
            Save changes
          </Button>
        }
      />
      <ResourcesNav />

      {loadError ? (
        <Panel>
          <ErrorState message={loadError} onRetry={load} />
        </Panel>
      ) : !defaults ? (
        <DetailSkeleton label="Loading the hub settings…" />
      ) : (
        <form
          className="grid xl:grid-cols-2 gap-6 items-start"
          onSubmit={(e) => {
            e.preventDefault();
            if (dirty) save();
          }}
        >
          <Panel title="Page text" subtitle="The heading and introduction at the top of /resources. Leave a field empty to use the default shown.">
            <div className="space-y-5">
              <label className="block">
                <span className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#4A4A4A]">Heading (H1)</span>
                  <Counter length={form.heading.length} limit={LIMITS.hubHeading} />
                </span>
                <input
                  type="text"
                  value={form.heading}
                  maxLength={LIMITS.hubHeading}
                  onChange={set('heading')}
                  placeholder={defaults.heading}
                  className="w-full px-3 py-2 text-base font-semibold rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                />
                {errors.heading && <span className="block mt-1 text-[11px] font-semibold text-[#B11912]">{errors.heading}</span>}
              </label>
              <label className="block">
                <span className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#4A4A4A]">Introduction</span>
                  <Counter length={form.intro.length} limit={LIMITS.hubIntro} />
                </span>
                <textarea
                  rows={4}
                  value={form.intro}
                  maxLength={LIMITS.hubIntro}
                  onChange={set('intro')}
                  placeholder={defaults.intro}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7] resize-y"
                />
                {errors.intro && <span className="block mt-1 text-[11px] font-semibold text-[#B11912]">{errors.intro}</span>}
              </label>
              <div className="rounded-xl bg-[#0A0A0A] text-white p-6">
                <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] uppercase text-[#E1261C] mb-3">Resource Hub</p>
                <p className="font-['Fraunces'] text-3xl font-semibold leading-tight mb-3">{effective('heading')}</p>
                <p className="text-sm text-[#D4D4D4] leading-relaxed">{effective('intro')}</p>
              </div>
            </div>
          </Panel>

          <Panel title="Search engines" subtitle="The title and description Google shows for /resources">
            <div className="space-y-5">
              <SearchPreview title={`${effective('metaTitle')} | CatchMyCash`} description={effective('metaDescription')} slug="" />
              <label className="block">
                <span className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#4A4A4A]">SEO title</span>
                  <Counter length={effective('metaTitle').length} guide={SEO_GUIDE.metaTitle} limit={LIMITS.metaTitle} />
                </span>
                <input
                  type="text"
                  value={form.metaTitle}
                  maxLength={LIMITS.metaTitle}
                  onChange={set('metaTitle')}
                  placeholder={defaults.metaTitle}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
                />
                {errors.metaTitle && <span className="block mt-1 text-[11px] font-semibold text-[#B11912]">{errors.metaTitle}</span>}
              </label>
              <label className="block">
                <span className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#4A4A4A]">Meta description</span>
                  <Counter length={effective('metaDescription').length} guide={SEO_GUIDE.metaDescription} limit={LIMITS.metaDescription} />
                </span>
                <textarea
                  rows={3}
                  value={form.metaDescription}
                  maxLength={LIMITS.metaDescription}
                  onChange={set('metaDescription')}
                  placeholder={defaults.metaDescription}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7] resize-y"
                />
                {errors.metaDescription && (
                  <span className="block mt-1 text-[11px] font-semibold text-[#B11912]">{errors.metaDescription}</span>
                )}
              </label>
              <p className="text-[11px] text-[#888888] leading-relaxed">
                The hub also publishes a sitemap entry for every article, an RSS feed at /resources/feed.xml and structured data
                for search engines. Each article’s own SEO is set in its editor.
              </p>
            </div>
          </Panel>
        </form>
      )}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
