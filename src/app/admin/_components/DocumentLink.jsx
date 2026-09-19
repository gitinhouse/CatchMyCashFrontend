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
    const tab = window.open('', '_blank', 'noopener,noreferrer');

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
