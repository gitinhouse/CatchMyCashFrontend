'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';

/**
 * Notification bell for signed-in claimants.
 *
 * Notifications were already being written — by the claim flow and by admins
 * from the case page — but nothing in the site chrome ever showed them, so
 * they were invisible to the person they were addressed to.
 *
 * Polls while mounted so an admin-sent notification appears without a reload.
 */
const POLL_INTERVAL_MS = 60_000;

export default function NotificationBell() {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  // Resolve the signed-in claimant; the bell stays hidden for everyone else.
  const readSession = useCallback(() => {
    try {
      const raw = localStorage.getItem('userLogin');
      if (!raw || raw === 'undefined') return null;
      const session = JSON.parse(raw);
      if (!session?.token || !session?.user?.user_id) return null;
      return session.user.user_id;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const sync = () => setUserId(readSession());
    sync();
    window.addEventListener('authChange', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('authChange', sync);
      window.removeEventListener('storage', sync);
    };
  }, [readSession]);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      // The bell shows the last 60 days plus anything still unread, so an
      // old unread item is never hidden by age.
      const { data } = await axios.get(
        `/api/notification?userId=${userId}&scope=recent&limit=30`,
      );
      if (data?.success) {
        setItems(Array.isArray(data.data) ? data.data : []);
        setUnread(data.unreadCount || 0);
        setTotal(data.totalCount || 0);
      }
    } catch (err) {
      // The bell is advisory; a failed poll should never surface an error.
      console.error('Failed to load notifications', err);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setUnread(0);
      return undefined;
    }
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [userId, load]);

  // Close when clicking outside the panel.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const markOne = async (id) => {
    try {
      await axios.put(`/api/notification?id=${id}`, {});
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, status: true } : n)),
      );
      setUnread((c) => Math.max(c - 1, 0));
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const markAll = async () => {
    if (!userId || unread === 0) return;
    setLoading(true);
    try {
      await axios.put(`/api/notification?all=true&userId=${userId}`, {});
      setItems((prev) => prev.map((n) => ({ ...n, status: true })));
      setUnread(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAll = async () => {
    if (!userId || total === 0) return;
    if (
      !window.confirm(
        'Delete all notifications? This cannot be undone.',
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`/api/notification?all=true&userId=${userId}`);
      setItems([]);
      setUnread(0);
      setTotal(0);
    } catch (err) {
      console.error('Failed to delete notifications', err);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
        }
        aria-expanded={open}
        className="relative p-2 rounded-lg text-[#4A4A4A] hover:text-[#E1261C] hover:bg-[#FCE9E7] transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E1261C] text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2rem)] bg-white border border-[#E8E6E3] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E3]">
            <p className="text-sm font-bold text-[#0A0A0A]">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAll}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E1261C] hover:text-[#B11912] disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="h-6 w-6 text-[#D4D4D4] mx-auto mb-2" />
              <p className="text-sm text-[#888888]">No notifications yet</p>
            </div>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto divide-y divide-[#F0EEEB]">
              {items.map((n) => {
                const isUnread = n.status === false;
                return (
                  <li
                    key={n._id}
                    className={`px-4 py-3 ${isUnread ? 'bg-[#FDF8F7]' : 'bg-white'}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          isUnread ? 'bg-[#E1261C]' : 'bg-[#D4D4D4]'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#0A0A0A]">
                          {n.title}
                        </p>
                        <p className="text-xs text-[#4A4A4A] mt-0.5 break-words">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-[#B4B0AA] mt-1">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : ''}
                        </p>
                      </div>
                      {isUnread && (
                        <button
                          onClick={() => markOne(n._id)}
                          title="Mark as read"
                          aria-label="Mark as read"
                          className="text-[#B4B0AA] hover:text-[#E1261C] shrink-0"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-[#E8E6E3] bg-[#FCFBFA]">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-[#E1261C] hover:text-[#B11912]"
            >
              See all notifications
              {total > items.length ? ` (${total})` : ''}
            </Link>
            {total > 0 && (
              <button
                onClick={deleteAll}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#888888] hover:text-[#E1261C] disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
