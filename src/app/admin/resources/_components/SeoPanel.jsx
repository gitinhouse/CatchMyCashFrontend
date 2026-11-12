'use client';

import React, { useMemo } from 'react';
import { CheckCircle2, Circle, Search } from 'lucide-react';
import ImageField from './ImageField';
import { counterTone } from './shared';
import { seoChecks } from './analysis';
import { LIMITS, SEO_GUIDE, articlePath } from '../../../lib/resources/constants';

const SITE = 'catchmycash.com';
const BRAND = ' | CatchMyCash';

const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

function Counter({ length, guide, limit }) {
  return (
    <span className={`text-[11px] tabular-nums ${counterTone(length, { ...guide, limit })}`}>
      {length}/{guide.max}
    </span>
  );
}

/** How the article is likely to look as a Google result. */
export function SearchPreview({ title, description, slug, date }) {
  return (
    <div className="rounded-lg border border-[#E8E6E3] bg-white p-4" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-7 h-7 rounded-full bg-[#F1F3F4] flex items-center justify-center text-[11px] font-bold text-[#E1261C]">C</span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[13px] text-[#202124]">CatchMyCash</span>
          <span className="block text-[12px] text-[#4D5156] truncate">
            https://{SITE}
            {slug ? ` › resources › ${slug}` : ' › resources'}
          </span>
        </span>
      </div>
      <p className="text-[19px] leading-snug text-[#1A0DAB] break-words">{clip(title || 'Article title', 62)}</p>
      <p className="text-[13px] leading-snug text-[#4D5156] mt-1 break-words">
        {date && <span className="text-[#70757A]">{date} — </span>}
        {description ? clip(description, 158) : <span className="italic">Add a summary or meta description.</span>}
      </p>
    </div>
  );
}

/** How a link to the article looks when shared. */
function SocialPreview({ image, title, description }) {
  return (
    <div className="rounded-lg border border-[#E8E6E3] overflow-hidden bg-white">
      <div className="aspect-[1200/630] bg-[#F0EEEB]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image || '/og-image.png'} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="px-3 py-2.5 border-t border-[#E8E6E3] bg-[#F7F5F2]">
        <p className="text-[11px] uppercase tracking-wide text-[#888888]">{SITE}</p>
        <p className="text-[13px] font-semibold text-[#0A0A0A] leading-snug line-clamp-2">{title}</p>
        <p className="text-[12px] text-[#4A4A4A] leading-snug line-clamp-2">{description}</p>
      </div>
    </div>
  );
}

/**
 * The SEO controls for one article, with a Google preview and a checklist.
 * setSeo(patch) merges into form.seo.
 */
export default function SeoPanel({ form, analysis, errors, setSeo, previewDate }) {
  const seo = form.seo;
  const effectiveTitle = (seo.metaTitle || form.title).trim();
  const effectiveDescription = (seo.metaDescription || form.excerpt).trim();
  const checks = useMemo(() => seoChecks(form, analysis), [form, analysis]);
  const passed = checks.filter((c) => c.ok).length;
  const score = checks.length ? Math.round((passed / checks.length) * 100) : 0;
  const tone = score >= 80 ? 'bg-[#00A67A]' : score >= 50 ? 'bg-[#E0A030]' : 'bg-[#E1261C]';
  const defaultUrl = `https://${SITE}${articlePath(form.slug || 'your-article')}`;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-[#4A4A4A] mb-1.5 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" />
          Search result preview
        </p>
        <SearchPreview
          title={`${effectiveTitle}${BRAND}`}
          description={effectiveDescription}
          slug={form.slug}
          date={previewDate}
        />
      </div>

      <label className="block">
        <span className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[#4A4A4A]">SEO title</span>
          <Counter length={effectiveTitle.length} guide={SEO_GUIDE.metaTitle} limit={LIMITS.metaTitle} />
        </span>
        <input
          type="text"
          value={seo.metaTitle}
          maxLength={LIMITS.metaTitle}
          onChange={(e) => setSeo({ metaTitle: e.target.value })}
          placeholder={form.title || 'Defaults to the article title'}
          aria-invalid={Boolean(errors['seo.metaTitle'])}
          className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] bg-white focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
        />
        <span className="block text-[11px] text-[#888888] mt-1">
          Shown as the blue link in search results, followed by “{BRAND.trim()}”. Leave empty to use the title.
        </span>
        {errors['seo.metaTitle'] && <span className="block text-[11px] font-semibold text-[#B11912] mt-1">{errors['seo.metaTitle']}</span>}
      </label>

      <label className="block">
        <span className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[#4A4A4A]">Meta description</span>
          <Counter length={effectiveDescription.length} guide={SEO_GUIDE.metaDescription} limit={LIMITS.metaDescription} />
        </span>
        <textarea
          rows={3}
          value={seo.metaDescription}
          maxLength={LIMITS.metaDescription}
          onChange={(e) => setSeo({ metaDescription: e.target.value })}
          placeholder={form.excerpt || 'Defaults to the summary'}
          aria-invalid={Boolean(errors['seo.metaDescription'])}
          className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] bg-white focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7] resize-y"
        />
        <span className="block text-[11px] text-[#888888] mt-1">The text under the link in search results. Leave empty to use the summary.</span>
        {errors['seo.metaDescription'] && (
          <span className="block text-[11px] font-semibold text-[#B11912] mt-1">{errors['seo.metaDescription']}</span>
        )}
      </label>

      <label className="block">
        <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">Focus keyword</span>
        <input
          type="text"
          value={seo.focusKeyword}
          maxLength={LIMITS.focusKeyword}
          onChange={(e) => setSeo({ focusKeyword: e.target.value })}
          placeholder="e.g. claim unclaimed money california"
          className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] bg-white focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
        />
        <span className="block text-[11px] text-[#888888] mt-1">Only used for the checklist below; it is not published.</span>
      </label>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#4A4A4A]">SEO checklist</span>
          <span className="text-[11px] font-semibold text-[#4A4A4A] tabular-nums">
            {passed} of {checks.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[#F0EEEB] overflow-hidden mb-3" aria-hidden="true">
          <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${score}%` }} />
        </div>
        <ul className="space-y-2">
          {checks.map((check) => (
            <li key={check.id} className="flex gap-2 text-[12px] leading-snug">
              {check.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00A67A]" aria-label="Done" />
              ) : (
                <Circle className="w-4 h-4 shrink-0 text-[#D4A64A]" aria-label="To do" />
              )}
              <span>
                <span className={check.ok ? 'text-[#4A4A4A]' : 'text-[#0A0A0A] font-medium'}>{check.label}</span>
                {!check.ok && check.tip && <span className="block text-[11px] text-[#888888] mt-0.5">{check.tip}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <details className="group rounded-lg border border-[#E8E6E3] bg-[#FCFBFA]" open={Boolean(seo.canonicalUrl || seo.noindex || seo.ogImage.url)}>
        <summary className="cursor-pointer select-none px-3 py-2.5 text-xs font-semibold text-[#4A4A4A]">
          Advanced: sharing image, canonical URL, indexing
        </summary>
        <div className="px-3 pb-3 space-y-4">
          <div>
            <ImageField
              label="Social sharing image"
              value={seo.ogImage}
              onChange={(ogImage) => setSeo({ ogImage })}
              errors={{ url: errors['seo.ogImage.url'], alt: errors['seo.ogImage.alt'] }}
              emptyText="Upload a sharing image"
              hint="Shown when the article is shared on social networks. Best at 1200 × 630. Defaults to the cover image, then the site’s card."
            />
            <p className="text-[11px] font-semibold text-[#4A4A4A] mt-3 mb-1.5">Share preview</p>
            <SocialPreview
              image={seo.ogImage.url || form.coverImage.url}
              title={`${effectiveTitle || 'Article title'}${BRAND}`}
              description={effectiveDescription}
            />
          </div>

          <label className="block">
            <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">Canonical URL</span>
            <input
              type="url"
              value={seo.canonicalUrl}
              maxLength={LIMITS.url}
              onChange={(e) => setSeo({ canonicalUrl: e.target.value })}
              placeholder={defaultUrl}
              aria-invalid={Boolean(errors['seo.canonicalUrl'])}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E6E3] bg-white focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
            />
            <span className="block text-[11px] text-[#888888] mt-1 leading-relaxed">
              Only set this if the article first appeared elsewhere: search engines will credit that address instead, and
              the article leaves the sitemap.
            </span>
            {errors['seo.canonicalUrl'] && (
              <span className="block text-[11px] font-semibold text-[#B11912] mt-1">{errors['seo.canonicalUrl']}</span>
            )}
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={seo.noindex}
              onChange={(e) => setSeo({ noindex: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-[#E1261C]"
            />
            <span>
              <span className="block text-xs font-semibold text-[#0A0A0A]">Hide from search engines</span>
              <span className="block text-[11px] text-[#888888] leading-relaxed">
                Adds “noindex” and leaves the article out of the sitemap, feed and llms.txt. Visitors can still open it.
              </span>
            </span>
          </label>
        </div>
      </details>
    </div>
  );
}
