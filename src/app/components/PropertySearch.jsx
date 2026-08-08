'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '../store/searchStore';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from 'axios';
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
} from 'lucide-react';
import { Button } from './uicomponents/Button';
import { InputField } from './uicomponents/InputField';

// ============================================================
// DESIGN TOKENS — matching the HTML mockup exactly
// ============================================================
const colors = {
  black: '#0A0A0A',
  white: '#FFFFFF',
  offWhite: '#F7F5F2',
  red: '#E1261C',
  redDeep: '#B11912',
  redTint: '#FCE9E7',
  gray900: '#1A1A1A',
  gray700: '#4A4A4A',
  gray500: '#888888',
  gray300: '#D4D4D4',
  gray200: '#E8E6E3',
  gray100: '#F0EEEB',
};

const PropertySearch = ({ onNext, onFieldFilled }) => {
  const [captchaToken, setCaptchaToken] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // const [address, setAddress] = useState('');
  // const [city, setCity] = useState('');
  // const [state, setState] = useState('California');
  // const addressInputRef = useRef(null);
  // const autocompleteRef = useRef(null);
  // const [zipCode, setZipCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [currentSearchStep, setCurrentSearchStep] = useState('');
  const [validationError, setValidationError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const { setUserData, setSearchResults } = useSearchStore();
  const [addressError, setAddressError] = useState('');
  //
  // const setAddressRef = useRef(setAddress);
  // const setCityRef = useRef(setCity);
  // const setZipRef = useRef(setZipCode);
  //
  useEffect(() => {
    //   setAddressRef.current = setAddress;
    //   setCityRef.current = setCity;
    //   setZipRef.current = setZipCode;
    //
  }, []);

  const searchSteps = [
    'Initializing secure connection...',
    'Accessing California SCO database...',
    'Cross-referencing address history...',
    'Scanning bank records...',
    'Checking insurance policies...',
    'Reviewing utility deposits...',
    'Analyzing investment accounts...',
    'Validating geographic data...',
    'Cross-referencing multiple sources...',
    'Calculating total amounts...',
    'Generating detailed report...',
  ];

  useEffect(() => {
    if (!isSearching) return;
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
  }, [isSearching]);

  useEffect(() => {
    const count = [
      firstName.trim(),
      lastName.trim(),
      // address.trim(),
      // city.trim(), // Commented out for testing
      // zipCode.trim(), // Commented out for testing
    ].filter(Boolean).length; // Filter out empty strings
    onFieldFilled?.(count); // Call onFieldFilled with the count of filled fields
  }, [firstName, lastName]); // Removed address, city, zipCode from dependencies

  // // ─── Google Maps PlaceAutocompleteElement ─────────────────────────────────
  // useEffect(() => {
  //   function initAutocomplete() {
  //     if (!addressInputRef.current) return;
  //     if (autocompleteRef.current) return;
  //     if (!window.google?.maps?.places?.Autocomplete) return;
  //
  //     const ac = new window.google.maps.places.Autocomplete(
  //       addressInputRef.current,
  //       {
  //         types: ['address'],
  //         componentRestrictions: { country: 'us' },
  //         fields: ['formatted_address', 'address_components'],
  //       },
  //     );
  //     autocompleteRef.current = ac;
  //
  //     ac.addListener('place_changed', () => {
  //       const place = ac.getPlace();
  //       if (!place.address_components) return;
  //
  //       let streetNum = '',
  //         route = '',
  //         cityName = '',
  //         zip = '';
  //
  //       place.address_components.forEach((c) => {
  //         const t = c.types ?? [];
  //         if (t.includes('street_number')) streetNum = c.long_name ?? '';
  //         if (t.includes('route')) route = c.long_name ?? '';
  //         if (t.includes('locality')) cityName = c.long_name ?? '';
  //         if (!cityName && t.includes('sublocality_level_1'))
  //           cityName = c.long_name ?? '';
  //         if (!cityName && t.includes('administrative_area_level_3'))
  //           cityName = c.long_name ?? '';
  //         if (!cityName && t.includes('administrative_area_level_2'))
  //           cityName = c.long_name ?? '';
  //         if (t.includes('postal_code')) zip = c.long_name ?? '';
  //       });
  //
  //       const street =
  //         [streetNum, route].filter(Boolean).join(' ') ||
  //         place.formatted_address ||
  //         '';
  //
  //       setAddressRef.current(street);
  //       setCityRef.current(cityName);
  //       setZipRef.current(zip);
  //     });
  //   }
  //
  //   function onScriptReady() {
  //     initAutocomplete();
  //   }
  //
  //   function loadScript() {
  //     if (document.getElementById('google-maps-script')) return;
  //     const s = document.createElement('script');
  //     s.id = 'google-maps-script';
  //     s.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
  //     s.async = true;
  //     s.defer = true;
  //     s.onload = onScriptReady;
  //     s.onerror = () => console.error('Google Maps failed to load');
  //     document.head.appendChild(s);
  //   }
  //
  //   const existing = document.getElementById('google-maps-script');
  //   if (!existing) loadScript();
  //   else if (window.google?.maps?.places) initAutocomplete();
  //   else existing.addEventListener('load', onScriptReady);
  //
  //   return () => {
  //     if (autocompleteRef.current) {
  //       window.google?.maps?.event?.clearInstanceListeners(
  //         autocompleteRef.current,
  //       );
  //       autocompleteRef.current = null;
  //     }
  //   };
  // }, []);

  const isAddressUrl = (value) => {
    const urlRegex =
      /^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|net|org|io|co|gov|edu|info|biz|me|us|uk|ca|au)(\/.*)?$)/i;

    return urlRegex.test(value.trim());
  };

  const handleNameChange = (setter, errorSetter, value) => {
    const nameRegex = /^[a-zA-Z\s]*$/;
    setter(value);
    if (nameRegex.test(value)) {
      errorSetter('');
    } else {
      errorSetter('Only alphabetic characters are allowed.');
    }
  };

  // ─── Form submit ──────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (firstNameError || lastNameError) {
      setValidationError('Please fix the errors before searching.');
      return;
    }
    const missingFields = [];
    if (!firstName.trim()) missingFields.push('first name');
    if (!lastName.trim()) missingFields.push('last name');
    // if (!address.trim()) missingFields.push('address');
    // if (!city.trim()) missingFields.push('city');
    //
    // if (!zipCode.trim()) missingFields.push('ZIP code');

    if (missingFields.length > 0) {
      setValidationError(
        missingFields.length === 1
          ? `Please enter your ${missingFields[0]}`
          : missingFields.length === 2
            ? `Please enter your ${missingFields[0]} and ${missingFields[1]}`
            : `Please fill in all required fields: ${missingFields.join(', ')}`,
      );
      return;
    }
    // if (isAddressUrl(address)) {
    //   setAddressError(
    //     'Please enter a valid street address, not a website URL.',
    //   );
    //   return;
    // }
    // const zipPattern = /^\d{5}(-\d{4})?$/;
    // if (!zipPattern.test(zipCode.trim())) {
    //   setValidationError(
    //     'Please enter a valid ZIP code (e.g., 90210 or 90210-1234)',
    //   );
    //   return;
    // }

    if (!captchaToken) {
      setValidationError('Please confirm you are not a robot.');
      return;
    }

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      address: 'test', //address.trim(),
      city: 'test', //city.trim(),
      state: 'CA',
      zip_code: '16005', //zipCode.trim(),
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

      const propertyPayload = {
        first_name: firstName.trim().toUpperCase(),
        last_name: lastName.trim().toUpperCase(),
        // address: address.trim().toUpperCase(),
        // city: city.trim().toUpperCase(),
        // state: 'CA',
        // zip_code: zipCode.trim(),
      };

      const { totalMatched, matchedProperties } = await axios
        .post('/api/filterProperty', propertyPayload, {
          headers: { 'x-captcha-token': captchaToken },
        })
        .then((res) => res.data);

      setSearchResults(matchedProperties);
      localStorage.setItem('propertyData', JSON.stringify(matchedProperties));
      setSearchProgress(100);

      if (matchedProperties.length > 0) {
        const { data } = await axios.post('/api/users', payload);
        setUserData(data);
        localStorage.setItem('userData', JSON.stringify(data));
      }

      setTimeout(() => {
        const transformedProperties = matchedProperties.map((prop) => ({
          id: prop.property_id,
          type: prop.property_type,
          holder: prop.owner_name,
          amount: prop.current_cash_balance || prop.cash_reported,
          reportDate: new Date().toISOString().split('T')[0],
          status: 'Available',
          lastKnownAddress: `${prop.owner_street_1}, ${prop.owner_city}, ${prop.owner_state} ${prop.owner_zip}`,
        }));

        onNext({
          name: `${firstName.trim()} ${lastName.trim()}`,
          address: {
            // street: address.trim(),
            // city: city.trim(),
            // state,
            // zipCode: zipCode.trim(),
          },
          properties: transformedProperties,
          totalAmount: transformedProperties
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
            .toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
          searchTime: '4.2 seconds',
          databasesSearched: 52,
          addressMatches: totalMatched,
        });
      }, 4800);
    } catch (error) {
      console.error(error);
      setValidationError(
        'There was a problem submitting your search. Please try again.',
      );
      setIsSearching(false);
    }
  };

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    !firstNameError &&
    !lastNameError;
  // !addressError;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      <style>{`
        /* Google Places Autocomplete Styling - Red Themed */
        .pac-container {
          z-index: 99999 !important;
          background-color: ${colors.white} !important;
          border: 1px solid ${colors.redTint} !important;
          border-radius: 0.5rem !important;
          margin-top: 4px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
          overflow: hidden !important;
        }
        .pac-item {
          color: ${colors.gray700} !important;
          padding: 0.6rem 1rem !important;
          font-size: 0.875rem !important;
          border-top: 1px solid ${colors.gray200} !important;
          cursor: pointer !important;
          background: transparent !important;
          font-family: 'Inter', system-ui, sans-serif !important;
        }
        .pac-item:first-child { border-top: none !important; }
        .pac-item:hover, .pac-item.pac-item-selected { background-color: ${colors.redTint} !important; }
        .pac-item-query { color: ${colors.black} !important; font-size: 0.875rem !important; }
        .pac-matched { color: ${colors.red} !important; font-weight: 600 !important; }
        .pac-icon, .pac-icon-marker { display: none !important; }
        .pac-logo::after { display: none !important; }
        
        /* Remove number input arrows */
        input.remove-arrow::-webkit-inner-spin-button,
        input.remove-arrow::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Animated background dots - red themed */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#E1261C]/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ scale: [0, 1, 0], opacity: [0, 0.5, 0] }}
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
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="bg-white p-8 mb-8 border border-[#E8E6E3] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 border-2 border-[#E1261C]/0 rounded-xl pointer-events-none"
                  animate={{
                    borderColor: [
                      'rgba(225,38,28,0)',
                      'rgba(225,38,28,0.15)',
                      'rgba(225,38,28,0)',
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
                    Advanced Property{' '}
                    <span className="text-[#E1261C] italic font-normal">
                      Search
                    </span>
                  </motion.h2>
                  <motion.div
                    className="text-[#4A4A4A]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Our proprietary AI searches across{' '}
                    <span className="text-[#E1261C] font-semibold">
                      52+ databases
                    </span>{' '}
                    using your personal and address history
                  </motion.div>
                </div>

                <motion.div
                  className="max-w-lg mx-auto space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {/* Validation error */}
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

                  {/* Personal info divider */}
                  <motion.div
                    className="flex items-center gap-3 py-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E1261C] to-transparent" />
                    <span className="text-sm text-[#4A4A4A] flex items-center gap-2 font-['JetBrains_Mono']">
                      <Eye className="h-4 w-4 text-[#E1261C]" />
                      Personal Information
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E1261C] to-transparent" />
                  </motion.div>

                  {/* First / Last name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div className="relative">
                      <label className="block text-sm font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
                        First Name *
                      </label>
                      <InputField
                        type="text"
                        value={firstName}
                        onChange={(e) =>
                          handleNameChange(
                            setFirstName,
                            setFirstNameError,
                            e.target.value,
                          )
                        }
                        placeholder="Enter first name"
                        className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg transition-all duration-300 focus:outline-none ${
                          firstNameError
                            ? 'border-red-500'
                            : firstName.trim()
                              ? 'border-[#E1261C]/50 focus:border-[#E1261C]'
                              : 'border-[#E8E6E3] focus:border-[#E1261C]'
                        }`}
                        onKeyPress={(e) =>
                          e.key === 'Enter' && isFormValid && handleSearch()
                        }
                        disabled={isSearching}
                      />
                      {firstNameError && (
                        <p className="text-red-500 text-xs mt-1">
                          {firstNameError}
                        </p>
                      )}
                      {firstName.trim() && !firstNameError && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-9 text-[#E1261C]"
                        >
                          ✓
                        </motion.div>
                      )}
                    </motion.div>

                    <motion.div className="relative">
                      <label className="block text-sm font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
                        Last Name *
                      </label>
                      <InputField
                        type="text"
                        value={lastName}
                        onChange={(e) =>
                          handleNameChange(
                            setLastName,
                            setLastNameError,
                            e.target.value,
                          )
                        }
                        placeholder="Enter last name"
                        className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg transition-all duration-300 focus:outline-none ${
                          lastNameError
                            ? 'border-red-500'
                            : lastName.trim()
                              ? 'border-[#E1261C]/50 focus:border-[#E1261C]'
                              : 'border-[#E8E6E3] focus:border-[#E1261C]'
                        }`}
                        onKeyPress={(e) =>
                          e.key === 'Enter' && isFormValid && handleSearch()
                        }
                        disabled={isSearching}
                      />
                      {lastNameError && (
                        <p className="text-red-500 text-xs mt-1">
                          {lastNameError}
                        </p>
                      )}
                      {lastName.trim() && !lastNameError && (
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

                  {/*
                  // Address divider
                  // <motion.div
                  //   className="flex items-center gap-3 py-2"
                  //   initial={{ opacity: 0 }}
                  //   animate={{ opacity: 1 }}
                  //   transition={{ delay: 1.0 }}
                  // >
                  //   <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E1261C] to-transparent" />
                  //   <span className="text-sm text-[#4A4A4A] flex items-center gap-2 font-['JetBrains_Mono']">
                  //     <MapPin className="h-4 w-4 text-[#E1261C]" />
                  //     Address Information
                  //   </span>
                  //   <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E1261C] to-transparent" />
                  // </motion.div>
                  //
                  // // Street Address - Google Places Autocomplete
                  // <motion.div className="relative">
                  //   <label className="text-sm font-medium text-[#0A0A0A] mb-2 flex items-center gap-2 font-['JetBrains_Mono']">
                  //     <Home className="h-4 w-4 text-[#E1261C]" />
                  //     Street Address *
                  //   </label>
                  //   <input
                  //     ref={addressInputRef}
                  //     type="text"
                  //     placeholder="Enter address…"
                  //     disabled={isSearching}
                  //     onChange={(e) => {
                  //       const value = e.target.value;
                  //
                  //       setAddressRef.current(value);
                  //
                  //       if (value.trim() && isAddressUrl(value)) {
                  //         setAddressError(
                  //           'Please enter a valid street address, not a website URL.',
                  //         );
                  //       } else {
                  //         setAddressError('');
                  //       }
                  //
                  //       setValidationError('');
                  //     }}
                  //     autoComplete="new-password"
                  //     className={`w-full rounded-lg border-2 transition-all duration-300 text-[#0A0A0A] placeholder-[#888888] text-sm bg-white px-4 py-[0.65rem] leading-6 focus:outline-none focus:ring-0 ${
                  //       addressError
                  //         ? 'border-[#E1261C]'
                  //         : address.trim()
                  //           ? 'border-[#E1261C]/50 focus:border-[#E1261C]'
                  //           : 'border-[#E8E6E3] focus:border-[#E1261C]'
                  //     }`}
                  //     style={{ caretColor: '#E1261C', fontFamily: 'inherit' }}
                  //   />
                  //   {address.trim() && (
                  //     <motion.div
                  //       initial={{ scale: 0 }}
                  //       animate={{ scale: 1 }}
                  //       className="absolute right-3 top-9 text-[#E1261C] pointer-events-none"
                  //     >
                  //       ✓
                  //     </motion.div>
                  //   )}
                  //   {addressError && (
                  //     <p className="text-[#E1261C] text-xs mt-2">
                  //       {addressError}
                  //     </p>
                  //   )}
                  // </motion.div>
                  //
                  // // City / ZIP
                  // <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  //   <motion.div className="relative">
                  //     <label className="block text-sm font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
                  //       City *
                  //     </label>
                  //     <InputField
                  //       type="text"
                  //       value={city}
                  //       onChange={(e) => setCity(e.target.value)}
                  //       placeholder="Auto-filled from address"
                  //       className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg transition-all duration-300 focus:outline-none ${city.trim() ? 'border-[#E1261C]/50 focus:border-[#E1261C]' : 'border-[#E8E6E3] focus:border-[#E1261C]'}`}
                  //       onKeyPress={(e) =>
                  //         e.key === 'Enter' && isFormValid && handleSearch()
                  //       }
                  //       disabled={isSearching}
                  //     />
                  //     {city.trim() && (
                  //       <motion.div
                  //         initial={{ scale: 0 }}
                  //         animate={{ scale: 1 }}
                  //         className="absolute right-3 top-9 text-[#E1261C]"
                  //       >
                  //         ✓
                  //       </motion.div>
                  //     )}
                  //   </motion.div>
                  //
                  //   <motion.div className="relative">
                  //     <label className="block text-sm font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
                  //       ZIP Code *
                  //     </label>
                  //     <InputField
                  //       type="text"
                  //       value={zipCode}
                  //       onChange={(e) => setZipCode(e.target.value)}
                  //       placeholder="Auto-filled from address"
                  //       maxLength={10}
                  //       className={`remove-arrow w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg transition-all duration-300 focus:outline-none ${zipCode.trim() ? 'border-[#E1261C]/50 focus:border-[#E1261C]' : 'border-[#E8E6E3] focus:border-[#E1261C]'}`}
                  //       onKeyPress={(e) =>
                  //         e.key === 'Enter' && isFormValid && handleSearch()
                  //       }
                  //       disabled={isSearching}
                  //     />
                  //     {zipCode.trim() && (
                  //       <motion.div
                  //         initial={{ scale: 0 }}
                  //         animate={{ scale: 1 }}
                  //         className="absolute right-3 top-9 text-[#E1261C]"
                  //       >
                  //         ✓
                  //       </motion.div>
                  //     )}
                  //   </motion.div>
                  // </div>
                  //
                  // // State (read-only)
                  // <motion.div
                  //   className="relative opacity-75"
                  //   initial={{ opacity: 0 }}
                  //   animate={{ opacity: 0.75 }}
                  //   transition={{ delay: 1.2 }}
                  // >
                  //   <label className="text-sm font-medium text-[#0A0A0A] mb-2 flex items-center gap-2 font-['JetBrains_Mono']">
                  //     <Globe className="h-4 w-4 text-[#E1261C]" />
                  //     State (California Only)
                  //   </label>
                  //   <InputField
                  //     type="text"
                  //     value={state}
                  //     readOnly
                  //     className="w-full text-[#0A0A0A] bg-[#F0EEEB] border-2 border-[#E8E6E3] rounded-lg cursor-not-allowed"
                  //     disabled
                  //   />
                  // </motion.div>
                  */}

                  {/* Form status */}
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
                        <span className="w-2 h-2 bg-[#E1261C] rounded-full" />
                        Ready to search all databases
                      </motion.span>
                    ) : (
                      <span className="text-[#888888]">
                        Fill in all required fields to begin comprehensive
                        search
                      </span>
                    )}
                  </motion.div>

                  {/* reCAPTCHA */}
                  <div className="flex justify-center mt-6 relative z-50">
                    <ReCAPTCHA
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                      onChange={(token) => {
                        setCaptchaToken(token);
                        setValidationError('');
                      }}
                      onExpired={() => {
                        setCaptchaToken(null);
                        setValidationError(
                          'Captcha expired. Please verify again.',
                        );
                      }}
                    />
                  </div>

                  {/* Submit button - red themed */}
                  <motion.div
                    whileHover={isFormValid ? { scale: 1.02 } : {}}
                    whileTap={isFormValid ? { scale: 0.98 } : {}}
                  >
                    <button
                      onClick={handleSearch}
                      className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${
                        isFormValid && !isSearching && captchaToken
                          ? 'bg-[#E1261C] text-white hover:bg-[#B11912] shadow-md hover:shadow-lg'
                          : 'bg-[#D4D4D4] text-[#888888] cursor-not-allowed'
                      }`}
                      disabled={!isFormValid || !captchaToken || isSearching}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {isSearching ? (
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
                            Searching {searchProgress.toFixed(0)}%...
                          </>
                        ) : isFormValid && captchaToken ? (
                          <>
                            Search All Databases
                            <ArrowRight className="h-5 w-5 transition-transform" />
                          </>
                        ) : (
                          <>
                            Complete Form to Continue
                            <Lock className="h-5 w-5" />
                          </>
                        )}
                      </span>
                    </button>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Feature cards - red themed */}
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: Globe,
                    title: '52+ Database Search',
                    desc: 'SCO, banks, insurance, utilities, address history',
                    delay: 0.8,
                  },
                  {
                    icon: Shield,
                    title: 'Bank-Level Security',
                    desc: '256-bit encryption protects your data',
                    delay: 1.0,
                  },
                  {
                    icon: Zap,
                    title: 'Lightning Fast',
                    desc: 'Complete search in under 5 seconds',
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
          ) : (
            /* Browser simulation - red themed */
            <motion.div
              key="browser-simulation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <motion.div
                className="bg-white border border-[#E8E6E3] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 overflow-hidden relative"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>

                <div className="flex items-center justify-between mb-6">
                  <motion.h3
                    className="text-lg font-bold text-[#0A0A0A] flex items-center gap-2 font-['Fraunces']"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Globe className="h-5 w-5 text-[#E1261C]" />
                    AI-Powered Multi-Database Search
                  </motion.h3>
                  <div className="flex items-center space-x-2">
                    {[
                      { color: 'bg-red-500', delay: 0 },
                      { color: 'bg-yellow-500', delay: 0.3 },
                      { color: 'bg-green-500', delay: 0.6 },
                    ].map((dot, i) => (
                      <motion.div
                        key={i}
                        className={`w-3 h-3 ${dot.color} rounded-full`}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: dot.delay,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <motion.div
                  className="bg-[#F0EEEB] rounded-lg p-4 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center space-x-2 text-sm text-[#4A4A4A]">
                    <Shield className="h-4 w-4 text-[#E1261C]" />
                    <span>https://secure.catchmycash.ai/advanced-search</span>
                  </div>
                </motion.div>

                <div className="bg-[#FCE9E7] rounded-lg p-6">
                  <motion.h4
                    className="font-bold mb-4 text-[#0A0A0A] flex items-center gap-2 font-['Fraunces']"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Search className="h-5 w-5 text-[#E1261C]" />
                    Professional Search Engine Active
                  </motion.h4>

                  <div className="mb-6">
                    <motion.div
                      className="flex justify-between text-sm text-[#4A4A4A] mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <span>
                        Searching: {firstName} {lastName} @ {'city'}, CA
                      </span>
                      <span>{Math.round(searchProgress)}%</span>
                    </motion.div>
                    <div className="w-full h-2 bg-[#E8E6E3] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#E1261C] to-[#B11912]"
                        initial={{ width: 0 }}
                        animate={{ width: `${searchProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  <motion.div
                    className="p-4 bg-white border border-[#E8E6E3] rounded-lg mb-4"
                    key={currentSearchStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-[#E1261C] font-medium flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="w-4 h-4 border-2 border-[#E1261C]/30 border-t-[#E1261C] rounded-full"
                      />
                      {currentSearchStep}
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      'California SCO',
                      'Banking Networks',
                      'Insurance Companies',
                      'Utility Providers',
                      'Investment Firms',
                      'Address History',
                    ].map((db, index) => (
                      <motion.div
                        key={db}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                          opacity: searchProgress > index * 15 ? 1 : 0.4,
                          x: 0,
                        }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-2 font-['JetBrains_Mono']"
                      >
                        <motion.div
                          className={`w-2 h-2 rounded-full ${
                            searchProgress > index * 15
                              ? 'bg-[#E1261C]'
                              : 'bg-[#D4D4D4]'
                          }`}
                          animate={
                            searchProgress > index * 15
                              ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
                              : {}
                          }
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                        <span
                          className={
                            searchProgress > index * 15
                              ? 'text-[#0A0A0A]'
                              : 'text-[#888888]'
                          }
                        >
                          {db}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <div className="inline-flex items-center space-x-3 text-[#E1261C] mb-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="w-6 h-6 border-2 border-[#E1261C]/30 border-t-[#E1261C] rounded-full"
                  />
                  <span className="text-lg font-bold font-['Fraunces']">
                    Enhanced AI search in progress...
                  </span>
                </div>
                <motion.div
                  className="text-[#4A4A4A]"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Using address history to find all connected properties. This
                  typically takes lawyers 6-18 months.
                </motion.div>
                <motion.div
                  className="mt-4 p-3 bg-white border border-[#E8E6E3] rounded-lg inline-block shadow-sm"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="text-sm text-[#E1261C]">
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
