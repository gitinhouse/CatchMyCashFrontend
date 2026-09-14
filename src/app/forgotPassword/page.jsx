'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Mail, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { InputField } from '../components/uicomponents/InputField';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await axios.post('/api/forgot-password', {
        userEmail: email.trim(),
      });
      setSuccessMsg(data.message || 'Password reset email sent. Please check your inbox.');
    } catch (error) {
      // Clear message when email doesn't exist (404) or any other error
      const msg =
        error?.response?.data?.message ||
        'Something went wrong. Please try again.';
      setErrorMsg(msg);
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
            <Mail className="h-8 w-8 text-[#E1261C]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
            Forgot{' '}
            <span className="text-[#E1261C] italic font-normal">Password</span>
          </h2>
          <p className="text-[#4A4A4A] mt-2 text-sm">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-[#FCE9E7] border border-[#E1261C]/20 rounded-lg text-[#E1261C] text-sm flex items-center gap-2 mb-4"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {errorMsg}
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2 mb-4"
            >
              <CheckCircle className="h-4 w-4 shrink-0" />
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {!successMsg && (
          <>
            <label className="block text-sm font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
              Email Address
            </label>
            <InputField
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full text-[#0A0A0A] placeholder-[#888888] border-2 border-[#E8E6E3] rounded-lg focus:border-[#E1261C] focus:outline-none transition-all mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isSubmitting}
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-3 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-[#D4D4D4] cursor-not-allowed'
                  : 'bg-[#E1261C] hover:bg-[#B11912]'
              }`}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;