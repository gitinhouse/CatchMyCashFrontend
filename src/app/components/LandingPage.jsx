'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';
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
  Search, // 🔹 ADD THIS
  CheckCircle2, // 🔹 ADD THIS
  ChevronRight, // 🔹 ADD THIS
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

  const [searchClaimId, setSearchClaimId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchError, setSearchError] = useState('');


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

const handleSearchClaim = async () => {
  if (!searchClaimId.trim()) {
    setSearchError('Please enter a Claim ID');
    return;
  }

  setIsSearching(true);
  setSearchError('');
  setSearchResult(null);

  try {
    // Use the existing endpoint with public=true
    const { data } = await axios.get(
      `/api/case?claim_id=${searchClaimId.trim()}&public=true`
    );

    if (data?.data && data.data.length > 0) {
      setSearchResult(data.data[0]);
      setShowModal(true);
    } else {
      setSearchError('No claim found with this Claim ID');
    }
  } catch (err) {
    console.error('Search error:', err);
    if (err.response?.status === 404) {
      setSearchError('No claim found with this Claim ID');
    } else {
      setSearchError('Failed to search for claim. Please try again.');
    }
  } finally {
    setIsSearching(false);
  }
};

  // 🔹 NEW: Close modal function
  const closeModal = () => {
    setShowModal(false);
    setSearchResult(null);
    setSearchClaimId('');
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-12 shadow-md hover:shadow-lg transition-all duration-300 max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-5 w-5 text-[#E1261C]" />
            <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
              Track Your Claim
            </h3>
          </div>
          <p className="text-sm text-[#4A4A4A] mb-4">
            Enter your Claim ID to check the progress of your claim
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchClaimId}
              onChange={(e) => {
                setSearchClaimId(e.target.value);
                setSearchError('');
              }}
              placeholder="Enter Claim ID"
              className="flex-1 px-4 py-3 border border-[#E8E6E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1261C] focus:border-transparent transition-all text-[#0A0A0A]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchClaim();
              }}
            />
            <button
              onClick={handleSearchClaim}
              disabled={isSearching}
              className="px-6 py-3 bg-[#E1261C] text-white font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
            >
              {isSearching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Track Claim
                </>
              )}
            </button>
          </div>
          {searchError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#E1261C] text-sm mt-2 flex items-center gap-1"
            >
              <AlertTriangle className="h-4 w-4" />
              {searchError}
            </motion.p>
          )}
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
    {showModal && searchResult && (
        <ClaimProgressModal
          claim={searchResult}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
const ClaimProgressModal = ({ claim, onClose }) => {
  const [activeTab, setActiveTab] = useState('progress');
  const properties = claim?.user_properties || [];
  const details = claim?.user_details?.[0] || {};
  
  const parseAmount = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const formatMoney = (n) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const caseTotal = properties.reduce(
    (sum, p) => sum + parseAmount(p.amount),
    0
  );

  // Derive claim progress steps
  const getProgressSteps = () => {
    const docs = claim?.user_docs?.[0] || {};
    const steps = [];
    
    // Step 1: Property Selected
    steps.push({
      id: 1,
      title: 'Property Selected',
      description: 'Property identified for claim',
      completed: properties.length > 0,
      icon: DollarSign,
    });

    // Step 2: User Information
    steps.push({
      id: 2,
      title: 'User Information',
      description: 'Personal details provided',
      completed: !!details?.email_id,
      icon: Users,
    });

    // Step 3: Documents Uploaded
    const hasDocs = !!docs.proof_id || !!docs.ssn_id || !!docs.adress_proof;
    steps.push({
      id: 3,
      title: 'Documents Uploaded',
      description: 'Required documents submitted',
      completed: hasDocs,
      icon: FileText,
    });

    // Step 4: Investigator Signed
    const hasInvestigatorSigned = typeof docs.signed_doc === 'string' &&
      docs.signed_doc.includes('signed-document');
    steps.push({
      id: 4,
      title: 'Investigator Agreement',
      description: 'Signed investigator services agreement',
      completed: hasInvestigatorSigned,
      icon: FileText,
    });

    // Step 5: Agreement Signed
    const hasAgreementForm = (typeof docs.filled_agreement_doc === 'string' &&
      docs.filled_agreement_doc.includes('FilledAgreement_form')) ||
      (typeof docs.signed_doc === 'string' &&
        docs.signed_doc.includes('FilledAgreement_form'));
    steps.push({
      id: 5,
      title: 'Agreement Signed',
      description: 'State Controller\'s Office authorization form signed',
      completed: hasAgreementForm,
      icon: FileText,
    });

    // Step 6: Claim Submitted
    const isSubmitted = Boolean(
      claim?.submitted_at ||
      claim?.document_upload_task_status === 'completed' ||
      claim?.claim_process_task_status === 'completed' ||
      claim?.claim_status === 'Success'
    );
    steps.push({
      id: 6,
      title: 'Claim Submitted',
      description: 'Claim submitted for review',
      completed: isSubmitted,
      icon: Clock,
    });

    // Step 7: Approved/Completed
    const isApproved = claim?.status === false;
    steps.push({
      id: 7,
      title: 'Claim Approved',
      description: 'Claim approved by State Controller\'s Office',
      completed: isApproved,
      icon: CheckCircle2,
    });

    return steps;
  };

  const progressSteps = getProgressSteps();
  const completedSteps = progressSteps.filter(s => s.completed).length;
  const totalSteps = progressSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8E6E3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-[#E8E6E3] p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
                  Claim Progress
                </h2>
                <span className="px-3 py-1 bg-[#FCE9E7] text-[#E1261C] text-xs font-semibold rounded-full font-['JetBrains_Mono']">
                  {claim.claim_id || 'N/A'}
                </span>
              </div>
              <p className="text-sm text-[#4A4A4A]">
                Case #{claim.case_id || String(claim._id).slice(-8).toUpperCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#FCE9E7] rounded-lg transition-all"
            >
              <X className="h-6 w-6 text-[#4A4A4A]" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[#888888] mb-1">
              <span>{completedSteps} of {totalSteps} steps complete</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full h-2 bg-[#F0EEEB] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#E1261C] to-[#B11912] rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-6 border-b border-[#E8E6E3] mb-6">
            {[
              { id: 'progress', label: 'Progress' },
              { id: 'assets', label: `Assets (${properties.length})` },
              { id: 'details', label: 'Details' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#E1261C] text-[#E1261C]'
                    : 'border-transparent text-[#4A4A4A] hover:text-[#0A0A0A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'progress' && (
            <div className="space-y-4">
              {progressSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    step.completed
                      ? 'bg-[#F0FFF4] border-[#00C896]/30'
                      : 'bg-[#F7F5F2] border-[#E8E6E3] opacity-70'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.completed
                      ? 'bg-[#00C896] text-white'
                      : 'bg-[#D4D4D4] text-[#888888]'
                  }`}>
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold ${
                        step.completed ? 'text-[#0A0A0A]' : 'text-[#888888]'
                      }`}>
                        {step.title}
                      </h4>
                      {step.completed && (
                        <span className="text-[#00C896] text-xs font-['JetBrains_Mono']">
                          ✓ Complete
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${
                      step.completed ? 'text-[#4A4A4A]' : 'text-[#888888]'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'assets' && (
            <div>
              <h4 className="font-bold text-[#0A0A0A] mb-3">Claimed Assets</h4>
              {properties.length === 0 ? (
                <p className="text-sm text-[#888888]">No assets on this claim.</p>
              ) : (
                <div className="space-y-3">
                  {properties.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b border-[#F0EEEB] pb-3 last:border-b-0"
                    >
                      <div>
                        <p className="font-semibold text-[#0A0A0A]">
                          {claim.user_info?.first_name} {claim.user_info?.last_name}
                        </p>
                        <p className="text-sm text-[#4A4A4A]">
                          {p.property_title || p.property_type}
                        </p>
                        <p className="text-xs text-[#888888] font-['JetBrains_Mono']">
                          ID: {p.property_id}
                        </p>
                        {p.claim_id && (
                          <p className="text-xs text-[#E1261C] font-['JetBrains_Mono'] mt-1">
                            Claim ID: {p.claim_id}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-[#0A0A0A]">
                        ${formatMoney(parseAmount(p.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#888888] text-xs uppercase font-['JetBrains_Mono']">Full Name</p>
                  <p className="font-semibold text-[#0A0A0A]">
                    {details.legal_name || `${claim.user_info?.first_name || ''} ${claim.user_info?.last_name || ''}`}
                  </p>
                </div>
                <div>
                  <p className="text-[#888888] text-xs uppercase font-['JetBrains_Mono']">Email</p>
                  <p className="font-semibold text-[#0A0A0A]">{details.email_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#888888] text-xs uppercase font-['JetBrains_Mono']">Contact</p>
                  <p className="font-semibold text-[#0A0A0A]">{details.contact_no || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#888888] text-xs uppercase font-['JetBrains_Mono']">Case Status</p>
                  <p className={`font-semibold ${claim.status === false ? 'text-[#00C896]' : 'text-[#E1261C]'}`}>
                    {claim.status === false ? 'Approved' : 'In Progress'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[#888888] text-xs uppercase font-['JetBrains_Mono']">Address</p>
                <p className="font-semibold text-[#0A0A0A]">
                  {details.address
                    ? `${details.address}, ${details.city}, ${details.state} ${details.zip_code}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[#888888] text-xs uppercase font-['JetBrains_Mono']">Filed On</p>
                <p className="font-semibold text-[#0A0A0A]">
                  {claim.createdAt
                    ? new Date(claim.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-[#F7F5F2] border-t border-[#E8E6E3] p-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#888888]">Total Claim Amount</p>
              <p className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
                ${formatMoney(caseTotal)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#E1261C] text-white font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
export default LandingPage;
