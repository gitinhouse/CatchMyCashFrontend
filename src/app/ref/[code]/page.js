// app/ref/[code]/page.js
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

export default function ReferralLandingPage() {
  const { code } = useParams();
  const router = useRouter();
  const [referrerName, setReferrerName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    const resolve = async () => {
      try {
        const res = await axios.get(`/api/referral-link?code=${code}`);
        setReferrerName(res.data.referrer_name);
        localStorage.setItem('referralCode', code);
      } catch {
        setError('This referral link is invalid or has expired.');
      } finally {
        setTimeout(() => router.push(`/?ref=${code}`), 1800);
      }
    };
    resolve();
  }, [code, router]);

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-4">
      <div className="text-center bg-white border border-[#E8E6E3] rounded-xl p-8 shadow-md max-w-md">
        <h1 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces'] mb-2">
          {error ? 'Oops!' : `${referrerName || 'A friend'} invited you to CatchMyCash`}
        </h1>
        <p className="text-[#4A4A4A]">
          {error || 'Redirecting you to search for your unclaimed property...'}
        </p>
      </div>
    </div>
  );
}