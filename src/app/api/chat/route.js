// The website's chat assistant. With ANTHROPIC_API_KEY set it answers with
// Claude, grounded in the site's own content; without it, or when the API
// fails, it answers from the FAQ so the widget never goes silent.
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { CHAT_SYSTEM_PROMPT } from '../../lib/chat/systemPrompt';
import { answerFromFaq } from '../../lib/chat/faqMatcher';
import { SUPPORT_EMAIL } from '../../lib/site';

export const dynamic = 'force-dynamic';

const MODEL = process.env.CHAT_MODEL || 'claude-opus-5-5';

const MAX_TURNS = 12;
const MAX_MESSAGE_CHARS = 1500;

// Per-IP request budget, kept in this server process. Enough to stop a script
// from running up the API bill through the widget; not a security boundary.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

// The visitor's conversation, cut to what the model needs: text only, the
// last MAX_TURNS messages, starting on a visitor turn and ending on one.
function cleanConversation(raw) {
  if (!Array.isArray(raw)) return null;
  const messages = raw
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim(),
    )
    .slice(-MAX_TURNS)
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, MAX_MESSAGE_CHARS),
    }));
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return null;
  }
  return messages;
}

let client = null;
const getClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ timeout: 30_000, maxRetries: 1 });
  return client;
};

const faqReply = (question) =>
  NextResponse.json({ reply: answerFromFaq(question), source: 'faq' });

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const messages = cleanConversation(body?.messages);
  if (!messages) {
    return NextResponse.json({ error: 'Ask a question to get started.' }, { status: 400 });
  }
  const question = messages[messages.length - 1].content;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json(
      {
        reply: `You've sent a lot of questions in a short time. Please try again in a few minutes, or email ${SUPPORT_EMAIL}.`,
        source: 'limit',
      },
      { status: 429 },
    );
  }

  const anthropic = getClient();
  if (!anthropic) return faqReply(question);

  try {
    // fallbacks: "default" — if Claude's safety classifiers decline a request,
    // the API retries it on Anthropic's recommended fallback model in the same
    // call instead of returning the refusal.
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      max_tokens: 2048,
      // Short, factual answers from a fixed reference: low effort keeps them
      // quick without changing what they say.
      output_config: { effort: 'low' },
      system: [
        {
          type: 'text',
          text: CHAT_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    });

    if (response.stop_reason === 'refusal') {
      return NextResponse.json({
        reply: `I can't help with that here. For questions about your claim or our service, email ${SUPPORT_EMAIL}.`,
        source: 'ai',
      });
    }

    const reply = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();
    if (!reply) return faqReply(question);

    return NextResponse.json({ reply, source: 'ai' });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error('[chat] Claude API error', error.message);
    } else {
      console.error('[chat] unexpected error', error);
    }
    return faqReply(question);
  }
}
