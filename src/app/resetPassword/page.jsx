'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { InputField } from '../components/uicomponents/InputField';

const ResetPasswordInner = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [invalidMsg, setInvalidMsg] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verify token validity as soon as the page loads
  useEffect(() => {
    const verify = async () => {
      if (!token || !email) {
        setInvalidMsg('Invalid or incomplete reset link.');
        setChecking(false);
        return;
      }
      try {
        await axios.get('/api/reset-password', { params: { token, email } });
        setTokenValid(true);
      } catch (error) {
        setInvalidMsg(
          error?.response?.data?.message ||
            'This reset link is invalid or has expired. Please request a new one.',
        );
      } finally {
        setChecking(false);
      }
    };
    verify();
  }, [token, email]);

  const handleSubmit = async () => {
    setErrorMsg('');

    if (!password || !confirmPassword) {
      setErrorMsg('Please fill in both password fields.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await axios.post('/api/reset-password', {
        token,
        email,
        password,
      });
      setSuccessMsg(data.message || 'Password reset successfully.');
      setTimeout(() => router.push('/userLogin'), 2500);
    } catch (error) {
      setErrorMsg(
        error?.response?.data?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-[#E8E6E3] rounded-xl shadow-md p-8 max-w-md w-full"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-[#E1261C]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
            Reset{' '}
            <span className="text-[#E1261C] italic font-normal">Password</span>
          </h2>
        </div>

        {checking && (
          <p className="text-center text-[#4A4A4A] text-sm">Verifying your link...</p>
        )}

        {!checking && !tokenValid && (
          <div className="p-3 bg-[#FCE9E7] border border-[#E1261C]/20 rounded-lg text-[#E1261C] text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {invalidMsg}
          </div>
        )}

        {!checking && tokenValid && !successMsg && (
          <>
            {errorMsg && (
              <div className="p-3 bg-[#FCE9E7] border border-[#E1261C]/20 rounded-lg text-[#E1261C] text-sm flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <label className="block text-sm font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
              New Password
            </label>
            <InputField
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full border-2 border-[#E8E6E3] rounded-lg focus:border-[#E1261C] focus:outline-none transition-all mb-4"
              disabled={isSubmitting}
            />

            <label className="block text-sm font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
              Confirm New Password
            </label>
            <InputField
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full border-2 border-[#E8E6E3] rounded-lg focus:border-[#E1261C] focus:outline-none transition-all mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isSubmitting}
            />

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-3 text-white font-semibold rounded-lg transition-all ${
                isSubmitting
                  ? 'bg-[#D4D4D4] cursor-not-allowed'
                  : 'bg-[#E1261C] hover:bg-[#B11912]'
              }`}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {successMsg} Redirecting to login...
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Wrap in Suspense because useSearchParams requires it in Next.js app router
const ResetPassword = () => (
  <Suspense fallback={<div className="min-h-screen bg-[#F7F5F2]" />}>
    <ResetPasswordInner />
  </Suspense>
);

export default ResetPassword;