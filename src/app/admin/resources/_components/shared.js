'use client';

import { useEffect } from 'react';
import { adminFetch } from '../../_lib/api';
import { IMAGE_MAX_BYTES, IMAGE_TYPES } from '../../../lib/resources/constants';

export const IMAGE_ACCEPT = IMAGE_TYPES.join(',');

/**
 * Upload one image to the media store.
 * @returns {Promise<string>} its address, /media/<id>
 */
export async function uploadImage(file) {
  if (!file) throw new Error('Choose an image to upload.');
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Use a JPEG, PNG, WebP or GIF image.');
  if (file.size > IMAGE_MAX_BYTES) {
    throw new Error(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${IMAGE_MAX_BYTES / 1024 / 1024} MB.`);
  }
  const form = new FormData();
  form.append('file', file);
  const data = await adminFetch('/api/admin/resources/images', { method: 'POST', body: form });
  return data.url;
}

/** Whether a scheduled or published article is visible to the public yet. */
export function postState(post) {
  if (!post || post.status !== 'published') return 'draft';
  if (post.publishedAt && new Date(post.publishedAt).getTime() > Date.now()) return 'scheduled';
  return 'published';
}

export const STATE_LABEL = { draft: 'Draft', published: 'Published', scheduled: 'Scheduled' };
export const STATE_TONE = { draft: 'muted', published: 'success', scheduled: 'info' };

/** Character count with the house colours: grey, amber outside the guide, red over the limit. */
export function counterTone(length, { min = 0, max, limit }) {
  if (limit && length > limit) return 'text-[#B11912]';
  if (length && ((min && length < min) || (max && length > max))) return 'text-[#9A6400]';
  return 'text-[#888888]';
}

/**
 * Ask before leaving with unsaved changes: closing or reloading the tab, and
 * following a link inside the console.
 */
export function useUnsavedChangesGuard(dirty, message = 'You have unsaved changes. Leave without saving?') {
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    // Capturing on the document runs before Next's <Link> handler, which
    // leaves a click alone once its default has been prevented.
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty, message]);
}

/** A datetime-local value ("2026-11-12T09:30") for an ISO date, in the browser's time zone. */
export function toLocalInput(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The ISO date for a datetime-local value, or null. */
export function fromLocalInput(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
