import React from 'react'
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

  return (
    <>
      {currentStep !== 'landing' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10"
        >
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-mint-green flex items-center justify-center">
                  <span className="text-xs font-bold text-navy-primary">
                    {Math.round(currentStepInfo.progress / 100 * 7)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Step {Math.round(currentStepInfo.progress / 100 * 7)}: {currentStepInfo.name}</h3>
                  <p className="text-sm text-gray-400">Your cash recovery journey</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-mint-green">
                  {currentStepInfo.progress}% Complete
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-navy-light rounded-full overflow-hidden">
              <motion.div
                className="h-full progress-bar"
                initial={{ width: 0 }}
                animate={{ width: `${currentStepInfo.progress}%` }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
        </motion.div>
      )}

    </>
  )
}

export default ProgressHeader