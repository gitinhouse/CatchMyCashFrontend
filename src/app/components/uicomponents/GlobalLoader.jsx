'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

// True in the browser, false on the server and while hydrating server HTML,
// so a loader the server drew is matched in place before it moves to <body>.
const subscribe = () => () => {};
const useIsClient = () => useSyncExternalStore(subscribe, () => true, () => false);

/**
 * The site's one loader. Every full-screen wait uses it: moving between pages,
 * opening the search, a page loading its data, preparing a document to sign.
 * Only the words under the spinner change.
 *
 * - message: optional line under the spinner; detail: optional second line.
 * - label: what a screen reader announces when there is no message.
 *
 * It covers the whole window, above everything else. In the browser it is
 * drawn straight into <body>, so a parent with a transform (the search steps
 * slide in with one) cannot shrink it to that parent's box. The spinner sits
 * at the exact centre whether or not there is a message, so handing over from
 * one wait to the next (page change, then the page's own loading) does not
 * make it jump.
 */
export default function GlobalLoader({ message, detail, label = 'Loading', ...rest }) {
  const isClient = useIsClient();

  const layer = (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/85 backdrop-blur-[2px]"
      {...rest}
    >
      <div className="relative flex flex-col items-center">
        <span className="loading-spinner h-10 w-10" aria-hidden="true" />
        {message ? (
          <div className="absolute top-full mt-5 w-[min(88vw,28rem)] text-center">
            <p className="text-[16px] font-semibold text-[#0A0A0A]">{message}</p>
            {detail && <p className="mt-1 text-[14px] text-[#4A4A4A]">{detail}</p>}
          </div>
        ) : (
          <span className="sr-only">{label}</span>
        )}
      </div>
    </div>
  );

  return isClient ? createPortal(layer, document.body) : layer;
}
