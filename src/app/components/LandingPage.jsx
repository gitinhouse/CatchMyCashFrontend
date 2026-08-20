'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Clock,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Menu,
  X,
} from 'lucide-react';
import { ImageWithFallback } from './uicomponents/ImageWithFallback';
import { Button } from './uicomponents/Button';

// ============================================================
// DESIGN TOKENS — matching the HTML mockup exactly
// ============================================================
const colors = {
  black: '#0A0A0A',
  white: '#FFFFFF',
  offWhite: '#F7F5F2',
  red: '#E1261C',
  redDeep: '#B11912',
  redTint: '#FCE9E7',
  gray900: '#1A1A1A',
  gray700: '#4A4A4A',
  gray500: '#888888',
  gray300: '#D4D4D4',
  gray200: '#E8E6E3',
  gray100: '#F0EEEB',
};

// ============================================================
// Header Component — exactly matching the HTML mockup
// ============================================================

const SolutionArray = [
  {
    num: '1',
    title: 'We Search & Find',
    desc: 'Our advanced system scans all California databases',
    delay: 2.8,
  },
  {
    num: '2',
    title: 'We Handle Everything',
    desc: 'Professional case preparation and submission',
    delay: 3.0,
  },
  {
    num: '3',
    title: 'You Get Paid',
    desc: '94% success rate - money in your account',
    delay: 3.2,
  },
];

const ResonsArray = [
  {
    icon: Clock,
    title: 'Extremely Time-Consuming',
    desc: 'Average claim takes 6-18 months to process',
  },
  {
    icon: FileText,
    title: 'Complex Legal Documentation',
    desc: 'Requires multiple forms, notarizations, and proof documents',
  },
  {
    icon: AlertTriangle,
    title: 'High Rejection Rate',
    desc: 'Over 70% of DIY claims are rejected due to errors',
  },
];

const LandingPage = ({ onNext }) => {
  const router = useRouter();

  const [stats, setStats] = useState({
    totalRecovered: 0,
    happyClients: 0,
    successRate: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        totalRecovered: 2847392,
        happyClients: 1247,
        successRate: 94,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleLogin = async () => {
    router.push('/userLogin');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] font-body">
      {/* Header - exactly matching HTML mockup */}
      {/* <SiteHeader onLoginClick={handleLogin} /> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-16"
        >
          <motion.h2
            className="md:text-5xl text-[30px] font-bold text-[#0A0A0A] mb-6 font-['Fraunces']"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Millions in Unclaimed Property
            <motion.span
              className="text-[#E1261C] italic font-normal block"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Waiting for You
            </motion.span>
          </motion.h2>

          <motion.p
            className="md:text-[20px] text-[16px] text-[#4A4A4A] mb-8 max-w-3xl mx-auto font-['Inter'] "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            The California unclaimed property process is complex,
            time-consuming, and often unsuccessful. Let our expert investigators
            recover what's rightfully yours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={onNext}
              className="inline-flex items-center justify-center gap-3 px-12 py-6 bg-[#E1261C] text-white text-[16px] sm:text-[20px] font-semibold rounded-xl hover:bg-[#B11912] transition-all shadow-md hover:shadow-lg"
            >
              Catch My Cash Now
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12H20M20 12L14 6M20 12L14 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.span>
            </button>
          </motion.div>
        </motion.div>

        {/* Stats Cards - with visible borders and shadows */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="grid md:grid-cols-3 grid-cols-1 gap-4 md:gap-6 mb-16"
        >
          {[
            {
              icon: TrendingUp,
              value: formatCurrency(stats.totalRecovered),
              label: 'Total Recovered',
            },
            {
              icon: Users,
              value: stats.happyClients.toLocaleString(),
              label: 'Happy Clients',
            },
            {
              icon: Award,
              value: `${stats.successRate}%`,
              label: 'Success Rate',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="bg-white text-center p-6 rounded-xl border border-[#E8E6E3] shadow-md hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.03, y: -5 }}
            >
              <div className="w-12 h-12 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
                <item.icon className="h-6 w-6 text-[#E1261C]" />
              </div>
              <div className="sm:text-[30px] text-[24px] font-bold text-[#0A0A0A] mb-1 font-['Fraunces']">
                {item.value}
              </div>
              <p className="text-[#4A4A4A] text-sm font-['JetBrains_Mono']">
                {item.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Why Most People Never Get Their Money Back - with visible borders and shadows */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="bg-white border border-[#E8E6E3] rounded-xl p-8 mb-12 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]">
            <motion.div
              className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <motion.div
            className="flex items-center mb-6"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle className="h-8 w-8 text-[#E1261C] mr-3" />
            </motion.div>
            <h3 className="sm:text-[24px] text-[20px] font-bold text-[#0A0A0A] font-['Fraunces']">
              Why Most People Never Get Their Money Back
            </h3>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.6 }}
              className="hidden md:block w-full h-48 lg:h-[192px]"
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1590966550724-e041c146b85f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25leSUyMGNhc2glMjBwcm9wZXJ0eSUyMGRvY3VtZW50cyUyMGxlZ2FsfGVufDF8fHx8MTc1NzA0MjE1Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Complex legal documents"
                className="w-full h-full object-cover rounded-lg filter brightness-95 hover:brightness-100 transition-all duration-300 shadow-sm"
              />
            </motion.div>

            <div className="space-y-4 md:space-y-6">
              {ResonsArray.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.8 + index * 0.2 }}
                  className="flex items-start group p-3 rounded-lg hover:bg-[#FCE9E7] transition-colors duration-300"
                  whileHover={{ x: 5 }}
                >
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.3 }}
                  >
                    <item.icon className="h-6 w-6 text-[#E1261C] mr-3 mt-1" />
                  </motion.div>
                  <div>
                    <div className="font-semibold font-['JetBrains_Mono'] text-[#0A0A0A] group-hover:text-[#E1261C] transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[#4A4A4A] font-['Inter'] group-hover:text-[#0A0A0A] transition-colors text-sm">
                      {item.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* We Make It Simple - with visible borders and shadows */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.4 }}
          className="bg-white border border-[#E8E6E3] rounded-xl p-8 mb-12 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]">
            <motion.div
              className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <motion.h3
            className="sm:text-[24px] text-[20px] font-bold text-[#0A0A0A] mb-8 text-center font-['Fraunces']"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 2.6 }}
          >
            We Make It Simple - You Get Paid
          </motion.h3>

          <div className="grid md:grid-cols-3 grid-cols-1 gap-4 md:gap-6">
            {SolutionArray.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: item.delay }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white text-center p-6 border border-[#E8E6E3] rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <motion.div
                  className="bg-[#FCE9E7] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 relative"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.span
                    className="text-2xl font-bold text-[#E1261C] relative z-10 font-['Fraunces']"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.5,
                    }}
                  >
                    {item.num}
                  </motion.span>
                  <motion.div
                    className="absolute inset-0 bg-[#FCE9E7] rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.7,
                    }}
                  />
                </motion.div>
                <h4 className="font-semibold font-['JetBrains_Mono'] mb-2 text-[#0A0A0A] group-hover:text-[#E1261C] transition-colors">
                  {item.title}
                </h4>
                <p className="text-[#4A4A4A] group-hover:text-[#0A0A0A] transition-colors text-sm">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Simple Pricing - with visible borders and shadows */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 3.4 }}
          whileHover={{ scale: 1.02 }}
          className="text-center bg-white border border-[#E8E6E3] rounded-xl p-8 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>

          <motion.div
            className="flex items-center justify-center mb-4"
            whileHover={{ scale: 1.1 }}
          >
            <motion.div
              className="w-10 h-10 bg-[#FCE9E7] rounded-full flex items-center justify-center"
              animate={{ rotate: [0, 360] }} // ✅ ADDED: continuous rotation, matching Figma
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} // ✅ ADDED: slow, smooth, infinite spin
            >
              <DollarSign className="h-5 w-5 text-[#E1261C]" />
            </motion.div>
            <h3 className="sm:text-[24px] text-[20px] font-bold text-[#0A0A0A] ml-2 font-['Fraunces']">
              Simple Pricing
            </h3>
          </motion.div>

          <motion.div className="relative" whileHover={{ scale: 1.1 }}>
            <motion.div className="text-4xl sm:text-6xl font-bold text-[#E1261C] mb-2 relative z-10 font-['Fraunces']">
              <span className="text-black"> 10</span>%
            </motion.div>
          </motion.div>

          <div className="text-[#4A4A4A] mb-6 sm:text-[18px] text-[16px]">
            You only pay when we successfully recover your money
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.8 }}
            className="flex flex-wrap justify-center items-center gap-2 sm:text-[14px] text-[12px] text-[#888888] font-['JetBrains_Mono']"
          >
            <span className="w-2 h-2 bg-[#E1261C] rounded-full"></span>
            <span>No upfront costs</span>
            <span className="w-2 h-2 bg-[#E1261C] rounded-full"></span>
            <span>No hidden fees</span>
            <span className="w-2 h-2 bg-[#E1261C] rounded-full"></span>
            <span>No risk to you</span>
          </motion.div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 4 }}
          className="text-center mt-12"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              onClick={onNext}
              className="inline-flex items-center justify-center gap-3 px-6 sm:px-16 py-6 bg-[#E1261C] text-white text-[16px] sm:text-[20px] font-semibold rounded-xl hover:bg-[#B11912] transition-all shadow-md hover:shadow-lg relative overflow-hidden group"
            >
              <motion.span
                className="relative z-10 flex items-center gap-3"
                whileHover={{ x: 5 }}
              >
                Start Your Free Property Search
                <motion.span
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 12H20M20 12L14 6M20 12L14 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.span>
              </motion.span>
            </button>
          </motion.div>

          <motion.div
            className="text-[#888888] mt-6 sm:text-[18px] text-[16px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.4 }}
          >
            Join{' '}
            <span className="text-[#E1261C] font-semibold">
              {stats.happyClients.toLocaleString()}+
            </span>{' '}
            people who have recovered their money
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
