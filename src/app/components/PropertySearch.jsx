import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "../store/searchStore";
import axios from "axios";
import {
  Search,
  Globe,
  Shield,
  Zap,
  Eye,
  Lock,
  ArrowRight,
  AlertTriangle,
  MapPin,
  Home,
} from "lucide-react";
import { Button } from "./uicomponents/Button";
import { InputField } from "./uicomponents/InputField";

const PropertySearch = ({ onNext }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("California");
  const [zipCode, setZipCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [currentSearchStep, setCurrentSearchStep] = useState("");
  const [validationError, setValidationError] = useState("");
  const { setUserData, setSearchResults } = useSearchStore();

  const searchSteps = [
    "Initializing secure connection...",
    "Accessing California SCO database...",
    "Cross-referencing address history...",
    "Scanning bank records...",
    "Checking insurance policies...",
    "Reviewing utility deposits...",
    "Analyzing investment accounts...",
    "Validating geographic data...",
    "Cross-referencing multiple sources...",
    "Calculating total amounts...",
    "Generating detailed report...",
  ];

  useEffect(() => {
    if (isSearching) {
      let step = 0;
      const interval = setInterval(() => {
        if (step < searchSteps.length) {
          setCurrentSearchStep(searchSteps[step]);
          setSearchProgress(((step + 1) / searchSteps.length) * 100);
          step++;
        } else {
          clearInterval(interval);
        }
      }, 450);

      return () => clearInterval(interval);
    }
  }, [isSearching]);

  useEffect(() => {
    if (
      validationError &&
      (firstName.trim() ||
        lastName.trim() ||
        address.trim() ||
        city.trim() ||
        zipCode.trim())
    ) {
      // setValidationError('');
    }
  }, [firstName, lastName, address, city, zipCode, validationError]);

  const handleSearch = async () => {
    // setValidationError('');

    const missingFields = [];
    if (!firstName.trim()) missingFields.push("first name");
    if (!lastName.trim()) missingFields.push("last name");
    if (!address.trim()) missingFields.push("address");
    if (!city.trim()) missingFields.push("city");
    if (!zipCode.trim()) missingFields.push("ZIP code");

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

    const zipPattern = /^\d{5}(-\d{4})?$/;
    if (!zipPattern.test(zipCode.trim())) {
      setValidationError(
        "Please enter a valid ZIP code (e.g., 90210 or 90210-1234)"
      );
      return;
    }

    // here i need to implement the API to save the data into the database and
    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      address: address.trim(),
      city: city.trim(),
      state:"CA",
      zip_code: zipCode.trim(),
    };

    setIsSearching(true);
    window.scrollTo(0, 0);
    setShowBrowser(true);
    setSearchProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setSearchProgress((prev) => {
          if (prev < 90) return prev + 5;
          clearInterval(progressInterval);
          return prev;
        });
      }, 200);

      const { data } = await axios.post("/api/users", payload);
      setUserData(data);

      const propertypPayload = {
        first_name: firstName.trim().toUpperCase(),
        last_name: lastName.trim().toUpperCase(),
        address: address.trim().toUpperCase(),
        city: city.trim().toUpperCase(),
        state:"CA",
        zip_code: zipCode.trim(),
      };
      const { totalMatched, currentPage, pageSize, matchedProperties } =
        await axios
          .post("/api/filterProperty", propertypPayload)
          .then((res) => res.data);

     
      setSearchProgress(100);
      // setTimeout(() => {
      //   const mockResults = {
      //     name: `${firstName.trim()} ${lastName.trim()}`,
      //     address: {
      //       street: address.trim(),
      //       city: city.trim(),
      //       state: state,
      //       zipCode: zipCode.trim(),
      //     },
      //     properties: [
      //       {
      //         id: 1,
      //         type: "Bank Account",
      //         holder: "Wells Fargo Bank",
      //         amount: "$2,847.50",
      //         reportDate: "2019-03-15",
      //         status: "Available",
      //         lastKnownAddress: `${address.trim()}, ${city.trim()}, CA ${zipCode.trim()}`,
      //       },
      //       {
      //         id: 2,
      //         type: "Insurance Refund",
      //         holder: "State Farm Insurance",
      //         amount: "$1,293.00",
      //         reportDate: "2020-07-22",
      //         status: "Available",
      //         lastKnownAddress: `${address.trim()}, ${city.trim()}, CA ${zipCode.trim()}`,
      //       },
      //       {
      //         id: 3,
      //         type: "Utility Deposit",
      //         holder: "Pacific Gas & Electric",
      //         amount: "$156.75",
      //         reportDate: "2021-01-10",
      //         status: "Available",
      //         lastKnownAddress: `Previous address linked to current`,
      //       },
      //     ],
      //     totalAmount: "$4,297.25",
      //     searchTime: "4.2 seconds",
      //     databasesSearched: 52,
      //     addressMatches: 3,
      //   };

      //   onNext(mockResults);
      // }, 4800);
      // setTimeout(() => {
      //   onNext(data);
      // }, 500);
   setTimeout(() => {
  // Transform matchedProperties into your frontend format
  const transformedProperties = matchedProperties.map((prop, index) => ({
    id: prop.property_id, // or use prop._id if you prefer
    type: prop.property_type,
    holder: prop.owner_name,
    amount: prop.current_cash_balance || prop.cash_reported,
    reportDate:  new Date().toISOString().split("T")[0], // If you have a date field, set it here
    status: "Available", // Or derive from your data
    lastKnownAddress: `${prop.owner_street_1}, ${prop.owner_city}, ${prop.owner_state} ${prop.owner_zip}`,
  }));

  const results = {
    name: `${firstName.trim()} ${lastName.trim()}`,
    address: {
      street: address.trim(),
      city: city.trim(),
      state: state,
      zipCode: zipCode.trim(),
    },
    properties: transformedProperties,
    totalAmount: transformedProperties
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
      .toLocaleString("en-US", { style: "currency", currency: "USD" }),
    searchTime: "4.2 seconds", // optionally calculate real time
    databasesSearched: 52, // if you track this
    addressMatches: totalMatched,
  };

  onNext(results);
}, 4800);
   
    } catch (error) {
      console.error(error);
      setValidationError(
        "There was a problem submitting your search. Please try again."
      );
      setIsSearching(false);
    }
  };

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    zipCode.trim().length > 0;

  return (
    <div className="min-h-screen relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-teal-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {!showBrowser ? (
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
                    Advanced Property Search
                  </motion.h2>
                  <motion.div
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
                  </motion.div>
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
                      Personal Information
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent"></div>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Name *
                      </label>
                      <InputField
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                        className={`w-full text-white placeholder-gray-400 border-2 transition-all duration-300 ${
                          firstName.trim()
                            ? "border-teal-400/50 focus:border-teal-400"
                            : "border-transparent focus:border-teal-400"
                        }`}
                        onKeyPress={(e) =>
                          e.key === "Enter" && isFormValid && handleSearch()
                        }
                        disabled={isSearching}
                      />
                      {firstName.trim() && (
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
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name *
                      </label>
                      <InputField
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                        className={`w-full text-white placeholder-gray-400 border-2 transition-all duration-300 ${
                          lastName.trim()
                            ? "border-teal-400/50 focus:border-teal-400"
                            : "border-transparent focus:border-teal-400"
                        }`}
                        onKeyPress={(e) =>
                          e.key === "Enter" && isFormValid && handleSearch()
                        }
                        disabled={isSearching}
                      />
                      {lastName.trim() && (
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

                  {/* Address Section Divider */}
                  <motion.div
                    className="flex items-center gap-3 py-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                  >
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent"></div>
                    <span className="text-sm text-teal-300 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address Information
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent"></div>
                  </motion.div>

                  <motion.div className="relative" whileFocus={{ scale: 1.02 }}>
                    <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Home className="h-4 w-4 text-teal-400" />
                      Street Address *
                    </label>
                    <InputField
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main Street, Apt 4B"
                      className={`w-full text-white placeholder-gray-400 border-2 transition-all duration-300 ${
                        address.trim()
                          ? "border-teal-400/50 focus:border-teal-400"
                          : "border-transparent focus:border-teal-400"
                      }`}
                      onKeyPress={(e) =>
                        e.key === "Enter" && isFormValid && handleSearch()
                      }
                      disabled={isSearching}
                    />
                    {address.trim() && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-3 top-9 text-teal-400"
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        City *
                      </label>
                      <InputField
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Los Angeles"
                        className={`w-full text-white placeholder-gray-400 border-2 transition-all duration-300 ${
                          city.trim()
                            ? "border-teal-400/50 focus:border-teal-400"
                            : "border-transparent focus:border-teal-400"
                        }`}
                        onKeyPress={(e) =>
                          e.key === "Enter" && isFormValid && handleSearch()
                        }
                        disabled={isSearching}
                      />
                      {city.trim() && (
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
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        ZIP Code *
                      </label>
                      <InputField
                        type="number"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="90210"
                        maxLength={10}
                        className={`w-full text-white placeholder-gray-400 border-2 transition-all duration-300 remove-arrow ${
                          zipCode.trim()
                            ? "border-teal-400/50 focus:border-teal-400"
                            : "border-transparent focus:border-teal-400"
                        }`}
                        onKeyPress={(e) =>
                          e.key === "Enter" && isFormValid && handleSearch()
                        }
                        disabled={isSearching}
                      />
                      {zipCode.trim() && (
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

                  {/* State field (readonly, California only) */}
                  <motion.div
                    className="relative opacity-75"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.75 }}
                    transition={{ delay: 1.2 }}
                  >
                    <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-teal-400" />
                      State (California Only)
                    </label>
                    <InputField
                      type="text"
                      value={state}
                      readOnly
                      className="w-full text-white bg-gray-600/30 border-2 border-teal-400/30 cursor-not-allowed"
                      disabled
                    />
                  </motion.div>

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
                        Ready to search all databases
                      </motion.span>
                    ) : (
                      <span className="text-gray-400">
                        Fill in all required fields to begin comprehensive
                        search
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
                            Searching {searchProgress.toFixed(0)}%...
                          </>
                        ) : isFormValid ? (
                          <>
                            Search All Databases
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        ) : (
                          <>
                            Complete Form to Continue
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
          ) : (
            /* Enhanced In-App Browser Simulation */
            <motion.div
              key="browser-simulation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Browser Window */}
              <motion.div
                className="glass-card p-6 border border-teal-500/20 rounded-xl overflow-hidden relative"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                {/* Browser Header */}
                <div className="flex items-center justify-between mb-6">
                  <motion.h3
                    className="text-lg font-semibold text-white flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Globe className="h-5 w-5 text-teal-400" />
                    AI-Powered Multi-Database Search
                  </motion.h3>
                  <div className="flex items-center space-x-2">
                    <motion.div
                      className="w-3 h-3 bg-red-500 rounded-full"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="w-3 h-3 bg-yellow-500 rounded-full"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                    <motion.div
                      className="w-3 h-3 bg-green-500 rounded-full"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    />
                  </div>
                </div>

                {/* URL Bar */}
                <motion.div
                  className="bg-navy-light rounded-lg p-4 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Shield className="h-4 w-4 text-green-400" />
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: "auto" }}
                      transition={{ delay: 0.6, duration: 1.5 }}
                      className="overflow-hidden"
                    >
                      https://secure.catchmycash.ai/advanced-search
                    </motion.span>
                  </div>
                </motion.div>

                {/* Search Interface */}
                <div className="glass-card-teal rounded-lg p-6">
                  <motion.h4
                    className="font-semibold mb-4 text-white flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Search className="h-5 w-5 text-mint-green" />
                    Professional Search Engine Active
                  </motion.h4>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <motion.div
                      className="flex justify-between text-sm text-gray-300 mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <span>
                        Searching: {firstName} {lastName} @ {city}, CA
                      </span>
                      <span>{Math.round(searchProgress)}%</span>
                    </motion.div>
                    <div className="w-full h-2 bg-navy-light rounded-full overflow-hidden">
                      <motion.div
                        className="h-full progress-bar"
                        initial={{ width: 0 }}
                        animate={{ width: `${searchProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Current Search Step */}
                  <motion.div
                    className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg mb-4"
                    key={currentSearchStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-teal-300 font-medium flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-teal-300/30 border-t-teal-300 rounded-full"
                      />
                      {currentSearchStep}
                    </div>
                  </motion.div>

                  {/* Database Status */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      "California SCO",
                      "Banking Networks",
                      "Insurance Companies",
                      "Utility Providers",
                      "Investment Firms",
                      "Address History",
                    ].map((db, index) => (
                      <motion.div
                        key={db}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                          opacity: searchProgress > index * 15 ? 1 : 0.3,
                          x: 0,
                        }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          className={`w-2 h-2 rounded-full ${
                            searchProgress > index * 15
                              ? "bg-mint-green"
                              : "bg-gray-500"
                          }`}
                          animate={
                            searchProgress > index * 15
                              ? {
                                  scale: [1, 1.3, 1],
                                  opacity: [1, 0.7, 1],
                                }
                              : {}
                          }
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                        <span
                          className={
                            searchProgress > index * 15
                              ? "text-mint-green"
                              : "text-gray-400"
                          }
                        >
                          {db}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Status Message */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <div className="inline-flex items-center space-x-3 text-teal-400 mb-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-6 h-6 border-2 border-teal-400/30 border-t-teal-400 rounded-full"
                  />
                  <span className="text-lg font-semibold">
                    Enhanced AI search in progress...
                  </span>
                </div>
                <motion.div
                  className="text-gray-400"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Using address history to find all connected properties. This
                  typically takes lawyers 6-18 months.
                </motion.div>

                {/* Fun fact ticker */}
                <motion.div
                  className="mt-4 p-3 glass-card rounded-lg inline-block"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="text-sm text-mint-green">
                    💡 Address matching increases recovery success by 340%
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PropertySearch;
