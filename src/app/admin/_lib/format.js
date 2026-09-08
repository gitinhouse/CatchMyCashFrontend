const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(value, precise = false) {
  const n = Number(value) || 0;
  return precise ? currencyPrecise.format(n) : currency.format(n);
}

export function compactMoney(value) {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `$${Math.round(n / 1000)}K`;
  return money(n);
}

export function number(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export function formatDateTime(value) {
  return formatDate(value, true);
}

/** "3 days ago" / "in 2 hours" — falls back to a date beyond 30 days. */
export function relativeTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const units = [
    ['minute', 60_000],
    ['hour', 3_600_000],
    ['day', 86_400_000],
  ];

  if (abs < 60_000) return 'just now';
  if (abs > 30 * 86_400_000) return formatDate(value);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  let unit = 'minute';
  let divisor = 60_000;
  for (const [name, ms] of units) {
    if (abs >= ms) {
      unit = name;
      divisor = ms;
    }
  }
  return rtf.format(Math.round(diffMs / divisor), unit);
}

/** Turn an audit action key like `claim_status_updated` into a readable label. */
export function humanize(value) {
  if (!value) return '—';
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function initials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function truncate(value, length = 60) {
  const str = String(value ?? '');
  return str.length > length ? `${str.slice(0, length - 1)}…` : str;
}
