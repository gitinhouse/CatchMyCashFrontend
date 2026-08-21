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
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchStore } from './store/searchStore';

export const SiteHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { goToSearch } = useSearchStore();
  
  // 🔹 ADD: Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userName, setUserName] = React.useState('');

  // 🔹 ADD: Check login status on mount and when localStorage changes
  React.useEffect(() => {
    const checkLoginStatus = () => {
      try {
        const storedLoginRaw = localStorage.getItem('userLogin');
        if (storedLoginRaw) {
          const storedLogin = JSON.parse(storedLoginRaw);
          if (storedLogin?.token && storedLogin?.user) {
            setIsLoggedIn(true);
            setUserName(storedLogin.user.first_name || storedLogin.user.email || 'User');
          } else {
            setIsLoggedIn(false);
            setUserName('');
          }
        } else {
          setIsLoggedIn(false);
          setUserName('');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
        setUserName('');
      }
    };

    checkLoginStatus();

    // Listen for storage changes (in case user logs in/out in another tab)
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  const handleLogin = async () => {
    router.push('/userLogin');
  };

  const handleDashboard = async () => {
    router.push('/myAccount');
  };

  const handleLogout = () => {
    localStorage.removeItem('userLogin');
    setIsLoggedIn(false);
    setUserName('');
    router.push('/');
  };

  const handleSearchNow = () => {
    router.push('/?step=search');
  };

  const navItems = [
    { name: 'About', path: '/about' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Privacy', path: '/privacy' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E8E6E3] shadow-sm">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="font-['Fraunces'] font-black text-lg md:text-xl lg:text-[22px] tracking-[-0.02em] flex items-center gap-2 text-black shrink-0"
        >
          <span className="w-2.5 h-2.5 bg-[#E1261C] rounded-full inline-block"></span>
          CatchMyCash
        </Link>

        {/* Desktop Navigation — visible from md (tablet) up */}
        <nav className="hidden md:flex items-center gap-2.5 lg:gap-6 xl:gap-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`text-xs lg:text-sm font-medium whitespace-nowrap transition-colors ${pathname === item.path
                  ? 'text-[#0A0A0A]'
                  : 'text-[#4A4A4A] hover:text-[#0A0A0A]'
                }`}
            >
              {item.name}
            </Link>
          ))}

          <div className="flex items-center gap-1.5 lg:gap-3">
            <button
              onClick={handleSearchNow}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 lg:px-5 lg:py-3 bg-[#E1261C] text-white text-xs lg:text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
            >
              Search Now
            </button>
            
            {/* 🔹 MODIFIED: Conditional rendering for Login/Dashboard */}
            {isLoggedIn ? (
              <>
                <button
                  onClick={handleDashboard}
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 lg:px-5 lg:py-3 bg-[#E1261C] text-white text-xs lg:text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  My Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 lg:px-5 lg:py-3 border border-[#E1261C] text-[#E1261C] text-xs lg:text-sm font-semibold rounded-lg hover:bg-[#FCE9E7] transition-all whitespace-nowrap"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 lg:px-5 lg:py-3 bg-[#E1261C] text-white text-xs lg:text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
              >
                Login
              </button>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button — only below md (phones only) */}
        <button
          className="md:hidden p-2 shrink-0"
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
            
            {/* 🔹 MODIFIED: Conditional rendering for Login/Dashboard in mobile */}
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleDashboard();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all w-full shadow-sm"
                >
                  My Dashboard
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-[#E1261C] text-[#E1261C] text-sm font-semibold rounded-lg hover:bg-[#FCE9E7] transition-all w-full"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogin();
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#E1261C] text-white text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all w-full shadow-sm"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    currentStep,
    propertyData,
    isTransitioning,
    setCurrentStep,
    setUserLogin,
    navigateToStep,
    goToResults,
    goToAutomation,
  } = useSearchStore();

  const [filledFields, setFilledFields] = React.useState(0);
  const hasRestoredSession = React.useRef(false);

  useEffect(() => {
    setFilledFields(0);
  }, [currentStep]);

  // Restore login session after browser reload and send returning users to documents
  useEffect(() => {
    if (hasRestoredSession.current) return;
    hasRestoredSession.current = true;

    try {
      const savedLoginRaw = localStorage.getItem('userLogin');
      if (!savedLoginRaw) return;

      const savedLogin = JSON.parse(savedLoginRaw);
      if (!savedLogin?.token || !savedLogin?.user) return;

      setUserLogin(savedLogin);

      // Returning end-users (logged in via /userLogin) skip re-login
      const isReturningUser =
        savedLogin.user.type === 'User' &&
        savedLogin.user.user_type === 'Old';

      if (!isReturningUser) return;

      const stepParam = searchParams.get('step');
      const allowedSteps = [
        'documents',
        'tracking',
        'leaderboard',
        'referral',
      ];

      if (!stepParam || !allowedSteps.includes(stepParam)) {
        // Don't blindly bounce to documents — check whether this user
        // has already completed doc collection & signing. If so, send
        // them to tracking instead so a reload after completion doesn't
        // put them back through the steps flow.
        let destination = 'documents';
        try {
          const savedAllDocs = JSON.parse(
            localStorage.getItem('userAllDocs') || 'null',
          );
          const savedCase = JSON.parse(
            localStorage.getItem('userCase') || 'null',
          );

          const isInvestigatorSigned =
            typeof savedAllDocs?.signed_doc === 'string' &&
            savedAllDocs.signed_doc.includes('signed-document');

          const hasFilledAgreement = Boolean(
            savedAllDocs?.filled_agreement_doc ||
            (typeof savedAllDocs?.signed_doc === 'string' &&
              savedAllDocs.signed_doc.includes('FilledAgreement_form')),
          );

          const hasRequiredUploads = Boolean(
            savedAllDocs?.proof_id &&
            savedAllDocs?.ssn_id &&
            savedAllDocs?.adress_proof,
          );

          const docsComplete =
            hasRequiredUploads && hasFilledAgreement && isInvestigatorSigned;

          // Also treat an already-submitted/queued case as "done with steps"
          const caseSubmitted =
            savedCase?.claim_process_task_status &&
            !['', null, 'queued', 'failed', 'Failed'].includes(
              savedCase.claim_process_task_status,
            );

          if (docsComplete || caseSubmitted) {
            destination = 'tracking';
          }
        } catch (error) {
          console.error('Failed to evaluate saved completion state:', error);
        }

        router.replace(`/?step=${destination}`);
        return;
      }

      setCurrentStep(stepParam);
    } catch (error) {
      console.error('Failed to restore login session:', error);
    }
  }, [router, searchParams, setCurrentStep, setUserLogin]);

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      setCurrentStep(stepParam);
    } else {
      // If no step parameter, ensure we're on the landing page
      setCurrentStep('landing');
    }
  }, [searchParams, setCurrentStep]);


  const handleStepChange = (step, data) => {
    // If navigating to landing, clear the URL
    if (step === 'landing') {
      router.push('/', { scroll: false });
      setCurrentStep('landing');
      return;
    }

    // For other steps, update URL with step parameter
    const params = new URLSearchParams(window.location.search);
    params.set('step', step);
    router.push(`?${params.toString()}`, { scroll: false });

    // Use the store's navigation
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
        <PropertySearch
          onNext={(data) => handleStepChange('results', data)}
          onBack={() => handleStepChange('landing')}
          onFieldFilled={setFilledFields}
        />
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
          onFieldFilled={setFilledFields}
          onBack={() => handleStepChange('results')}
        />
      ),
      automation: (
        <FormAutomation
          userData={propertyData}
          onNext={() => handleStepChange('documents')}
        />
      ),
      documents: (
        <DocumentUpload
          onNext={() => handleStepChange('tracking')}
          onFieldFilled={setFilledFields}
        />
      ),
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

      <ProgressHeader currentStep={currentStep} filledFields={filledFields} />

      <div className={currentStep !== 'landing' ? '' : ''}>
        {renderCurrentStep()}
      </div>
      <LoadingOverlay isTransitioning={isTransitioning} />
    </div>
  );
}