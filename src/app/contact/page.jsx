'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CircleAlert, CircleCheck, Mail, User } from 'lucide-react';
import { SOCIAL_LINKS } from '../lib/socialLinks';

// What the message is about. The text is sent as it is, so the inbox sees the
// same subjects as before.
const SUBJECTS = [
  'General question',
  'I have an active claim',
  'Privacy / data request',
  'Partnership / press',
];

const EMPTY_FORM = { name: '', email: '', subject: SUBJECTS[0], message: '' };

const NEXT_STEPS = [
  'A real person on our team reads your message.',
  'We reply by email within one business day, usually within a few hours.',
  'Writing about a claim? Include your Case ID so we can find it straight away.',
];

const LABEL = 'block text-[14px] font-semibold text-[#0A0A0A] mb-2';
const FIELD =
  'w-full max-w-full rounded-lg border border-[#D4D4D4] bg-white text-[15px] text-[#0A0A0A] placeholder:text-[#888888] transition-colors hover:border-[#A3A3A3] focus:border-[#E1261C]';

export default function ContactPage() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const successHeading = useRef(null);

  const update = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  // The form is replaced by the confirmation, so move focus to it rather than
  // leaving it on a button that no longer exists.
  useEffect(() => {
    if (submitSuccess) successHeading.current?.focus();
  }, [submitSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setSubmitSuccess(
        "Thank you for your message! We'll get back to you within one business day.",
      );
      setFormData(EMPTY_FORM);
    } catch (error) {
      setSubmitError(
        error.message ||
        'There was a problem sending your message. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="bg-[#0A0A0A] text-white py-12 lg:py-25 overflow-x-hidden">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 lg:gap-20 items-center">
            <div className="min-w-0">
              <h1 className="font-['Fraunces'] text-[clamp(32px,8vw,72px)] font-[600] tracking-[-0.02em] leading-[1.05] mb-5 sm:mb-6 break-words">
                Real humans,
                <br />
                <em className="italic text-[#E1261C] font-normal">
                  same-day replies.
                </em>
              </h1>
              <p className="text-base sm:text-lg text-[#D4D4D4] leading-relaxed break-words">
                No bots, no ticket queues, no overseas call centers. Whatever
                you need — a question, a status check, a worry about your data —
                write to us and someone on the team writes back.
              </p>
              <p className="text-sm sm:text-base text-[#D4D4D4] leading-relaxed mt-4">
                Checking on a claim? Your Case ID shows its progress any time on{' '}
                <Link href="/track-claim" className="text-white underline underline-offset-2 hover:text-[#E1261C]">
                  Track Your Claim
                </Link>
                , and most questions are answered in the{' '}
                <Link href="/faq" className="text-white underline underline-offset-2 hover:text-[#E1261C]">
                  FAQ
                </Link>
                .
              </p>
            </div>

            <div className="bg-white text-black p-5 sm:p-8 lg:p-10 rounded-lg min-w-0 overflow-hidden w-full">
              <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#E1261C] mb-2">
                PRIMARY
              </div>
              <a
                href="mailto:help@catchmycash.com"
                className="font-['Fraunces'] text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-[-0.01em] block mb-4 sm:mb-6 hover:text-[#E1261C] transition-colors break-all"
              >
                help@catchmycash.com
              </a>
              <hr className="border-t border-[#E8E6E3] my-5 sm:my-6" />
              <p className="text-sm text-[#4A4A4A] mb-5 sm:mb-6 break-words">
                <strong className="text-black">Response time:</strong> within
                one business day, usually within a few hours.
              </p>
              <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#E1261C] mb-3">
                FOLLOW
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-3">
                {/* The same profiles and icons as the footer, rather than
                    lookalike characters on links that went nowhere. */}
                {SOCIAL_LINKS.filter(({ href }) => href.startsWith('http')).map(
                  ({ label, href, Icon }, index, all) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`min-w-0 w-full border border-[#D4D4D4] py-2.5 sm:py-3 px-2 sm:px-4 rounded flex items-center justify-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-medium hover:border-[#E1261C] hover:text-[#E1261C] transition-all ${
                        index === all.length - 1 && all.length % 2 ? 'col-span-2 sm:col-span-1' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4 text-[#E1261C] shrink-0" aria-hidden="true" />
                      <span className="truncate">{label}</span>
                    </a>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-25 overflow-x-hidden">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Laptop: intro and "what happens next" on the left, the form on the
              right. Phone and tablet: intro, then the form, then the steps. */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-10">
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <div className="font-['JetBrains_Mono'] text-xs tracking-[0.15em] uppercase text-[#E1261C] mb-4">
                OR USE THE FORM
              </div>
              <h2 className="font-['Fraunces'] text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.01em] mb-4 break-words">
                Send us a message.
              </h2>
              <p className="text-base text-[#4A4A4A] leading-relaxed break-words max-w-xl">
                One inbox for everything — questions about a claim,{' '}
                <Link href="/privacy" className="text-[#E1261C] underline underline-offset-2">privacy</Link> or
                data requests, partnership inquiries, press, or anything else.
                A real person reads it and gets back to you, usually within a
                few hours.
              </p>
            </div>

            <div className="relative min-w-0 overflow-hidden rounded-2xl border border-[#E8E6E3] bg-white p-5 shadow-md sm:p-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:p-10">
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]" />

              {submitSuccess ? (
                <div className="py-8 text-center sm:py-12">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F7F1]">
                    <CircleCheck className="h-7 w-7 text-[#00875F]" aria-hidden="true" />
                  </div>
                  <h3
                    ref={successHeading}
                    tabIndex={-1}
                    className="font-['Fraunces'] text-2xl sm:text-3xl font-semibold text-[#0A0A0A] mb-3 focus:outline-none"
                  >
                    Message sent
                  </h3>
                  <p role="status" className="mx-auto max-w-sm text-[15px] leading-relaxed text-[#4A4A4A]">
                    {submitSuccess}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess('')}
                    className="mt-7 text-[15px] font-semibold text-[#E1261C] underline-offset-4 hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="cmc-form min-w-0 w-full">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-5">
                    <div className="min-w-0">
                      <label htmlFor="contact-name" className={LABEL}>
                        Name
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#888888]" aria-hidden="true" />
                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          value={formData.name}
                          onChange={(e) => update('name', e.target.value)}
                          className={`${FIELD} h-12 pl-11 pr-4`}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="contact-email" className={LABEL}>
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#888888]" aria-hidden="true" />
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={(e) => update('email', e.target.value)}
                          className={`${FIELD} h-12 pl-11 pr-4`}
                          placeholder="you@email.com"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* One tap per subject instead of a dropdown; still a native
                      radio group for keyboards and screen readers. */}
                  <fieldset className="mb-5 min-w-0">
                    <legend className={LABEL}>What&apos;s this about?</legend>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map((subject) => (
                        <label key={subject} className="relative cursor-pointer">
                          <input
                            type="radio"
                            name="subject"
                            value={subject}
                            checked={formData.subject === subject}
                            onChange={() => update('subject', subject)}
                            className="peer sr-only"
                          />
                          <span className="inline-flex items-center rounded-full border border-[#D4D4D4] bg-white px-4 py-2 text-[14px] font-medium text-[#4A4A4A] transition-colors hover:border-[#0A0A0A] hover:text-[#0A0A0A] peer-checked:border-[#E1261C] peer-checked:bg-[#FCE9E7] peer-checked:text-[#B11912] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#E1261C]">
                            {subject}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mb-6 min-w-0">
                    <label htmlFor="contact-message" className={LABEL}>
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={(e) => update('message', e.target.value)}
                      className={`${FIELD} block min-h-[160px] resize-y px-4 py-3 leading-relaxed`}
                      placeholder={
                        formData.subject === 'I have an active claim'
                          ? 'Include your Case ID (e.g. CM-2026-123456) and your question...'
                          : 'Tell us what you need...'
                      }
                      required
                    />
                  </div>

                  {submitError && (
                    <div
                      role="alert"
                      className="mb-5 flex items-start gap-2.5 rounded-lg border border-[#E1261C]/30 bg-[#FCE9E7] px-4 py-3 text-[14px] leading-relaxed text-[#B11912] break-words"
                    >
                      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#E1261C] px-8 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#B11912] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send message
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="min-w-0 lg:col-start-1 lg:row-start-2">
              <h3 className="font-['JetBrains_Mono'] text-xs tracking-[0.15em] uppercase text-[#888888] mb-4">
                What happens next
              </h3>
              <ol className="space-y-4">
                {NEXT_STEPS.map((step, index) => (
                  <li key={step} className="flex items-start gap-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FCE9E7] font-['Fraunces'] text-[14px] font-bold text-[#E1261C]">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 text-[15px] leading-relaxed text-[#4A4A4A]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
