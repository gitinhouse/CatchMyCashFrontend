'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Cpu,
  FileStack,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { adminFetch, getAdminSession, isAdminSession } from '../_lib/api';
import { initials } from '../_lib/format';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/attention', label: 'Action Queue', icon: AlertTriangle, badge: 'attention' },
  { href: '/admin/cases', label: 'Claims', icon: FolderKanban },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/documents', label: 'Documents', icon: FileStack },
  { href: '/admin/automation', label: 'Automation', icon: Cpu },
  { href: '/admin/activity', label: 'Audit Log', icon: Activity },
];

function NavLink({ item, active, badgeCount, onNavigate }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-[#FCE9E7] text-[#E1261C]'
          : 'text-[#4A4A4A] hover:bg-[#F0EEEB] hover:text-[#0A0A0A]'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge === 'attention' && badgeCount > 0 && (
        <span className="min-w-[20px] px-1.5 py-0.5 rounded-full bg-[#E1261C] text-white text-[10px] font-bold text-center">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </Link>
  );
}

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [authState, setAuthState] = useState('checking'); // checking | ok | denied
  const [attentionCount, setAttentionCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = getAdminSession();
    if (!stored) {
      setAuthState('denied');
      router.replace('/userLogin');
      return;
    }
    if (!isAdminSession(stored)) {
      setAuthState('denied');
      router.replace('/');
      return;
    }
    setSession(stored);
    setAuthState('ok');
  }, [router]);

  // Keep the action-queue badge fresh without re-fetching on every navigation.
  const refreshAttention = useCallback(async () => {
    try {
      const data = await adminFetch('/api/admin/cases?needs_attention=true&limit=1');
      setAttentionCount(data?.total || 0);
    } catch {
      /* badge is advisory only */
    }
  }, []);

  useEffect(() => {
    if (authState !== 'ok') return undefined;
    refreshAttention();
    const timer = setInterval(refreshAttention, 60_000);
    return () => clearInterval(timer);
  }, [authState, refreshAttention]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('userLogin');
    window.dispatchEvent(new Event('authChange'));
    router.push('/userLogin');
  };

  const activeHref = useMemo(() => {
    const match = NAV.filter((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href),
    ).sort((a, b) => b.href.length - a.href.length)[0];
    return match?.href || null;
  }, [pathname]);

  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#E1261C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === 'denied') {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-6">
        <div className="text-center">
          <ShieldCheck className="w-8 h-8 text-[#E1261C] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0A0A0A]">
            Admin access required
          </p>
          <p className="text-xs text-[#888888] mt-1">Redirecting…</p>
        </div>
      </div>
    );
  }

  const email = session?.user?.email || 'Admin';

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-[#E8E6E3]">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E1261C] flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-[#0A0A0A]">CatchMyCash</p>
            <p className="text-[10px] uppercase tracking-widest text-[#888888] font-semibold">
              Admin Console
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={activeHref === item.href}
            badgeCount={attentionCount}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-[#E8E6E3]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
            {initials(email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#0A0A0A] truncate">{email}</p>
            <p className="text-[10px] text-[#888888]">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#4A4A4A] hover:bg-[#FCE9E7] hover:text-[#E1261C] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-[#F7F5F2]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 bg-white border-r border-[#E8E6E3] flex-col z-40">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-white border-r border-[#E8E6E3] flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-[#888888] hover:text-[#E1261C]"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#E8E6E3] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-[#4A4A4A] hover:text-[#E1261C]"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-[#0A0A0A]">Admin Console</span>
          {attentionCount > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-[#FCE9E7] text-[#E1261C] text-[11px] font-bold">
              {attentionCount} to review
            </span>
          )}
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1500px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Page-level heading used by every admin route. */
export function PageHeader({ title, description, actions, breadcrumb }) {
  return (
    <div className="mb-6">
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1
            className="text-2xl font-bold text-[#0A0A0A] tracking-tight"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[#888888] mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
