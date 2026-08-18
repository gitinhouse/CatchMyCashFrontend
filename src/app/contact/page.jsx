'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General question',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

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
      setFormData({
        name: '',
        email: '',
        subject: 'General question',
        message: '',
      });
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
                <a
                  href="#"
                  className="min-w-0 w-full border border-[#D4D4D4] py-2.5 sm:py-3 px-2 sm:px-4 rounded flex items-center justify-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-medium hover:border-[#E1261C] hover:text-[#E1261C] transition-all"
                >
                  <span className="text-[#E1261C] font-bold shrink-0">𝕏</span>
                  <span className="truncate">Twitter</span>
                </a>
                <a
                  href="#"
                  className="min-w-0 w-full border border-[#D4D4D4] py-2.5 sm:py-3 px-2 sm:px-4 rounded flex items-center justify-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-medium hover:border-[#E1261C] hover:text-[#E1261C] transition-all"
                >
                  <span className="text-[#E1261C] font-bold shrink-0">in</span>
                  <span className="truncate">LinkedIn</span>
                </a>
                <a
                  href="#"
                  className="min-w-0 w-full col-span-2 sm:col-span-1 border border-[#D4D4D4] py-2.5 sm:py-3 px-2 sm:px-4 rounded flex items-center justify-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-medium hover:border-[#E1261C] hover:text-[#E1261C] transition-all"
                >
                  <span className="text-[#E1261C] font-bold shrink-0">◉</span>
                  <span className="truncate">Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-25 overflow-x-hidden">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-10 md:gap-16 lg:gap-20">
            <div className="min-w-0">
              <div className="font-['JetBrains_Mono'] text-xs tracking-[0.15em] uppercase text-[#E1261C] mb-4">
                OR USE THE FORM
              </div>
              <h2 className="font-['Fraunces'] text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.01em] mb-4 break-words">
                Send us a message.
              </h2>
              <div className="space-y-4">
                <p className="text-base text-[#4A4A4A] leading-relaxed break-words">
                  One inbox for everything — questions about a claim, privacy or
                  data requests, partnership inquiries, press, or anything else.
                  A real person reads it and gets back to you, usually within a
                  few hours.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="min-w-0 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="min-w-0">
                  <label className="font-['JetBrains_Mono'] text-xs tracking-[0.1em] uppercase text-[#4A4A4A] block mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full max-w-full px-4 py-3.5 border border-[#D4D4D4] rounded focus:outline-none focus:border-[#E1261C] transition-colors box-border"
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="min-w-0">
                  <label className="font-['JetBrains_Mono'] text-xs tracking-[0.1em] uppercase text-[#4A4A4A] block mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full max-w-full px-4 py-3.5 border border-[#D4D4D4] rounded focus:outline-none focus:border-[#E1261C] transition-colors box-border"
                    placeholder="you@email.com"
                    required
                  />
                </div>
              </div>
              <div className="mb-5 min-w-0">
                <label className="font-['JetBrains_Mono'] text-xs tracking-[0.1em] uppercase text-[#4A4A4A] block mb-2">
                  What's this about?
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full max-w-full px-4 py-3.5 border border-[#D4D4D4] rounded focus:outline-none focus:border-[#E1261C] transition-colors bg-[#f7f5f2] box-border"
                >
                  <option>General question</option>
                  <option>I have an active claim</option>
                  <option>Privacy / data request</option>
                  <option>Partnership / press</option>
                </select>
              </div>
              <div className="mb-6 min-w-0">
                <label className="font-['JetBrains_Mono'] text-xs tracking-[0.1em] uppercase text-[#4A4A4A] block mb-2">
                  Your message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full max-w-full px-4 py-3.5 border border-[#D4D4D4] rounded focus:outline-none focus:border-[#E1261C] transition-colors min-h-[140px] resize-y box-border"
                  placeholder="Tell us what you need..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send message →'}
              </button>
              {submitError && (
                <p className="mt-4 text-sm text-[#E1261C] break-words">
                  {submitError}
                </p>
              )}
              {submitSuccess && (
                <p className="mt-4 text-sm text-[#00C896] break-words">
                  {submitSuccess}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
