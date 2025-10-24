"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import LandingPage from "./components/LandingPage";
import FloatingElements from "./components/uicomponents/FloatingElements";
import PropertySearch from "./components/PropertySearch";
import ProgressHeader from "./components/uicomponents/ProgressHeader";
import LoadingOverlay from "./components/uicomponents/LoadingOverlay";
import PropertyResults from "./components/PropertyResults";
import UserInformation from "./components/UserInformation";
import FormAutomation from "./components/FormAutomation";
import DocumentUpload from "./components/DocumentUpload";
import CaseTracking from "./components/CaseTracking";
import ReferralSystem from "./components/ReferralSystem";
import Leaderboard from "./components/Leaderboared";

export default function Home() {
  const [currentStep, setCurrentStep] = useState("landing");
  const [userData, setUserData] = useState({});
  const [propertyData, setPropertyData] = useState(null);
  const [referralCode, setReferralCode] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam) {
      setCurrentStep(stepParam); // jump to step 5 (documents)
    }
  }, [searchParams]);

  const handleStepChange = (step, data) => {
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentStep(step);
      if (data) {
        if (step === "results") {
          setPropertyData(data);
        } else if (step === "automation") {
          setUserData(data);
        }
      }
      setIsTransitioning(false);
      window.scrollTo(0, 0);
    }, 300);
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
      landing: <LandingPage onNext={() => handleStepChange("search")} />,
      search: (
        <PropertySearch onNext={(data) => handleStepChange("results", data)} />
      ),
      results: (
        <PropertyResults
          propertyData={propertyData}
          onNext={() => handleStepChange("userinfo")}
        />
      ),
      userinfo: (
        <UserInformation
          onNext={(data) => handleStepChange("automation", data)}
        />
      ),
      automation: (
        <FormAutomation
          userData={userData}
          onNext={() => handleStepChange("documents")}
        />
      ),
      documents: <DocumentUpload onNext={() => handleStepChange("tracking")} />,
      tracking: (
        <CaseTracking
          onViewLeaderboard={() => handleStepChange("leaderboard")}
          onCreateReferral={() => handleStepChange("referral")}
        />
      ),
      leaderboard: <Leaderboard onBack={() => handleStepChange("tracking")} />,
      referral: <ReferralSystem onBack={() => handleStepChange("tracking")} />,
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
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B2A] via-[#1a2332] to-[#0D1B2A] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <FloatingElements />
      </div>
      <ProgressHeader currentStep={currentStep} />
      <div className={currentStep !== "landing" ? "pt-24" : ""}>
        {renderCurrentStep()}
      </div>
      <LoadingOverlay isTransitioning={isTransitioning} />
    </div>
  );
}
