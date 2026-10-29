'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const MIN_VISIBLE_MS = 240;
const NAVIGATION_TIMEOUT_MS = 15000;

function isSearchStep(url) {
  return url.pathname === '/' && url.searchParams.get('step') === 'search';
}

export default function NavigationLoader() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const lastPathname = useRef(pathname);
  const pendingNavigation = useRef(null);

  const clearPendingNavigation = () => {
    const pending = pendingNavigation.current;
    if (pending?.timeout) clearTimeout(pending.timeout);
    if (pending?.finishTimeout) clearTimeout(pending.finishTimeout);
    pendingNavigation.current = null;
  };

  const hideLoader = () => {
    clearPendingNavigation();
    setIsVisible(false);
  };

  const beginNavigation = (destination, originPath = lastPathname.current) => {
    const url = new URL(destination, window.location.href);

    if (url.origin !== window.location.origin) return;

    if (isSearchStep(url)) {
      hideLoader();
      return;
    }

    if (url.pathname === originPath) return;
    if (pendingNavigation.current?.pathname === url.pathname) return;

    clearPendingNavigation();
    const pending = {
      pathname: url.pathname,
      startedAt: Date.now(),
      timeout: null,
      finishTimeout: null,
    };
    pending.timeout = setTimeout(hideLoader, NAVIGATION_TIMEOUT_MS);
    pendingNavigation.current = pending;
    setIsVisible(true);
  };

  useLayoutEffect(() => {
    const onDocumentClick = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = event.target.closest?.('a[href]');
      if (
        !link ||
        link.target === '_blank' ||
        link.hasAttribute('download')
      ) {
        return;
      }

      beginNavigation(link.href);
    };

    const onNavigate = (event) => {
      if (event.navigationType === 'reload' || event.hashChange) return;
      beginNavigation(event.destination.url);
    };

    const onPopState = () => {
      beginNavigation(window.location.href, lastPathname.current);
    };

    document.addEventListener('click', onDocumentClick, true);
    window.addEventListener('popstate', onPopState);
    window.navigation?.addEventListener('navigate', onNavigate);

    return () => {
      document.removeEventListener('click', onDocumentClick, true);
      window.removeEventListener('popstate', onPopState);
      window.navigation?.removeEventListener('navigate', onNavigate);
      clearPendingNavigation();
    };
  }, []);

  useLayoutEffect(() => {
    if (!pathname || pathname === lastPathname.current) return;

    const previousPathname = lastPathname.current;
    lastPathname.current = pathname;

    const destination = new URL(window.location.href);

    if (isSearchStep(destination)) {
      hideLoader();
      return;
    }

    let pending = pendingNavigation.current;
    if (!pending) {
      beginNavigation(destination.href, previousPathname);
      pending = pendingNavigation.current;
    }
    if (!pending) return;

    const remaining = Math.max(
      0,
      MIN_VISIBLE_MS - (Date.now() - pending.startedAt),
    );
    pending.finishTimeout = setTimeout(hideLoader, remaining);
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/80 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <span className="loading-spinner h-8 w-8" aria-hidden="true" />
    </div>
  );
}
