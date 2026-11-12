'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * A small dialog. Escape and the backdrop close it; focus moves into it on
 * open and back to where it was on close.
 */
export default function Modal({ open, title, onClose, children, footer, width = 'max-w-md', returnFocus }) {
  const titleId = useId();
  const panelRef = useRef(null);
  // Callers pass a new onClose on every render; the effect below must run
  // only when the dialog opens or closes, or focus would jump on each keystroke.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // How to hand focus back on close, when the opener needs more than a plain
  // focus() (the article editor restores its own text selection).
  const returnFocusRef = useRef(returnFocus);
  returnFocusRef.current = returnFocus;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector('input:not([type="file"]):not([type="hidden"]), textarea, select, button:not([data-close])');
    (first || panel)?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (returnFocusRef.current) returnFocusRef.current();
      else if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full ${width} bg-white rounded-xl shadow-xl border border-[#E8E6E3] outline-none`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#E8E6E3]">
          <h2 id={titleId} className="text-sm font-semibold text-[#0A0A0A]">
            {title}
          </h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            className="text-[#888888] hover:text-[#E1261C]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 px-5 py-3 border-t border-[#E8E6E3] bg-[#FCFBFA] rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** A yes/no question in a Modal. */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, busy = false, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-sm font-semibold rounded-lg border border-[#E8E6E3] bg-white text-[#4A4A4A] hover:bg-[#F7F5F2]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg border text-white disabled:opacity-70 ${
              danger ? 'bg-[#B11912] border-[#B11912] hover:bg-[#8F130E]' : 'bg-[#E1261C] border-[#E1261C] hover:bg-[#B11912]'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-[#4A4A4A] leading-relaxed">{message}</p>
    </Modal>
  );
}
