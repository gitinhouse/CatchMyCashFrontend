// 'use client';
// import React, { useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { usePathname, useSearchParams } from 'next/navigation';
// import LandingPage from './components/LandingPage';
// import FloatingElements from './components/uicomponents/FloatingElements';
// import PropertySearch from './components/PropertySearch';
// import ProgressHeader from './components/uicomponents/ProgressHeader';
// import LoadingOverlay from './components/uicomponents/LoadingOverlay';
// import PropertyResults from './components/PropertyResults';
// import UserInformation from './components/UserInformation';
// import FormAutomation from './components/FormAutomation';
// import DocumentUpload from './components/DocumentUpload';
// import CaseTracking from './components/CaseTracking';
// import ReferralSystem from './components/ReferralSystem';
// import Leaderboard from './components/Leaderboared';
// import { useRouter } from 'next/navigation';
// import { useSearchStore } from './store/searchStore';

// // Last resort against a push that never commits at all (dropped payload, a tab
// // that went offline), not a load budget: on a throttled connection the landing
// // payload plus this chunk can legitimately take tens of seconds, and the loader
// // has to stay up for all of it.

// export default function Home() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const {
//     currentStep,
//     propertyData,
//     isTransitioning,
//     setCurrentStep,
//     setStepReady,
//     setUserLogin,
//     navigateToStep,
//     goToResults,
//     goToAutomation,
//   } = useSearchStore();

//   const [filledFields, setFilledFields] = React.useState(0);
//   const [activeReferralCode, setActiveReferralCode] = React.useState('');
//   const hasRestoredSession = React.useRef(false);

//   useEffect(() => {
//     setFilledFields(0);
//   }, [currentStep]);

//   useEffect(() => {
//     if (!activeReferralCode) {
//       const saved = localStorage.getItem('activeReferralCode');
//       if (saved) setActiveReferralCode(saved);
//     }
//   }, [activeReferralCode]);

//   // The server renders this page, and it has no persisted store to read, so
//   // until the store has been pointed at the URL the step comes from the URL
//   // alone. Reading the persisted step on the first client render would not match
//   // the server's HTML.
//   const urlStep = searchParams.get('step') || 'landing';
//   const [storeSynced, setStoreSynced] = React.useState(false);
//   const step = storeSynced ? currentStep : urlStep;
//   // Only the landing page is drawn before then. The later steps read the claim
//   // the visitor has in progress, which only exists in this browser, so drawing
//   // them on the server would draw them empty.
//   const renderedStep = storeSynced || urlStep === 'landing' ? step : null;

//   // Restore login session after browser reload and send returning users to documents

//   useEffect(() => {
//     const stepParam = searchParams.get('step');
//     if (stepParam) {
//       setCurrentStep(stepParam);
//     } else {
//       // If no step parameter, ensure we're on the landing page
//       setCurrentStep('landing');
//     }
//     setStoreSynced(true);
//   }, [searchParams, setCurrentStep]);

//   // The landing page is painted by the server and skips its entrance animation
//   // (see the step wrapper below), so there is no animation end to report that
//   // it is on screen. It already is.
//   useEffect(() => {
//     if (urlStep === 'landing') setStepReady(true);
//     // Only the step the page was opened on; later steps report themselves.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);


//   const handleStepChange = (step, data) => {
//     // If navigating to landing, clear the URL
//     if (step === 'landing') {
//       router.push('/', { scroll: false });
//       setCurrentStep('landing');
//       return;
//     }

//     // For other steps, update URL with step parameter
//     const params = new URLSearchParams(window.location.search);
//     params.set('step', step);
//     router.push(`?${params.toString()}`, { scroll: false });

//     // Use the store's navigation
//     navigateToStep(step, data);
//   };


//   const renderCurrentStep = () => {
//     const pageVariants = {
//       initial: {
//         opacity: 0,
//         y: 20,
//         scale: 0.95,
//       },
//       in: {
//         opacity: 1,
//         y: 0,
//         scale: 1,
//         transition: {
//           duration: 0.6,
//           ease: [0.16, 1, 0.3, 1],
//         },
//       },
//       out: {
//         opacity: 0,
//         y: -20,
//         scale: 1.05,
//         transition: {
//           duration: 0.4,
//           ease: [0.4, 0, 1, 1],
//         },
//       },
//     };

//     const stepComponents = {
//       landing: <LandingPage onNext={() => handleStepChange('search')} />,
//       search: (
//         <PropertySearch
//           onNext={(data) => handleStepChange('results', data)}
//           onBack={() => handleStepChange('landing')}
//           onFieldFilled={setFilledFields}
//         />
//       ),
//       results: (
//         <PropertyResults
//           propertyData={propertyData}
//           onNext={() => handleStepChange('userinfo')}
//           onBack={() => handleStepChange('search')}
//         />
//       ),
//       userinfo: (
//         <UserInformation
//           onNext={(data) => handleStepChange('automation', data)}
//           onFieldFilled={setFilledFields}
//           onBack={() => handleStepChange('results')}
//         />
//       ),
//       automation: (
//         <FormAutomation
//           userData={propertyData}
//           onNext={() => handleStepChange('documents')}
//         />
//       ),
//       documents: (
//         <DocumentUpload
//           onNext={() => handleStepChange('tracking')}
//           onFieldFilled={setFilledFields}
//         />
//       ),
//       tracking: (
//         <CaseTracking
//           onViewLeaderboard={() => handleStepChange('leaderboard')}
//           onCreateReferral={(code) => {           // ← CHANGE: capture the code
//             setActiveReferralCode(code);
//             localStorage.setItem('activeReferralCode', code);
//             handleStepChange('referral');
//           }}
//         />
//       ),
//       leaderboard: <Leaderboard onBack={() => handleStepChange('tracking')} />,
//       referral: (
//         <ReferralSystem
//           referralCode={activeReferralCode}        // ← CHANGE: pass it down
//           onBack={() => handleStepChange('tracking')}
//         />
//       ),
//     };

//     return (
//       <AnimatePresence mode="wait">
//         <motion.div
//           key={renderedStep ?? 'pending'}
//           variants={pageVariants}
//           // The step on screen when the page opens is already there, painted by
//           // the server, and fading it in from nothing would only hold back the
//           // first paint. Steps mounted after that still animate in. Set here
//           // rather than as initial={false} on AnimatePresence, which would also
//           // switch off every entrance animation inside the step.
//           initial={storeSynced ? 'initial' : false}
//           animate="in"
//           // The blank stand-in for a step that is not drawn yet has nothing to
//           // fade out, and no reason to hold the step back while it does.
//           exit={renderedStep ? 'out' : undefined}
//           onAnimationComplete={() => {
//             // The step leaving the screen reports completion here too, and it
//             // reports it first; only the step that is still the current one has
//             // finished animating in and is what the user is looking at.
//             if (renderedStep && useSearchStore.getState().currentStep === renderedStep) {
//               setStepReady(true);
//             }
//           }}
//           className={renderedStep ? 'w-full' : 'w-full min-h-screen'}
//         >
//           {renderedStep ? stepComponents[renderedStep] || stepComponents.landing : null}
//         </motion.div>
//       </AnimatePresence>
//     );
//   };

//   return (
//     <div className="min-h-screen relative overflow-hidden">
//       <div className="absolute inset-0 pointer-events-none">
//         <FloatingElements />
//       </div>

//       <ProgressHeader currentStep={step} filledFields={filledFields} />

//       <div>
//         {renderCurrentStep()}
//       </div>
//       <LoadingOverlay isTransitioning={isTransitioning} />
//     </div>
//   );
// }




'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

import LandingPage from './components/LandingPage';
import FloatingElements from './components/uicomponents/FloatingElements';
import ProgressHeader from './components/uicomponents/ProgressHeader';
import LoadingOverlay from './components/uicomponents/LoadingOverlay';

import { useSearchStore } from './store/searchStore';

// Lazy-load workflow components.
// These components are downloaded only when their corresponding
// workflow step is rendered, reducing the initial JavaScript bundle.

const PropertySearch = dynamic(
  () => import('./components/PropertySearch')
);

const PropertyResults = dynamic(
  () => import('./components/PropertyResults')
);

const UserInformation = dynamic(
  () => import('./components/UserInformation')
);

const FormAutomation = dynamic(
  () => import('./components/FormAutomation')
);

const DocumentUpload = dynamic(
  () => import('./components/DocumentUpload')
);

const CaseTracking = dynamic(
  () => import('./components/CaseTracking')
);

const ReferralSystem = dynamic(
  () => import('./components/ReferralSystem')
);

const Leaderboard = dynamic(
  () => import('./components/Leaderboared')
);

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    currentStep,
    propertyData,
    isTransitioning,
    setCurrentStep,
    setStepReady,
    navigateToStep,
  } = useSearchStore();

  const [filledFields, setFilledFields] = React.useState(0);
  const [activeReferralCode, setActiveReferralCode] = React.useState('');

  const [storeSynced, setStoreSynced] = React.useState(false);

  const hasRestoredSession = React.useRef(false);

  // Reset completed fields when the visitor changes workflow steps.
  useEffect(() => {
    setFilledFields(0);
  }, [currentStep]);

  // Restore the referral code saved in the browser.
  useEffect(() => {
    if (!activeReferralCode) {
      const saved = localStorage.getItem('activeReferralCode');

      if (saved) {
        setActiveReferralCode(saved);
      }
    }
  }, [activeReferralCode]);

  // Read the initial step from the URL.
  // Until Zustand is synchronized, use the URL step to avoid
  // rendering a different step from the server-rendered HTML.
  const urlStep = searchParams.get('step') || 'landing';

  const step = storeSynced ? currentStep : urlStep;

  // Only render the landing page before the browser store is synchronized.
  // Other workflow steps may depend on claim data stored in the browser.
  const renderedStep =
    storeSynced || urlStep === 'landing' ? step : null;

  // Synchronize the URL with the Zustand store after mounting.
  useEffect(() => {
    const stepParam = searchParams.get('step');

    if (stepParam) {
      setCurrentStep(stepParam);
    } else {
      setCurrentStep('landing');
    }

    setStoreSynced(true);
  }, [searchParams, setCurrentStep]);

  // The landing page is already rendered by the server.
  // Mark it ready without waiting for an entrance animation.
  useEffect(() => {
    if (urlStep === 'landing') {
      setStepReady(true);
    }

    // Only the initially requested step is handled here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle navigation between workflow steps.
  const handleStepChange = (step, data) => {
    // Return to the landing page and clear the step parameter.
    if (step === 'landing') {
      router.push('/', { scroll: false });
      setCurrentStep('landing');
      return;
    }

    // Preserve existing URL parameters while updating the step.
    const params = new URLSearchParams(window.location.search);
    params.set('step', step);

    router.push(`?${params.toString()}`, {
      scroll: false,
    });

    // Update the existing Zustand workflow state.
    navigateToStep(step, data);
  };

  // Render the currently selected workflow step.
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

    // Keep the existing workflow and callbacks unchanged.
    const stepComponents = {
      landing: (
        <LandingPage
          onNext={() => handleStepChange('search')}
        />
      ),

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
          onCreateReferral={(code) => {
            setActiveReferralCode(code);
            localStorage.setItem('activeReferralCode', code);

            handleStepChange('referral');
          }}
        />
      ),

      leaderboard: (
        <Leaderboard
          onBack={() => handleStepChange('tracking')}
        />
      ),

      referral: (
        <ReferralSystem
          referralCode={activeReferralCode}
          onBack={() => handleStepChange('tracking')}
        />
      ),
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={renderedStep ?? 'pending'}
          variants={pageVariants}

          // Do not delay the initial server-rendered landing page.
          // Subsequent workflow steps retain their entrance animation.
          initial={storeSynced ? 'initial' : false}
          animate="in"

          // Only animate out when a real step is being displayed.
          exit={renderedStep ? 'out' : undefined}

          onAnimationComplete={() => {
            // Only mark the currently visible step as ready.
            if (
              renderedStep &&
              useSearchStore.getState().currentStep === renderedStep
            ) {
              setStepReady(true);
            }
          }}

          className={
            renderedStep
              ? 'w-full'
              : 'w-full min-h-screen'
          }
        >
          {renderedStep
            ? stepComponents[renderedStep] || stepComponents.landing
            : null}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingElements />
      </div>

      {/* Workflow progress indicator */}
      <ProgressHeader
        currentStep={step}
        filledFields={filledFields}
      />

      {/* Current workflow page */}
      <div>
        {renderCurrentStep()}
      </div>

      {/* Existing navigation/loading overlay */}
      <LoadingOverlay
        isTransitioning={isTransitioning}
      />

    </div>
  );
}
