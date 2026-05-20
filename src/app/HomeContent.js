'use client';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useSearchParams } from 'next/navigation';
import LandingPage from './components/LandingPage';
import FloatingElements from './components/uicomponents/FloatingElements';
import PropertySearch from './components/PropertySearch';
import ProgressHeader from './components/uicomponents/ProgressHeader';
import LoadingOverlay from './components/uicomponents/LoadingOverlay';
import PropertyResults from './components/PropertyResults';
import UserInformation from './components/UserInformation';
import FormAutomation from './components/FormAutomation';
import DocumentUpload from './components/DocumentUpload';
import CaseTracking from './components/CaseTracking';
import ReferralSystem from './components/ReferralSystem';
import Leaderboard from './components/Leaderboared';
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import Link from 'next/link';
import { useSearchStore } from './store/searchStore';

export const SiteHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { goToSearch } = useSearchStore();

  const handleLogin = async () => {
    router.push("/userLogin");
  };

  const handleSearchNow = () => {
    goToSearch();
  };

  const navItems = [
    { name: "About", path: "/about" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "Privacy", path: "/privacy" },
    { name: "FAQ", path: "/faq" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E8E6E3] shadow-sm">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-['Fraunces'] font-black text-[22px] tracking-[-0.02em] flex items-center gap-2 text-black"
        >
          <span className="w-2.5 h-2.5 bg-[#E1261C] rounded-full inline-block"></span>
          CatchMyCash
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`text-sm font-medium transition-colors ${
                pathname === item.path 
                  ? 'text-[#0A0A0A]' 
                  : 'text-[#4A4A4A] hover:text-[#0A0A0A]'
              }`}
            >
              {item.name}
            </Link>
          ))}
          <button
            onClick={handleSearchNow}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm hover:shadow-md"
          >
            Search Now
          </button>
          <button
            onClick={handleLogin}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm hover:shadow-md"
          >
            Login
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E6E3] bg-white shadow-lg">
          <div className="px-4 sm:px-8 py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className="text-sm font-medium text-[#4A4A4A] hover:text-[#0A0A0A] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleSearchNow();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all w-full shadow-sm"
            >
              Search Now
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogin();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all w-full shadow-sm"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default function Home() {
  const searchParams = useSearchParams();
  const {
    currentStep,
    propertyData,
    isTransitioning,
    setCurrentStep,
    navigateToStep,
    goToResults,
    goToAutomation,
  } = useSearchStore();

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      setCurrentStep(stepParam);
    }
  }, [searchParams, setCurrentStep]);

  const handleStepChange = (step, data) => {
    navigateToStep(step, data);
  };

  const renderCurrentStep = () => {
    const pageVariants = {
      initial: {
        opacity: 0,
        y: 20,
        scale: 0.95,
      },
      in: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
        },
      },
      out: {
        opacity: 0,
        y: -20,
        scale: 1.05,
        transition: {
          duration: 0.4,
          ease: [0.4, 0, 1, 1],
        },
      },
    };

    const stepComponents = {
      landing: <LandingPage onNext={() => handleStepChange('search')} />,
      search: (
        <PropertySearch onNext={(data) => handleStepChange('results', data)} />
      ),
      results: (
        <PropertyResults
          propertyData={propertyData}
          onNext={() => handleStepChange('userinfo')}
          onBack={() => handleStepChange('search')}
        />
      ),
      userinfo: (
        <UserInformation
          onNext={(data) => handleStepChange('automation', data)}
        />
      ),
      automation: (
        <FormAutomation
          userData={propertyData}
          onNext={() => handleStepChange('documents')}
        />
      ),
      documents: <DocumentUpload onNext={() => handleStepChange('tracking')} />,
      tracking: (
        <CaseTracking
          onViewLeaderboard={() => handleStepChange('leaderboard')}
          onCreateReferral={() => handleStepChange('referral')}
        />
      ),
      leaderboard: <Leaderboard onBack={() => handleStepChange('tracking')} />,
      referral: <ReferralSystem onBack={() => handleStepChange('tracking')} />,
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
          className="w-full"
        >
          {stepComponents[currentStep] || stepComponents.landing}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <FloatingElements />
      </div>
      
      <ProgressHeader currentStep={currentStep} />
      <div className={currentStep !== 'landing' ? '' : ''}>
        {renderCurrentStep()}
      </div>
      <LoadingOverlay isTransitioning={isTransitioning} />
    </div>
  );
}