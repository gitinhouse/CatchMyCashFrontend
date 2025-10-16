import React from 'react'
import { motion } from 'framer-motion'

const JackpotCelebration = ({showCelebration}) => {
  return (
    <>
      {showCelebration && (
             <div className="fixed inset-0 pointer-events-none z-10">
               {Array.from({ length: 20 }).map((_, i) => (
                 <motion.div
                   key={i}
                   className="absolute w-3 h-3 bg-gradient-to-br from-teal-400 to-mint-green rounded-full"
                   style={{
                     left: `${Math.random() * 100}%`,
                     top: `-10px`,
                   }}
                   animate={{
                     y: [0, typeof window !== 'undefined' ? window.innerHeight + 50 : 800],
                     x: [0, (Math.random() - 0.5) * 200],
                     rotate: [0, 360],
                     opacity: [1, 0],
                   }}
                   transition={{
                     duration: 3 + Math.random() * 2,
                     delay: Math.random() * 2,
                     ease: "easeOut"
                   }}
                 />
               ))}
             </div>
         )}
    </>
  )
}

export default JackpotCelebration