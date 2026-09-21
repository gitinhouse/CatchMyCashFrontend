'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Loader2, Mail, ShieldCheck, X } from 'lucide-react';
import { writeVerifiedEmail } from '../lib/verifiedEmail';

/**
 * Proves a signed-out visitor owns the address their claim will be filed under.
 *
 * Two steps: the address, then the code that was mailed to it. An address that
 * already has an account is a dead end here on purpose — that claim belongs on
 * the account, so the visitor is pointed at the login page instead of being
 * allowed to file a second identity as a guest.
 */
export default function EmailVerificationModal({ open, onClose, onVerified }) {
  const router = useRouter();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const emailRef = useRef(null);
  const otpRef = useRef(null);

  // Reset whenever the dialog is opened, so a previous attempt never bleeds in.
  useEffect(() => {
    if (!open) return;
    setStep('email');
    setOtp('');
    setError('');
    setRegistered(false);
    setBusy(false);
    setSecondsLeft(0);
    setResendIn(0);
    const timer = setTimeout(() => emailRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open]);

  // The visible countdown on the code's 10-minute life.
  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return undefined;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [step, secondsLeft]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus();
  }, [step]);

  const sendCode = useCallback(
    async (address) => {
      setBusy(true);
      setError('');
      setRegistered(false);
      try {
        const { data } = await axios.post('/api/email-verification/send', {
          email: address,
        });
        const minutes = data?.expires_in_minutes || 10;
        setSecondsLeft(minutes * 60);
        setResendIn(30);
        setStep('otp');
        return true;
      } catch (err) {
        const payload = err.response?.data;
        if (payload?.registered) setRegistered(true);
        if (payload?.retry_after_seconds) setResendIn(payload.retry_after_seconds);
        setError(
          payload?.error || 'Could not send the code. Please try again.',
        );
        return false;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const submitEmail = async (e) => {
    e?.preventDefault?.();
    const address = email.trim().toLowerCase();
    if (!address) {
      setError('Please enter your email address.');
      return;
    }
    // Show back exactly the address the code went to, rather than whatever
    // capitalisation and spacing was typed.
    setEmail(address);
    await sendCode(address);
  };

  const submitOtp = async (e) => {
    e?.preventDefault?.();
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const { data } = await axios.post('/api/email-verification/verify', {
        email: email.trim().toLowerCase(),
        otp: code,
      });

      writeVerifiedEmail({
        email: data.email,
        token: data.verification_token,
        ttlMinutes: data.token_expires_in_minutes,
      });

      onVerified?.({ email: data.email, token: data.verification_token });
    } catch (err) {
      const payload = err.response?.data;
      if (payload?.registered) {
        setRegistered(true);
        setStep('email');
      }
      if (payload?.expired) setSecondsLeft(0);
      setError(payload?.error || 'Could not verify that code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const mmss = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60,
  ).padStart(2, '0')}`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Verify your email"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-[#E8E6E3]">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[#E8E6E3]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#FCE9E7] flex items-center justify-center shrink-0">
              {step === 'otp' ? (
                <ShieldCheck className="w-4 h-4 text-[#E1261C]" />
              ) : (
                <Mail className="w-4 h-4 text-[#E1261C]" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#0A0A0A] font-['Fraunces']">
                {step === 'otp' ? 'Enter your code' : 'Verify your email'}
              </h2>
              <p className="text-xs text-[#888888] mt-0.5">
                {step === 'otp'
                  ? `We sent a 6-digit code to ${email}`
                  : 'We need a working email address before we search.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#B4B0AA] hover:text-[#E1261C] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {registered ? (
            <div className="rounded-lg border border-[#F5C6C1] bg-[#FCE9E7] p-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#B11912] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#B11912]">
                    You already have an account
                  </p>
                  <p className="text-xs text-[#4A4A4A] mt-1 leading-relaxed">
                    An account already exists with <strong>{email}</strong>.
                    Please log in to continue your claim — your claims stay
                    together that way. Forgotten your password? You can reset it
                    from the login page.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => router.push('/userLogin')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#E1261C] text-white text-xs font-semibold hover:bg-[#B11912] transition-colors"
                    >
                      Log in to continue
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => router.push('/forgotPassword')}
                      className="px-3 py-2 rounded-lg border border-[#E8E6E3] text-xs font-semibold text-[#4A4A4A] hover:border-[#E1261C] hover:text-[#E1261C] transition-colors"
                    >
                      Reset password
                    </button>
                    <button
                      onClick={() => {
                        setRegistered(false);
                        setError('');
                        setEmail('');
                        emailRef.current?.focus();
                      }}
                      className="px-3 py-2 rounded-lg border border-[#E8E6E3] text-xs font-semibold text-[#4A4A4A] hover:border-[#E1261C] hover:text-[#E1261C] transition-colors"
                    >
                      Use another email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : step === 'email' ? (
            <form onSubmit={submitEmail}>
              <label
                htmlFor="verify-email"
                className="block text-xs font-semibold text-[#0A0A0A] mb-1.5"
              >
                Email address
              </label>
              <input
                id="verify-email"
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg border-2 border-[#E8E6E3] text-sm text-[#0A0A0A] placeholder-[#B4B0AA] focus:border-[#E1261C] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[#888888] mt-2 leading-relaxed">
                Your claim, agreement and updates are all sent here, so we check
                it works before searching.
              </p>

              {error && (
                <p className="text-xs text-[#B11912] font-medium mt-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#E1261C] text-white text-sm font-semibold hover:bg-[#B11912] transition-colors disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {busy ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitOtp}>
              <label
                htmlFor="verify-otp"
                className="block text-xs font-semibold text-[#0A0A0A] mb-1.5"
              >
                6-digit code
              </label>
              <input
                id="verify-otp"
                ref={otpRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                // No maxLength: the browser would cut the raw value to six
                // characters before the digits are picked out, so pasting a
                // code written as "123 456" would arrive as "12345".
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-3 py-2.5 rounded-lg border-2 border-[#E8E6E3] text-center text-lg tracking-[0.5em] font-['JetBrains_Mono'] text-[#0A0A0A] placeholder-[#D4D4D4] focus:border-[#E1261C] focus:outline-none transition-colors"
              />

              <p className="text-[11px] text-[#888888] mt-2">
                {secondsLeft > 0
                  ? `This code expires in ${mmss}.`
                  : 'This code has expired — request a new one.'}
              </p>

              {error && (
                <p className="text-xs text-[#B11912] font-medium mt-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy || secondsLeft === 0}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#E1261C] text-white text-sm font-semibold hover:bg-[#B11912] transition-colors disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {busy ? 'Verifying…' : 'Verify and search'}
              </button>

              <div className="flex items-center justify-between gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setError('');
                  }}
                  className="text-[11px] font-semibold text-[#888888] hover:text-[#E1261C]"
                >
                  Change email
                </button>
                <button
                  type="button"
                  disabled={busy || resendIn > 0}
                  onClick={() => sendCode(email.trim().toLowerCase())}
                  className="text-[11px] font-semibold text-[#E1261C] hover:text-[#B11912] disabled:text-[#B4B0AA]"
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
