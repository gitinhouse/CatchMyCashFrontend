'use client'
import React, { useState,useEffect } from 'react';
import { motion } from 'framer-motion'; 
 
 
 const FloatingElements = () =>{ 
     const [elements, setElements] = useState([]);

    useEffect(() => {
      const newElements = Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        width: `${Math.random() * 100 + 50}px`,
        height: `${Math.random() * 100 + 50}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: i * 0.2,
        duration: 6 + i * 0.5,
      }));
      setElements(newElements);
    }, []);
    
    
    return(
    <>
        {elements.map((el) => (
          <motion.div
            key={el.id}
            className="absolute rounded-full bg-gradient-to-br from-teal-500/10 to-transparent"
            style={{
              width: el.width,
              height: el.height,
              left: el.left,
              top: el.top,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: el.animationDelay,
            }}
          />
        ))}
      </>
  );
}

export default FloatingElements

