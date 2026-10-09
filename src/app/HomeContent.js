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
import { Loader2, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchStore } from './store/searchStore';
import { clearClientSession } from './lib/session';
import NotificationBell from './components/NotificationBell';
import BrandLogo from './components/uicomponents/BrandLogo';

// Last resort against a push that never commits at all (dropped payload, a tab
// that went offline), not a load budget: on a throttled connection the landing
// payload plus this chunk can legitimately take tens of seconds, and the loader
// has to stay up for all of it.
const SEARCH_NAV_TIMEOUT_MS = 45000;

export const SiteHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { resetAll, currentStep, stepReady, setStepReady } = useSearchStore();

  // Raised synchronously on click so the loader paints on the first frame after
  // it, instead of the page looking dead until the route commits.
  const [isOpeningSearch, setIsOpeningSearch] = React.useState(false);
  const searchNavTimer = React.useRef(null);
  // Route the push started from, so "still waiting for it" can be told apart
  // from "the user went somewhere else instead".
  const searchNavOrigin = React.useRef(null);

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
    window.addEventListener('authChange', checkLoginStatus); // ← ADD this line

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('authChange', checkLoginStatus); // ← ADD this line
    };
  }, [pathname]); // ← CHANGE: was [], now re-checks on every route change

  const handleLogin = async () => {
    router.push('/userLogin');
  };

  const handleDashboard = async () => {
    router.push('/myAccount');
  };

  const handleLogout = () => {
    clearClientSession();
    resetAll();
    setIsLoggedIn(false);
    setUserName('');
    router.push('/');
  };

  const stopOpeningSearch = React.useCallback(() => {
    if (searchNavTimer.current) {
      clearTimeout(searchNavTimer.current);
      searchNavTimer.current = null;
    }
    setIsOpeningSearch(false);
  }, []);

  // currentStep stands in for the search params here because this header renders
  // in the root layout, where useSearchParams() would need a Suspense boundary
  // and would otherwise fail the build on every statically prerendered page.
  React.useEffect(() => {
    if (!isOpeningSearch) return;

    // currentStep flips the instant the URL commits, but Home swaps steps inside
    // AnimatePresence mode="wait": the old step still has 0.4s of exit and the new
    // one 0.6s of enter to play. stepReady is the step that is genuinely on screen.
    const searchStepOnScreen =
      pathname === '/' && currentStep === 'search' && stepReady;

    // Browser Back out of the pending push, or any other navigation, leaves this
    // as a full-screen click blocker over a page it was never meant to cover: off
    // '/' as soon as the route is no longer the one we started from, and on '/'
    // as soon as some other step has settled there.
    const navigationAbandoned =
      pathname === '/'
        ? stepReady && currentStep !== 'search'
        : pathname !== searchNavOrigin.current;

    if (!searchStepOnScreen && !navigationAbandoned) return;

    stopOpeningSearch();
  }, [isOpeningSearch, pathname, currentStep, stepReady, stopOpeningSearch]);

  // Back or Forward while the push is in flight gives up on it. Coming back out to
  // the route the click started from looks identical to never having left, so the
  // pathname alone cannot catch this one.
  React.useEffect(() => {
    if (!isOpeningSearch) return;

    window.addEventListener('popstate', stopOpeningSearch);
    return () => window.removeEventListener('popstate', stopOpeningSearch);
  }, [isOpeningSearch, stopOpeningSearch]);

  React.useEffect(() => {
    return () => {
      if (searchNavTimer.current) clearTimeout(searchNavTimer.current);
    };
  }, []);

  const handleSearchNow = () => {
    if (isOpeningSearch) return;

    const params = new URLSearchParams(window.location.search);

    // Already on the search step: there is no navigation to cover, and pushing
    // would only rewrite the query string we are already sitting on.
    if (pathname === '/' && params.get('step') === 'search') return;

    // Readiness left over from an earlier visit to a step would otherwise take the
    // overlay down on the frame the URL commits, before the step is drawn.
    setStepReady(false);
    searchNavOrigin.current = pathname;
    setIsOpeningSearch(true);
    if (searchNavTimer.current) clearTimeout(searchNavTimer.current);
    searchNavTimer.current = setTimeout(() => {
      searchNavTimer.current = null;
      setIsOpeningSearch(false);
    }, SEARCH_NAV_TIMEOUT_MS);

    // Carry the rest of the query string over (referral and utm codes), the way
    // Home's own step navigation does.
    params.set('step', 'search');
    router.push(`/?${params.toString()}`);
  };

  const navItems = [
    { name: 'About', path: '/about' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Track Claim', path: '/track-claim' },
    { name: 'Privacy', path: '/privacy' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  // The admin console renders its own chrome.
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-[#E8E6E3] shadow-sm">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
          <BrandLogo />

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
              {isLoggedIn && (<NotificationBell />)}

              {/* aria rather than the native disabled attribute: disabling the
                  button the user just pressed drops keyboard focus to <body> for
                  the whole navigation, and the handler already ignores a second
                  press. */}
              <button
                onClick={handleSearchNow}
                aria-busy={isOpeningSearch}
                aria-disabled={isOpeningSearch}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 lg:px-5 lg:py-3 bg-[#E1261C] text-white text-xs lg:text-sm font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm hover:shadow-md whitespace-nowrap aria-disabled:opacity-70 aria-disabled:cursor-wait"
              >
                {isOpeningSearch && <Loader2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 animate-spin" />}
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
              {/* No busy state on this one: closing the menu and opening the
                  search batch into a single commit, so this subtree is gone before
                  it could render one. The overlay is what the mobile user sees. */}
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

      {/* Owned by the header rather than by Home: Home is unmounted on routes
          like /faq, so its overlay cannot cover a cross-route Search Now. */}
      <LoadingOverlay
        isTransitioning={isOpeningSearch}
        message="Opening your property search..."
      />
    </>
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