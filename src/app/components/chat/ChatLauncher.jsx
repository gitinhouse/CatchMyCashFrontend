'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

// The panel's code only downloads once someone opens it, so the button costs
// the first paint next to nothing.
const ChatPanel = dynamic(() => import('./ChatPanel'), { ssr: false });

export default function ChatLauncher() {
  const pathname = usePathname();
  // Opened at least once: from then on the panel stays mounted, hidden when
  // closed, so the conversation survives closing it and moving between pages.
  const [started, setStarted] = useState(false);
  const [open, setOpen] = useState(false);

  // The admin console renders its own chrome.
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => {
            setStarted(true);
            setOpen(true);
          }}
          aria-label="Ask a question"
          aria-haspopup="dialog"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] flex items-center gap-2 rounded-full bg-[#0A0A0A] text-white p-3.5 sm:pl-4 sm:pr-5 sm:py-3 shadow-xl hover:bg-[#E1261C] transition-colors"
        >
          <MessageCircle className="w-5 h-5" aria-hidden="true" />
          {/* Icon only on phones, where a labelled pill would sit over the page. */}
          <span className="hidden sm:inline text-sm font-semibold">Ask a question</span>
        </button>
      )}
      {started && <ChatPanel open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
