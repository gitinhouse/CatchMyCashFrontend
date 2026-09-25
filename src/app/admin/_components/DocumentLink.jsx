'use client';

import React, { useState } from 'react';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import { adminFetch } from '../_lib/api';

/**
 * Opens a case document in a new tab.
 *
 * The URL is resolved when the link is clicked rather than embedded when the
 * page renders: signed URLs expire an hour after minting, so a link sitting in
 * a backlog list had often gone stale and opened nothing. Resolving on demand
 * also surfaces the real reason when a document cannot be served.
 */
/** The label is written into the placeholder page, so it goes in as text. */
function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

export default function DocumentLink({
  caseId,
  field,
  label,
  className = '',
  compact = false,
  onError,
}) {
  const [loading, setLoading] = useState(false);

  const open = async () => {
    if (loading) return;
    setLoading(true);

    // The tab is opened synchronously, inside the click, and pointed at the
    // document once it resolves. Opening it after the await instead would be
    // outside the user gesture, which is exactly what pop-up blockers stop.
    //
    // No 'noopener' in the feature string: asking for it makes the browser
    // return null by design, and without a handle there was nothing to point
    // at the document. The blank tab stayed on about:blank and the fallback
    // below took over the tab the admin was working in, which is how the
    // document ended up opening over the page instead of beside it. The opener
    // is severed on the new tab itself, which keeps the handle and still
    // leaves the opened page no reference back here.
    const tab = window.open('', '_blank');

    if (tab) {
      try {
        tab.opener = null;
        // Something to read while the signed URL is being minted, rather than
        // a blank tab that looks like a dead end.
        const name = escapeHtml(label || 'document');
        tab.document.write(
          `<!doctype html><title>Opening ${name}…</title>` +
            '<body style="margin:0;display:flex;align-items:center;' +
            'justify-content:center;height:100vh;font:15px system-ui;' +
            'color:#4A4A4A;background:#F7F5F2">' +
            `Opening ${name}…</body>`,
        );
        tab.document.close();
      } catch {
        // A browser that refuses either of these still gets the document: the
        // handle is what matters, and the URL is pointed at it below.
      }
    }

    const fail = (message) => {
      try {
        tab?.close();
      } catch {
        /* the tab may already be gone */
      }
      onError?.(message);
    };

    try {
      const res = await adminFetch(
        `/api/admin/documents/resolve?case_id=${encodeURIComponent(
          caseId,
        )}&field=${encodeURIComponent(field)}`,
      );
      if (res?.url) {
        if (tab) tab.location.href = res.url;
        // A blocked pop-up leaves nothing to point at, so fall back to the
        // current tab rather than silently doing nothing.
        else window.location.href = res.url;
      } else {
        fail(`Could not open ${label}`);
      }
    } catch (err) {
      fail(err.message || `Could not open ${label}`);
    } finally {
      setLoading(false);
    }
  };

  const base = compact
    ? 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E8E6E3] bg-white text-[11px] font-medium text-[#4A4A4A] hover:border-[#E1261C] hover:text-[#E1261C] transition-colors disabled:opacity-60'
    : 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E8E6E3] text-xs font-semibold text-[#4A4A4A] hover:border-[#E1261C] hover:text-[#E1261C] transition-colors disabled:opacity-60';

  return (
    <button
      type="button"
      onClick={open}
      disabled={loading}
      title={`Open ${label}`}
      className={`${base} ${className}`}
    >
      {compact &&
        (loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <FileText className="w-3 h-3" />
        ))}
      {compact ? label : loading ? 'Opening…' : 'Open'}
      {!loading && <ExternalLink className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />}
      {!compact && loading && <Loader2 className="w-3 h-3 animate-spin" />}
    </button>
  );
}
