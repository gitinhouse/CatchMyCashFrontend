'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Panel({ title, subtitle, actions, children, className = '', bodyClassName = '' }) {
  return (
    <section
      className={`bg-white border border-[#E8E6E3] rounded-xl shadow-sm overflow-hidden ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#E8E6E3]">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold text-[#0A0A0A] tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-[#888888] mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName || 'p-5'}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

const TONES = {
  success: 'bg-[#E6F7F1] text-[#00785A] border-[#B7E7D8]',
  danger: 'bg-[#FCE9E7] text-[#B11912] border-[#F5C6C1]',
  warning: 'bg-[#FFF4E0] text-[#9A6400] border-[#F3DFB4]',
  info: 'bg-[#EAF1FC] text-[#1B4F9C] border-[#C6D8F2]',
  neutral: 'bg-[#F0EEEB] text-[#4A4A4A] border-[#E0DDD8]',
  muted: 'bg-[#F7F5F2] text-[#888888] border-[#E8E6E3]',
  brand: 'bg-[#FCE9E7] text-[#E1261C] border-[#F5C6C1]',
};

export function Badge({ tone = 'neutral', children, className = '', icon: Icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${
        TONES[tone] || TONES.neutral
      } ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}

const STATUS_TONES = {
  approved: 'success',
  in_review: 'info',
  docs_pending: 'warning',
  processing: 'neutral',
  failed: 'danger',
  draft: 'muted',
};

export function StatusBadge({ status, label, className = '' }) {
  return (
    <Badge tone={STATUS_TONES[status] || 'neutral'} className={className}>
      {label || status}
    </Badge>
  );
}

const SEVERITY_TONES = { high: 'danger', medium: 'warning', low: 'neutral' };

export function SeverityBadge({ severity, children }) {
  return <Badge tone={SEVERITY_TONES[severity] || 'neutral'}>{children}</Badge>;
}

/* ------------------------------------------------------------------ */
/* Buttons & inputs                                                    */
/* ------------------------------------------------------------------ */

const BUTTON_VARIANTS = {
  primary:
    'bg-[#E1261C] text-white hover:bg-[#B11912] border-transparent disabled:bg-[#E9A6A2]',
  secondary:
    'bg-white text-[#4A4A4A] hover:bg-[#F7F5F2] hover:text-[#0A0A0A] border-[#E8E6E3]',
  ghost:
    'bg-transparent text-[#4A4A4A] hover:bg-[#F0EEEB] hover:text-[#0A0A0A] border-transparent',
  danger:
    'bg-white text-[#B11912] hover:bg-[#FCE9E7] border-[#F5C6C1]',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  loading = false,
  children,
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-sm gap-2',
  };
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center font-semibold rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
        BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.secondary
      } ${sizes[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        Icon && <Icon className="w-3.5 h-3.5" />
      )}
      {children}
    </button>
  );
}

export function TextInput({ label, hint, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">
          {label}
        </span>
      )}
      <input
        {...props}
        className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] bg-white text-[#0A0A0A] placeholder-[#B4B0AA] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7] transition"
      />
      {hint && <span className="block text-[11px] text-[#888888] mt-1">{hint}</span>}
    </label>
  );
}

export function Select({ label, options = [], className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">
          {label}
        </span>
      )}
      <select
        {...props}
        className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] bg-white text-[#0A0A0A] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7] transition"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextArea({ label, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">
          {label}
        </span>
      )}
      <textarea
        {...props}
        className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] bg-white text-[#0A0A0A] placeholder-[#B4B0AA] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7] transition resize-y"
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

/**
 * One shimmering placeholder block.
 *
 * `width` and `height` are passed as inline styles rather than classes because
 * skeletons are sized to whatever they stand in for, and Tailwind cannot emit
 * a class it never sees written down.
 */
export function Skeleton({ width = '100%', height = 12, rounded = 6, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`cmc-skeleton block ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof rounded === 'number' ? `${rounded}px` : rounded,
      }}
    />
  );
}

/**
 * A stand-in for a block of prose: the last line is short, the way real text
 * ends part-way across.
 */
export function SkeletonText({ lines = 2, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height={10} />
      ))}
    </div>
  );
}

/**
 * Wraps any skeleton so the wait is announced to screen readers, which see
 * nothing of the shimmer itself.
 */
export function LoadingRegion({ label = 'Loading…', children }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Rows of a table that has not arrived yet, in the shape it will arrive in. */
export function TableSkeleton({ columns = 5, rows = 6, label = 'Loading…' }) {
  // A little variety across the columns, so the placeholder reads as a table
  // of differing values rather than a block of identical bars.
  const widths = ['70%', '85%', '55%', '75%', '45%', '65%', '80%'];

  return (
    <LoadingRegion label={label}>
      <div className="px-5">
        <div className="flex items-center gap-4 py-3 border-b border-[#E8E6E3]">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="flex-1 min-w-0">
              <Skeleton width="50%" height={8} />
            </div>
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="flex items-center gap-4 py-4 border-b border-[#F0EEEB] last:border-0"
          >
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className="flex-1 min-w-0 space-y-1.5">
                <Skeleton width={widths[(r + c) % widths.length]} height={11} />
                {c === 0 && <Skeleton width="40%" height={8} />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

/** A queue or card list waiting on its rows. */
export function ListSkeleton({ rows = 5, label = 'Loading…' }) {
  return (
    <LoadingRegion label={label}>
      <div className="divide-y divide-[#F0EEEB]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-5 py-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton width={110} height={12} />
                <Skeleton width={70} height={18} rounded={999} />
              </div>
              <Skeleton width="45%" height={9} />
              <div className="flex gap-1.5 pt-0.5">
                <Skeleton width={84} height={16} rounded={999} />
                <Skeleton width={64} height={16} rounded={999} />
              </div>
            </div>
            <div className="shrink-0 space-y-2 text-right">
              <Skeleton width={80} height={12} />
              <Skeleton width={56} height={9} />
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

/** The row of headline figures on the dashboard. */
export function StatsSkeleton({ count = 4, label = 'Loading…' }) {
  return (
    <LoadingRegion label={label}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#E8E6E3] bg-white p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton width={90} height={9} />
              <Skeleton width={28} height={28} rounded={8} />
            </div>
            <Skeleton width="55%" height={26} />
            <Skeleton width="40%" height={9} />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

/** A record page — heading, a grid of fields, then a body. */
export function DetailSkeleton({ label = 'Loading…' }) {
  return (
    <LoadingRegion label={label}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton width={220} height={22} />
          <Skeleton width={320} height={10} />
        </div>
        <div className="rounded-xl border border-[#E8E6E3] bg-white p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton width={70} height={8} />
                <Skeleton width="80%" height={12} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#E8E6E3] bg-white p-5 space-y-3">
          <Skeleton width={160} height={14} />
          <SkeletonText lines={4} />
        </div>
      </div>
    </LoadingRegion>
  );
}

/**
 * The plain spinner, kept for the few places a skeleton cannot describe what
 * is coming — an action in flight rather than a shape being filled.
 */
export function LoadingBlock({ label = 'Loading…', className = '' }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 py-16 text-sm text-[#888888] ${className}`}
    >
      <Loader2 className="w-5 h-5 animate-spin text-[#E1261C]" />
      {label}
    </div>
  );
}

export function EmptyState({ title, message, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-6">
      <div className="w-11 h-11 rounded-full bg-[#F7F5F2] border border-[#E8E6E3] flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#B4B0AA]" />
      </div>
      <p className="text-sm font-semibold text-[#0A0A0A]">{title}</p>
      {message && <p className="text-xs text-[#888888] max-w-sm">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
      <div className="w-11 h-11 rounded-full bg-[#FCE9E7] border border-[#F5C6C1] flex items-center justify-center">
        <AlertCircle className="w-5 h-5 text-[#E1261C]" />
      </div>
      <p className="text-sm font-semibold text-[#0A0A0A]">Something went wrong</p>
      <p className="text-xs text-[#888888] max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table + pagination                                                  */
/* ------------------------------------------------------------------ */

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  );
}

// Written out in full so Tailwind's scanner can see each class; an
// interpolated `text-${align}` would be purged from the build.
const ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Th({ children, sortKey, sort, onSort, align = 'left', className = '' }) {
  const active = sort?.by === sortKey;
  const clickable = !!sortKey && !!onSort;

  return (
    <th
      onClick={clickable ? () => onSort(sortKey) : undefined}
      className={`px-4 py-2.5 ${ALIGN[align] || ALIGN.left} text-[11px] font-semibold uppercase tracking-wide text-[#888888] bg-[#F7F5F2] border-b border-[#E8E6E3] whitespace-nowrap ${
        clickable ? 'cursor-pointer select-none hover:text-[#0A0A0A]' : ''
      } ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active && sort?.dir && (
          <span className="text-[#E1261C]">{sort.dir === 'asc' ? '▲' : '▼'}</span>
        )}
      </span>
    </th>
  );
}

export function Td({ children, align = 'left', className = '' }) {
  return (
    <td
      className={`px-4 py-3 ${ALIGN[align] || ALIGN.left} text-[#4A4A4A] align-middle ${className}`}
    >
      {children}
    </td>
  );
}

export function Tr({ children, className = '' }) {
  return (
    <tr
      className={`border-b border-[#F0EEEB] last:border-0 transition-colors hover:bg-[#FDF8F7] ${className}`}
    >
      {children}
    </tr>
  );
}

export function Pagination({ page, totalPages, total, limit, onPageChange, label = 'records' }) {
  if (!total) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-[#E8E6E3] bg-[#FCFBFA]">
      <p className="text-xs text-[#888888]">
        Showing <span className="font-semibold text-[#4A4A4A]">{from}</span>–
        <span className="font-semibold text-[#4A4A4A]">{to}</span> of{' '}
        <span className="font-semibold text-[#4A4A4A]">{total.toLocaleString()}</span>{' '}
        {label}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={ChevronLeft}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>
        <span className="text-xs text-[#4A4A4A] font-medium tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small display helpers                                               */
/* ------------------------------------------------------------------ */

export function Field({ label, children, mono = false, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#888888]">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-[#0A0A0A] break-words ${
          mono ? "font-['JetBrains_Mono',monospace] text-[13px]" : ''
        }`}
      >
        {children ?? <span className="text-[#B4B0AA]">—</span>}
      </dd>
    </div>
  );
}

export function ProgressBar({ value, tone = 'brand', className = '' }) {
  const colors = {
    brand: 'bg-[#E1261C]',
    success: 'bg-[#00A67A]',
    warning: 'bg-[#E0A030]',
    danger: 'bg-[#B11912]',
    neutral: 'bg-[#888888]',
  };
  return (
    <div className={`h-1.5 w-full rounded-full bg-[#F0EEEB] overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all ${colors[tone] || colors.brand}`}
        style={{ width: `${Math.min(Math.max(value || 0, 0), 100)}%` }}
      />
    </div>
  );
}

export function Mono({ children, className = '' }) {
  return (
    <span className={`font-['JetBrains_Mono',monospace] text-[13px] ${className}`}>
      {children}
    </span>
  );
}

export function CaseLink({ id, children, className = '' }) {
  return (
    <Link
      href={`/admin/cases/${id}`}
      className={`font-['JetBrains_Mono',monospace] text-[13px] font-semibold text-[#E1261C] hover:text-[#B11912] hover:underline ${className}`}
    >
      {children}
    </Link>
  );
}

export function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const tone =
    toast.type === 'error'
      ? 'bg-[#B11912] text-white'
      : toast.type === 'warning'
        ? 'bg-[#9A6400] text-white'
        : 'bg-[#0A0A0A] text-white';

  return (
    <div className="fixed bottom-6 right-6 z-[60] max-w-sm">
      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm ${tone}`}
      >
        <span className="flex-1">{toast.message}</span>
        <button
          onClick={onDismiss}
          className="text-white/70 hover:text-white text-xs font-semibold"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
