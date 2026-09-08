'use client';

import React, { useId, useMemo } from 'react';

/**
 * Small dependency-free SVG charts. The admin panel only needs three shapes,
 * so a charting library would be more weight than it is worth here.
 *
 * Palette is derived from the CatchMyCash brand: red for the primary series,
 * warm neutrals for supporting data. Every series also carries a label so the
 * charts stay readable without relying on colour alone.
 */

const SERIES_COLORS = {
  created: '#E1261C',
  approved: '#00A67A',
  failed: '#9A6400',
};

export function TrendChart({ data = [], height = 190 }) {
  const gradientId = useId();

  const { points, maxValue, ticks } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.created));
    return {
      maxValue: max,
      points: data,
      ticks: [0, Math.round(max / 2), max],
    };
  }, [data]);

  if (!data.length) {
    return (
      <div className="h-[190px] flex items-center justify-center text-xs text-[#B4B0AA]">
        No data in this range
      </div>
    );
  }

  const width = 700;
  const padX = 8;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const toXY = (value, index) => [
    padX + index * stepX,
    padY + innerH - (value / maxValue) * innerH,
  ];

  const line = (key) =>
    data
      .map((d, i) => {
        const [x, y] = toXY(d[key], i);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const area = `${line('created')} L${(padX + (data.length - 1) * stepX).toFixed(
    1,
  )},${padY + innerH} L${padX},${padY + innerH} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Claims created per day"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E1261C" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#E1261C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => {
          const y = padY + innerH - (t / maxValue) * innerH;
          return (
            <g key={t}>
              <line
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                stroke="#F0EEEB"
                strokeWidth="1"
              />
              <text x={padX} y={y - 4} fontSize="9" fill="#B4B0AA">
                {t}
              </text>
            </g>
          );
        })}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line('created')}
          fill="none"
          stroke={SERIES_COLORS.created}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={line('approved')}
          fill="none"
          stroke={SERIES_COLORS.approved}
          strokeWidth="1.75"
          strokeDasharray="4 3"
          strokeLinejoin="round"
        />
      </svg>

      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-4">
          <Legend color={SERIES_COLORS.created} label="Claims started" />
          <Legend color={SERIES_COLORS.approved} label="Approved" dashed />
        </div>
        <div className="flex gap-4 text-[10px] text-[#B4B0AA]">
          <span>{formatTick(points[0]?.date)}</span>
          <span>{formatTick(points[points.length - 1]?.date)}</span>
        </div>
      </div>
    </div>
  );
}

function formatTick(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Legend({ color, label, dashed }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#4A4A4A]">
      <span
        className="inline-block w-4 h-0.5 rounded"
        style={{
          backgroundColor: dashed ? 'transparent' : color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
        }}
      />
      {label}
    </span>
  );
}

const DONUT_COLORS = {
  approved: '#00A67A',
  in_review: '#1B4F9C',
  docs_pending: '#E0A030',
  processing: '#888888',
  failed: '#E1261C',
  draft: '#D4D4D4',
};

export function StatusDonut({ data = [], total = 0 }) {
  const visible = data.filter((d) => d.count > 0);
  const sum = visible.reduce((s, d) => s + d.count, 0) || 1;

  let offset = 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0">
        <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Claims by status">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#F0EEEB" strokeWidth="16" />
          {visible.map((slice) => {
            const length = (slice.count / sum) * circumference;
            const dash = `${length} ${circumference - length}`;
            const el = (
              <circle
                key={slice.key}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={DONUT_COLORS[slice.key] || '#888888'}
                strokeWidth="16"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              />
            );
            offset += length;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-[#0A0A0A] tabular-nums">
            {total.toLocaleString()}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-[#888888] font-semibold">
            Claims
          </span>
        </div>
      </div>

      <ul className="flex-1 w-full space-y-2">
        {data.map((slice) => (
          <li key={slice.key} className="flex items-center gap-2.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: DONUT_COLORS[slice.key] || '#888888' }}
            />
            <span className="flex-1 text-[#4A4A4A]">{slice.label}</span>
            <span className="font-semibold text-[#0A0A0A] tabular-nums">
              {slice.count.toLocaleString()}
            </span>
            <span className="w-9 text-right text-[#B4B0AA] tabular-nums">
              {slice.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FunnelChart({ steps = [] }) {
  const max = Math.max(1, ...steps.map((s) => s.count));

  return (
    <ol className="space-y-2.5">
      {steps.map((step, index) => {
        const width = Math.max((step.count / max) * 100, step.count > 0 ? 4 : 1.5);
        const dropOff =
          index > 0 ? steps[index - 1].count - step.count : null;

        return (
          <li key={step.key}>
            <div className="flex items-baseline justify-between mb-1 gap-3">
              <span className="text-xs font-medium text-[#4A4A4A] truncate">
                {index + 1}. {step.label}
              </span>
              <span className="text-xs shrink-0">
                <span className="font-semibold text-[#0A0A0A] tabular-nums">
                  {step.count.toLocaleString()}
                </span>
                <span className="text-[#B4B0AA] ml-1.5 tabular-nums">{step.pct}%</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-5 rounded bg-[#F7F5F2] overflow-hidden">
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${width}%`,
                    backgroundColor: `rgba(225, 38, 28, ${
                      0.85 - index * 0.09 < 0.25 ? 0.25 : 0.85 - index * 0.09
                    })`,
                  }}
                />
              </div>
              {dropOff > 0 && (
                <span className="text-[10px] text-[#B4B0AA] tabular-nums w-12 text-right">
                  −{dropOff}
                </span>
              )}
              {!dropOff && <span className="w-12" />}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
