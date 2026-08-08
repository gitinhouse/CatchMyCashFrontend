import React from 'react'
import { motion , AnimatePresence } from 'framer-motion'
const LoadingOverlay = ({isTransitioning}) => {
  return (
    <>  
    <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-primary/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="glass-card p-8 rounded-xl flex flex-col items-center gap-4">
              <div className="loading-spinner w-12 h-12"></div>
              <p className="text-lg font-semibold text-[#b89b9b]">Securing your next step...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
  )
}

export default LoadingOverlay