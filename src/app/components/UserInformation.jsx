import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from './uicomponents/Button';
import { Card } from './uicomponents/Card';
import { Textarea } from './uicomponents/Textarea';
import {
  ArrowLeft,
  Shield,
  FileText,
  Clock,
  Eye,
  MapPin,
  Home,
  Calendar,
  Mail,
  Phone,
  User,
  CreditCard,
  Building,
} from 'lucide-react';
import { InputField } from './uicomponents/InputField';
import { useSearchStore } from '../store/searchStore';
import axios from 'axios';

const UserInformation = ({ onNext, onFieldFilled, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'CA',
    zipCode: '',
    dateOfBirth: '',
    ssn: '',
    currentEmployer: '',
    formerEmployers: '',
    previousAddresses: '',
  });
  const [errorModal, setErrorModal] = useState({
    show: false,
    title: '',
    message: '',
  });
  const [nextPageData, setNextPageData] = useState(null);
  const {
    userData,
    setUserAgreement,
    setUserLogin,
    searchResults,
    setSearchResults,
    ownPropertyIds,
  } = useSearchStore();
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    dateOfBirth: '',
    ssn: '',
  });
  const [apiError, setApiError] = useState('');
  const [agreeSMS, setAgreeSMS] = useState(false);
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (userData?.first_name && userData?.last_name) {
      setFormData((prev) => ({
        ...prev,
        fullName: `${userData.first_name} ${userData.last_name}`,
      }));
    }
  }, [userData]);
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => {
      const updated = {
        ...prev,
        [field]: '',
      };

      if (field === 'address') {
        const urlRegex =
          /^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|net|org|io|co|gov|edu|info|biz|me|us|uk|ca|au)(\/.*)?$)/i;

        if (value.trim() && urlRegex.test(value.trim())) {
          updated.address =
            'Please enter a valid street address, not a website URL.';
        }
      }

      if (field === 'fullName') {
        const nameRegex = /^[A-Za-z\s]*$/;

        if (value && !nameRegex.test(value)) {
          updated.fullName = 'Full name can only contain letters and spaces.';
        }
      }

      if (field === 'email') {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if (value.trim() && !emailRegex.test(value.trim())) {
          updated.email = 'Please enter a valid email address.';
        }
      }
      return updated;
    });
  };
  const setCityRef = useRef(null);
  const setAddressRef = useRef(null);
  const setZipRef = useRef(null);

  useEffect(() => {
    setAddressRef.current = (val) => handleInputChange('address', val);
    setCityRef.current = (val) => handleInputChange('city', val);
    setZipRef.current = (val) => handleInputChange('zipCode', val);
  });

  useEffect(() => {
    function initAutocomplete() {
      if (!addressInputRef.current) return;
      if (autocompleteRef.current) return;
      if (!window.google?.maps?.places?.Autocomplete) return;

      const ac = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'address_components'],
        },
      );
      autocompleteRef.current = ac;

      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.address_components) return;

        let streetNum = '',
          route = '',
          cityName = '',
          zip = '';

        place.address_components.forEach((c) => {
          const t = c.types ?? [];
          if (t.includes('street_number')) streetNum = c.long_name ?? '';
          if (t.includes('route')) route = c.long_name ?? '';
          if (t.includes('locality')) cityName = c.long_name ?? '';
          if (!cityName && t.includes('sublocality_level_1'))
            cityName = c.long_name ?? '';
          if (!cityName && t.includes('administrative_area_level_3'))
            cityName = c.long_name ?? '';
          if (!cityName && t.includes('administrative_area_level_2'))
            cityName = c.long_name ?? '';
          if (t.includes('postal_code')) zip = c.long_name ?? '';
        });

        const street =
          [streetNum, route].filter(Boolean).join(' ') ||
          place.formatted_address ||
          '';

        setAddressRef.current(street);
        setCityRef.current(cityName);
        setZipRef.current(zip);
      });
    }

    function onScriptReady() {
      initAutocomplete();
    }

    function loadScript() {
      if (document.getElementById('google-maps-script')) return;
      const s = document.createElement('script');
      s.id = 'google-maps-script';
      s.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
      s.async = true;
      s.defer = true;
      s.onload = onScriptReady;
      s.onerror = () => console.error('Google Maps failed to load');
      document.head.appendChild(s);
    }

    const existing = document.getElementById('google-maps-script');
    if (!existing) loadScript();
    else if (window.google?.maps?.places) initAutocomplete();
    else existing.addEventListener('load', onScriptReady);

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(
          autocompleteRef.current,
        );
        autocompleteRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const savedProperty = localStorage.getItem('propertyData');
    if (savedProperty && savedProperty !== 'undefined') {
      try {
        setSearchResults(JSON.parse(savedProperty));
      } catch (e) {
        console.error('Failed to parse propertyData from localStorage', e);
      }
    }
  }, []);

  const handlePhoneChange = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    let formatted = digits;
    if (digits.length > 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      formatted = `(${digits}`;
    }
    handleInputChange('phone', formatted);
  };

  const handlePhoneBlur = () => {
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setErrors((prev) => ({
        ...prev,
        phone: 'Phone number must be exactly 10 digits.',
      }));
    } else {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  const handleSSNChange = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    let formatted = digits;
    if (digits.length > 5) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    handleInputChange('ssn', formatted);
  };

  const handleSSNBlur = () => {
    const ssnDigits = formData.ssn.replace(/\D/g, '');
    if (ssnDigits.length !== 9) {
      setErrors((prev) => ({ ...prev, ssn: 'SSN must be exactly 9 digits.' }));
    } else {
      setErrors((prev) => ({ ...prev, ssn: '' }));
    }
  };

  const handleZipBlur = () => {
    const zip = formData.zipCode;
    const zipRegex = /^\d{5}$/;
    if (!zipRegex.test(zip)) {
      setErrors((prev) => ({
        ...prev,
        zipCode: 'ZIP code must be exactly 5 digits.',
      }));
    } else {
      setErrors((prev) => ({ ...prev, zipCode: '' }));
    }
  };

  const getFirstAndLastName = (fullName = '') => {
    const trimmed = fullName.trim();
    if (!trimmed.includes(' ')) {
      return { firstName: trimmed, lastName: '' };
    }
    const firstSpaceIndex = trimmed.indexOf(' ');
    return {
      firstName: trimmed.slice(0, firstSpaceIndex),
      lastName: trimmed.slice(firstSpaceIndex + 1),
    };
  };

  useEffect(() => {
    const requiredFields = [
      formData.fullName,
      formData.email,
      formData.phone,
      formData.address,
      formData.city,
      formData.zipCode,
      formData.dateOfBirth,
      formData.ssn,
    ];
    const count = requiredFields.filter((v) => v && v.trim()).length;
    onFieldFilled?.(count);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    let newErrors = {};

    const requiredFields = {
      fullName: 'Full name is required.',
      email: 'Email is required.',
      phone: 'Phone number is required.',
      address: 'Address is required.',
      city: 'City is required.',
      zipCode: 'ZIP code is required.',
      dateOfBirth: 'Date of birth is required.',
      ssn: 'SSN is required.',
    };

    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!formData[field]?.trim()) {
        newErrors[field] = message;
      }
    });

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits.';
    }

    const ssnDigits = formData.ssn.replace(/\D/g, '');
    if (ssnDigits.length !== 9) {
      newErrors.ssn = 'SSN must be exactly 9 digits.';
    }

    const zipDigits = formData.zipCode.replace(/\D/g, '');
    if (zipDigits.length !== 5) {
      newErrors.zipCode = 'ZIP code must be exactly 5 digits.';
    }

    const nameRegex = /^[A-Za-z\s]+$/;

    if (!nameRegex.test(formData.fullName.trim())) {
      newErrors.fullName = 'Full name can only contain letters and spaces.';
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!agreeSMS) {
      setApiError('You must agree to receive SMS updates before continuing.');
      return;
    } else {
      setApiError('');
    }

    try {
      setLoading(true);
      const payload = {
        user_id: userData._id,
        legal_name: formData.fullName,
        date_of_birth: formData.dateOfBirth,
        email_id: formData.email,
        contact_no: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        ssn_id: formData.ssn,
        company_name: formData.currentEmployer,
        formal_employer: formData.formerEmployers,
        previous_address: formData.previousAddresses,
      };
      const payloadData = {
        userEmail: formData.email,
        user_id: userData._id,
        userType: 'User',
      };

      const { firstName, lastName } = getFirstAndLastName(formData.fullName);
      const [dobYear, dobMonth, dobDay] = formData.dateOfBirth.split('-');

      const claimSubmissionPayloadData = {
        userId: userData._id,
        property_ids: ownPropertyIds,
        form_data: {
          firstName: firstName,
          lastName: lastName,
          email: 'help@mail.catchmycash.com',
          phone1: formData.phone,
          taxID: formData.ssn,
          dobMonth: dobMonth,
          dobDay: dobDay,
          dobYear: dobYear,
          address1: formData.address,
          address2: '',
          city: formData.city,
          state: 'CA',
          postalCode: formData.zipCode,
          countryCode: 'USA',
          taxIdentifierType: 'Individual',
          sourceOfClaim: '1',
          assistedByFinder: false,
        },
        max_concurrent: 1,
        max_search_pages: 1,
        post_click_wait_secs: 10,
        enable_document_upload: false,
        claim_id_override: '',
        documents_to_upload: [],
      };

      let userLoginRes;
      try {
        userLoginRes = await axios.post('/api/register', payloadData);
        setUserLogin(userLoginRes.data);
        localStorage.setItem('userLogin', JSON.stringify(userLoginRes.data));
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          'This email is already registered. Please use a different email or log in.';
        setErrorModal({
          show: true,
          title: 'Registration Failed',
          message: msg,
        });
        setLoading(false);
        return;
      }

      let claimSubmission;
      try {
        const res = await axios.post(
          '/api/claim-submission',
          claimSubmissionPayloadData,
        );
        claimSubmission = res.data;
        console.log('--claimSubmission--', claimSubmission);

        if (claimSubmission.failed > 0 && claimSubmission.succeeded === 0) {
          const failedMessages = claimSubmission.results
            ?.filter((r) => !r.success)
            .map((r) => r.message)
            .join(' ');

          setErrorModal({
            show: true,
            title: 'Claim Submission Failed',
            message:
              failedMessages ||
              'We were unable to submit your claim. Please try again.',
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        setErrorModal({
          show: true,
          title: 'Claim Submission Failed',
          message:
            err.response?.data?.message ||
            'An unexpected error occurred while submitting your claim.',
        });
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.post('/api/legalDetails', {
          ...payload,
          claimSubmission: {
            ...claimSubmission,
            property_ids: ownPropertyIds,
          },
        });
        setUserAgreement(data);
        localStorage.setItem('userAgreement', JSON.stringify(data));

        if (data.userCase) {
          localStorage.setItem('userCase', JSON.stringify(data.userCase));
        }

        setNextPageData(data);

        setErrorModal({
          show: true,
          title: 'Claim is in Process',
          message:
            'We have sent an email with your login details, and your claim is currently being processed. Please wait. We will send updates to your email.',
        });
      } catch (err) {
        setErrorModal({
          show: true,
          title: 'Something Went Wrong',
          message:
            err.response?.data?.message ||
            'We could not save your legal details. Please try again.',
        });
      }
    } catch (err) {
      console.error('Error saving user properties:', err);
      if (err.response && err.response.data?.message) {
        setApiError(err.response.data.message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] pt-5 relative">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-[#E1261C]/30 border-t-[#E1261C] rounded-full"
          />
          <p className="mt-4 text-lg font-semibold text-[#0A0A0A]">
            Submitting Information...
          </p>
          <p className="text-[#4A4A4A]">
            Please wait while we process your request.
          </p>
        </motion.div>
      )}
      <style>{`
        .pac-container {
          z-index: 99999 !important;
          background-color: #FFFFFF !important;
          border: 1px solid #FCE9E7 !important;
          border-radius: 0.5rem !important;
          margin-top: 4px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
          overflow: hidden !important;
        }
        .pac-item {
          color: #4A4A4A !important;
          padding: 0.6rem 1rem !important;
          font-size: 0.875rem !important;
          border-top: 1px solid #E8E6E3 !important;
          cursor: pointer !important;
          background: transparent !important;
          font-family: 'Inter', system-ui, sans-serif !important;
        }
        .pac-item:first-child { border-top: none !important; }
        .pac-item:hover, .pac-item.pac-item-selected {
          background-color: #FCE9E7 !important;
        }
        .pac-item-query { color: #0A0A0A !important; font-size: 0.875rem !important; }
        .pac-matched { color: #E1261C !important; font-weight: 600 !important; }
        .pac-icon, .pac-icon-marker { display: none !important; }
        .pac-logo::after { display: none !important; }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E3] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-[#0A0A0A] font-['Fraunces']">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E1261C]"></span>
            CatchMyCash
          </h1>
          <p className="text-[#4A4A4A] mt-1">
            Investigator Agreement Information
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          className="mb-8"
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
        {/* Info Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-[#E1261C]" />
          </div>
          <h2 className="text-3xl font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
            Investigator{' '}
            <span className="text-[#E1261C] italic font-normal">Agreement</span>
          </h2>
          <p className="text-[#4A4A4A] mb-6">
            We need some information to prepare your legal documents and begin
            the recovery process
          </p>
        </div>

        {/* Security Notice - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-[#FCE9E7] rounded-full flex items-center justify-center mr-3">
              <Shield className="h-5 w-5 text-[#E1261C]" />
            </div>
            <h3 className="font-bold text-[#0A0A0A] font-['Fraunces']">
              Your Information is Secure
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-[#E1261C] font-['JetBrains_Mono']">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
              256-bit encryption
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
              GDPR compliant
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
              Licensed investigators
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={loading}>
            <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 md:p-8 shadow-md">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information Section */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-[#E1261C]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
                      Personal{' '}
                      <span className="text-[#E1261C] italic font-normal">
                        Information
                      </span>
                    </h3>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Full Legal Name *
                  </label>
                  <InputField
                    type="text"
                    value={formData.fullName}
                    placeholder="As it appears on government documents"
                    className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg focus:border-[#E1261C] focus:outline-none transition-all ${
                      errors.fullName ? 'border-[#E1261C]' : 'border-[#E8E6E3]'
                    } bg-[#F0EEEB] cursor-not-allowed`}
                    required
                    disabled
                  />
                  {errors.fullName && (
                    <p className="text-[#E1261C] text-xs mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Date of Birth *
                  </label>
                  <InputField
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleInputChange('dateOfBirth', e.target.value)
                    }
                    max={today}
                    className={`w-full text-[#0A0A0A] border-2 rounded-lg focus:border-[#E1261C] focus:outline-none transition-all ${
                      errors.dateOfBirth
                        ? 'border-[#E1261C]'
                        : 'border-[#E8E6E3]'
                    }`}
                    required
                  />
                  {errors.dateOfBirth && (
                    <p className="text-[#E1261C] text-xs mt-1">
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Email Address *
                  </label>
                  <InputField
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg focus:border-[#E1261C] focus:outline-none transition-all ${
                      errors.email ? 'border-[#E1261C]' : 'border-[#E8E6E3]'
                    }`}
                    required
                  />
                  {errors.email && (
                    <p className="text-[#E1261C] text-xs mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Phone Number *
                  </label>
                  <InputField
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(555) 123-4567"
                    onBlur={handlePhoneBlur}
                    className="w-full text-[#0A0A0A] placeholder-[#888888] border-2 border-[#E8E6E3] rounded-lg focus:border-[#E1261C] focus:outline-none transition-all"
                    required
                  />
                  {errors.phone && (
                    <p className="text-[#E1261C] text-xs mt-1">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Social Security Number *
                  </label>
                  <InputField
                    type="text"
                    value={formData.ssn}
                    onChange={(e) => handleSSNChange(e.target.value)}
                    onBlur={handleSSNBlur}
                    placeholder="XXX-XX-XXXX"
                    className="w-full text-[#0A0A0A] placeholder-[#888888] border-2 border-[#E8E6E3] rounded-lg focus:border-[#E1261C] focus:outline-none transition-all"
                    required
                  />
                  <p className="text-xs text-[#888888] mt-1">
                    Required for identity verification
                  </p>
                  {errors.ssn && (
                    <p className="text-[#E1261C] text-xs mt-1">{errors.ssn}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Current Employer
                  </label>
                  <InputField
                    type="text"
                    value={formData.currentEmployer}
                    onChange={(e) =>
                      handleInputChange('currentEmployer', e.target.value)
                    }
                    placeholder="Company name"
                    className="w-full text-[#0A0A0A] placeholder-[#888888] border-2 border-[#E8E6E3] rounded-lg focus:border-[#E1261C] focus:outline-none transition-all"
                  />
                </div>

                {/* Address Information Section */}
                <div className="md:col-span-2 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-[#E1261C]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
                      Current{' '}
                      <span className="text-[#E1261C] italic font-normal">
                        Address
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Street Address *
                  </label>
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={formData.address}
                    placeholder="Enter address…"
                    autoComplete="new-password"
                    onChange={(e) =>
                      handleInputChange('address', e.target.value)
                    }
                    required
                    className={`w-full rounded-lg border-2 bg-white px-4 py-2.5 text-sm text-[#0A0A0A] placeholder-[#888888] leading-6 focus:outline-none focus:border-[#E1261C] transition-all duration-300 ${
                      errors.address ? 'border-[#E1261C]' : 'border-[#E8E6E3]'
                    }`}
                  />
                  {errors.address && (
                    <p className="text-[#E1261C] text-xs mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    City *
                  </label>
                  <InputField
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Los Angeles"
                    className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg focus:border-[#E1261C] focus:outline-none transition-all ${
                      errors.city ? 'border-[#E1261C]' : 'border-[#E8E6E3]'
                    }`}
                    required
                  />
                  {errors.city && (
                    <p className="text-[#E1261C] text-xs mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    ZIP Code *
                  </label>
                  <InputField
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) =>
                      handleInputChange('zipCode', e.target.value)
                    }
                    onBlur={handleZipBlur}
                    placeholder="90210"
                    className="w-full text-[#0A0A0A] placeholder-[#888888] border-2 border-[#E8E6E3] rounded-lg focus:border-[#E1261C] focus:outline-none transition-all"
                    required
                  />
                  {errors.zipCode && (
                    <p className="text-[#E1261C] text-xs mt-1">
                      {errors.zipCode}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    State
                  </label>
                  <InputField
                    type="text"
                    value={formData.state}
                    readOnly
                    className="w-full text-[#0A0A0A] bg-[#F0EEEB] border-2 border-[#E8E6E3] rounded-lg cursor-not-allowed"
                    disabled
                  />
                </div>

                {/* Additional Information Section */}
                <div className="md:col-span-2 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center">
                      <Building className="h-4 w-4 text-[#E1261C]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
                      Additional{' '}
                      <span className="text-[#E1261C] italic font-normal">
                        Information
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Former Employers (if applicable)
                  </label>
                  <Textarea
                    value={formData.formerEmployers}
                    onChange={(e) =>
                      handleInputChange('formerEmployers', e.target.value)
                    }
                    placeholder="List any companies you've worked for that might have unclaimed property..."
                    rows={3}
                    className="w-full text-[#0A0A0A] placeholder-[#888888] border-2 border-[#E8E6E3] rounded-lg focus:border-[#E1261C] focus:outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Previous Addresses (if applicable)
                  </label>
                  <Textarea
                    value={formData.previousAddresses}
                    onChange={(e) =>
                      handleInputChange('previousAddresses', e.target.value)
                    }
                    placeholder="List any previous addresses where you might have lived..."
                    rows={3}
                    className="w-full text-[#0A0A0A] placeholder-[#888888] border-2 border-[#E8E6E3] rounded-lg focus:border-[#E1261C] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Agreement Terms - Red Themed */}
              <div className="mt-8 p-4 bg-[#FCE9E7] rounded-lg border border-[#E8E6E3]">
                <h4 className="font-bold text-[#0A0A0A] mb-2 font-['Fraunces']">
                  Agreement{' '}
                  <span className="text-[#E1261C] italic font-normal">
                    Terms
                  </span>
                </h4>
                <ul className="text-sm text-[#4A4A4A] space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    CatchMyCash will act as your authorized investigator
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    Our fee is 10% of any successfully recovered property
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    No upfront costs or fees
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    You only pay if we successfully recover your money
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    All information provided is confidential and secure
                  </li>
                </ul>
              </div>

              {/* SMS Agreement */}
              <div className="mt-4">
                <label className="flex items-center space-x-2 text-sm text-[#0A0A0A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeSMS}
                    onChange={(e) => setAgreeSMS(e.target.checked)}
                    className="h-4 w-4 text-[#E1261C] rounded border-[#E8E6E3] focus:ring-[#E1261C]"
                  />
                  <span>
                    I agree to receive SMS updates from CatchMyCash about my
                    claim.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <div className="flex items-center text-[#E1261C]">
                  <Clock className="h-5 w-5 mr-2" />
                  <span className="text-sm font-['JetBrains_Mono']">
                    Next: Automatic form preparation
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 w-auto min-w-[300px] ${
                    loading
                      ? 'bg-[#D4D4D4] text-[#888888] cursor-not-allowed'
                      : 'bg-[#E1261C] hover:bg-[#B11912] shadow-md hover:shadow-lg'
                  }`}
                >
                  {loading ? (
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
                      Submitting...
                    </>
                  ) : (
                    'Continue to Form Automation'
                  )}
                </button>
              </div>

              {apiError && (
                <p className="text-[#E1261C] text-sm mt-3 text-center w-full">
                  {apiError}
                </p>
              )}
            </div>
          </fieldset>
        </form>
        <ErrorModal
          show={errorModal.show}
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => {
            setErrorModal({
              show: false,
              title: '',
              message: '',
            });

            if (nextPageData) {
              onNext(nextPageData);
            }
          }}
        />
      </div>
    </div>
  );
};

const ErrorModal = ({ show, title, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-[#E8E6E3] rounded-xl shadow-lg max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#FCE9E7] rounded-full flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-[#E1261C]" />
          </div>
          <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
            {title}
          </h3>
        </div>
        <p className="text-sm text-[#4A4A4A] mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 bg-[#E1261C] hover:bg-[#B11912] text-white font-semibold rounded-lg transition-all duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UserInformation;
