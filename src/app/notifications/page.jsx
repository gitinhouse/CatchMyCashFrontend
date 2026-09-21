'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';

/**
 * Full notification history.
 *
 * The bell only shows the last 60 days plus anything still unread; this page
 * is the complete record, with the same read and delete controls.
 */
export default function NotificationsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [checked, setChecked] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('userLogin');
      const session = raw && raw !== 'undefined' ? JSON.parse(raw) : null;
      if (session?.token && session?.user?.user_id) {
        setUserId(session.user.user_id);
      }
    } catch {
      /* treated as signed out */
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    if (checked && !userId) router.replace('/userLogin');
  }, [checked, userId, router]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(
        `/api/notification?userId=${userId}&scope=all&limit=200`,
      );
      if (data?.success) {
        setItems(Array.isArray(data.data) ? data.data : []);
        setUnread(data.unreadCount || 0);
      } else {
        // Reporting the failure matters: an empty list and a failed request
        // look identical otherwise, so a broken query reads as "no
        // notifications" and nobody goes looking.
        setError(data?.error || 'Could not load your notifications.');
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
      setError(
        err.response?.data?.error ||
          'Could not load your notifications. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const markOne = async (id) => {
    try {
      await axios.put(`/api/notification?id=${id}`, {});
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, status: true } : n)),
      );
      setUnread((c) => Math.max(c - 1, 0));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAll = async () => {
    if (unread === 0) return;
    setBusy(true);
    try {
      await axios.put(`/api/notification?all=true&userId=${userId}`, {});
      setItems((prev) => prev.map((n) => ({ ...n, status: true })));
      setUnread(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    } finally {
      setBusy(false);
    }
  };

  const removeOne = async (id) => {
    try {
      await axios.delete(`/api/notification?id=${id}`);
      setItems((prev) => {
        const gone = prev.find((n) => n._id === id);
        if (gone && gone.status === false) setUnread((c) => Math.max(c - 1, 0));
        return prev.filter((n) => n._id !== id);
      });
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const removeAll = async () => {
    if (items.length === 0) return;
    if (!window.confirm('Delete all notifications? This cannot be undone.')) {
      return;
    }
    setBusy(true);
    try {
      await axios.delete(`/api/notification?all=true&userId=${userId}`);
      setItems([]);
      setUnread(0);
    } catch (err) {
      console.error('Failed to delete notifications', err);
    } finally {
      setBusy(false);
    }
  };

  if (!checked || !userId) return null;

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="font-['Fraunces'] text-3xl font-bold text-[#0A0A0A]">
              Notifications
            </h1>
            <p className="text-sm text-[#888888] mt-1">
              {unread > 0
                ? `${unread} unread of ${items.length}`
                : `${items.length} notification${items.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unread > 0 && (
              <button
                onClick={markAll}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8E6E3] bg-white text-xs font-semibold text-[#4A4A4A] hover:border-[#E1261C] hover:text-[#E1261C] transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
            {items.length > 0 && (
              <button
                onClick={removeAll}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#F5C6C1] bg-white text-xs font-semibold text-[#B11912] hover:bg-[#FCE9E7] transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete all
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E8E6E3] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm text-[#888888]">
              Loading notifications…
            </div>
          ) : error ? (
            <div className="py-16 text-center px-6">
              <p className="text-sm font-semibold text-[#B11912]">{error}</p>
              <button
                onClick={load}
                className="mt-3 px-4 py-2 rounded-lg border border-[#E8E6E3] text-xs font-semibold text-[#4A4A4A] hover:border-[#E1261C] hover:text-[#E1261C] transition-colors"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="h-7 w-7 text-[#D4D4D4] mx-auto mb-2" />
              <p className="text-sm text-[#888888]">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F0EEEB]">
              {items.map((n) => {
                const isUnread = n.status === false;
                return (
                  <li
                    key={n._id}
                    className={`px-5 py-4 ${isUnread ? 'bg-[#FDF8F7]' : 'bg-white'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                          isUnread ? 'bg-[#E1261C]' : 'bg-[#D4D4D4]'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#0A0A0A]">
                          {n.title}
                        </p>
                        <p className="text-sm text-[#4A4A4A] mt-0.5 break-words">
                          {n.message}
                        </p>
                        <p className="text-xs text-[#B4B0AA] mt-1">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isUnread && (
                          <button
                            onClick={() => markOne(n._id)}
                            title="Mark as read"
                            aria-label="Mark as read"
                            className="p-1.5 rounded-lg text-[#B4B0AA] hover:text-[#E1261C] hover:bg-[#FCE9E7] transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => removeOne(n._id)}
                          title="Delete"
                          aria-label="Delete notification"
                          className="p-1.5 rounded-lg text-[#B4B0AA] hover:text-[#B11912] hover:bg-[#FCE9E7] transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
