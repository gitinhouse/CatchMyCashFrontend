import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from './uicomponents/Button';
import { Card } from './uicomponents/Card';
import { Textarea } from './uicomponents/Textarea';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
  AlertCircle,
} from 'lucide-react';
import { InputField } from './uicomponents/InputField';
import { useSearchStore } from '../store/searchStore';
import { readVerifiedEmail, sessionEmail } from '../lib/verifiedEmail';
import axios from 'axios';

const getInputErrorClass = (hasError) =>
  hasError
    ? 'border-[#E1261C] bg-[#FCE9E7] ring-2 ring-[#E1261C]/20'
    : 'border-[#E8E6E3]';

const AGE_ERROR =
  'You must be at least 18 years old.';

// "YYYY-MM-DD" -> local Date (avoids the timezone shift from new Date(str))
const parseDOB = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

// Date -> "YYYY-MM-DD"
const formatDOB = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getAge = (dob) => {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

// The date picker opens on this date when nothing is selected yet
const getEighteenYearsAgo = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setFullYear(d.getFullYear() - 18);
  return d;
};

// "YYYY-MM-DD" -> "MM/DD/YYYY"
const toDisplayDOB = (str) => {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${m}/${d}/${y}`;
};

const DOB_FORMAT_ERROR = 'Please enter a complete, valid date (MM/DD/YYYY).';

const CLAIMANT_RELATIONSHIPS = [
  { value: 'MYSELF', label: 'Myself - Individual' },
  { value: 'BUSINESS - CORP', label: 'Business - Corporation' },
  { value: 'BUSINESS - PARTNERSHIP', label: 'Business - Partnership' },
  { value: 'BUSINESS - LLC', label: 'Business - LLC' },
  { value: 'BUSINESS - SOLE PROPIETOR', label: 'Business - Sole Proprietor' },
  { value: 'HEIR - TRUST', label: 'Heir - Trust' },
  { value: 'HEIR - WILL', label: 'Heir - Will' },
  { value: 'HEIR - COURT APPOINTED REP', label: 'Heir - Court Appointed Rep' },
  { value: 'HEIR - FINAL DECREE (BENEFICIARY)', label: 'Heir - Final Decree (Beneficiary)' },
  { value: 'HEIR - INTESTATE', label: 'Heir - Intestate' },
  { value: 'HOLDER REIMBURSEMENT', label: 'Holder Reimbursement' },
  { value: 'GOVERNMENT AGENCY', label: 'Government Agency' },
  { value: 'BANKRUPTCY TRUSTEE', label: 'Bankruptcy Trustee' },
];

// A refused claim names its reason under whichever of these the layer that
// refused it happens to use: the state portal, the automation server and our
// own route each word it differently, and the failure dialog is useless to the
// claimant without it. `upstream` is where /api/claim-submission parks an
// answer that was not a plain object.
const BODY_REASON_KEYS = [
  'message',
  'error',
  'errors',
  'reason',
  'detail',
  'details',
  'description',
  'upstream',
];

// A per-property entry describes the property as much as its refusal, so the
// keys that carry the property's own metadata are not read as the reason it
// was refused: a description of "Unclaimed deposit, Bank of X" is what the
// claim is about, not what went wrong with it.
const ENTRY_REASON_KEYS = ['message', 'error', 'errors', 'reason', 'detail'];

// Substituted by /api/claim-submission when the layer underneath it said
// nothing of its own, so they must never be shown in place of a real reason —
// they only repeat the dialog title.
const GENERIC_REASONS = ['claim submission failed', 'server error'];

// Whatever punctuation the sender ended it with, a placeholder is still a
// placeholder: "Claim submission failed?" was being echoed back as a reason.
const isGenericReason = (reason) =>
  GENERIC_REASONS.includes(
    String(reason).trim().toLowerCase().replace(/[^\p{L}\p{N}]+$/u, ''),
  );

// Said against a property that failed without explaining itself, so the
// dialog accounts for every failure rather than listing only the explained
// ones.
const NO_REASON_GIVEN = 'No reason was given';

const REASON_MAX_LENGTH = 280;

// Reason bodies nest several layers deep — an error wrapping a detail
// wrapping a message — so what has to be stopped is a cycle, not depth; the
// cap is only a guard against a runaway body.
const REASON_MAX_DEPTH = 10;

// Upstream occasionally answers with a stack trace or a whole paragraph; the
// dialog shows the beginning of it rather than overflowing.
const forDisplay = (reason) => {
  const text = String(reason ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const clipped =
    text.length > REASON_MAX_LENGTH
      ? `${text.slice(0, REASON_MAX_LENGTH).trimEnd()}…`
      : text;
  return /[.!?:)…]$/.test(clipped) ? clipped : `${clipped}.`;
};

// A reason arrives as a string, as a list of validation errors, or wrapped in
// an object, so each shape is unwrapped until readable text falls out.
const readReason = (value, depth = 0, seen = new Set()) => {
  if (typeof value === 'string') {
    const text = value.trim();
    // An HTML error page is not a reason anybody can read.
    return text.startsWith('<') ? '' : text;
  }

  // A number or a boolean is a flag rather than something to show a claimant:
  // the `{ error: true, message: ... }` envelope used to render as "true".
  if (!value || typeof value !== 'object') return '';

  if (seen.has(value) || depth > REASON_MAX_DEPTH) return '';
  seen.add(value);

  // A validation error from a Python (FastAPI) service names the field in
  // `loc` and the fault in `msg` — { loc: ['body', 'form_data', 'taxID'],
  // msg: 'field required', type: '...' } — so it reads as "taxID: field
  // required" rather than as every key it carries.
  if (!Array.isArray(value) && typeof value.msg === 'string' && value.msg.trim()) {
    const field = Array.isArray(value.loc)
      ? [...value.loc].reverse().find((part) => typeof part === 'string' && part.trim())
      : '';
    return field ? `${field}: ${value.msg.trim()}` : value.msg.trim();
  }

  if (Array.isArray(value)) {
    // A list of validation errors reads as one clause per fault, so the
    // sentence punctuation the sender may have added is normalised away.
    const parts = [];
    value.forEach((item) => {
      const part = readReason(item, depth + 1, seen).replace(/[.;]+$/, '');
      if (part && !parts.includes(part)) parts.push(part);
    });
    return parts.join('; ');
  }

  for (const key of BODY_REASON_KEYS) {
    const part = readReason(value[key], depth + 1, seen);
    if (part) return part;
  }

  // A validation body keys each fault by the field it is about —
  // `{ errors: { taxID: { message: 'taxID is required' } } }` — so once the
  // reason keys have missed, the key is half of what the claimant needs.
  const labelled = [];
  Object.entries(value).forEach(([key, nested]) => {
    if (BODY_REASON_KEYS.includes(key)) return;
    const part = readReason(nested, depth + 1, seen).replace(/[.;]+$/, '');
    if (!part) return;
    const text = `${key}: ${part}`;
    if (!labelled.includes(text)) labelled.push(text);
  });
  return labelled.join('; ');
};

// The reason a payload carries under the keys it is allowed to use, ignoring
// the placeholders: a specific field sitting beside one is what the claimant
// needs to see.
const readReasonFrom = (value, keys) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    const reason = readReason(value);
    return isGenericReason(reason) ? '' : reason;
  }

  for (const key of keys) {
    const reason = readReason(value[key]);
    if (reason && !isGenericReason(reason)) return reason;
  }

  return '';
};

const readBodyReason = (body) => readReasonFrom(body, BODY_REASON_KEYS);

const readEntryReason = (entry) => readReasonFrom(entry, ENTRY_REASON_KEYS);

// The processor words a filed claim in the same `message` field a refusal uses
// — see extractPropertyClaimIds in src/app/api/legalDetails/route.js — and
// leaves `success` off its entries altogether on some versions, so a claim
// that was filed used to be shown as the reason the claim failed.
const CLAIM_FILED_MESSAGE = /claim\s+\d+\s+filed/i;

const isFailedEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return false;
  if (entry.success === true || entry.success === 'true') return false;
  if (CLAIM_FILED_MESSAGE.test(String(entry.message ?? ''))) return false;

  // An entry has to say it failed, in either of the two wordings used around
  // the claim process; a silent entry is not a refusal to report.
  return (
    entry.success === false ||
    entry.success === 'false' ||
    String(entry.status ?? '').toLowerCase() === 'failed'
  );
};

// Nothing was filed. Usually said with the counters, but a refusal of the whole
// submission can also come back as a 200 that only says `success: false` (or
// `status: 'failed'`) next to its reason; reading that as a success sent the
// claimant on to "Claim is in Process" over a claim that was never filed.
const isWholeSubmissionFailed = (body) => {
  if (!body || typeof body !== 'object') return false;
  const succeeded = Number(body.succeeded);
  if (Number(body.failed) > 0 && succeeded === 0) return true;
  const saysFailed =
    body.success === false ||
    body.success === 'false' ||
    String(body.status ?? '').toLowerCase() === 'failed';
  return saysFailed && !(succeeded > 0);
};

// Every property is filed separately and can be refused for its own reason.
const readFailedResults = (results) => {
  if (!Array.isArray(results)) return [];

  return results.filter(isFailedEntry).map((entry) => ({
    // Key casing has varied between processor versions; these are the
    // variants /api/legalDetails already accepts.
    propertyId: String(
      entry.property_id ?? entry.propertyId ?? entry.PropertyId ?? '',
    ).trim(),
    reason: readEntryReason(entry),
  }));
};

/**
 * Work out what the claim-failure dialog should say.
 *
 * @param {object} args
 * @param {*} args.body     the response body, whether it came back 200 with
 *                          failures in it or as an error payload
 * @param {number} [args.status]  HTTP status, the last thing left to tell
 *                          support when nobody supplied a reason
 * @param {*} [args.error]  the axios error, when the request itself failed
 * @returns {{ message: string, details: string[] }}
 */
const buildSubmissionFailure = ({ body, status, error }) => {
  // A request that never landed — a dropped connection or a timeout — carries
  // no body at all, and is worth saying plainly instead of as a bare reason.
  if (error?.isAxiosError && !error.response) {
    const network = forDisplay(error.message);
    return {
      message: network
        ? `We could not reach our claim submission service: ${network} Please check your connection and try again.`
        : 'We could not reach our claim submission service. Please check your connection and try again.',
      details: [],
    };
  }

  const failures = readFailedResults(body?.results);
  const explained = failures.filter((entry) => entry.reason);
  const distinctReasons = Array.from(new Set(explained.map((entry) => entry.reason)));

  // One reason stands for the whole claim only when it is the reason for
  // every property that failed. Short of that each property is listed with
  // its own, including the ones that came back silent — dropping those let
  // one property's reason read as the reason the claim was refused.
  if (distinctReasons.length === 1 && explained.length === failures.length) {
    return {
      message: `We were unable to submit your claim. ${forDisplay(distinctReasons[0])}`,
      details: [],
    };
  }

  if (explained.length > 0) {
    return {
      message:
        'We were unable to submit your claim. The submission service reported the following for each property:',
      details: failures.map(({ propertyId, reason }) => {
        const text = forDisplay(reason || NO_REASON_GIVEN);
        return propertyId ? `Property ${propertyId}: ${text}` : text;
      }),
    };
  }

  // Nothing per property, so whatever the body itself says stands for the
  // claim: a portal-wide refusal arrives that way.
  const bodyReason = readBodyReason(body);
  if (bodyReason) {
    return {
      message: `We were unable to submit your claim. ${forDisplay(bodyReason)}`,
      details: [],
    };
  }

  // Nothing readable came back at all, so the status is the only thing left
  // that support can work from — and only when the status is itself the
  // failure, since a 200 quoted at a claimant reads as success.
  const quotableStatus = Number(status) >= 400 ? status : null;
  return {
    message: quotableStatus
      ? `We were unable to submit your claim, and no reason was given (status ${quotableStatus}). Please try again, and quote that status if you contact support.`
      : 'We were unable to submit your claim, and no reason was given. Please try again, and contact support if it keeps happening.',
    details: [],
  };
};

const UserInformation = ({ onNext, onFieldFilled, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
    claimantRelationship: 'MYSELF',
  });
  // Set when the address is already settled — from the signed-in session, or
  // from the code a signed-out visitor verified before searching. Either way
  // the field is filled in and cannot be edited.
  const [lockedEmail, setLockedEmail] = useState(null);
  // Proof of an OTP-verified address, sent with the registration so the server
  // can check the claim is being filed under an address somebody owns.
  const [verificationToken, setVerificationToken] = useState(null);
  const [errorModal, setErrorModal] = useState({
    show: false,
    title: '',
    message: '',
    details: [],
  });
  const [nextPageData, setNextPageData] = useState(null);
  const {
    userData,
    setUserData,
    setUserAgreement,
    setUserLogin,
    searchResults,
    setSearchResults,
    ownPropertyIds,
  } = useSearchStore();
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    dateOfBirth: '',
    ssn: '',
    claimantRelationship: '',
  });
  const [apiError, setApiError] = useState('');
  // Kept apart from apiError, which is rendered in two other places: sharing one
  // string meant the consent warning appeared three times for one unticked box.
  const [smsError, setSmsError] = useState('');
  const [agreeSMS, setAgreeSMS] = useState(false);
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [today, setToday] = useState('');
  const [dobRaw, setDobRaw] = useState('');

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  const handleInputChange = (field, value) => {
    // readOnly stops typing, but browser autofill still fires onChange, so the
    // session email is held here too.
    if (field === 'email' && lockedEmail) return;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setApiError('');

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

      if (field === 'firstName' || field === 'lastName') {
        const nameRegex = /^[A-Za-z]*$/;

        if (value && !nameRegex.test(value)) {
          updated[field] = 'Only alphabets are allowed.';
        }
      }

      if (field === 'email') {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if (value.trim() && !emailRegex.test(value.trim())) {
          updated.email = 'Please enter a valid email address.';
        }
      }

      // if (field === 'dateOfBirth' && value) {
      //   const dob = new Date(value);
      //   const now = new Date();
      //   now.setHours(0, 0, 0, 0);

      //   if (dob > now) {
      //     updated.dateOfBirth = 'Date of birth cannot be in the future.';
      //   }
      // }

      if (field === 'dateOfBirth' && value) {
        const dob = parseDOB(value);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (!dob || isNaN(dob.getTime())) {
          updated.dateOfBirth = 'Please enter a valid date.';
        } else if (dob > now) {
          updated.dateOfBirth = 'Date of birth cannot be in the future.';
        } else {
          const age = getAge(dob);
          if (age < 18) updated.dateOfBirth = AGE_ERROR;
          else if (age > 120) updated.dateOfBirth = 'Please enter a valid date of birth.';
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

  // A signed-in claimant files against the account they are signed in to, so
  // the email is taken from the session and locked. Signed-out visitors keep
  // the editable field, which is what creates their account.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('userLogin');
      if (!raw || raw === 'undefined') return;

      const session = JSON.parse(raw);
      const sessionEmail = session?.user?.email;
      if (!session?.token || !sessionEmail) return;

      setLockedEmail(sessionEmail);
      setVerificationToken(null);
      setFormData((prev) => ({ ...prev, email: sessionEmail }));
      setErrors((prev) => {
        if (!prev.email) return prev;
        const next = { ...prev };
        delete next.email;
        return next;
      });
    } catch (e) {
      console.error('Failed to read userLogin from localStorage', e);
    }
  }, []);

  // Signed-out visitors reach this form only after verifying an address, so it
  // is prefilled and locked here too: the claim has to be filed under the
  // address that was verified, not one typed in afterwards.
  useEffect(() => {
    // Read the session directly rather than waiting for the effect above to
    // land: both run in the same commit, so lockedEmail is still null here.
    if (sessionEmail()) return;

    const verified = readVerifiedEmail();
    if (!verified?.email) return;

    setLockedEmail(verified.email);
    setVerificationToken(verified.token);
    setFormData((prev) => ({ ...prev, email: verified.email }));
    setErrors((prev) => {
      if (!prev.email) return prev;
      const next = { ...prev };
      delete next.email;
      return next;
    });
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
    if (!formData.phone.trim()) {
      setErrors((prev) => ({
        ...prev,
        phone: 'Phone number is required.',
      }));
    } else if (phoneDigits.length !== 10) {
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
    if (!formData.ssn.trim()) {
      setErrors((prev) => ({ ...prev, ssn: 'SSN is required.' }));
    } else if (ssnDigits.length !== 9) {
      setErrors((prev) => ({ ...prev, ssn: 'SSN must be exactly 9 digits.' }));
    } else {
      setErrors((prev) => ({ ...prev, ssn: '' }));
    }
  };

  const handleZipBlur = () => {
    const zip = formData.zipCode.trim();
    const zipRegex = /^\d{5}$/;
    if (!zip) {
      setErrors((prev) => ({
        ...prev,
        zipCode: 'ZIP code is required.',
      }));
    } else if (!zipRegex.test(zip)) {
      setErrors((prev) => ({
        ...prev,
        zipCode: 'ZIP code must be exactly 5 digits.',
      }));
    } else {
      setErrors((prev) => ({ ...prev, zipCode: '' }));
    }
  };

  useEffect(() => {
    const requiredFields = [
      formData.firstName,
      formData.lastName,
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

  const scrollToFirstError = (errorMap) => {
    const fieldOrder = [
      'firstName',
      'lastName',
      'dateOfBirth',
      'email',
      'phone',
      'ssn',
      'address',
      'city',
      'zipCode',
      'claimantRelationship',
    ];
    const firstErrorField = fieldOrder.find((field) => errorMap[field]);
    if (!firstErrorField) return;

    const el = document.querySelector(`[data-field="${firstErrorField}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input, textarea');
      input?.focus?.({ preventScroll: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // ADD THIS GUARD — right at the top, before any other validation
    if (!userData?._id) {
      setApiError('Your session data was lost. Please go back and search again.');
      return;
    }

    let newErrors = {};

    const requiredFields = {
      firstName: 'First name is required.',
      lastName: 'Last name is required.',
      email: 'Email is required.',
      phone: 'Phone number is required.',
      address: 'Address is required.',
      city: 'City is required.',
      zipCode: 'ZIP code is required.',
      dateOfBirth: 'Date of birth is required.',
      ssn: 'SSN is required.',
      claimantRelationship: 'Claimant relationship is required.',
    };

    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!formData[field]?.trim()) {
        newErrors[field] = message;
      }
    });

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (formData.phone.trim() && phoneDigits.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits.';
    }

    const ssnDigits = formData.ssn.replace(/\D/g, '');
    if (formData.ssn.trim() && ssnDigits.length !== 9) {
      newErrors.ssn = 'SSN must be exactly 9 digits.';
    }

    const zipDigits = formData.zipCode.replace(/\D/g, '');
    if (formData.zipCode.trim() && zipDigits.length !== 5) {
      newErrors.zipCode = 'ZIP code must be exactly 5 digits.';
    }

    const nameRegex = /^[A-Za-z]+$/;

    if (formData.firstName.trim() && !nameRegex.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name can only contain alphabets.';
    }

    if (formData.lastName.trim() && !nameRegex.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name can only contain alphabets.';
    }

    // if (formData.dateOfBirth) {
    //   const dob = new Date(formData.dateOfBirth);
    //   const now = new Date();
    //   now.setHours(0, 0, 0, 0);

    //   if (isNaN(dob.getTime())) {
    //     newErrors.dateOfBirth = 'Please enter a valid date.';
    //   } else if (dob > now) {
    //     newErrors.dateOfBirth = 'Date of birth cannot be in the future.';
    //   } else {
    //     const age = now.getFullYear() - dob.getFullYear() -
    //       (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    //     if (age < 18) {
    //       newErrors.dateOfBirth = 'You must be at least 18 years old.';
    //     } else if (age > 120) {
    //       newErrors.dateOfBirth = 'Please enter a valid date of birth.';
    //     }
    //   }
    // }

    if (formData.dateOfBirth) {
      const dob = parseDOB(formData.dateOfBirth);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (!dob || isNaN(dob.getTime())) {
        newErrors.dateOfBirth = 'Please enter a valid date.';
      } else if (dob > now) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future.';
      } else {
        const age = getAge(dob);
        if (age < 18) newErrors.dateOfBirth = AGE_ERROR;
        else if (age > 120) newErrors.dateOfBirth = 'Please enter a valid date of birth.';
      }
    }

    if (dobRaw && dobRaw !== toDisplayDOB(formData.dateOfBirth)) {
      newErrors.dateOfBirth = DOB_FORMAT_ERROR;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (formData.email.trim() && !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (formData.address.trim()) {
      const urlRegex =
        /^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|net|org|io|co|gov|edu|info|biz|me|us|uk|ca|au)(\/.*)?$)/i;
      if (urlRegex.test(formData.address.trim())) {
        newErrors.address =
          'Please enter a valid street address, not a website URL.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setApiError(
        'Please fill in all required fields and fix the highlighted errors.',
      );
      scrollToFirstError(newErrors);
      return;
    }

    if (!agreeSMS) {
      setSmsError('You must agree to receive SMS updates before continuing.');
      // The fields have just passed, so a "fix the highlighted errors" line left
      // over from an earlier attempt would be stale — and would read as a second
      // complaint about the box.
      setApiError('');
      return;
    }

    setSmsError('');
    setApiError('');

    try {
      setLoading(true);
      const legalName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const payload = {
        user_id: userData._id,
        legal_name: legalName,
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
        claimant_relationship: formData.claimantRelationship,
      };
      const payloadData = {
        userEmail: formData.email,
        user_id: userData._id,
        userType: 'User',
        // Present for signed-out claimants; the server rejects a registration
        // whose address was never verified.
        verification_token: verificationToken || undefined,
      };

      const [dobYear, dobMonth, dobDay] = formData.dateOfBirth.split('-');

      const claimSubmissionPayloadData = {
        userId: userData._id,
        property_ids: ownPropertyIds,
        form_data: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
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
          claimantRelationship: formData.claimantRelationship,
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
        // The email is locked for two different people: a signed-in claimant,
        // who already has an account, and a signed-out visitor who verified an
        // address by code and still needs one. The two are told apart by the
        // session, not by the lock — keying it on the lock alone would leave a
        // guest with no account at all.
        const existingSession = sessionEmail()
          ? localStorage.getItem('userLogin')
          : null;

        if (existingSession) {
          // Already signed in, so registration creates nothing. It is still
          // called: it is what tells the claimant, by email, that this claim
          // is going on the account they already have. The server writes
          // nothing on that path and will not repeat the notice for the same
          // address in quick succession.
          //
          // The session already in hand is what carries on. The reply to an
          // existing account has no token in it, so storing it over the
          // session would sign the claimant out in the middle of their claim.
          const session = JSON.parse(existingSession);
          userLoginRes = { data: session };

          try {
            await axios.post('/api/register', payloadData, {
              // Signed in as the address being filed under, which is what
              // lets the server answer as the account holder rather than as
              // somebody merely asking about the address.
              headers: session?.token
                ? { Authorization: `Bearer ${session.token}` }
                : undefined,
            });
          } catch (err) {
            // A courtesy notice is not worth failing a claim over.
            console.error(
              '[claim] could not send the existing-account notice',
              err.response?.data?.message || err.message,
            );
          }
        } else {
          userLoginRes = await axios.post('/api/register', payloadData);

          // The address already has an account and this visit has not proved
          // it belongs to whoever is filing. The claim has to be filed from
          // that account, so it stops here — carrying on would file it against
          // a session the address does not belong to, and the claim would be
          // refused a step later with nothing useful to say.
          if (
            userLoginRes.data?.account_exists &&
            !userLoginRes.data?.user?.user_id
          ) {
            setErrorModal({
              show: true,
              title: 'Account Already Exists',
              message:
                'An account already exists for this email address. We have emailed it a reminder of how to sign in. Please log in and file your claim from there, or use a different email address.',
            });
            setLoading(false);
            return;
          }

          setUserLogin(userLoginRes.data);
          localStorage.setItem('userLogin', JSON.stringify(userLoginRes.data));
          window.dispatchEvent(new Event('authChange'));

          // Registration can hand back a different identity than the search
          // produced: it does whenever this browser has already filed under
          // another address, because that account keeps the id it had. The
          // claim has to follow the identity the account was actually created
          // under, or it would be filed against somebody else's record.
          const registeredUserId = userLoginRes.data?.user?.user_id;
          if (registeredUserId && registeredUserId !== userData._id) {
            console.log('[claim] following the identity registration returned', {
              from: userData._id,
              to: registeredUserId,
            });
            payload.user_id = registeredUserId;
            claimSubmissionPayloadData.userId = registeredUserId;

            const movedUserData = { ...userData, _id: registeredUserId };
            setUserData(movedUserData);
            localStorage.setItem('userData', JSON.stringify(movedUserData));
          }
        }
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          'Please use a different email or log in.';
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

        if (isWholeSubmissionFailed(claimSubmission)) {
          // No status here: the request itself succeeded, and the failures are
          // inside the body.
          const failure = buildSubmissionFailure({ body: claimSubmission });

          setErrorModal({
            show: true,
            title: 'Claim Submission Failed',
            message: failure.message,
            details: failure.details,
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        // The reason shown to the claimant is trimmed for the dialog, so the
        // whole answer is kept in the console for support.
        console.error('[claim] submission failed', err.response?.data || err);

        const failure = buildSubmissionFailure({
          body: err.response?.data,
          status: err.response?.status,
          error: err,
        });

        setErrorModal({
          show: true,
          title: 'Claim Submission Failed',
          message: failure.message,
          details: failure.details,
        });
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.post('/api/legalDetails', {
          ...payload,
          verification_token: verificationToken || undefined,
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

        // Some properties can be refused while others are filed. The claim does
        // carry on, but saying nothing about the refused ones left the claimant
        // reading "in process" over a property that had already been turned down.
        const someRefused = Number(claimSubmission?.failed) > 0;
        const refused = someRefused
          ? readFailedResults(claimSubmission?.results).map(({ propertyId, reason }) =>
              propertyId ? `Property ${propertyId}: ${forDisplay(reason)}` : forDisplay(reason),
            )
          : [];

        setErrorModal({
          show: true,
          title: 'Claim is in Process',
          message: someRefused
            ? 'Your claim is being processed for the properties we could file, and we have emailed your login details. Some properties could not be filed:'
            : 'We have sent an email with your login details, and your claim is currently being processed. Please wait. We will send updates to your email.',
          details: refused.length
            ? refused
            : someRefused
              ? ['One of your properties could not be filed, and no reason was given.']
              : [],
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

  useEffect(() => {
    if (!loading) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [loading]);

  return (
    <div className="min-h-screen bg-[#F7F5F2] pt-5 relative">
      {loading && (
        <div className="fixed inset-x-0 bottom-0 top-[76px] sm:top-[88px] z-[150] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm overscroll-contain">
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
        </div>
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

        .react-datepicker-popper { z-index: 50 !important; }
        .react-datepicker {
          font-family: 'Inter', system-ui, sans-serif;
          border: 1px solid #E8E6E3;
          border-radius: 0.75rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .react-datepicker__header {
          background-color: #FCE9E7;
          border-bottom: 1px solid #E8E6E3;
        }
        .react-datepicker__month-select,
        .react-datepicker__year-select {
          padding: 2px 6px;
          border: 1px solid #E8E6E3;
          border-radius: 6px;
          background: #fff;
        }
        .react-datepicker__day:hover { background-color: #FCE9E7; }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #E1261C !important;
          color: #fff !important;
        }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E3] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-[#0A0A0A] font-['Fraunces']">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E1261C]"></span>
            <a href="https://catchmycash.com" rel="noopener noreferrer">CatchMyCash</a>
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

        <form onSubmit={handleSubmit} noValidate>
          <fieldset disabled={loading}>
            <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 md:p-8 shadow-md">
              {(apiError || Object.values(errors).some(Boolean)) && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-[#E1261C]/40 bg-[#FCE9E7] p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#E1261C]" />
                  <div>
                    <p className="font-semibold text-[#E1261C]">
                      Please review the highlighted fields
                    </p>
                    <p className="mt-1 text-sm text-[#4A4A4A]">
                      {apiError ||
                        'Some required fields are empty or have invalid values.'}
                    </p>
                  </div>
                </div>
              )}

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

                <div data-field="firstName">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    First Name *
                  </label>
                  <InputField
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange(
                        'firstName',
                        e.target.value.replace(/[^A-Za-z]/g, ''),
                      )
                    }
                    placeholder="First name"
                    aria-invalid={!!errors.firstName}
                    className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg focus:border-[#E1261C] focus:outline-none transition-all ${getInputErrorClass(!!errors.firstName)}`}
                  />
                  {errors.firstName && (
                    <p className="text-[#E1261C] text-xs mt-1 font-medium">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div data-field="lastName">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Last Name *
                  </label>
                  <InputField
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange(
                        'lastName',
                        e.target.value.replace(/[^A-Za-z]/g, ''),
                      )
                    }
                    placeholder="Last name"
                    aria-invalid={!!errors.lastName}
                    className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg focus:border-[#E1261C] focus:outline-none transition-all ${getInputErrorClass(!!errors.lastName)}`}
                  />
                  {errors.lastName && (
                    <p className="text-[#E1261C] text-xs mt-1 font-medium">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div data-field="dateOfBirth">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Date of Birth *
                  </label>
                  <DatePicker
                    selected={parseDOB(formData.dateOfBirth)}
                    onChange={(date) => {
                      setDobRaw(date ? toDisplayDOB(formatDOB(date)) : '');
                      handleInputChange('dateOfBirth', formatDOB(date));
                    }}
                    onChangeRaw={(e) => {
                      // Only handle real typing in the text input.
                      // Calendar clicks and month/year dropdowns also fire this event.
                      if (!e || !e.target || e.target.tagName !== 'INPUT') return;

                      const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                      let formatted = digits;
                      if (digits.length > 4) {
                        formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                      } else if (digits.length > 2) {
                        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                      }
                      e.target.value = formatted;
                      setDobRaw(formatted);
                      setErrors((prev) => ({ ...prev, dateOfBirth: '' }));
                    }}
                    onBlur={() => {
                      // typed text that never became a valid date
                      if (dobRaw && dobRaw !== toDisplayDOB(formData.dateOfBirth)) {
                        setErrors((prev) => ({ ...prev, dateOfBirth: DOB_FORMAT_ERROR }));
                      }
                    }}
                    strictParsing
                    openToDate={parseDOB(formData.dateOfBirth) || getEighteenYearsAgo()}
                    maxDate={new Date()}
                    minDate={new Date(1900, 0, 1)}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                    dateFormat="MM/dd/yyyy"
                    placeholderText="MM/DD/YYYY"
                    autoComplete="off"
                    wrapperClassName="w-full"
                    aria-invalid={!!errors.dateOfBirth}
                    className={`w-full px-4 py-2.5 text-sm text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg focus:border-[#E1261C] focus:outline-none transition-all ${getInputErrorClass(!!errors.dateOfBirth)}`}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-[#E1261C] text-xs mt-1 font-medium">
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div data-field="email">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Email Address *
                  </label>
                  <InputField
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    aria-invalid={!!errors.email}
                    readOnly={!!lockedEmail}
                    disabled={!!lockedEmail}
                    aria-readonly={!!lockedEmail}
                    title={
                      lockedEmail
                        ? 'This claim is filed under your verified email address.'
                        : undefined
                    }
                    className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg focus:border-[#E1261C] focus:outline-none transition-all ${getInputErrorClass(
                      !!errors.email,
                    )} ${lockedEmail
                      ? 'bg-[#F0EEEB] text-[#4A4A4A] cursor-not-allowed focus:border-[#E8E6E3] disabled:opacity-100 disabled:cursor-not-allowed'
                      : ''
                      }`}
                  />
                  {errors.email && (
                    <p className="text-[#E1261C] text-xs mt-1 font-medium">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div data-field="phone">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Phone Number *
                  </label>
                  <InputField
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(555) 123-4567"
                    onBlur={handlePhoneBlur}
                    aria-invalid={!!errors.phone}
                    className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg focus:border-[#E1261C] focus:outline-none transition-all ${getInputErrorClass(!!errors.phone)}`}
                  />
                  {errors.phone && (
                    <p className="text-[#E1261C] text-xs mt-1 font-medium">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div data-field="ssn">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Social Security Number *
                  </label>
                  <InputField
                    type="text"
                    value={formData.ssn}
                    onChange={(e) => handleSSNChange(e.target.value)}
                    onBlur={handleSSNBlur}
                    placeholder="XXX-XX-XXXX"
                    aria-invalid={!!errors.ssn}
                    className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg focus:border-[#E1261C] focus:outline-none transition-all ${getInputErrorClass(!!errors.ssn)}`}
                  />
                  <p className="text-xs text-[#888888] mt-1">
                    Required for identity verification
                  </p>
                  {errors.ssn && (
                    <p className="text-[#E1261C] text-xs mt-1 font-medium">
                      {errors.ssn}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
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

                <div className="md:col-span-2" data-field="address">
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
                    aria-invalid={!!errors.address}
                    className={`w-full rounded-lg border-2 bg-white px-4 py-2.5 text-sm text-[#0A0A0A] placeholder-[#888888] leading-6 focus:outline-none focus:border-[#E1261C] transition-all duration-300 ${getInputErrorClass(!!errors.address)}`}
                  />
                  {errors.address && (
                    <p className="text-[#E1261C] text-xs mt-1 font-medium">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div data-field="city">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    City *
                  </label>
                  <InputField
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Los Angeles"
                    aria-invalid={!!errors.city}
                    className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg focus:border-[#E1261C] focus:outline-none transition-all ${getInputErrorClass(!!errors.city)}`}
                  />
                  {errors.city && (
                    <p className="text-[#E1261C] text-xs mt-1 font-medium">
                      {errors.city}
                    </p>
                  )}
                </div>

                <div data-field="zipCode">
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
                    aria-invalid={!!errors.zipCode}
                    className={`w-full text-[#0A0A0A] placeholder-[#888888] border-2 rounded-lg focus:border-[#E1261C] focus:outline-none transition-all ${getInputErrorClass(!!errors.zipCode)}`}
                  />
                  {errors.zipCode && (
                    <p className="text-[#E1261C] text-xs mt-1 font-medium">
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


                {/* Claimant Relationship - Add this in the Additional Information section */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
                    Claimant Relationship *
                  </label>
                  <select
                    value={formData.claimantRelationship}
                    onChange={(e) => {
                      handleInputChange('claimantRelationship', e.target.value);
                      // Clear any related errors
                      setErrors((prev) => ({ ...prev, claimantRelationship: '' }));
                    }}
                    className={`w-full text-[#0A0A0A] border-2 rounded-lg px-4 py-2.5 focus:border-[#E1261C] focus:outline-none transition-all bg-white ${errors.claimantRelationship
                      ? 'border-[#E1261C] bg-[#FCE9E7] ring-2 ring-[#E1261C]/20'
                      : 'border-[#E8E6E3]'
                      }`}
                  >
                    {CLAIMANT_RELATIONSHIPS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.claimantRelationship && (
                    <p className="text-[#E1261C] text-xs mt-1 font-medium">
                      {errors.claimantRelationship}
                    </p>
                  )}
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
                    className="w-full h-24 min-h-24 max-h-24 overflow-y-auto resize-none [field-sizing:fixed] text-[#0A0A0A] placeholder-[#888888] border-2 border-[#E8E6E3] rounded-lg focus:border-[#E1261C] focus:outline-none transition-all"
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
                    className="w-full h-24 min-h-24 max-h-24 overflow-y-auto resize-none [field-sizing:fixed] text-[#0A0A0A] placeholder-[#888888] border-2 border-[#E8E6E3] rounded-lg focus:border-[#E1261C] focus:outline-none transition-all"
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
              <div
                className={`mt-4 rounded-lg p-3 ${smsError
                  ? 'border border-[#E1261C]/40 bg-[#FCE9E7]'
                  : ''
                  }`}
              >
                <label className="flex items-center space-x-2 text-sm text-[#0A0A0A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeSMS}
                    onChange={(e) => {
                      setAgreeSMS(e.target.checked);
                      if (e.target.checked) setSmsError('');
                    }}
                    className="h-4 w-4 text-[#E1261C] rounded border-[#E8E6E3] focus:ring-[#E1261C]"
                  />
                  <span>
                    I agree to receive SMS updates from CatchMyCash about my
                    claim.
                  </span>
                </label>
                {smsError && (
                  <p className="text-[#E1261C] text-xs mt-2 font-medium">
                    {smsError}
                  </p>
                )}
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
                  className={`px-8 py-3 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 w-auto min-w-[300px] ${loading
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
          details={errorModal.details}
          onClose={() => {
            setErrorModal({
              show: false,
              title: '',
              message: '',
              details: [],
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

const ErrorModal = ({ show, title, message, details, onClose }) => {
  if (!show) return null;

  // Only the claim-failure dialog has a per-property breakdown to show.
  const detailList = Array.isArray(details) ? details : [];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-[#E8E6E3] rounded-xl shadow-lg max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#FCE9E7] rounded-full flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-[#E1261C]" />
          </div>
          <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
            {title}
          </h3>
        </div>
        <p
          className={`text-sm text-[#4A4A4A] ${detailList.length ? 'mb-3' : 'mb-6'}`}
        >
          {message}
        </p>
        {detailList.length > 0 && (
          <ul className="mb-6 space-y-2 max-h-40 overflow-y-auto pr-1">
            {detailList.map((detail, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-[#4A4A4A]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#E1261C] shrink-0"></span>
                <span className="break-words">{detail}</span>
              </li>
            ))}
          </ul>
        )}
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
