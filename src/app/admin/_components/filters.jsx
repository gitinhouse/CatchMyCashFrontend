'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Badge, Button } from './ui';

/** Debounced search box used by every list page. */
export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative flex-1 min-w-[220px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B4B0AA] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-[#E8E6E3] bg-white text-[#0A0A0A] placeholder-[#B4B0AA] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7] transition"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B4B0AA] hover:text-[#E1261C]"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/** Multi-select chip row — clicking a chip toggles it in the active filter set. */
export function ChipFilter({ label, options, selected = [], onChange }) {
  const toggle = (value) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888] mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
                active
                  ? 'bg-[#E1261C] border-[#E1261C] text-white'
                  : 'bg-white border-[#E8E6E3] text-[#4A4A4A] hover:border-[#E1261C] hover:text-[#E1261C]'
              }`}
            >
              {opt.label}
              {typeof opt.count === 'number' && (
                <span className={active ? 'ml-1 text-white/80' : 'ml-1 text-[#B4B0AA]'}>
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Collapsible advanced-filter drawer with an active-filter counter. */
export function FilterBar({ open, onToggle, activeCount, children, controls }) {
  return (
    <div className="bg-white border border-[#E8E6E3] rounded-xl shadow-sm mb-4">
      <div className="flex flex-wrap items-center gap-2 p-3">
        {controls}
        <Button
          variant={open ? 'primary' : 'secondary'}
          icon={SlidersHorizontal}
          onClick={onToggle}
        >
          Filters
          {activeCount > 0 && (
            <Badge
              tone={open ? 'muted' : 'brand'}
              className="ml-1 !px-1.5 !py-0"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </div>
      {open && (
        <div className="border-t border-[#E8E6E3] p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {children}
        </div>
      )}
    </div>
  );
}

export function DateRange({ from, to, onChange }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888] mb-2">
        Created between
      </p>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={from || ''}
          onChange={(e) => onChange({ from: e.target.value, to })}
          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E6E3] bg-white text-[#0A0A0A] focus:outline-none focus:border-[#E1261C]"
        />
        <span className="text-xs text-[#B4B0AA]">to</span>
        <input
          type="date"
          value={to || ''}
          onChange={(e) => onChange({ from, to: e.target.value })}
          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E6E3] bg-white text-[#0A0A0A] focus:outline-none focus:border-[#E1261C]"
        />
      </div>
    </div>
  );
}

/** Tri-state toggle: any / yes / no. */
export function TriToggle({ label, value, onChange, yesLabel = 'Yes', noLabel = 'No' }) {
  const options = [
    { value: '', label: 'Any' },
    { value: 'true', label: yesLabel },
    { value: 'false', label: noLabel },
  ];
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888888] mb-2">
        {label}
      </p>
      <div className="inline-flex rounded-lg border border-[#E8E6E3] overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-colors border-r border-[#E8E6E3] last:border-r-0 ${
              value === opt.value
                ? 'bg-[#E1261C] text-white'
                : 'bg-white text-[#4A4A4A] hover:bg-[#F7F5F2]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Summary of every active filter, each individually removable. */
export function ActiveFilters({ chips, onClearAll }) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FCE9E7] border border-[#F5C6C1] text-[11px] font-semibold text-[#B11912]"
        >
          {chip.label}
          <button onClick={chip.onRemove} aria-label={`Remove ${chip.label}`}>
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-[11px] font-semibold text-[#888888] hover:text-[#E1261C] underline"
      >
        Clear all
      </button>
    </div>
  );
}
