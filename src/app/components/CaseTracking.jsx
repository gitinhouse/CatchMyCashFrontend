'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './uicomponents/Button';
import { Card } from './uicomponents/Card';
import { Badge } from './uicomponents/Badge';
import { Progress } from './uicomponents/Progress';
import {
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  Trophy,
  Share2,
  Bell,
  Shield,
  AlertCircle,
  LayoutDashboard,
} from 'lucide-react';
import { useSearchStore } from '../store/searchStore';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CaseTracking = ({ onViewLeaderboard, onCreateReferral }) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const [shareAmount, setShareAmount] = useState('');
  const [hasShared, setHasShared] = useState(false);
  const dropdownRef = useRef(null);
  const [estimatedPayout, setEstimatedPayout] = useState(0);
  const [estimatedFee, setEstimatedFee] = useState(0);
  const [estimatedNet, setEstimatedNet] = useState(0);
  const [milestones, setMilestones] = useState([]);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [caseProgress, setCaseProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [shareError, setShareError] = useState('');


  const {
    userData,
    userAgreement,
    userSignedAgreement,
    userCase,
    setUserCase,
    searchResults,
    setSearchResults,
    ownPropertyIds,
    setOwnPropertyIds,
  } = useSearchStore();

  // ============================================================
  // ✅ Fetch Case Data from API (MyAccountPage pattern)
  // ============================================================
  const fetchCaseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user data from localStorage (like MyAccountPage)
      const storedLoginRaw = localStorage.getItem('userLogin');
      const storedLogin = storedLoginRaw ? JSON.parse(storedLoginRaw) : null;
      const token = storedLogin?.token;
      const realUserId = storedLogin?.user?.user_id;

      // Also check userData from store
      const storeUserId = userData?._id;

      // Use whichever userId is available
      const userId = realUserId || storeUserId;

      if (!userId || !token) {
        console.log('No user ID or token found, skipping case fetch');
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      console.log('🔍 Fetching case data for user:', userId);

      // ✅ API CALL - Same as MyAccountPage
      const response = await axios.get(
        `/api/case?user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('📦 Case API Response:', response.data);

      if (response.data?.data && response.data.data.length > 0) {
        const caseData = response.data.data[0];
        console.log('✅ Case data received:', caseData);
        setCaseData(caseData);
        setUserCase(caseData);
        localStorage.setItem('userCase', JSON.stringify(caseData));

        // Update property IDs
        if (caseData.property_ids) {
          setOwnPropertyIds(caseData.property_ids);
          localStorage.setItem('ownPropertyIds', JSON.stringify(caseData.property_ids));
        }
      } else {
        console.log('ℹ️ No case data found for user');
        setCaseData(null);
        setCaseProgress(0);
      }
    } catch (err) {
      console.error('❌ Error fetching case data:', err);
      setError(err.message || 'Failed to load case data');
      setCaseData(null);
    } finally {
      setLoading(false);
    }
  }, [userData?._id, setUserCase, setOwnPropertyIds]);

  // ============================================================
  // ✅ Fetch on Mount
  // ============================================================
  useEffect(() => {
    fetchCaseData();
  }, [fetchCaseData]);

  // ============================================================
  // ✅ Parse Property Amount
  // ============================================================
  const parsePropertyAmount = (property) => {
    const value = parseFloat(
      property?.amount ??
      property?.current_cash_balance ??
      property?.cash_reported ??
      0,
    );
    return Number.isFinite(value) ? value : 0;
  };

  const getPropertyId = (property) =>
    String(property?.id ?? property?.property_id ?? '');

  // ============================================================
  // ✅ Calculate Payouts from Case Data
  // ============================================================
  useEffect(() => {
    if (!caseData) return;

    const properties = caseData.user_properties || [];
    const total = properties.reduce(
      (sum, property) => sum + parsePropertyAmount(property),
      0,
    );

    const fee = Math.round(total * 10) / 100;
    const net = total - fee;

    setEstimatedPayout(total);
    setEstimatedFee(fee);
    setEstimatedNet(net);
  }, [caseData]);

  // ============================================================
  // ✅ Generate Milestones + Progress from REAL case status fields
  //
  // Pipeline: property selection → user info → claim filed with the
  // state (claim_process_task_status / claim_status) → document
  // verification (document_upload_task_status) → under state review
  // → approved. Each milestone's state (completed / current / failed)
  // is derived directly from backend fields instead of guessed date
  // offsets.
  //
  // Progress is the share of milestones completed (current = half
  // credit) — EXCEPT when document verification has failed, in which
  // case progress is fixed at 75%.
  // ============================================================
  useEffect(() => {
    if (!caseData) {
      setMilestones([]);
      setCaseProgress(0);
      return;
    }

    const properties = caseData.user_properties || [];
    const hasProperties = properties.length > 0;
    const hasUserInfo = !!caseData.user_details?.[0];
    const docs = caseData.user_docs?.[0] || {};
    const hasUploadedDocs = !!(docs.proof_id || docs.ssn_id || docs.adress_proof);

    const claimProcessStatus = caseData.claim_process_task_status; // 'completed' | 'failed' | 'queued' | ''
    const claimStatus = caseData.claim_status; // 'Success' | 'Pending' | 'Failed'
    const claimFiled = claimProcessStatus === 'completed' && claimStatus === 'Success';
    const claimFilingFailed = claimStatus === 'Failed' || claimProcessStatus === 'failed';

    const uploadStatus = caseData.document_upload_task_status; // 'processing' | 'failed' | 'completed' | undefined
    const uploadCompleted = uploadStatus === 'completed';
    const uploadFailed = uploadStatus === 'failed';
    const uploadProcessing = uploadStatus === 'processing';

    const submittedForReview = Boolean(caseData.submitted_at) && uploadCompleted;

    // "Approved" mirrors status === false meaning approved.
    const isApproved = caseData.status === false;

    const caseStartSource = caseData.submitted_at || caseData.createdAt || null;
    const hasCaseStartDate = Boolean(caseStartSource);
    const formatDisplayDate = (date) =>
      new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    const caseCreatedLabel = hasCaseStartDate
      ? formatDisplayDate(caseData.createdAt || caseStartSource)
      : null;

    const built = [];

    built.push({
      name: 'Property Selected',
      completed: hasProperties,
      current: !hasProperties,
      failed: false,
      description: hasProperties
        ? (caseCreatedLabel ? `Property identified on ${caseCreatedLabel}` : 'Property identified for claim')
        : 'Select the property you want to claim to get started',
    });

    built.push({
      name: 'Information Provided',
      completed: hasUserInfo,
      current: hasProperties && !hasUserInfo,
      failed: false,
      description: hasUserInfo
        ? 'Your personal details were submitted'
        : 'Waiting for your personal details',
    });

    built.push({
      name: 'Claim Filed with State',
      completed: claimFiled,
      current: hasUserInfo && !claimFiled && !claimFilingFailed,
      failed: claimFilingFailed,
      description: claimFiled
        ? `Claim filed successfully${caseData.claim_id ? ` (Claim ID: ${caseData.claim_id})` : ''}`
        : claimFilingFailed
          ? 'Claim filing failed. Please contact support.'
          : "Your claim is being filed with the State Controller's Office",
    });

    built.push({
      name: 'Documents Verified',
      completed: uploadCompleted,
      current: uploadProcessing,
      failed: uploadFailed,
      description: uploadCompleted
        ? 'All submitted documents were verified'
        : uploadFailed
          ? 'Document verification failed. Please retry and upload your documents again.'
          : uploadProcessing
            ? "We're verifying your resubmitted documents. This usually takes a few minutes."
            : claimFiled && !hasUploadedDocs
              ? 'Waiting for your documents to be uploaded'
              : 'Not started yet',
    });

    built.push({
      name: 'Submitted for State Review',
      completed: submittedForReview && !isApproved,
      current: false,
      failed: false,
      description: submittedForReview
        ? "Your claim is under review by the State Controller's Office"
        : 'Not started yet',
    });

    built.push({
      name: 'Claim Approved',
      completed: isApproved,
      current: submittedForReview && !isApproved,
      failed: false,
      description: isApproved
        ? 'Your claim has been approved and funds are being processed'
        : 'Not started yet',
    });

    setMilestones(built);

    if (uploadFailed) {
      // Fixed at 75% whenever document verification has failed.
      setCaseProgress(75);
    } else {
      const totalWeight = built.length;
      const earnedWeight = built.reduce((sum, m) => {
        if (m.completed) return sum + 1;
        if (m.current) return sum + 0.5;
        return sum;
      }, 0);
      setCaseProgress(Math.round((earnedWeight / totalWeight) * 100));
    }
  }, [caseData]);

  // ============================================================
  // ✅ Recent Updates from Case Data
  // ============================================================
  const getRecentUpdates = () => {
    if (!caseData) return [];

    const caseStartSource = caseData.submitted_at || caseData.createdAt || null;
    const hasCaseStartDate = Boolean(caseStartSource);
    const caseStartDate = new Date(caseStartSource || Date.now());

    const addDays = (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    const formatDisplayDate = (date) =>
      new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    const documentationVerifiedDate = addDays(caseStartDate, 15);
    const stateProcessingQueueDate = addDays(documentationVerifiedDate, 7);
    const paymentAuthorizationDate = addDays(documentationVerifiedDate, 14);
    const initialReviewCompletedDate = paymentAuthorizationDate;

    const isSuccess = caseData.claim_status === 'Success';
    const currentStage = caseData.claim_process_stage || 0;

    const updates = [
      {
        title: 'Documentation Verified',
        dateLabel: hasCaseStartDate ? formatDisplayDate(documentationVerifiedDate) : 'Date not available yet',
        description: 'All your documents have been validated by the state',
        active: isSuccess || currentStage >= 2,
      },
      {
        title: 'Case Entered State Processing Queue',
        dateLabel: hasCaseStartDate ? formatDisplayDate(stateProcessingQueueDate) : 'Date not available yet',
        description: 'Your case is now in the official state processing system',
        active: isSuccess || currentStage >= 3,
      },
      {
        title: 'Initial Review Completed',
        dateLabel: hasCaseStartDate ? formatDisplayDate(initialReviewCompletedDate) : 'Date not available yet',
        description: "State Controller's office has begun processing your claim",
        active: isSuccess || currentStage >= 4,
      },
    ];

    return updates;
  };

  // ============================================================
  // ✅ Existing Functions (unchanged)
  // ============================================================
  useEffect(() => {
    if (!searchResults) {
      const savedProperty = localStorage.getItem('propertyData');
      if (savedProperty) setSearchResults(JSON.parse(savedProperty));
    }

    if (!ownPropertyIds) {
      const savedOwnPropertyIds = localStorage.getItem('ownPropertyIds');
      if (savedOwnPropertyIds) {
        try {
          const parsed = JSON.parse(savedOwnPropertyIds);
          if (Array.isArray(parsed)) setOwnPropertyIds(parsed.map(String));
        } catch {
          // ignore invalid localStorage value
        }
      }
    }

    if (!userCase) {
      const savedUserCase = localStorage.getItem('userCase');
      if (savedUserCase) {
        try {
          setUserCase(JSON.parse(savedUserCase));
        } catch {
          // ignore invalid localStorage value
        }
      }
    }
  }, [
    searchResults,
    setSearchResults,
    ownPropertyIds,
    setOwnPropertyIds,
    userCase,
    setUserCase,
  ]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const storedLoginRaw = localStorage.getItem('userLogin');
        const storedLogin = storedLoginRaw ? JSON.parse(storedLoginRaw) : null;
        const userId = storedLogin?.user?.user_id || userData?._id;

        if (!userId) return;

        const res = await axios.get(`/api/notification?userId=${userId}`);

        if (res.data.success) {
          console.log('User notifications:', res.data.data);
          setAllNotifications(res.data.data);
          setNotifications(res.data.data.length > 0);
        } else {
          console.error('Failed to fetch notifications:', res.data.error);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [userData]);

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const formatDisplayDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const handleShareSuccess = async () => {
    if (!shareAmount || parseFloat(shareAmount) <= 0) return;
    try {
      setShareError('');
      const storedLoginRaw = localStorage.getItem('userLogin');
      const storedLogin = storedLoginRaw ? JSON.parse(storedLoginRaw) : null;
      const userId = storedLogin?.user?.user_id || userData?._id;

      const res = await axios.post('/api/referral-link', {
        user_id: userId,
        case_id: caseData?._id,
      });

      setReferralCode(res.data.referral_code);
      setHasShared(true);
    } catch (err) {
      console.error('Error creating referral link:', err);
      setShareError('Could not create your referral link. Please try again.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notificationId) => {
    try {
      const storedLoginRaw = localStorage.getItem('userLogin');
      const storedLogin = storedLoginRaw ? JSON.parse(storedLoginRaw) : null;
      const userId = storedLogin?.user?.user_id || userData?._id;

      const res = await axios.put(`/api/notification?id=${notificationId}`, {
        status: true,
      });

      if (res.data.success) {
        const updated = await axios.get(`/api/notification?userId=${userId}`);
        if (updated.data.success) {
          setAllNotifications(updated.data.data);
          setNotifications(updated.data.data.length > 0);
        }
      } else {
        console.error('Failed to update notification:', res.data.error);
      }
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const handleSmsToggle = async () => {
    const newState = !smsEnabled;
    setSmsEnabled(newState);
    try {
      console.log('SMS notifications:', newState ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Failed to update SMS preference:', error);
      setSmsEnabled(!newState);
    }
  };

  const shareToSocial = (platform) => {
    let url = '';
    switch (platform) {
      case 'email':
        url = `mailto:test@gmail.com`;
        break;
      case 'call':
        url = `tel:5551234567`;
        break;
    }
    if (url) window.open(url, '_blank');
  };

  // ============================================================
  // ✅ Get data for display
  // ============================================================
  const recentUpdates = getRecentUpdates();
  const caseNumber = caseData?.case_id || 'CM-2024-001234';
  const claimStatus = caseData?.claim_status || 'Pending';
  const isSuccess = claimStatus === 'Success';
  const isFailed = claimStatus === 'Failed';

  // ✅ Check if any properties are already claimed
  const properties = caseData?.user_properties || [];
  const hasClaimedProperties = properties.some(p => p.is_claimed === true);
  const claimedCount = properties.filter(p => p.is_claimed === true).length;
  const availableCount = properties.filter(p => p.is_claimed !== true).length;

  // ============================================================
  // ✅ Loading State
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E1261C] mx-auto mb-4"></div>
          <p className="text-[#4A4A4A]">Loading your case data...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ No Data State
  // ============================================================
  if (!caseData) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#E1261C] text-5xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-[#0A0A0A] mb-2">No Active Case Found</h3>
          <p className="text-[#4A4A4A]">You don't have any active case. Start by searching for unclaimed property.</p>
          <button
            onClick={() => router.push('/?step=search')}
            className="mt-4 px-6 py-2 bg-[#E1261C] text-white rounded-lg hover:bg-[#B11912]"
          >
            Search for Property
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ Render
  // ============================================================
  return (
    <div className="min-h-screen bg-[#F7F5F2] pt-4">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E3] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Link href="/">
                <h1 className="text-3xl font-bold text-[#0A0A0A] font-['Fraunces']">
                  CatchMyCash
                </h1>
              </Link>
              <p className="text-[#4A4A4A] mt-1 font-['JetBrains_Mono'] text-sm">
                Case #{caseNumber}
              </p>
            </div>
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <button
                onClick={handleSmsToggle}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${smsEnabled
                  ? 'bg-[#E1261C] text-white shadow-sm'
                  : 'border border-[#E8E6E3] text-[#0A0A0A] hover:bg-[#FCE9E7]'
                  }`}
              >
                <span className="text-base">📱</span>
                <span className="hidden sm:inline">
                  SMS {smsEnabled ? 'On' : 'Off'}
                </span>
              </button>
              <button
                onClick={onViewLeaderboard}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-[#E8E6E3] text-[#0A0A0A] hover:bg-[#FCE9E7] transition-all"
              >
                <Trophy className="h-4 w-4 text-[#E1261C]" />
                <span className="hidden sm:inline">Leaderboard</span>
              </button>

              <button
                onClick={() => router.push('/myAccount')}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-[#E8E6E3] text-[#0A0A0A] hover:bg-[#FCE9E7] transition-all"
              >
                <LayoutDashboard className="h-4 w-4 text-[#E1261C]" />
                <span className="hidden sm:inline">My Dashboard</span>
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all border border-[#E8E6E3] hover:bg-[#FCE9E7] ${notifications ? 'bg-[#FCE9E7]' : ''
                    }`}
                >
                  <Bell className="h-4 w-4 text-[#E1261C]" />
                  <span className="hidden sm:inline">Notifications</span>
                  {allNotifications.length > 0 && (
                    <span className="ml-1 bg-[#E1261C] text-white text-xs px-2 py-0.5 rounded-full">
                      {allNotifications.length}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {notifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-[#E8E6E3] rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-[#E8E6E3] text-[#E1261C] font-semibold font-['Fraunces']">
                      Notifications
                    </div>
                    {allNotifications.length > 0 ? (
                      <ul className="divide-y divide-[#E8E6E3]">
                        {allNotifications.map((n, i) => (
                          <li
                            key={i}
                            className="p-3 hover:bg-[#FCE9E7] transition duration-200 cursor-pointer"
                            onClick={() => handleNotificationClick(n._id)}
                          >
                            <p className="text-sm text-[#0A0A0A] font-medium">
                              {n.title}
                            </p>
                            <p className="text-xs text-[#4A4A4A]">
                              {n.message}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-[#888888] text-sm">
                        No new notifications
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Case Status Banner */}
        <div className={`mb-6 p-4 rounded-xl border ${isSuccess ? 'bg-green-50 border-green-200' :
          isFailed ? 'bg-red-50 border-red-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
          <div className="flex items-center gap-3">
            {isSuccess ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : isFailed ? (
              <Clock className="h-6 w-6 text-red-600" />
            ) : (
              <Clock className="h-6 w-6 text-yellow-600" />
            )}
            <div>
              <p className="font-semibold text-[#0A0A0A]">
                Status: {claimStatus}
              </p>
              <p className="text-sm text-[#4A4A4A]">
                {isSuccess ? 'Your claim has been successfully initiated.!' :
                  isFailed ? 'Your claim failed. Please contact support.' :
                    'Your claim is being initiated.'}
              </p>
            </div>
          </div>
        </div>

        {/* ✅ Warning Banner for Already Claimed Properties */}
        {hasClaimedProperties && (
          <div className="mb-6 p-4 bg-[#FCE9E7] border border-[#E1261C]/30 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#E1261C] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#E1261C]">
                  ⚠️ {claimedCount} Properit{claimedCount > 1 ? 'ies' : 'y'} Already Claimed
                </p>
                <p className="text-sm text-[#4A4A4A] mt-1">
                  {claimedCount} of {properties.length} properties have already been claimed by another user and cannot be claimed again.
                </p>
                {availableCount > 0 && (
                  <p className="text-sm text-[#E1261C] mt-1">
                    ✅ {availableCount} properit{availableCount > 1 ? 'ies' : 'y'} are still available to claim.
                  </p>
                )}
                <p className="text-xs text-[#888888] mt-1 font-['JetBrains_Mono']">
                  Claimed Property IDs: {properties.filter(p => p.is_claimed === true).map(p => p.property_id).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Overview */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
              Your Case{' '}
              <span className="text-[#E1261C] italic font-normal">
                Progress
              </span>
            </h2>
            <Badge className={`${isSuccess ? 'bg-green-600' :
              isFailed ? 'bg-red-600' :
                'bg-[#E1261C]'
              } text-white border-none`}>
              {isSuccess ? 'Completed' : isFailed ? 'Failed' : 'In Progress'}
            </Badge>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#4A4A4A] font-['JetBrains_Mono']">
                Overall Progress
              </span>
              <span className="text-sm font-medium text-[#E1261C]">
                {caseProgress}%
              </span>
            </div>
            <div className="w-full h-2 bg-[#E8E6E3] rounded-full overflow-hidden mb-4">
              <div
                className={`h-full transition-all duration-300 rounded-full ${isSuccess ? 'bg-green-600' :
                  isFailed ? 'bg-red-600' :
                    'bg-gradient-to-r from-[#E1261C] to-[#B11912]'
                  }`}
                style={{ width: `${caseProgress}%` }}
              />
            </div>
            <p className="text-sm text-[#4A4A4A]">
              {isSuccess ? '✅ Your claim has been successfully initiated.!' :
                isFailed ? '❌ Your claim failed. Please contact support.' :
                  'Your case is progressing well. Estimated completion in 3-4 weeks.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-[#FCE9E7] p-4 rounded-lg">
              <DollarSign className="h-8 w-8 text-[#E1261C] mb-2" />
              <h3 className="font-bold text-[#0A0A0A]">Total Property Amount</h3>
              <p className="text-2xl font-bold text-[#E1261C] font-['Fraunces']">
                $
                {estimatedPayout.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-[#4A4A4A] mt-1">
                {properties.length} properit{properties.length !== 1 ? 'ies' : 'y'} found
              </p>
            </div>
            <div className="bg-[#F0EEEB] p-4 rounded-lg">
              <FileText className="h-8 w-8 text-[#4A4A4A] mb-2" />
              <h3 className="font-bold text-[#0A0A0A]">Service Fee (10%)</h3>
              <p className="text-2xl font-bold text-[#4A4A4A] font-['Fraunces']">
                $
                {estimatedFee.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="bg-[#FCE9E7] p-4 rounded-lg border-2 border-[#E1261C]/30">
              <CheckCircle className="h-8 w-8 text-[#E1261C] mb-2" />
              <h3 className="font-bold text-[#0A0A0A]">Net Amount (You Get)</h3>
              <p className="text-2xl font-bold text-[#E1261C] font-['Fraunces']">
                $
                {estimatedNet.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-6 font-['Fraunces']">
            Case{' '}
            <span className="text-[#E1261C] italic font-normal">Timeline</span>
          </h3>
          <div className="space-y-4">
            {milestones.length > 0 ? (
              milestones.map((milestone, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${milestone.completed
                      ? 'bg-[#003f2f]'
                      : milestone.current
                        ? 'bg-[#E1261C] animate-pulse'
                        : milestone.failed
                          ? 'bg-red-600'
                          : 'bg-[#D4D4D4]'
                      }`}
                  >
                    {milestone.completed ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : milestone.current ? (
                      <Clock className="h-5 w-5 text-white" />
                    ) : milestone.failed ? (
                      <span className="text-white font-bold">✕</span>
                    ) : (
                      <span className="text-white font-bold font-['JetBrains_Mono'] text-sm">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4
                      className={`font-medium ${milestone.completed
                        ? 'text-[#0A0A0A]'
                        : milestone.current
                          ? 'text-[#E1261C]'
                          : milestone.failed
                            ? 'text-red-600'
                            : 'text-[#888888]'
                        }`}
                    >
                      {milestone.name}
                    </h4>
                    <p className="text-sm text-[#4A4A4A]">
                      {milestone.description}
                    </p>
                  </div>
                  {milestone.current && (
                    <Badge className="bg-[#E1261C] text-white border-none ml-2">
                      Current
                    </Badge>
                  )}
                  {milestone.failed && (
                    <Badge className="bg-red-600 text-white border-none ml-2">
                      Failed
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[#4A4A4A] text-center py-4">No milestones available</p>
            )}
          </div>
        </div>

        {/* Share Success Story - Only show if success */}
        {isSuccess && (
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-[#FCE9E7] rounded-full flex items-center justify-center mr-3">
                <Share2 className="h-5 w-5 text-[#E1261C]" />
              </div>
              <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
                Share Your{' '}
                <span className="text-[#E1261C] italic font-normal">
                  Success & Earn More!
                </span>
              </h3>
            </div>

            {!hasShared ? (
              <div>
                <p className="text-[#4A4A4A] mb-4">
                  Once you receive your money, share your success story and earn
                  1% of any new customer recoveries from your referral link!
                </p>

                <div className="bg-[#FCE9E7] p-4 rounded-lg border border-[#E8E6E3]">
                  <h4 className="font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
                    Preview Your Success Post:
                  </h4>
                  <div className="text-sm text-[#4A4A4A] italic bg-white p-3 rounded-lg">
                    "Just recovered ${estimatedNet.toFixed(2)} in unclaimed property with
                    @CatchMyCash! The process was so easy - they handled
                    everything while I just waited for my check. Check if you have
                    money waiting: [your_referral_link]"
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="$ Amount you received"
                    value={shareAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow empty string or positive numbers only
                      if (val === '' || parseFloat(val) >= 0) {
                        setShareAmount(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent minus sign, 'e' (exponential), and other special characters
                      if (e.key === '-' || e.key === '+' || e.key === 'Minus' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      // Prevent pasting negative values
                      const pasted = e.clipboardData.getData('text');
                      if (pasted.includes('-')) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full sm:flex-1 px-4 py-2 border-2 border-[#E8E6E3] rounded-lg text-[#0A0A0A] placeholder-[#888888] focus:border-[#E1261C] focus:outline-none transition-all"
                  />
                  <button
                    onClick={handleShareSuccess}
                    disabled={!shareAmount || parseFloat(shareAmount) <= 0}
                    className={`w-full sm:w-auto px-6 py-2 font-semibold rounded-lg transition-all ${shareAmount && parseFloat(shareAmount) > 0
                      ? 'bg-[#E1261C] text-white hover:bg-[#B11912] shadow-md hover:shadow-lg'
                      : 'bg-[#D4D4D4] text-[#888888] cursor-not-allowed'
                      }`}
                  >
                    Create My Referral Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-[#E1261C]" />
                </div>
                <h4 className="font-bold text-[#0A0A0A] mb-2 font-['Fraunces']">
                  Success Story Shared!
                </h4>
                <p className="text-[#4A4A4A] mb-4">
                  You'll earn 1% of any recoveries from people who use your
                  referral link.
                </p>
                <button onClick={() => onCreateReferral(referralCode)}
                  className="bg-[#E1261C] hover:bg-[#B11912] text-white px-6 py-3 font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  View My Referral Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recent Updates */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
            Recent{' '}
            <span className="text-[#E1261C] italic font-normal">Updates</span>
          </h3>
          <div className="space-y-3">
            {recentUpdates.length > 0 ? (
              recentUpdates.map((update) => (
                <div key={update.title} className="flex items-start">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 mr-3 ${update.active ? 'bg-[#E1261C]' : 'bg-[#003f2f]'
                      }`}
                  ></div>
                  <div className="w-[90%]">
                    <p className="font-medium text-[#0A0A0A]">{update.title}</p>
                    <p className="text-sm text-[#4A4A4A]">
                      {update.dateLabel} - {update.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[#4A4A4A] text-center py-4">No updates available</p>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-center mt-8">
          <p className="text-[#4A4A4A] mb-4">
            Questions about your case? Our team is here to help.
          </p>
          <div className="flex justify-center flex-wrap gap-3">
            <button
              onClick={() => shareToSocial('email')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#E8E6E3] rounded-lg text-[#0A0A0A] hover:bg-[#FCE9E7] transition-all"
            >
              📧 Email Support
            </button>
            <button
              onClick={() => shareToSocial('call')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#E8E6E3] rounded-lg text-[#0A0A0A] hover:bg-[#FCE9E7] transition-all"
            >
              📞 Call (555) 123-4567
            </button>
            <button
              onClick={onViewLeaderboard}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E1261C] text-white rounded-lg hover:bg-[#B11912] transition-all shadow-sm"
            >
              <Trophy className="h-4 w-4" />
              View Success Stories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseTracking;