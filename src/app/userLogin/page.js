"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "../store/searchStore";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Search,
  Globe,
  Shield,
  Zap,
  Eye,
  Lock,
  ArrowRight,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { Button } from "../components/uicomponents/Button";
import { InputField } from "../components/uicomponents/InputField";

const ErrorPopup = ({ message, onClose }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white border border-[#E8E6E3] shadow-xl rounded-2xl p-6 max-w-sm w-full text-center"
          >
            <AlertTriangle className="h-10 w-10 text-[#E1261C] mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-[#0A0A0A] mb-2 font-['Fraunces']">
              Login Failed
            </h3>
            <p className="text-[#4A4A4A] mb-4">{message}</p>
            <button
              onClick={onClose}
              className="bg-[#E1261C] hover:bg-[#B11912] text-white px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const UserLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [validationError, setValidationError] = useState("");
  const { setUserLogin } = useSearchStore();
  const [popupMessage, setPopupMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (validationError && (email.trim() || password.trim())) {
      setValidationError("");
    }
  }, [email, password, validationError]);

  const handleSearch = async () => {
    setValidationError("");

    const missingFields = [];
    if (!email.trim()) missingFields.push("Email-Id");
    if (!password.trim()) missingFields.push("Password");

    if (missingFields.length > 0) {
      if (missingFields.length === 1) {
        setValidationError(`Please enter your ${missingFields[0]}`);
      } else if (missingFields.length === 2) {
        setValidationError(
          `Please enter your ${missingFields[0]} and ${missingFields[1]}`
        );
      } else {
        setValidationError(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
      }
      return;
    }

    const payload = {
      userEmail: email.trim(),
      userPassword: password.trim(),
    };

    setIsSearching(true);
    window.scrollTo(0, 0);

    try {
      const { data } = await axios.post("/api/login", payload);
      setUserLogin(data);
      localStorage.setItem("userLogin", JSON.stringify(data));
      console.log(data?.user?.type);
      if (data?.user?.type === "User") {
        router.push("/?step=documents");
      } else {
        router.push("/allUsers");
      }
    } catch (error) {
      console.error(error);
      let msg = "Invalid credentials. Please check your email or password.";
      if (error?.response?.data?.message) msg = error.response.data.message;

      setPopupMessage(msg);
      setValidationError("");
      setIsSearching(false);
    }
  };

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#F7F5F2]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      {/* <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white border-b border-[#E8E6E3] shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E1261C] rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#0A0A0A] font-['Fraunces']">CatchMyCash</h1>
              <p className="text-[#4A4A4A] mt-1">
                California's Premier Unclaimed Property Recovery Service
              </p>
            </div>
          </div>
        </div>
      </motion.div> */}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key="search-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Login Form Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-white border border-[#E8E6E3] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-8 mb-8 relative overflow-hidden"
            >
              {/* Animated border glow - red themed */}
              <motion.div
                className="absolute inset-0 border-2 border-[#E1261C]/0 rounded-xl pointer-events-none"
                animate={{
                  borderColor: [
                    "rgba(225, 38, 28, 0)",
                    "rgba(225, 38, 28, 0.15)",
                    "rgba(225, 38, 28, 0)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              <div className="text-center mb-8 relative z-10">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="inline-block"
                >
                  <div className="w-16 h-16 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-[#E1261C]" />
                  </div>
                </motion.div>
                <motion.h2
                  className="text-3xl font-bold text-[#0A0A0A] mb-4 font-['Fraunces']"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Sign <span className="text-[#E1261C] italic font-normal">In</span>
                </motion.h2>
              </div>

              <motion.div
                className="max-w-lg mx-auto space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {/* Validation Error */}
                <AnimatePresence>
                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="p-3 bg-[#FCE9E7] border border-[#E1261C]/20 rounded-lg text-[#E1261C] text-sm flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {validationError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Divider */}
                <motion.div
                  className="flex items-center gap-3 py-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E1261C] to-transparent" />
                  <span className="text-sm text-[#4A4A4A] flex items-center gap-2 font-['JetBrains_Mono']">
                    <Eye className="h-4 w-4 text-[#E1261C]" />
                    Enter Sign In details
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E1261C] to-transparent" />
                </motion.div>

                <div className="flex flex-col gap-4 mx-auto w-full">
                  {/* Email Field */}
                  <motion.div className="relative w-full">
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
                      Email-Id *
                    </label>
                    <InputField
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter Email-Id"
                      className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg transition-all duration-300 focus:outline-none ${
                        email.trim()
                          ? "border-[#E1261C]/50 focus:border-[#E1261C]"
                          : "border-[#E8E6E3] focus:border-[#E1261C]"
                      }`}
                      onKeyPress={(e) =>
                        e.key === "Enter" && isFormValid && handleSearch()
                      }
                      disabled={isSearching}
                    />
                    {email.trim() && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-3 top-9 text-[#E1261C]"
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Password Field */}
                  <motion.div className="relative w-full">
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
                      Password *
                    </label>
                    <InputField
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg transition-all duration-300 focus:outline-none ${
                        password.trim()
                          ? "border-[#E1261C]/50 focus:border-[#E1261C]"
                          : "border-[#E8E6E3] focus:border-[#E1261C]"
                      }`}
                      onKeyPress={(e) =>
                        e.key === "Enter" && isFormValid && handleSearch()
                      }
                      disabled={isSearching}
                    />
                    {password.trim() && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-3 top-9 text-[#E1261C]"
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                {/* Form Status */}
                <motion.div
                  className="text-center text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                >
                  {isFormValid ? (
                    <motion.span
                      className="text-[#E1261C] flex items-center justify-center gap-2"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      <span className="w-2 h-2 bg-[#E1261C] rounded-full"></span>
                      Ready to sign in
                    </motion.span>
                  ) : (
                    <span className="text-[#888888]">
                      Fill in all required fields to Login
                    </span>
                  )}
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  whileHover={isFormValid ? { scale: 1.02 } : {}}
                  whileTap={isFormValid ? { scale: 0.98 } : {}}
                >
                  <button
                    onClick={handleSearch}
                    className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${
                      isFormValid && !isSearching
                        ? "bg-[#E1261C] text-white hover:bg-[#B11912] shadow-md hover:shadow-lg"
                        : "bg-[#D4D4D4] text-[#888888] cursor-not-allowed"
                    }`}
                    disabled={!isFormValid || isSearching}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {isSearching ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                          Signing in...
                        </>
                      ) : isFormValid ? (
                        <>
                          Sign-In
                          <ArrowRight className="h-5 w-5 transition-transform" />
                        </>
                      ) : (
                        <>
                          Sign-In
                          <Lock className="h-5 w-5" />
                        </>
                      )}
                    </span>
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Features - Red Themed */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Globe,
                  title: "52+ Database Search",
                  desc: "SCO, banks, insurance, utilities, address history",
                  delay: 0.8,
                },
                {
                  icon: Shield,
                  title: "Bank-Level Security",
                  desc: "256-bit encryption protects your data",
                  delay: 1.0,
                },
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  desc: "Complete search in under 5 seconds",
                  delay: 1.2,
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: feature.delay }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white p-6 text-center border border-[#E8E6E3] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3"
                  >
                    <feature.icon className="h-6 w-6 text-[#E1261C]" />
                  </motion.div>
                  <h3 className="font-semibold mb-2 text-[#0A0A0A] group-hover:text-[#E1261C] transition-colors">
                    {feature.title}
                  </h3>
                  <div className="text-[#4A4A4A] text-sm group-hover:text-[#0A0A0A] transition-colors">
                    {feature.desc}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <ErrorPopup
          message={popupMessage}
          onClose={() => {
            setPopupMessage("");
            setEmail("");
            setPassword("");
          }}
        />
      </div>
    </div>
  );
};

export default UserLogin;