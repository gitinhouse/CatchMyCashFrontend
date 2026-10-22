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
import { useSearchStore } from './store/searchStore';

// Last resort against a push that never commits at all (dropped payload, a tab
// that went offline), not a load budget: on a throttled connection the landing
// payload plus this chunk can legitimately take tens of seconds, and the loader
// has to stay up for all of it.

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    currentStep,
    propertyData,
    isTransitioning,
    setCurrentStep,
    setStepReady,
    setUserLogin,
    navigateToStep,
    goToResults,
    goToAutomation,
  } = useSearchStore();

  const [filledFields, setFilledFields] = React.useState(0);
  const [activeReferralCode, setActiveReferralCode] = React.useState('');
  const hasRestoredSession = React.useRef(false);

  useEffect(() => {
    setFilledFields(0);
  }, [currentStep]);

  useEffect(() => {
    if (!activeReferralCode) {
      const saved = localStorage.getItem('activeReferralCode');
      if (saved) setActiveReferralCode(saved);
    }
  }, [activeReferralCode]);

  // The server renders this page, and it has no persisted store to read, so
  // until the store has been pointed at the URL the step comes from the URL
  // alone. Reading the persisted step on the first client render would not match
  // the server's HTML.
  const urlStep = searchParams.get('step') || 'landing';
  const [storeSynced, setStoreSynced] = React.useState(false);
  const step = storeSynced ? currentStep : urlStep;
  // Only the landing page is drawn before then. The later steps read the claim
  // the visitor has in progress, which only exists in this browser, so drawing
  // them on the server would draw them empty.
  const renderedStep = storeSynced || urlStep === 'landing' ? step : null;

  // Restore login session after browser reload and send returning users to documents

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      setCurrentStep(stepParam);
    } else {
      // If no step parameter, ensure we're on the landing page
      setCurrentStep('landing');
    }
    setStoreSynced(true);
  }, [searchParams, setCurrentStep]);

  // The landing page is painted by the server and skips its entrance animation
  // (see the step wrapper below), so there is no animation end to report that
  // it is on screen. It already is.
  useEffect(() => {
    if (urlStep === 'landing') setStepReady(true);
    // Only the step the page was opened on; later steps report themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
          onCreateReferral={(code) => {           // ← CHANGE: capture the code
            setActiveReferralCode(code);
            localStorage.setItem('activeReferralCode', code);
            handleStepChange('referral');
          }}
        />
      ),
      leaderboard: <Leaderboard onBack={() => handleStepChange('tracking')} />,
      referral: (
        <ReferralSystem
          referralCode={activeReferralCode}        // ← CHANGE: pass it down
          onBack={() => handleStepChange('tracking')}
        />
      ),
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={renderedStep ?? 'pending'}
          variants={pageVariants}
          // The step on screen when the page opens is already there, painted by
          // the server, and fading it in from nothing would only hold back the
          // first paint. Steps mounted after that still animate in. Set here
          // rather than as initial={false} on AnimatePresence, which would also
          // switch off every entrance animation inside the step.
          initial={storeSynced ? 'initial' : false}
          animate="in"
          // The blank stand-in for a step that is not drawn yet has nothing to
          // fade out, and no reason to hold the step back while it does.
          exit={renderedStep ? 'out' : undefined}
          onAnimationComplete={() => {
            // The step leaving the screen reports completion here too, and it
            // reports it first; only the step that is still the current one has
            // finished animating in and is what the user is looking at.
            if (renderedStep && useSearchStore.getState().currentStep === renderedStep) {
              setStepReady(true);
            }
          }}
          className={renderedStep ? 'w-full' : 'w-full min-h-screen'}
        >
          {renderedStep ? stepComponents[renderedStep] || stepComponents.landing : null}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <FloatingElements />
      </div>

      <ProgressHeader currentStep={step} filledFields={filledFields} />

      <div>
        {renderCurrentStep()}
      </div>
      <LoadingOverlay isTransitioning={isTransitioning} />
    </div>
  );
}