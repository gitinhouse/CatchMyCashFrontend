import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  { key: 'landing', name: 'Welcome', progress: 0 },
  { key: 'search', name: 'Search', progress: 15 },
  { key: 'results', name: 'Results', progress: 30 },
  { key: 'userinfo', name: 'Information', progress: 45 },
  { key: 'automation', name: 'Automation', progress: 60 },
  { key: 'documents', name: 'Documents', progress: 75 },
  { key: 'tracking', name: 'Tracking', progress: 90 },
  { key: 'leaderboard', name: 'Success', progress: 100 },
  { key: 'referral', name: 'Sharing', progress: 100 },
];

const ProgressHeader = ({ currentStep }) => {
  const currentStepInfo = steps.find(step => step.key === currentStep) || steps[0];
  
  // Calculate step number (1-8, excluding landing)
  const stepNumber = steps.findIndex(step => step.key === currentStep);
  const displayStepNumber = stepNumber > 0 ? stepNumber : 0;

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
                {/* Step Number Circle - Red themed */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FCE9E7] flex items-center justify-center flex-shrink-0">
                  <span className="text-sm sm:text-base font-bold text-[#E1261C] font-['Fraunces']">
                    {displayStepNumber}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-[#0A0A0A] text-sm sm:text-base font-['Fraunces']">
                    Step {displayStepNumber}: {currentStepInfo.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4A4A4A]">
                    Your cash recovery journey
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm sm:text-base font-semibold  font-['JetBrains_Mono']  text-[#E1261C]">
                  <span className='text-black font-["Fraunces"]'>{currentStepInfo.progress} </span>% Complete
                </div>
              </div>
            </div>
            
            {/* Progress bar - Red themed */}
            <div className="w-full h-2 bg-[#E8E6E3] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#E1261C] to-[#B11912]"
                initial={{ width: 0 }}
                animate={{ width: `${currentStepInfo.progress}%` }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default ProgressHeader;