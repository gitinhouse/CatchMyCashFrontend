import React from 'react'
import { motion , AnimatePresence } from 'framer-motion'
const LoadingOverlay = ({isTransitioning, message = 'Securing your next step...'}) => {
  return (
    <>  
    <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Framer's default tween is slow enough that the overlay is still
            // half transparent a frame or two in, which reads as a stutter on the
            // click rather than as an immediate response.
            transition={{ duration: 0.12, ease: 'linear' }}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            // Above ProgressHeader (z-[200]) and the cookie banner (z-[70]), which
            // would otherwise paint through the loader and stay clickable.
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center"
          >
            <div className="glass-card p-8 rounded-xl flex flex-col items-center gap-4">
              <div className="loading-spinner w-12 h-12"></div>
              <p className="text-lg font-semibold text-[#0A0A0A]">{message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
  )
}

export default LoadingOverlay