'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { describeProperty } from '../lib/propertyDetails';
import JackpotCelebration from './uicomponents/JackpotCelebration';
import GlobalLoader from './uicomponents/GlobalLoader';
import { Card } from './uicomponents/Card';
import { Button } from './uicomponents/Button';
import { Badge } from './uicomponents/Badge';
import { useSearchStore } from '../store/searchStore';
import { NOTARY_CLAIM_THRESHOLD, requiresNotary } from '../lib/notary';

// Selecting more than this many properties in one submission sends the
// agreement through the remote online notary (RON) flow instead of a plain
// e-signature. Change it in ../lib/notary so the server agrees; it is low
// while the notary path is being tested and goes up in production.
const NOTARY_THRESHOLD = NOTARY_CLAIM_THRESHOLD;

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

const formatMoney = (value) =>
  parsePropertyAmount(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const NotOnFile = () => <span className="text-[#888888]">Not on file</span>;

const Detail = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.12em] text-[#888888]">
      {label}
    </dt>
    <dd className="mt-1 text-[14px] sm:text-[15px] leading-snug text-[#0A0A0A] break-words">
      {children}
    </dd>
  </div>
);

/**
 * One property. The whole card is the checkbox's label, so a tap anywhere on
 * it selects it. Who reported it and the amount come first; then the facts
 * that tell someone whether it is theirs. Anything the State's file does not
 * have is left out, or shown as "Not on file" for the name and address.
 */
const PropertyCard = ({ property, selected, onToggle }) => {
  const d = describeProperty(property);
  const title = d.holderName || d.type || 'Unclaimed property';
  const titleLabel = d.holderName ? 'Reported by' : 'Property type';
  const inputId = `property-${property.id}`;
  const otherOwners = d.coOwners.length
    ? d.coOwners.join(', ')
    : d.otherOwnersCount
      ? `${d.otherOwnersCount} other owner${d.otherOwnersCount > 1 ? 's' : ''} on record`
      : '';

  return (
    <label
      htmlFor={inputId}
      className={`block cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition-colors sm:p-6 ${
        selected
          ? 'border-[#E1261C] ring-1 ring-[#E1261C]'
          : 'border-[#E8E6E3] hover:border-[#BDBDBD]'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <input
          id={inputId}
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select property ${property.id}: ${title}, $${formatMoney(property.amount)}`}
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#E1261C]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.12em] text-[#888888]">
                {titleLabel}
              </p>
              <p className="mt-0.5 font-['Fraunces'] text-[18px] sm:text-[20px] font-semibold leading-snug text-[#0A0A0A] break-words">
                {title}
              </p>
              {d.holderLocation && (
                <p className="mt-0.5 text-[13px] text-[#4A4A4A]">{d.holderLocation}</p>
              )}
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="hidden sm:block font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.12em] text-[#888888]">
                Amount
              </p>
              <p className="font-['Fraunces'] text-[22px] sm:text-2xl font-bold text-[#E1261C] whitespace-nowrap">
                ${' '}
                <span className="text-[#0A0A0A]">{formatMoney(property.amount)}</span>
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {d.holderName && d.type && (
              <span className="rounded-full bg-[#FCE9E7] px-3 py-1 text-[12px] font-semibold text-[#B11912] break-words">
                {d.type}
              </span>
            )}
            <span className="rounded-full border border-[#E8E6E3] bg-[#F7F5F2] px-3 py-1 font-['JetBrains_Mono'] text-[12px] text-[#4A4A4A]">
              ID {property.id}
            </span>
          </div>

          <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-[#F0EEEB] pt-4 sm:grid-cols-2">
            <Detail label="Name on record">{d.owner || <NotOnFile />}</Detail>
            <Detail label="Last known address">{d.address || <NotOnFile />}</Detail>
            {otherOwners && (
              <Detail label={d.coOwners.length > 1 ? 'Co-owners' : 'Co-owner'}>{otherOwners}</Detail>
            )}
            {d.securities && <Detail label="Securities">{d.securities}</Detail>}
          </dl>
        </div>
      </div>
    </label>
  );
};

const PropertyResults = ({ propertyData, onNext, onBack }) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [animatedAmount, setAnimatedAmount] = useState(0);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [selectedTotalAmount, setSelectedTotalAmount] = useState(0);
  const [showSelectionLimitPopup, setShowSelectionLimitPopup] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const { userData, ownPropertyIds, setOwnPropertyIds, propertyData: storedPropertyData } = useSearchStore();

  const data = propertyData ?? storedPropertyData;

  const uniqueProperties = React.useMemo(
    () => getUniquePropertiesWithTotals(data?.properties), // CHANGED: data?.properties
    [data?.properties],
  );

  const totalAmount = getTotalPropertyAmount(data?.properties);
  // Calculate commission first and round it to the nearest cent.
  // Then, derive the net amount from the rounded commission to avoid floating point inaccuracies.
  const commissionValue = Math.round(selectedTotalAmount * 10) / 100;
  const netAmountValue = selectedTotalAmount - commissionValue;
  const commission = commissionValue.toFixed(2);
  const netAmount = netAmountValue.toFixed(2);

  const handleCheckboxChange = (propertyId) => {
    setSelectedProperties((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      }

      const next = [...prev, propertyId];
      // Crossing the threshold is allowed; it changes how the agreement is
      // signed, so say so once rather than blocking the selection.
      if (requiresNotary(next.length) && !requiresNotary(prev.length)) {
        setShowSelectionLimitPopup(true);
      }
      return next;
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

  // After the hooks, so they run in the same order whether or not the results
  // have arrived yet (an early return above them crashes React when they do).
  if (!data) {
    return (
      <div className="min-h-screen bg-[#F7F5F2]">
        <GlobalLoader message="Loading your results…" />
      </div>
    );
  }

  // In handleClaim:
  const handleClaim = async () => {
    if (isButtonDisabled || isClaiming) return;
    setIsClaiming(true);
    try {
      // ✅ Try userData from store first, then localStorage
      let userId = userData?._id;

      if (!userId) {
        const savedUserData = localStorage.getItem('userData');
        if (savedUserData && savedUserData !== 'undefined') {
          try {
            const parsed = JSON.parse(savedUserData);
            // ✅ Handle both response shapes
            userId = parsed?._id || parsed?.data?._id;
            console.log('✅ Recovered userId from localStorage:', userId);
          } catch (e) {
            console.error('Failed to parse userData:', e);
          }
        }
      }

      // ✅ Validate
      if (!userId) {
        alert('User data is missing. Please search again.');
        setIsClaiming(false);
        return;
      }

      if (!selectedProperties.length) {
        alert('Please select at least one property.');
        setIsClaiming(false);
        return;
      }

      setOwnPropertyIds(selectedProperties);
      localStorage.setItem('ownPropertyIds', JSON.stringify(selectedProperties));

      setShowCelebration(true);

      const selectedRawProperties = data.properties.filter((p) =>
        selectedProperties.includes(p.id),
      );

      console.log('📤 Sending:', { user_id: userId, count: selectedRawProperties.length });

      const response = await axios.post('/api/property', {
        user_id: userId,
        properties: selectedRawProperties,
      });

      onNext(response.data);
    } catch (err) {
      console.error('Error saving user properties:', err);
      if (err.response?.status === 400) {
        alert('Invalid data. Please search again.');
      }
    } finally {
      setIsClaiming(false);
    }
  };


  const isButtonDisabled = selectedTotalAmount <= 0 || isClaiming;
  const notaryRequired = requiresNotary(selectedProperties.length);

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
                    {data.name.split(' ')[0]}!
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-1 leading-tight break-words max-w-full">
                  <span>Sorry,</span>
                  <span className="text-[#E1261C] italic break-all">
                    {data.name.split(' ')[0]}
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

        {/* The properties. Each card carries what the State's own search
            lists, so someone can tell whether a property is theirs before
            they select it. No motion: the cards are there as soon as the
            page is, however many there are. */}
        <section className="mb-8" aria-labelledby="results-list-heading">
          <h3
            id="results-list-heading"
            className="text-xl font-bold text-[#0A0A0A] flex items-center gap-2 font-['Fraunces']"
          >
            <Sparkles className="h-5 w-5 text-[#E1261C]" aria-hidden="true" />
            Property Details
          </h3>
          {uniqueProperties.length > 0 && (
            <p className="mt-1 mb-4 text-[14px] sm:text-[15px] leading-relaxed text-[#4A4A4A]">
              Tick the ones that are yours. The name, last known address and the
              business that reported each one help you check.
            </p>
          )}
          {uniqueProperties.length > 0 ? (
            <ul className="space-y-4">
              {uniqueProperties.map((property) => (
                <li key={property.id}>
                  <PropertyCard
                    property={property}
                    selected={selectedProperties.includes(property.id)}
                    onToggle={() => handleCheckboxChange(property.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 bg-white p-6 border border-[#E8E6E3] rounded-xl text-center shadow-md">
              <div className="text-[#E1261C] font-semibold text-lg">
                ⚠ No properties found
              </div>
            </div>
          )}
        </section>

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

        {/* A claim above the threshold is signed with a notary, so say so
            where the claimant is about to commit rather than only in the
            one-time popup. */}
        {notaryRequired && (
          <div
            data-testid="notary-notice"
            className="max-w-2xl mx-auto mb-6 rounded-xl border border-[#F5C6C1] bg-[#FCE9E7] px-4 py-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-[#B11912] mt-0.5 shrink-0" />
              <p className="text-sm text-[#4A4A4A] text-left">
                <span className="font-semibold text-[#B11912]">
                  Notarised signing required.
                </span>{' '}
                You have selected {selectedProperties.length} properties, which
                is more than {NOTARY_THRESHOLD}. Your agreement will be signed
                with a notary online instead of a plain electronic signature.
              </p>
            </div>
          </div>
        )}

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
              className={`px-4 sm:px-16 py-4 sm:py-6 text-base sm:text-xl font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 mx-auto w-full sm:w-auto sm:min-w-[300px] max-w-full ${!isButtonDisabled
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
                This Claim Needs a Notary
              </h2>
              <p className="text-[#4A4A4A] mb-6">
                Claiming more than {NOTARY_THRESHOLD} propert
                {NOTARY_THRESHOLD === 1 ? 'y' : 'ies'} at once means your
                agreement is signed with a notary online, rather than with a
                plain electronic signature. You can carry on — we will set up
                the notary session when you sign.
              </p>
              <button
                onClick={() => setShowSelectionLimitPopup(false)}
                className="bg-[#E1261C] hover:bg-[#B11912] text-white px-8 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default PropertyResults;
