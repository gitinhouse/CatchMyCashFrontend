'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Send, X } from 'lucide-react';

const SUGGESTIONS = [
  'How much does it cost?',
  'Who can claim?',
  'How do I track my claim?',
  'How long does it take?',
];

const GREETING = {
  role: 'assistant',
  content:
    'Hi! I can answer questions about finding and claiming California unclaimed property, our fee, documents and timing. What would you like to know?',
};

// Site paths and web addresses in a reply become links; everything else stays
// plain text (replies are never rendered as HTML).
const LINK_PATTERN = /(https?:\/\/[^\s)]+[^\s).,;:!?]|\/(?:\?step=search|track-claim|claim-types|eligibility|how-it-works|faq|about|contact|privacy|terms|cookies)\b|[\w.+-]+@[\w-]+\.[\w.]+[a-z])/g;

function Linkified({ text }) {
  const parts = text.split(LINK_PATTERN);
  return parts.map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    const className = 'underline underline-offset-2 text-[#E1261C] break-words';
    if (part.includes('@') && !part.startsWith('http')) {
      return (
        <a key={i} href={`mailto:${part}`} className={className}>
          {part}
        </a>
      );
    }
    if (part.startsWith('/')) {
      return (
        <Link key={i} href={part} className={className}>
          {part}
        </Link>
      );
    }
    return (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={className}>
        {part}
      </a>
    );
  });
}

export default function ChatPanel({ open, onClose }) {
  const [messages, setMessages] = useState([GREETING]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const send = async (text) => {
    const question = text.trim();
    if (!question || sending) return;
    const next = [...messages, { role: 'user', content: question }];
    setMessages(next);
    setDraft('');
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The greeting is the widget's, not part of the conversation.
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING) }),
      });
      const data = await res.json().catch(() => ({}));
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            data.reply ||
            data.error ||
            'Sorry, something went wrong. Please try again, or email help@catchmycash.com.',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I couldn’t reach the server. Check your connection and try again, or email help@catchmycash.com.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onlyGreeting = messages.length === 1;

  return (
    <div
      role="dialog"
      aria-label="Ask CatchMyCash"
      hidden={!open}
      className="fixed z-[60] inset-x-2 bottom-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px] h-[min(560px,calc(100dvh-16px))] flex flex-col bg-white border border-[#E8E6E3] rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[#0A0A0A] text-white">
        <div>
          <p className="font-['Fraunces'] font-semibold text-base leading-tight">
            Ask CatchMyCash
          </p>
          <p className="text-[11px] text-[#D4D4D4]">
            Automated answers from our site. A person replies at help@catchmycash.com.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="p-1.5 rounded hover:bg-white/10"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div
        ref={listRef}
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#F7F5F2]"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-line text-sm leading-relaxed rounded-2xl px-3.5 py-2.5 ${
              m.role === 'user'
                ? 'ml-auto bg-[#E1261C] text-white rounded-br-md'
                : 'bg-white border border-[#E8E6E3] text-[#0A0A0A] rounded-bl-md'
            }`}
          >
            {m.role === 'user' ? m.content : <Linkified text={m.content} />}
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Thinking…
          </div>
        )}
        {onlyGreeting && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="text-xs border border-[#E8E6E3] bg-white rounded-full px-3 py-1.5 hover:border-[#E1261C] hover:text-[#E1261C] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="border-t border-[#E8E6E3] p-3 bg-white"
      >
        <div className="flex items-center gap-2">
          <label htmlFor="chat-question" className="sr-only">
            Your question
          </label>
          <input
            id="chat-question"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1500}
            autoComplete="off"
            placeholder="Type your question…"
            className="flex-1 px-3 py-2.5 text-sm border border-[#E8E6E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1261C] focus:border-transparent"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label="Send"
            className="p-2.5 rounded-lg bg-[#E1261C] text-white hover:bg-[#B11912] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-[11px] text-[#888888] mt-2">
          Please don’t share your SSN, ID or bank details here.
        </p>
      </form>
    </div>
  );
}
