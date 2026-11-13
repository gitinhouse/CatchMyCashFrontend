'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

const TABS = [
  { href: '/admin/resources', label: 'Articles' },
  { href: '/admin/resources/topics', label: 'Topics' },
  { href: '/admin/resources/settings', label: 'Hub page & SEO' },
];

/** Tabs across the Resources section of the console. */
export default function ResourcesNav() {
  const pathname = usePathname() || '';
  const current = pathname.startsWith('/admin/resources/topics')
    ? '/admin/resources/topics'
    : pathname.startsWith('/admin/resources/settings')
      ? '/admin/resources/settings'
      : '/admin/resources';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[#E8E6E3]">
      <nav aria-label="Resources sections" className="flex gap-1 -mb-px">
        {TABS.map((tab) => {
          const active = tab.href === current;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                active
                  ? 'border-[#E1261C] text-[#0A0A0A]'
                  : 'border-transparent text-[#888888] hover:text-[#0A0A0A]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <a
        href="/resources"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 pb-2 text-xs font-semibold text-[#E1261C] hover:text-[#B11912]"
      >
        View the public hub
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
