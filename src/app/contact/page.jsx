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
      <section className="bg-[#0A0A0A] text-white py-12.5 lg:py-25">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div>
              <h1 className="font-['Fraunces'] text-[clamp(40px,6vw,72px)] font-[600] tracking-[-0.02em] leading-[1.02] mb-6">
                Real humans,
                <br />
                <em className="italic text-[#E1261C] font-normal">
                  same-day replies.
                </em>
              </h1>
              <p className="text-lg text-[#D4D4D4] leading-relaxed">
                No bots, no ticket queues, no overseas call centers. Whatever
                you need — a question, a status check, a worry about your data —
                write to us and someone on the team writes back.
              </p>
            </div>
            <div className="bg-white text-black p-10 rounded-lg">
              <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#E1261C] mb-2">
                PRIMARY
              </div>
              <a
                href="mailto:help@catchmycash.com"
                className="font-['Fraunces'] text-3xl md:text-4xl font-semibold tracking-[-0.01em] block mb-6 hover:text-[#E1261C] transition-colors"
              >
                help@catchmycash.com
              </a>
              <hr className="border-t border-[#E8E6E3] my-6" />
              <p className="text-sm text-[#4A4A4A] mb-6">
                <strong className="text-black">Response time:</strong> within
                one business day, usually within a few hours.
              </p>
              <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#E1261C] mb-3">
                FOLLOW
              </div>
              <div className="flex gap-3 flex-wrap mt-3">
                <a
                  href="#"
                  className="flex-1 min-w-[110px] border border-[#D4D4D4] py-3.5 px-4 rounded flex items-center gap-2.5 text-sm font-medium hover:border-[#E1261C] hover:text-[#E1261C] transition-all"
                >
                  <span className="text-[#E1261C] font-bold">𝕏</span> Twitter
                </a>
                <a
                  href="#"
                  className="flex-1 min-w-[110px] border border-[#D4D4D4] py-3.5 px-4 rounded flex items-center gap-2.5 text-sm font-medium hover:border-[#E1261C] hover:text-[#E1261C] transition-all"
                >
                  <span className="text-[#E1261C] font-bold">in</span> LinkedIn
                </a>
                <a
                  href="#"
                  className="flex-1 min-w-[110px] border border-[#D4D4D4] py-3.5 px-4 rounded flex items-center gap-2.5 text-sm font-medium hover:border-[#E1261C] hover:text-[#E1261C] transition-all"
                >
                  <span className="text-[#E1261C] font-bold">◉</span> Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12.5 lg:py-25">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-[1fr_1.2fr] gap-12 md:gap-20">
            <div>
              <div className="font-['JetBrains_Mono'] text-xs tracking-[0.15em] uppercase text-[#E1261C] mb-4">
                OR USE THE FORM
              </div>
              <h2 className="font-['Fraunces'] text-3xl md:text-4xl font-semibold tracking-[-0.01em] mb-4">
                Send us a message.
              </h2>
              <div className="space-y-4">
                <p className="text-base text-[#4A4A4A] leading-relaxed">
                  One inbox for everything — questions about a claim, privacy or
                  data requests, partnership inquiries, press, or anything else.
                  A real person reads it and gets back to you, usually within a
                  few hours.
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="font-['JetBrains_Mono'] text-xs tracking-[0.1em] uppercase text-[#4A4A4A] block mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3.5 border border-[#D4D4D4] rounded focus:outline-none focus:border-[#E1261C] transition-colors"
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <label className="font-['JetBrains_Mono'] text-xs tracking-[0.1em] uppercase text-[#4A4A4A] block mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3.5 border border-[#D4D4D4] rounded focus:outline-none focus:border-[#E1261C] transition-colors"
                    placeholder="you@email.com"
                    required
                  />
                </div>
              </div>
              <div className="mb-5">
                <label className="font-['JetBrains_Mono'] text-xs tracking-[0.1em] uppercase text-[#4A4A4A] block mb-2">
                  What's this about?
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-3.5 border border-[#D4D4D4] rounded focus:outline-none focus:border-[#E1261C] transition-colors bg-[#f7f5f2]"
                >
                  <option>General question</option>
                  <option>I have an active claim</option>
                  <option>Privacy / data request</option>
                  <option>Partnership / press</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="font-['JetBrains_Mono'] text-xs tracking-[0.1em] uppercase text-[#4A4A4A] block mb-2">
                  Your message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3.5 border border-[#D4D4D4] rounded focus:outline-none focus:border-[#E1261C] transition-colors min-h-[140px] resize-vertical"
                  placeholder="Tell us what you need..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send message →'}
              </button>
              {submitError && (
                <p className="mt-4 text-sm text-[#E1261C]">{submitError}</p>
              )}
              {submitSuccess && (
                <p className="mt-4 text-sm text-[#00C896]">{submitSuccess}</p>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
