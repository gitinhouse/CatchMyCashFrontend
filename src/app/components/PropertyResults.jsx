'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, DollarSign, Calendar, Building, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import JackpotCelebration from './uicomponents/JackpotCelebration';
import { Card } from './uicomponents/Card';
import { Button } from './uicomponents/Button';
import { Badge } from './uicomponents/Badge';


const infoArray = [
                "Provide your information for our investigator agreement",
                "We automatically prepare and submit all required forms", 
                "Upload supporting documents through our secure portal",
                "We build your case and submit to the State Controller's Office",
                "You receive your money (typically 30-60 days)"
              ]

const PropertyResults = ({ propertyData, onNext }) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [animatedAmount, setAnimatedAmount] = useState(0);
  
  const totalAmount = parseFloat(propertyData.totalAmount.replace('$', '').replace(',', ''));
  const commission = (totalAmount * 0.1).toFixed(2);
  const netAmount = (totalAmount * 0.9).toFixed(2);

  useEffect(() => {
   
    setShowCelebration(true);
    
    
    const duration = 2000;
    const steps = 60;
    const increment = totalAmount / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= totalAmount) {
        setAnimatedAmount(totalAmount);
        clearInterval(timer);
      } else {
        setAnimatedAmount(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalAmount]);

  return (
    <div className="min-h-screen relative">
       
       <JackpotCelebration showCelebration={showCelebration}/>
     

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 10
            }}
            className="relative inline-block mb-6"
          >
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400/30 to-mint-green/30 blur-xl"
            />
            <CheckCircle className="h-20 w-20 text-teal-400 relative z-10" />
          </motion.div>
          
          <motion.h2 
            className="text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
           <span className='text-orange-300'>🎉</span>  Jackpot, {propertyData.name.split(' ')[0]}!
          </motion.h2>
          
          <motion.div 
            className="text-xl text-gray-300 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            We found <span className="text-teal-400 font-semibold">{propertyData.properties.length} unclaimed properties</span> in your name
          </motion.div>
          
          {/* Animated Amount Display */}
          <motion.div 
            className="glass-card-teal border border-teal-500/30 rounded-xl p-8 mb-8 relative overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {/* Animated background glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-mint-green/20"
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            <div className="relative z-10">
              <motion.div 
                className="flex items-center justify-center mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div>
                  <DollarSign className="h-10 w-10 text-teal-400 mr-3" />
                </motion.div>
                <div className="text-center">
                  <div className="text-lg text-teal-200 mb-1">Total Found</div>
                  <motion.span 
                    className="text-4xl font-bold text-teal-300"
                    key={animatedAmount}
                  >
                    ${animatedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </motion.span>
                </div>
              </motion.div>
              
              <motion.div 
                className="grid md:grid-cols-2 gap-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
              >
                <div className="glass-card p-4 rounded-lg">
                  <div className="text-sm text-gray-300 mb-1">Our Fee (10%)</div>
                  <div className="text-xl font-semibold text-orange-300">${commission}</div>
                </div>
                <div className="glass-card p-4 rounded-lg border border-mint-green/20">
                  <div className="text-sm text-gray-300 mb-1">You Receive</div>
                  <motion.div 
                    className="text-2xl font-bold text-mint-green"
                    animate={{ 
                      textShadow: [
                        "0 0 10px rgba(0, 200, 150, 0.5)",
                        "0 0 20px rgba(0, 200, 150, 0.8)",
                        "0 0 10px rgba(0, 200, 150, 0.5)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ${netAmount}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Property Details */}
        <motion.div 
          className="space-y-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-400" />
            Property Details
          </h3>
          {propertyData.properties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2 + index * 0.2 }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <Card className="glass-card p-6 border border-teal-500/20 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant="secondary" className="bg-teal-500/20 text-teal-300 border-teal-500/30">
                        {property.type}
                      </Badge>
                      <motion.span 
                        className="text-2xl font-bold text-teal-400"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                      >
                        {property.amount}
                      </motion.span>
                    </div>
                    <div className="flex items-center flex-wrap gap-1 space-x-4 text-gray-300">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-1 text-teal-400" />
                        <span>{property.holder}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-teal-400" />
                        <span>Reported: {property.reportDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Warning about DIY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
        >
          <Card className="glass-card p-6 border border-red-400/20 mb-8 rounded-xl">
            <div className="flex items-start">
              <motion.div
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle className="h-6 w-6 text-red-400 mr-3 mt-1" />
              </motion.div>
              <div className='w-[90%]'>
                <h4 className="font-bold text-red-300 mb-2">
                  Don't Try This Yourself - Here's Why:
                </h4>
                <ul className="space-y-2 text-red-400">
                  <li>• Complex legal forms require specific language and notarization</li>
                  <li>• Multiple supporting documents needed for each property type</li>
                  <li>• Average processing time: 6-18 months without professional help</li>
                  <li>• 70%+ rejection rate for self-filed claims due to documentation errors</li>
                  <li>• State may require additional verification that delays or denies claims</li>
                </ul>
                <div className="mt-3 font-medium text-red-300">
                  Let our licensed investigators handle this complex process for you.
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* What Happens Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8 }}
        >
          <Card className="glass-card p-6 mb-8 border border-teal-500/10 rounded-xl">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-400" />
              What Happens Next:
            </h4>
            <div className="space-y-3">
              {infoArray.map((step, index) => (
                <motion.div
                  key={index}
                  className="flex items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 3 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <motion.div 
                    className="w-8 h-8 bg-gradient-to-br from-teal-500/30 to-mint-green/20 rounded-full flex items-center justify-center mr-3"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-teal-300 font-bold">{index + 1}</span>
                  </motion.div>
                  <span className="text-gray-300 w-[90%]">{step}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={onNext}
              className="glass-button text-white sm:px-16 px-6 py-6 text-xl rounded-xl hover:text-teal-200 pulse-glow relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Claim My ${propertyData.totalAmount.replace('$', '')} Now
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className='text-yellow-600'
                >
                  💰
                </motion.span>
              </span>
            </Button>
          </motion.div>
          <motion.div 
            className="text-gray-400 mt-4"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Secure • No upfront costs • Licensed investigators
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default PropertyResults