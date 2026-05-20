"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  CheckCircle,
  DollarSign,
  Calendar,
  Building,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import JackpotCelebration from "./uicomponents/JackpotCelebration";
import { Card } from "./uicomponents/Card";
import { Button } from "./uicomponents/Button";
import { Badge } from "./uicomponents/Badge";
import { useSearchStore } from "../store/searchStore";

const infoArray = [
  "Provide your information for our investigator agreement",
  "We automatically prepare and submit all required forms",
  "Upload supporting documents through our secure portal",
  "We build your case and submit to the State Controller's Office",
  "You receive your money (typically 30-60 days)",
];

const PropertyResults = ({ propertyData, onNext, onBack }) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [animatedAmount, setAnimatedAmount] = useState(0);

  const totalAmount = parseFloat(
    propertyData.totalAmount.replace("$", "").replace(",", ""),
  );
  const commission = (totalAmount * 0.1).toFixed(2);
  const netAmount = (totalAmount * 0.9).toFixed(2);
  const { userData } = useSearchStore();

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

  const handleClaim = async () => {
    try {
      setShowCelebration(true);
      const userId = userData?._id;
      const response = await axios.post("/api/property", {
        user_id: userId,
        properties: propertyData.properties,
      });
      onNext(response.data);
    } catch (err) {
      console.error("Error saving user properties:", err);
    }
  };
  const propertyCount = propertyData?.properties?.length || 0;
  const isJackpot = propertyCount > 0;

  return (
    <div
      className="min-h-screen bg-[#F7F5F2]"
       
    >
      <JackpotCelebration showCelebration={showCelebration} />

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
              damping: 10,
            }}
            className="relative inline-block mb-6"
          >
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-[#E1261C]/30 to-[#B11912]/30 blur-xl"
            />
            <CheckCircle className="h-20 w-20 text-[#E1261C] relative z-10" />
          </motion.div>

          <motion.h2
            className="text-5xl font-bold text-[#0A0A0A] mb-4 font-['Fraunces']"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {isJackpot ? (
              <>
                <span className="text-orange-500">🎉</span> Jackpot,{" "}
                <span className="text-[#E1261C] italic">
                  {propertyData.name.split(" ")[0]}
                </span>
                !
              </>
            ) : (
              <>
                <span className="text-orange-500">😔</span> Sorry,{" "}
                <span className="text-[#E1261C] italic">
                  {propertyData.name.split(" ")[0]}
                </span>
              </>
            )}
          </motion.h2>

          <motion.div
            className="text-xl text-[#4A4A4A] mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {isJackpot ? (
              <>
                We found{" "}
                <span className="text-[#E1261C] font-semibold">
                  {propertyCount} unclaimed properties
                </span>{" "}
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
                className="bg-[#E1261C] text-white px-10 py-5 text-lg font-semibold rounded-xl hover:bg-[#B11912] transition-all shadow-md hover:shadow-lg"
              >
                🔎 Search Again
              </button>
            </motion.div>
          )}

          {/* Animated Amount Display - Red Themed */}
          <motion.div
            className="bg-white border border-[#E8E6E3] rounded-xl p-8 mb-8 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
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

            <div className="relative z-10">
              <motion.div
                className="flex items-center justify-center mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-center">
                  <div className="text-lg text-[#4A4A4A] mb-1 font-['JetBrains_Mono']">
                    Total Found
                  </div>
                  <motion.span
                    className="text-5xl font-bold text-[#E1261C] font-['Fraunces']"
                    key={animatedAmount}
                  >
                    $
                    <span className="text-black">
                      {animatedAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </motion.span>
                </div>
              </motion.div>

              <motion.div
                className="grid md:grid-cols-2 gap-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
              >
                <div className="bg-[#FCE9E7] p-4 rounded-lg border border-[#E8E6E3]">
                  <div className="text-sm text-[#4A4A4A] mb-1 font-['JetBrains_Mono']">
                    Our Fee (10%)
                  </div>
                  <div className="text-xl font-semibold text-[#E1261C]">
                    ${" "}
                    <span className="text-black">
                      {" "}
                      {parseFloat(commission).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-[#E1261C]/30 shadow-md">
                  <div className="text-sm text-[#4A4A4A] mb-1 font-['JetBrains_Mono']">
                    You Receive
                  </div>
                  <motion.div
                    className="text-2xl font-bold text-[#E1261C] font-['Fraunces']"
                    animate={{
                      textShadow: [
                        "0 0 10px rgba(225, 38, 28, 0.3)",
                        "0 0 20px rgba(225, 38, 28, 0.5)",
                        "0 0 10px rgba(225, 38, 28, 0.3)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ${" "}
                    <span className="text-black">
                      {parseFloat(netAmount).toLocaleString("en-US", {
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
          {propertyData.properties.length > 0 ? (
            propertyData.properties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2 + index * 0.2 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="bg-white p-6 border border-[#E8E6E3] rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-3 mb-2">
                        <span className="bg-[#FCE9E7] text-[#E1261C] text-xs font-semibold px-3 py-1 rounded-full border border-[#E8E6E3]">
                          {property.type}
                        </span>
                        <motion.span
                          className="text-2xl font-bold text-[#E1261C] font-['Fraunces']"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.5,
                          }}
                        >
                          ${" "}
                          <span className="text-black">
                            {parseFloat(property.amount).toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </span>
                        </motion.span>
                      </div>
                      <div className="flex items-center flex-wrap gap-4 text-[#4A4A4A] text-sm">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-1 text-[#E1261C]" />
                          <span>{property.holder}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-[#E1261C]" />
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
          <div className="bg-white border border-[#E8E6E3] p-6 mb-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
            <div className="flex items-start">
              <motion.div
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle className="h-6 w-6 text-[#E1261C] mr-3 mt-1" />
              </motion.div>
              <div className="w-[90%]">
                <h4 className="font-bold text-[#0A0A0A] mb-2 font-['Fraunces']">
                  Don't Try This Yourself - Here's Why:
                </h4>
                <ul className="space-y-2 text-[#4A4A4A]">
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
          <div className="bg-white border border-[#E8E6E3] p-6 mb-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
            <h4 className="font-bold text-[#0A0A0A] mb-4 flex items-center gap-2 font-['Fraunces']">
              <TrendingUp className="h-5 w-5 text-[#E1261C]" />
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
                    className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center mr-3"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-[#E1261C] font-bold font-['JetBrains_Mono']">
                      {index + 1}
                    </span>
                  </motion.div>
                  <span className="text-[#4A4A4A] w-[90%]">{step}</span>
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
              disabled={
                parseFloat(
                  propertyData.totalAmount.replace("$", "").replace(",", ""),
                ) === 0.0
              }
              className={`px-6 sm:px-16 py-6 text-xl font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 mx-auto ${
                parseFloat(
                  propertyData.totalAmount.replace("$", "").replace(",", ""),
                ) > 0
                  ? "bg-[#E1261C] text-white hover:bg-[#B11912] shadow-md hover:shadow-lg"
                  : "bg-[#D4D4D4] text-[#888888] cursor-not-allowed"
              }`}
            >
              <span className="relative z-10 flex items-center gap-3">
                Claim My $
                {parseFloat(
                  propertyData.totalAmount.replace("$", "").replace(",", ""),
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                Now
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-yellow-400"
                >
                  💰
                </motion.span>
              </span>
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
    </div>
  );
};

export default PropertyResults;
