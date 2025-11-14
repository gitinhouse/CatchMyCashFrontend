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
            className="bg-gray-900 border border-red-500/30 shadow-lg shadow-red-900/20 rounded-2xl p-6 max-w-sm w-full text-center"
          >
            <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Login Failed
            </h3>
            <p className="text-gray-300 mb-4">{message}</p>
            <Button
              onClick={onClose}
              className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-colors"
            >
              Close
            </Button>
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
    <div className="min-h-screen relative">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card border-b border-teal-500/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-mint-green rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-navy-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-teal-400">CatchMyCash</h1>
              <p className="text-gray-300 mt-1">
                {"California's Premier Unclaimed Property Recovery Service"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key="search-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Search Form */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="glass-card p-8 mb-8 border border-teal-500/20 rounded-xl relative overflow-hidden"
            >
              {/* Animated border glow */}
              <motion.div
                className="absolute inset-0 border-2 border-teal-500/0 rounded-xl"
                animate={{
                  borderColor: [
                    "rgba(0, 128, 128, 0)",
                    "rgba(0, 128, 128, 0.3)",
                    "rgba(0, 128, 128, 0)",
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
                  <Search className="h-12 w-12 text-teal-400 mx-auto mb-4" />
                </motion.div>
                <motion.h2
                  className="text-3xl font-bold text-white mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Sign In
                </motion.h2>
                {/* <motion.div
                    className="text-gray-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Our proprietary AI searches across{" "}
                    <span className="text-teal-400 font-semibold">
                      52+ databases
                    </span>{" "}
                    using your personal and address history
                  </motion.div> */}
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
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {validationError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Personal Information Section */}
                <motion.div
                  className="flex items-center gap-3 py-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent"></div>
                  <span className="text-sm text-teal-300 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Enter Sign In details
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent"></div>
                </motion.div>

                <div className="flex flex-col gap-4 mx-auto w-full">
                  <motion.div
                    className="relative w-full"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email-Id *
                    </label>
                    <InputField
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter Email-Id"
                      className={`w-full text-white placeholder-gray-400 border-2 transition-all duration-300 ${
                        email.trim()
                          ? "border-teal-400/50 focus:border-teal-400"
                          : "border-transparent focus:border-teal-400"
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
                        className="absolute right-3 top-9 text-teal-400"
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.div>

                  <motion.div
                    className="relative w-full"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password *
                    </label>
                    <InputField
                      type="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      className={`w-full text-white placeholder-gray-400 border-2 transition-all duration-300 ${
                        password.trim()
                          ? "border-teal-400/50 focus:border-teal-400"
                          : "border-transparent focus:border-teal-400"
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
                        className="absolute right-3 top-9 text-teal-400"
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
                      className="text-teal-400 flex items-center justify-center gap-2"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                      Ready to search In databases
                    </motion.span>
                  ) : (
                    <span className="text-gray-400">
                      Fill in all required fields to Login
                    </span>
                  )}
                </motion.div>

                <motion.div
                  whileHover={isFormValid ? { scale: 1.02 } : {}}
                  whileTap={isFormValid ? { scale: 0.98 } : {}}
                >
                  <Button
                    onClick={handleSearch}
                    className={`w-full py-4 text-lg relative overflow-hidden group transition-all duration-300 ${
                      isFormValid && !isSearching
                        ? "glass-button text-white hover:text-teal-200 pulse-glow"
                        : "bg-gray-600/30 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!isFormValid || isSearching}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {isFormValid ? (
                        <>
                          Sign-In
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      ) : (
                        <>
                          Sign-In
                          <Lock className="h-5 w-5" />
                        </>
                      )}
                    </span>
                  </Button>

                  {/* <Button
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/downloadSCO");
                          const data = await res.json();
                          if (res.ok) {
                            console.log(
                              "Extracted files path:",
                              data.extractedPath
                            );
                          } else {
                            alert("Failed: " + data.error);
                          }
                        } catch (err) {
                          console.error(err);
                          alert("Something went wrong");
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      Download & Extract SCO Records
                    </Button> */}
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Features */}
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
                  className="glass-card p-6 text-center border border-teal-500/10 rounded-xl group"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="h-8 w-8 text-teal-400 mx-auto mb-3" />
                  </motion.div>
                  <h3 className="font-semibold mb-2 text-white group-hover:text-teal-200 transition-colors">
                    {feature.title}
                  </h3>
                  <div className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors">
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
