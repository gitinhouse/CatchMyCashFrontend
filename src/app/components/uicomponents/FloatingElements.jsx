// 'use client'
// import React, { useState,useEffect } from 'react';
// import { motion } from 'framer-motion'; 
 
 
//  const FloatingElements = () =>{ 
//      const [elements, setElements] = useState([]);

//     useEffect(() => {
//       const newElements = Array.from({ length: 8 }).map((_, i) => ({
//         id: i,
//         width: `${Math.random() * 100 + 50}px`,
//         height: `${Math.random() * 100 + 50}px`,
//         left: `${Math.random() * 100}%`,
//         top: `${Math.random() * 100}%`,
//         animationDelay: i * 0.2,
//         duration: 6 + i * 0.5,
//       }));
//       setElements(newElements);
//     }, []);
    
    
//     return(
//     <>
//         {elements.map((el) => (
//           <motion.div
//             key={el.id}
//             className="absolute rounded-full bg-gradient-to-br from-teal-500/10 to-transparent"
//             style={{
//               width: el.width,
//               height: el.height,
//               left: el.left,
//               top: el.top,
//             }}
//             animate={{
//               y: [-20, 20, -20],
//               opacity: [0.3, 0.6, 0.3],
//               scale: [1, 1.1, 1],
//             }}
//             transition={{
//               duration: el.duration,
//               repeat: Infinity,
//               ease: "easeInOut",
//               delay: el.animationDelay,
//             }}
//           />
//         ))}
//       </>
//   );
// }

// export default FloatingElements


'use client';

const elements = [
  { width: 100, left: '8%', top: '12%', delay: '0s' },
  { width: 150, left: '76%', top: '18%', delay: '1s' },
  { width: 80, left: '45%', top: '38%', delay: '2s' },
  { width: 130, left: '15%', top: '58%', delay: '3s' },
  { width: 110, left: '82%', top: '64%', delay: '1.5s' },
  { width: 90, left: '55%', top: '78%', delay: '2.5s' },
  { width: 140, left: '35%', top: '88%', delay: '0.5s' },
  { width: 70, left: '92%', top: '42%', delay: '3.5s' },
];

export default function FloatingElements() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {elements.map((element, index) => (
        <div
          key={index}
          className="floating-decoration absolute rounded-full
                     bg-gradient-to-br from-teal-500/10 to-transparent"
          style={{
            width: element.width,
            height: element.width,
            left: element.left,
            top: element.top,
            animationDelay: element.delay,
          }}
        />
      ))}
    </div>
  );
}
