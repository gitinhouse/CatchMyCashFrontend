'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Calendar,
  Building,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import JackpotCelebration from './uicomponents/JackpotCelebration';
import { Card } from './uicomponents/Card';
import { Button } from './uicomponents/Button';
import { Badge } from './uicomponents/Badge';
import { useSearchStore } from '../store/searchStore';

const infoArray = [
  'Provide your information for our investigator agreement',
  'We automatically prepare and submit all required forms',
  'Upload supporting documents through our secure portal',
  "We build your case and submit to the State Controller's Office",
  'You receive your money (typically 30-60 days)',
];

const parsePropertyAmount = (amount) => parseFloat(amount || 0) || 0;

const getUniquePropertiesWithTotals = (properties = []) =>
  Array.from(
    properties
      .reduce((map, property) => {
        const amount = parsePropertyAmount(property.amount);
        const existing = map.get(property.id);

        if (existing) {
          map.set(property.id, {
            ...existing,
            amount: parsePropertyAmount(existing.amount) + amount,
          });
        } else {
          map.set(property.id, { ...property, amount });
        }

        return map;
      }, new Map())
      .values(),
  );

const getTotalPropertyAmount = (properties = []) =>
  properties.reduce(
    (sum, property) => sum + parsePropertyAmount(property.amount),
    0,
  );

const PropertyResults = ({ propertyData, onNext, onBack }) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [animatedAmount, setAnimatedAmount] = useState(0);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [selectedTotalAmount, setSelectedTotalAmount] = useState(0);
  const [showSelectionLimitPopup, setShowSelectionLimitPopup] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const uniqueProperties = React.useMemo(
    () => getUniquePropertiesWithTotals(propertyData.properties),
    [propertyData.properties],
  );

  const totalAmount = getTotalPropertyAmount(propertyData.properties);
  // Calculate commission first and round it to the nearest cent.
  // Then, derive the net amount from the rounded commission to avoid floating point inaccuracies.
  const commissionValue = Math.round(selectedTotalAmount * 10) / 100;
  const netAmountValue = selectedTotalAmount - commissionValue;
  const commission = commissionValue.toFixed(2);
  const netAmount = netAmountValue.toFixed(2);
  const { userData, ownPropertyIds, setOwnPropertyIds } = useSearchStore();

  const handleCheckboxChange = (propertyId) => {
    setSelectedProperties((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      }
      if (prev.length < 3) {
        return [...prev, propertyId];
      }
      setShowSelectionLimitPopup(true);
      return prev;
    });
  };

  useEffect(() => {
    const newTotal = uniqueProperties
      .filter((p) => selectedProperties.includes(p.id))
      .reduce((sum, p) => sum + parsePropertyAmount(p.amount), 0);
    setSelectedTotalAmount(newTotal);
  }, [selectedProperties, uniqueProperties]);

  useEffect(() => {
    console.log('---user data--', userData);
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

  const handleClaim = async () => {
    if (isButtonDisabled || isClaiming) return;
    setIsClaiming(true);
    try {
      const selectedPropertyObjects = uniqueProperties.filter((property) =>
        selectedProperties.includes(property.id),
      );
      setOwnPropertyIds(selectedProperties);
      localStorage.setItem(
        'ownPropertyIds',
        JSON.stringify(selectedProperties),
      );
      console.log('Selected Property IDs:', selectedProperties);
      console.log('Selected Properties:', selectedPropertyObjects);

      setShowCelebration(true);
      const userId = userData?._id;
      const selectedRawProperties = propertyData.properties.filter((p) =>
        selectedProperties.includes(p.id),
      );
      const response = await axios.post('/api/property', {
        user_id: userId,
        properties: selectedRawProperties,
      });
      onNext(response.data);
    } catch (err) {
      console.error('Error saving user properties:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  const isButtonDisabled = selectedTotalAmount <= 0 || isClaiming;

  const propertyCount = uniqueProperties?.length || 0;
  const isJackpot = propertyCount > 0;

  return (
    <div className="min-h-screen bg-[#F7F5F2] overflow-x-hidden">
      <JackpotCelebration showCelebration={showCelebration} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {isJackpot && (
          <motion.div
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-[#4A4A4A] hover:text-[#E1261C] transition-colors font-semibold"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute w-8 h-8 rounded-full bg-[#E1261C]/10"></div>
                <ArrowLeft className="h-4 w-4 relative z-10 text-[#E1261C]" />
              </div>
            </button>
          </motion.div>
        )}
        {/* Success Header */}
        <motion.div
          className="text-center mb-8 px-1"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-[clamp(1.75rem,7vw,3rem)] font-bold text-[#0A0A0A] mb-4 font-['Fraunces'] flex flex-col items-center justify-center gap-3 w-full max-w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {isJackpot ? (
              <>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.2,
                    type: 'spring',
                    stiffness: 200,
                    damping: 10,
                  }}
                  className="relative block mb-4 sm:mb-6"
                >
                  <motion.span
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 block rounded-full bg-gradient-to-r from-[#E1261C]/30 to-[#B11912]/30 blur-xl"
                  />
                  <CheckCircle className="h-14 w-14 sm:h-20 sm:w-20 text-[#E1261C] relative z-10" />
                </motion.span>
                <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-1 leading-tight break-words max-w-full">
                  <span className="text-orange-500 shrink-0" aria-hidden="true">
                    🎉
                  </span>
                  <span>Jackpot,</span>
                  <span className="text-[#E1261C] italic break-all">
                    {propertyData.name.split(' ')[0]}!
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-1 leading-tight break-words max-w-full">
                  <span>Sorry,</span>
                  <span className="text-[#E1261C] italic break-all">
                    {propertyData.name.split(' ')[0]}
                  </span>
                </span>
              </>
            )}
          </motion.h2>

          <motion.div
            className="text-base sm:text-xl text-[#4A4A4A] mb-8 px-1 break-words"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {isJackpot ? (
              <>
                We found{' '}
                <span className="text-[#E1261C] font-semibold">
                  {propertyCount} unclaimed properties
                </span>{' '}
                in your name
              </>
            ) : (
              <>We couldn't find any unclaimed properties in your name.</>
            )}
          </motion.div>

          {!isJackpot && (
            <motion.div
              className="text-center mt-8 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <button
                onClick={onBack}
                className="bg-[#E1261C] text-white px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-semibold rounded-xl hover:bg-[#B11912] transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                🔎 Search Again
              </button>
            </motion.div>
          )}

          {/* Animated Amount Display - Red Themed */}
          <motion.div
            className="bg-white border border-[#E8E6E3] rounded-xl p-5 sm:p-8 mb-8 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {/* Animated background glow - Red themed */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#E1261C]/5 to-[#B11912]/5"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <div className="relative z-10 min-w-0">
              <motion.div
                className="flex items-center justify-center mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-center min-w-0 w-full px-1">
                  <div className="text-sm sm:text-lg text-[#4A4A4A] mb-1 font-['JetBrains_Mono']">
                    Total Found
                  </div>
                  <motion.span
                    className="text-[clamp(1.75rem,8vw,3rem)] font-bold text-[#E1261C] font-['Fraunces'] break-all"
                    key={animatedAmount}
                  >
                    $
                    <span className="text-black">
                      {animatedAmount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </motion.span>
                </div>
              </motion.div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
              >
                <div className="bg-[#FCE9E7] p-4 rounded-lg border border-[#E8E6E3] min-w-0">
                  <div className="text-sm text-[#4A4A4A] mb-1 font-['JetBrains_Mono']">
                    Our Fee (10%)
                  </div>
                  <div className="text-lg sm:text-xl font-semibold text-[#E1261C] break-all">
                    ${' '}
                    <span className="text-black">
                      {' '}
                      {parseFloat(commission).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-[#E1261C]/30 shadow-md min-w-0">
                  <div className="text-sm text-[#4A4A4A] mb-1 font-['JetBrains_Mono']">
                    You Receive
                  </div>
                  <motion.div
                    className="text-xl sm:text-2xl font-bold text-[#E1261C] font-['Fraunces'] break-all"
                    animate={{
                      textShadow: [
                        '0 0 10px rgba(225, 38, 28, 0.3)',
                        '0 0 20px rgba(225, 38, 28, 0.5)',
                        '0 0 10px rgba(225, 38, 28, 0.3)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ${' '}
                    <span className="text-black">
                      {parseFloat(netAmount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
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
          <h3 className="text-xl font-bold text-[#0A0A0A] flex items-center gap-2 font-['Fraunces']">
            <Sparkles className="h-5 w-5 text-[#E1261C]" />
            Property Details
          </h3>
          {uniqueProperties.length > 0 ? (
            uniqueProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2 + index * 0.2 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="bg-white p-4 sm:p-6 border border-[#E8E6E3] rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <input
                      type="checkbox"
                      checked={selectedProperties.includes(property.id)}
                      onChange={() => handleCheckboxChange(property.id)}
                      className="mt-2 h-5 w-5 cursor-pointer accent-[#E1261C] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-3 mb-2">
                        <span className="bg-[#FCE9E7] text-[#E1261C] text-xs font-semibold px-3 py-1 rounded-full border border-[#E8E6E3]">
                          {property.id}
                        </span>
                        <span className="bg-[#FCE9E7] text-[#E1261C] text-xs font-semibold px-3 py-1 rounded-full border border-[#E8E6E3]">
                          {property.type}
                        </span>
                        <motion.span
                          className="text-xl sm:text-2xl font-bold text-[#E1261C] font-['Fraunces'] break-all"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.5,
                          }}
                        >
                          ${' '}
                          <span className="text-black">
                            {parseFloat(property.amount).toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </span>
                        </motion.span>
                      </div>
                      <div className="flex items-center flex-wrap gap-4 text-[#4A4A4A] text-sm">
                        <div className="flex items-center min-w-0">
                          <Building className="h-4 w-4 mr-1 text-[#E1261C] shrink-0" />
                          <span className="break-words">{property.holder}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-[#E1261C] shrink-0" />
                          <span>Reported: {property.reportDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white p-6 border border-[#E8E6E3] rounded-xl text-center shadow-md">
              <div className="text-[#E1261C] font-semibold text-lg">
                ⚠ No properties found
              </div>
            </div>
          )}
        </motion.div>

        {/* Warning about DIY - Red Themed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
        >
          <div className="bg-white border border-[#E8E6E3] p-4 sm:p-6 mb-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
            <div className="flex items-start gap-2 sm:gap-0">
              <motion.div
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="shrink-0"
              >
                <AlertTriangle className="h-6 w-6 text-[#E1261C] mr-3 mt-1" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#0A0A0A] mb-2 font-['Fraunces'] text-base sm:text-lg">
                  Don't Try This Yourself - Here's Why:
                </h4>
                <ul className="space-y-2 text-[#4A4A4A] text-sm sm:text-base">
                  <li>
                    • Complex legal forms require specific language and
                    notarization
                  </li>
                  <li>
                    • Multiple supporting documents needed for each property
                    type
                  </li>
                  <li>
                    • Average processing time: 6-18 months without professional
                    help
                  </li>
                  <li>
                    • 70%+ rejection rate for self-filed claims due to
                    documentation errors
                  </li>
                  <li>
                    • State may require additional verification that delays or
                    denies claims
                  </li>
                </ul>
                <div className="mt-3 font-medium text-[#E1261C]">
                  Let our licensed investigators handle this complex process for
                  you.
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* What Happens Next - Red Themed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8 }}
        >
          <div className="bg-white border border-[#E8E6E3] p-4 sm:p-6 mb-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
            <h4 className="font-bold text-[#0A0A0A] mb-4 flex items-center gap-2 font-['Fraunces']">
              <TrendingUp className="h-5 w-5 text-[#E1261C] shrink-0" />
              What Happens Next:
            </h4>
            <div className="space-y-3">
              {infoArray.map((step, index) => (
                <motion.div
                  key={index}
                  className="flex items-start sm:items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 3 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <motion.div
                    className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center mr-3 shrink-0"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-[#E1261C] font-bold font-['JetBrains_Mono']">
                      {index + 1}
                    </span>
                  </motion.div>
                  <span className="text-[#4A4A4A] flex-1 min-w-0 break-words text-sm sm:text-base">
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA - Red Themed */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              onClick={handleClaim}
              disabled={isButtonDisabled}
              className={`px-4 sm:px-16 py-4 sm:py-6 text-base sm:text-xl font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 mx-auto w-full sm:w-auto sm:min-w-[300px] max-w-full ${
                !isButtonDisabled
                  ? 'bg-[#E1261C] text-white hover:bg-[#B11912] shadow-md hover:shadow-lg'
                  : 'bg-[#D4D4D4] text-[#888888] cursor-not-allowed opacity-60'
              }`}
            >
              {isClaiming ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Claiming...
                </>
              ) : (
                <span className="relative z-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center">
                  Claim My ${' '}
                  {selectedTotalAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  Now
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-yellow-400"
                  >
                    💰
                  </motion.span>
                </span>
              )}
            </button>
          </motion.div>
          <motion.div
            className="text-[#888888] mt-4 text-sm font-['JetBrains_Mono']"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Secure • No upfront costs • Licensed investigators
          </motion.div>
        </motion.div>
      </div>

      {showSelectionLimitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            className="w-full max-w-md mx-4 rounded-2xl bg-white border border-[#E8E6E3] shadow-xl p-5 sm:p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="text-center">
              <div className="w-14 h-14 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-7 w-7 text-[#E1261C]" />
              </div>
              <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2 font-['Fraunces']">
                Selection Limit Reached
              </h2>
              <p className="text-[#4A4A4A] mb-6">
                You can select a maximum of 3 properties to claim at once.
              </p>
              <button
                onClick={() => setShowSelectionLimitPopup(false)}
                className="bg-[#E1261C] hover:bg-[#B11912] text-white px-8 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PropertyResults;
