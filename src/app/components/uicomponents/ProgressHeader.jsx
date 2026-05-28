import React from 'react';
import { motion } from 'framer-motion';

// Each step: key, name, startProgress, endProgress, totalFields (0 = no inputs, jumps straight to endProgress)
const steps = [
  {
    key: 'landing',
    name: 'Welcome',
    startProgress: 0,
    endProgress: 0,
    totalFields: 0,
  },
  {
    key: 'search',
    name: 'Search',
    startProgress: 0,
    endProgress: 15,
    totalFields: 5,
  },
  {
    key: 'results',
    name: 'Results',
    startProgress: 15,
    endProgress: 30,
    totalFields: 0,
  },
  {
    key: 'userinfo',
    name: 'Information',
    startProgress: 30,
    endProgress: 45,
    totalFields: 8,
  },
  {
    key: 'automation',
    name: 'Automation',
    startProgress: 45,
    endProgress: 60,
    totalFields: 0,
  },
  {
    key: 'documents',
    name: 'Documents',
    startProgress: 60,
    endProgress: 75,
    totalFields: 5,
  }, // 4 docs + docusign
  {
    key: 'tracking',
    name: 'Tracking',
    startProgress: 75,
    endProgress: 90,
    totalFields: 0,
  },
  {
    key: 'leaderboard',
    name: 'Success',
    startProgress: 90,
    endProgress: 100,
    totalFields: 0,
  },
  {
    key: 'referral',
    name: 'Sharing',
    startProgress: 100,
    endProgress: 100,
    totalFields: 0,
  },
];

// filledFields: how many fields are filled in the current step
const ProgressHeader = ({ currentStep, filledFields = 0 }) => {
  const stepInfo = steps.find((s) => s.key === currentStep) || steps[0];
  const stepIndex = steps.findIndex((s) => s.key === currentStep);
  const displayStepNumber = stepIndex > 0 ? stepIndex : 0;

  let progress;
  if (stepInfo.totalFields === 0) {
    // No inputs → show full endProgress for this step
    progress = stepInfo.endProgress;
  } else {
    const perField =
      (stepInfo.endProgress - stepInfo.startProgress) / stepInfo.totalFields;
    progress =
      stepInfo.startProgress +
      Math.min(filledFields, stepInfo.totalFields) * perField;
  }

  progress = Math.round(progress);

  return (
    <>
      {currentStep !== 'landing' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-99 bg-white border-b border-[#E8E6E3] shadow-md"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FCE9E7] flex items-center justify-center flex-shrink-0">
                  <span className="text-sm sm:text-base font-bold text-[#E1261C] font-['Fraunces']">
                    {displayStepNumber}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-[#0A0A0A] text-sm sm:text-base font-['Fraunces']">
                    Step {displayStepNumber}: {stepInfo.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4A4A4A]">
                    Your cash recovery journey
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm sm:text-base font-semibold font-['JetBrains_Mono'] text-[#E1261C]">
                  <span className='text-black font-["Fraunces"]'>
                    {progress}{' '}
                  </span>
                  % Complete
                </div>
              </div>
            </div>
            <div className="w-full h-2 bg-[#E8E6E3] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#E1261C] to-[#B11912]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default ProgressHeader;
