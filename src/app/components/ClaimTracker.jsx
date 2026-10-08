'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Search,
  Users,
  X,
} from 'lucide-react';
import { deriveSubmissionStep } from '../lib/claimLifecycle';
import { claimIdSummary, propertyClaimId } from '../lib/claimIds';

/**
 * Case ID lookup and the claim progress dialog it opens. Shared by the landing
 * page card and the Track Your Claim page.
 */
export default function ClaimTracker({
  headingLevel = 'h2',
  title = 'Track Your Claim',
  description = 'Enter your Case ID to check the progress of your claim',
  inputId = 'track-claim-case-id',
  // Look up the Case ID in the page's ?case= parameter on arrival, so a link in
  // an email can open straight onto the claim.
  readCaseFromUrl = false,
}) {
  const Heading = headingLevel;
  const [searchCaseId, setSearchCaseId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Claimants track by Case ID: it is issued as soon as the case exists,
  // whereas the state's Claim ID only arrives once the filing is accepted.
  const lookUpCase = async (caseId) => {
    if (!caseId.trim()) {
      setSearchError('Please enter a Case ID');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const { data } = await axios.get(
        `/api/case?case_number=${encodeURIComponent(
          caseId.trim(),
        )}&public=true`,
      );

      if (data?.data && data.data.length > 0) {
        setSearchResult(data.data[0]);
        setShowModal(true);
      } else {
        setSearchError('No claim found with this Case ID');
      }
    } catch (err) {
      console.error('Search error:', err);
      if (err.response?.status === 404) {
        setSearchError('No claim found with this Case ID');
      } else {
        setSearchError('Failed to search for claim. Please try again.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchClaim = () => lookUpCase(searchCaseId);

  useEffect(() => {
    if (!readCaseFromUrl) return;
    const caseId = new URLSearchParams(window.location.search).get('case');
    if (!caseId) return;
    setSearchCaseId(caseId);
    lookUpCase(caseId);
    // Once, for the address the page was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setSearchResult(null);
    setSearchCaseId('');
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <Search className="h-5 w-5 text-[#E1261C]" />
        <Heading className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
          {title}
        </Heading>
      </div>
      <p className="text-sm text-[#4A4A4A] mb-4">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id={inputId}
          type="text"
          aria-label="Case ID"
          autoComplete="off"
          value={searchCaseId}
          onChange={(e) => {
            setSearchCaseId(e.target.value);
            setSearchError('');
          }}
          placeholder="Enter Case ID (e.g. CM-2026-123456)"
          className="flex-1 px-4 py-3 border border-[#E8E6E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1261C] focus:border-transparent transition-all text-[#0A0A0A]"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearchClaim();
          }}
        />
        <button
          onClick={handleSearchClaim}
          disabled={isSearching}
          className="px-6 py-3 bg-[#E1261C] text-white font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
        >
          {isSearching ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Track Claim
            </>
          )}
        </button>
      </div>
      {searchError && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#E1261C] text-sm mt-2 flex items-center gap-1"
        >
          <AlertTriangle className="h-4 w-4" />
          {searchError}
        </motion.p>
      )}
      {/* Portalled: the landing card around this animates with a transform,
          which would otherwise become the containing block of a fixed dialog. */}
      {showModal &&
        searchResult &&
        createPortal(
          <ClaimProgressModal claim={searchResult} onClose={closeModal} />,
          document.body,
        )}
    </>
  );
}

const ClaimProgressModal = ({ claim, onClose }) => {
  const [activeTab, setActiveTab] = useState('progress');
  const properties = claim?.user_properties || [];
  const details = claim?.user_details?.[0] || {};

  const parseAmount = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const formatMoney = (n) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const caseTotal = properties.reduce(
    (sum, p) => sum + parseAmount(p.amount),
    0
  );

  // Derive claim progress steps
  const getProgressSteps = () => {
    const docs = claim?.user_docs?.[0] || {};
    const steps = [];

    // Step 1: Property Selected
    steps.push({
      id: 1,
      title: 'Property Selected',
      description: 'Property identified for claim',
      completed: properties.length > 0,
      icon: DollarSign,
    });

    // Step 2: User Information
    steps.push({
      id: 2,
      title: 'User Information',
      description: 'Personal details provided',
      completed: !!details?.email_id,
      icon: Users,
    });

    // Step 3: Documents Uploaded
    const hasDocs = !!docs.proof_id || !!docs.ssn_id || !!docs.adress_proof;
    steps.push({
      id: 3,
      title: 'Documents Uploaded',
      description: 'Required documents submitted',
      completed: hasDocs,
      icon: FileText,
    });

    // Step 4: Investigator Signed
    const hasInvestigatorSigned = typeof docs.signed_doc === 'string' &&
      docs.signed_doc.includes('signed-document');
    steps.push({
      id: 4,
      title: 'Investigator Agreement',
      description: 'Signed investigator services agreement',
      completed: hasInvestigatorSigned,
      icon: FileText,
    });

    // Step 5: Agreement Signed
    const hasAgreementForm = (typeof docs.filled_agreement_doc === 'string' &&
      docs.filled_agreement_doc.includes('FilledAgreement_form')) ||
      (typeof docs.signed_doc === 'string' &&
        docs.signed_doc.includes('FilledAgreement_form'));
    steps.push({
      id: 5,
      title: 'Agreement Signed',
      description: 'State Controller\'s Office authorization form signed',
      completed: hasAgreementForm,
      icon: FileText,
    });

    // Step 6: Claim Submitted — reads "Claim Submission Failed" when either the
    // filing or the document-verification run failed.
    const submission = deriveSubmissionStep(claim, { includeMessage: true });
    steps.push({
      id: 6,
      title: submission.title,
      description: submission.description,
      completed: submission.completed,
      failed: submission.failed,
      icon: submission.failed ? AlertTriangle : Clock,
    });

    // Step 7: Approved/Completed
    const isApproved = claim?.status === false;
    steps.push({
      id: 7,
      title: 'Claim Approved',
      description: 'Claim approved by State Controller\'s Office',
      completed: isApproved,
      icon: CheckCircle2,
    });

    return steps;
  };

  const progressSteps = getProgressSteps();
  const completedSteps = progressSteps.filter(s => s.completed).length;
  const totalSteps = progressSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8E6E3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-[#E8E6E3] p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
                  Claim Progress
                </h2>
                {claimIdSummary(claim) && (
                  <span className="px-3 py-1 bg-[#FCE9E7] text-[#E1261C] text-xs font-semibold rounded-full font-['JetBrains_Mono']">
                    Claim ID: {claimIdSummary(claim)}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#4A4A4A]">
                Case #{claim.case_id || String(claim._id).slice(-8).toUpperCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#FCE9E7] rounded-lg transition-all"
            >
              <X className="h-6 w-6 text-[#4A4A4A]" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[#888888] mb-1">
              <span>{completedSteps} of {totalSteps} steps complete</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full h-2 bg-[#F0EEEB] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#E1261C] to-[#B11912] rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-6 border-b border-[#E8E6E3] mb-6">
            {[
              { id: 'progress', label: 'Progress' },
              { id: 'assets', label: `Assets (${properties.length})` },
              { id: 'details', label: 'Details' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.id
                  ? 'border-[#E1261C] text-[#E1261C]'
                  : 'border-transparent text-[#4A4A4A] hover:text-[#0A0A0A]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'progress' && (
            <div className="space-y-4">
              {progressSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${step.failed // ← ADD this branch first
                    ? 'bg-[#FCE9E7] border-[#E1261C]/40'
                    : step.completed
                      ? 'bg-[#F0FFF4] border-[#00C896]/30'
                      : 'bg-[#F7F5F2] border-[#E8E6E3] opacity-70'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${step.failed // ← ADD this branch first
                    ? 'bg-[#E1261C] text-white'
                    : step.completed
                      ? 'bg-[#00C896] text-white'
                      : 'bg-[#D4D4D4] text-[#888888]'
                    }`}>
                    {step.failed ? ( // ← ADD
                      <AlertTriangle className="h-5 w-5" />
                    ) : step.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-semibold ${step.failed ? 'text-[#E1261C]' : step.completed ? 'text-[#0A0A0A]' : 'text-[#888888]'
                        }`}>
                        {step.title}
                      </h3>
                      {step.completed && !step.failed && (
                        <span className="text-[#00C896] text-xs font-['JetBrains_Mono']">
                          ✓ Complete
                        </span>
                      )}
                      {step.failed && ( // ← ADD
                        <span className="text-[#E1261C] text-xs font-['JetBrains_Mono']">
                          ✗ Failed
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${step.failed ? 'text-[#E1261C]' : step.completed ? 'text-[#4A4A4A]' : 'text-[#888888]'
                      }`}>
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'assets' && (
            <div>
              <h3 className="text-base font-bold text-[#0A0A0A] mb-3">Claimed Assets</h3>
              {properties.length === 0 ? (
                <p className="text-sm text-[#888888]">No assets on this claim.</p>
              ) : (
                <div className="space-y-3">
                  {properties.map((p, idx) => {
                    const isClaimed = p.is_claimed === true;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between border-b border-[#F0EEEB] pb-3 last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#0A0A0A]">
                              {claim.user_info?.first_name} {claim.user_info?.last_name}
                            </p>
                            {isClaimed && (
                              <span className="px-2 py-0.5 bg-[#00C896] text-white text-[10px] font-semibold rounded-full">
                                ✓ Claimed
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#4A4A4A]">
                            {p.property_title || p.property_type}
                          </p>
                          <p className="text-xs text-[#888888] font-['JetBrains_Mono']">
                            ID: {p.property_id}
                          </p>
                          {propertyClaimId(p, claim) && (
                            <p className="text-xs text-[#E1261C] font-['JetBrains_Mono'] mt-1">
                              Claim ID: {propertyClaimId(p, claim)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#0A0A0A]">
                            ${formatMoney(parseAmount(p.amount))}
                          </p>
                          {isClaimed && (
                            <p className="text-xs text-[#00C896]">Claimed</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#888888] text-xs uppercase font-['JetBrains_Mono']">Full Name</p>
                  <p className="font-semibold text-[#0A0A0A]">
                    {details.legal_name || `${claim.user_info?.first_name || ''} ${claim.user_info?.last_name || ''}`}
                  </p>
                </div>
                <div>
                  <p className="text-[#888888] text-xs uppercase font-['JetBrains_Mono']">Email</p>
                  <p className="font-semibold text-[#0A0A0A]">{details.email_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#888888] text-xs uppercase font-['JetBrains_Mono']">Contact</p>
                  <p className="font-semibold text-[#0A0A0A]">{details.contact_no || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#888888] text-xs uppercase font-['JetBrains_Mono']">Case Status</p>
                  <p className={`font-semibold ${claim.status === false ? 'text-[#00C896]' : 'text-[#E1261C]'}`}>
                    {claim.status === false ? 'Approved' : 'In Progress'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[#888888] text-xs uppercase font-['JetBrains_Mono']">Address</p>
                <p className="font-semibold text-[#0A0A0A]">
                  {details.address
                    ? `${details.address}, ${details.city}, ${details.state} ${details.zip_code}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[#888888] text-xs uppercase font-['JetBrains_Mono']">Filed On</p>
                <p className="font-semibold text-[#0A0A0A]">
                  {claim.createdAt
                    ? new Date(claim.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                    : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-[#F7F5F2] border-t border-[#E8E6E3] p-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#888888]">Total Claim Amount</p>
              <p className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
                ${formatMoney(caseTotal)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#E1261C] text-white font-semibold rounded-lg hover:bg-[#B11912] transition-all shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
