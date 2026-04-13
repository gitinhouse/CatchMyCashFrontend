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
  Pointer,
} from 'lucide-react';
import { ImageWithFallback } from './uicomponents/ImageWithFallback';
import { Button } from './uicomponents/Button';

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
  const handlePrivacy = async () => {
    router.push('/privacy-policy');
  };
  return (
    <div className="min-h-screen relative">
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card border-b border-teal-500/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-mint-green rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-navy-primary" />
            </div>
            <div className="w-[90%]">
              <h1 className="text-3xl font-bold text-teal-400">CatchMyCash</h1>
              <p className="text-gray-300 mt-1">
                California's Premier Unclaimed Property Recovery Service
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleLogin}
                className="glass-button text-white px-12 py-6 sm:text-[20px] text-[16px] rounded-xl hover:text-teal-200 pulse-glow"
              >
                <span className="flex items-center gap-3">Login</span>
              </Button>
            </motion.div>
            <Button
              onClick={() => (window.location.href = '/api/auth/google')}
              className="glass-button text-white px-6 py-3 rounded-xl hover:text-teal-200"
            >
              Connect Gmail
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-16"
        >
          <motion.h2
            className="md:text-5xl text-[30px] font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Millions in Unclaimed Property
            <motion.span
              className="text-teal-400 block"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Waiting for You
            </motion.span>
          </motion.h2>

          <motion.p
            className="md:text-[20px] text-[16px] text-gray-300 mb-8 max-w-3xl mx-auto"
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
            <Button
              onClick={onNext}
              className="glass-button text-white px-12 py-6 sm:text-[20px] text-[16px] rounded-xl hover:text-teal-200 pulse-glow"
            >
              <span className="flex items-center gap-3">
                Catch My Cash Now
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          <motion.div
            className="glass-card-teal text-center p-6 rounded-xl"
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <TrendingUp className="h-8 w-8 text-mint-green mx-auto mb-3" />
            <div className="sm:text-[30px] text-[24px] font-bold text-white mb-1">
              {formatCurrency(stats.totalRecovered)}
            </div>
            <p className="text-teal-200 ">Total Recovered</p>
          </motion.div>

          <motion.div
            className="glass-card-teal text-center p-6 rounded-xl"
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <Users className="h-8 w-8 text-mint-green mx-auto mb-3" />
            <div className="sm:text-[30px] text-[24px] font-bold text-white mb-1">
              {stats.happyClients.toLocaleString()}
            </div>
            <p className="text-teal-200">Happy Clients</p>
          </motion.div>

          <motion.div
            className="glass-card-teal text-center p-6 rounded-xl"
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <Award className="h-8 w-8 text-mint-green mx-auto mb-3" />
            <div className="sm:text-[30px] text-[24px] font-bold text-white mb-1">
              {stats.successRate}%
            </div>
            <p className="text-teal-200">Success Rate</p>
          </motion.div>
        </motion.div>

        {/* Problem Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="glass-card border border-red-400/20 rounded-xl p-8 mb-12 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500">
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
              <AlertTriangle className="h-8 w-8 text-red-400 mr-3" />
            </motion.div>
            <h3 className="sm:text-[24px] text-[20px] font-bold text-red-300">
              Why Most People Never Get Their Money Back
            </h3>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.6 }}
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1590966550724-e041c146b85f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25leSUyMGNhc2glMjBwcm9wZXJ0eSUyMGRvY3VtZW50cyUyMGxlZ2FsfGVufDF8fHx8MTc1NzA0MjE1Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Complex legal documents"
                className="w-full h-48 object-cover rounded-lg filter brightness-75 hover:brightness-90 transition-all duration-300"
              />
            </motion.div>

            <div className="space-y-6">
              {ResonsArray.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.8 + index * 0.2 }}
                  className="flex items-start group"
                  whileHover={{ x: 5 }}
                >
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.3 }}
                  >
                    <item.icon className="h-6 w-6 text-red-400 mr-3 mt-1" />
                  </motion.div>
                  <div>
                    <div className="font-semibold text-red-300 group-hover:text-red-200 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-red-400 group-hover:text-red-300 transition-colors">
                      {item.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Solution Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.4 }}
          className="glass-card-teal border border-teal-500/20 rounded-xl p-8 mb-12 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-mint-green">
            <motion.div
              className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <motion.h3
            className="sm:text-[24px] text-[20px] font-bold text-teal-300 mb-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 2.6 }}
          >
            We Make It Simple - You Get Paid
          </motion.h3>

          <div className="grid md:grid-cols-3 gap-6">
            {SolutionArray.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: item.delay }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-6 text-center border-teal-500/10 rounded-xl group"
              >
                <motion.div
                  className="bg-gradient-to-br from-teal-500/30 to-mint-green/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 relative"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.span
                    className="text-2xl font-bold text-teal-300 relative z-10"
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
                    className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-mint-green/10 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.7,
                    }}
                  />
                </motion.div>
                <h4 className="font-semibold mb-2 text-white group-hover:text-teal-200 transition-colors">
                  {item.title}
                </h4>
                <p className="text-gray-300 group-hover:text-gray-200 transition-colors">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 3.4 }}
          whileHover={{ scale: 1.02 }}
          className="text-center glass-card rounded-xl p-8 border border-teal-500/20 relative overflow-hidden"
        >
          <motion.div
            className="flex items-center justify-center mb-4"
            whileHover={{ scale: 1.1 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <DollarSign className="h-8 w-8 text-teal-400 mr-2" />
            </motion.div>
            <h3 className="sm:text-[24px] text-[20px] font-bold text-white">
              Simple Pricing
            </h3>
          </motion.div>

          <motion.div className="relative" whileHover={{ scale: 1.1 }}>
            <motion.div
              className="text-6xl font-bold text-teal-400 mb-2 relative z-10"
              animate={{
                textShadow: [
                  '0 0 20px rgba(0, 200, 150, 0.5)',
                  '0 0 40px rgba(0, 200, 150, 0.8)',
                  '0 0 20px rgba(0, 200, 150, 0.5)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              10%
            </motion.div>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-400/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>

          <div className="text-gray-300 mb-6 sm:text-[18px] text-[16px]">
            You only pay when we successfully recover your money
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.8 }}
            className="flex justify-center items-center gap-2 sm:text-[14px] text-[12px] text-gray-400"
          >
            <span className="w-2 h-2 bg-mint-green rounded-full"></span>
            <span>No upfront costs</span>
            <span className="w-2 h-2 bg-mint-green rounded-full"></span>
            <span>No hidden fees</span>
            <span className="w-2 h-2 bg-mint-green rounded-full"></span>
            <span>No risk to you</span>
            <span onClick={handlePrivacy} className="cursor-pointer">
              <a href="https://catchmycash.com/privacy-policy">
                Privacy policy
              </a>
            </span>
          </motion.div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 4 }}
          className="text-center mt-12"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onNext}
              className="glass-button text-white sm:px-16 px-6 py-6 sm:text-[20px] text-[16px] rounded-xl hover:text-teal-200 pulse-glow relative overflow-hidden group"
            >
              <motion.span
                className="relative z-10 flex items-center  gap-3"
                whileHover={{ x: 5 }}
              >
                Start Your Free Property Search
                <motion.span
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </motion.span>
            </Button>
          </motion.div>

          <motion.div
            className="text-gray-400 mt-6 sm:text-[18px] text-[16px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.4 }}
          >
            Join{' '}
            <span className="text-teal-400 font-semibold">
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
