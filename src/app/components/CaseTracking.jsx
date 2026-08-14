import React, { useState, useRef, useEffect } from 'react';
import { Button } from './uicomponents/Button';
import { Card } from './uicomponents/Card';
import { Badge } from './uicomponents/Badge';
import {
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  Trophy,
  Share2,
  Bell,
} from 'lucide-react';
import { useSearchStore } from '../store/searchStore';
import axios from 'axios';

const CaseTracking = ({ onViewLeaderboard, onCreateReferral }) => {
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

  const [caseProgress, setCaseProgress] = useState(0);

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
    if (!searchResults || !Array.isArray(searchResults)) return;

    const claimedIds = Array.isArray(ownPropertyIds)
      ? ownPropertyIds.map(String)
      : [];

    const claimedProperties =
      claimedIds.length > 0
        ? searchResults.filter((property) =>
          claimedIds.includes(getPropertyId(property)),
        )
        : searchResults;

    const total = claimedProperties.reduce(
      (sum, property) => sum + parsePropertyAmount(property),
      0,
    );
    // Round fee to nearest cent first, then derive net (same as PropertyResults)
    const fee = Math.round(total * 10) / 100;
    const net = total - fee;

    setEstimatedPayout(total);
    setEstimatedFee(fee);
    setEstimatedNet(net);
  }, [searchResults, ownPropertyIds]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!userData?._id) return;

        const res = await axios.get(`/api/notification?userId=${userData._id}`);

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

  const formatDate = (date) => date.toISOString().split('T')[0];
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

  // State processing base date → Recent Updates schedule
  const caseStartDate = new Date(
    userCase?.submitted_at || userCase?.createdAt || Date.now()
  );

  const documentationVerifiedDate = addDays(caseStartDate, 14);
  const stateProcessingQueueDate = addDays(caseStartDate, 21);
  const initialReviewCompletedDate = addDays(caseStartDate, 28);
  const recentUpdates = [
    {
      title: 'Documentation Verified',
      date: documentationVerifiedDate,
      description: 'All your documents have been validated by the state',
      active: true,
    },
    {
      title: 'Case Entered State Processing Queue',
      date: stateProcessingQueueDate,
      description:
        'Your case is now in the official state processing system',
      active: false,
    },
    {
      title: 'Initial Review Completed',
      date: initialReviewCompletedDate,
      description:
        "State Controller's office has begun processing your claim",
      active: false,
    },
  ];

  const baseMilestones = [
    'Case Submitted',
    'Initial Review',
    'Documentation Verified',
    'State Processing',
    'Payment Authorization',
    'Funds Distributed',
  ];

  useEffect(() => {
    // Anchor timeline to the case's real submission date, not "today at page load"
    const anchorDate = new Date(
      userCase?.submitted_at || userCase?.createdAt || Date.now(),
    );
    const now = new Date();

    const withDates = baseMilestones.map((name, index) => ({
      name,
      milestoneDate: addDays(anchorDate, index * 7),
    }));

    // First milestone whose date hasn't arrived yet = the "current" one.
    // If every milestone date has already passed, treat the last as current.
    let currentIndex = withDates.findIndex((m) => m.milestoneDate > now);
    if (currentIndex === -1) currentIndex = withDates.length - 1;

    const generated = withDates.map((m, index) => ({
      name: m.name,
      date: formatDate(m.milestoneDate),
      completed: index < currentIndex,
      current: index === currentIndex,
      estimated: index >= currentIndex ? formatDate(m.milestoneDate) : undefined,
    }));

    setMilestones(generated);

    // Overall progress bar — completed steps + half-credit for the in-progress one
    const percent = Math.round(
      ((currentIndex + 0.5) / baseMilestones.length) * 100,
    );
    setCaseProgress(Math.min(percent, 100));
  }, [userCase]);

  const handleShareSuccess = () => {
    if (shareAmount && parseFloat(shareAmount) > 0) {
      setHasShared(true);
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
      const res = await axios.put(`/api/notification?id=${notificationId}`, {
        status: true,
      });

      if (res.data.success) {
        const updated = await axios.get(
          `/api/notification?userId=${userData._id}`,
        );
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

  return (
    <div className="min-h-screen bg-[#F7F5F2] pt-4">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E3] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0A0A0A] font-['Fraunces']">
                CatchMyCash
              </h1>
              <p className="text-[#4A4A4A] mt-1 font-['JetBrains_Mono'] text-sm">
                Case #CM-2024-001234
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
        {/* Progress Overview - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
              Your Case{' '}
              <span className="text-[#E1261C] italic font-normal">
                Progress
              </span>
            </h2>
            <Badge className="bg-[#E1261C] text-white border-none">
              In Progress
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
                className="h-full bg-gradient-to-r from-[#E1261C] to-[#B11912] transition-all duration-300 rounded-full"
                style={{ width: `${caseProgress}%` }}
              />
            </div>
            <p className="text-sm text-[#4A4A4A]">
              Your case is progressing well. Estimated completion in 3-4 weeks.
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

        {/* Milestone Timeline - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-6 font-['Fraunces']">
            Case{' '}
            <span className="text-[#E1261C] italic font-normal">Timeline</span>
          </h3>
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${milestone.completed
                      ? 'bg-[#003f2f]'
                      : milestone.current
                        ? 'bg-[#E1261C] animate-pulse'
                        : 'bg-[#D4D4D4]'
                    }`}
                >
                  {milestone.completed ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : milestone.current ? (
                    <Clock className="h-5 w-5 text-white" />
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
                          : 'text-[#888888]'
                      }`}
                  >
                    {milestone.name}
                  </h4>
                  <p className="text-sm text-[#4A4A4A]">
                    {milestone.completed
                      ? `Completed ${milestone.date}`
                      : milestone.current
                        ? `In progress - Est. ${milestone.estimated}`
                        : `Estimated ${milestone.estimated}`}
                  </p>
                </div>
                {milestone.current && (
                  <Badge className="bg-[#E1261C] text-white border-none ml-2">
                    Current
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Share Success Story - Red/Yellow Themed */}
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
                  "Just recovered $[amount] in unclaimed property with
                  @CatchMyCash! The process was so easy - they handled
                  everything while I just waited for my check. Check if you have
                  money waiting: [your_referral_link]"
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="number"
                  placeholder="Amount you received"
                  value={shareAmount}
                  onChange={(e) => setShareAmount(e.target.value)}
                  className="w-full sm:flex-1 px-4 py-2 border-2 border-[#E8E6E3] rounded-lg text-[#0A0A0A] placeholder-[#888888] focus:border-[#E1261C] focus:outline-none transition-all"
                />
                <button
                  onClick={handleShareSuccess}
                  disabled={!shareAmount}
                  className={`w-full sm:w-auto px-6 py-2 font-semibold rounded-lg transition-all ${shareAmount
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
              <button
                onClick={onCreateReferral}
                className="bg-[#E1261C] hover:bg-[#B11912] text-white px-6 py-3 font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                View My Referral Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Recent Updates - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
            Recent{' '}
            <span className="text-[#E1261C] italic font-normal">Updates</span>
          </h3>
          <div className="space-y-3">
            {recentUpdates.map((update) => (
              <div key={update.title} className="flex items-start">
                <div
                  className={`w-2 h-2 rounded-full mt-2 mr-3 ${update.active ? 'bg-[#E1261C]' : 'bg-[#003f2f]'
                    }`}
                ></div>
                <div className="w-[90%]">
                  <p className="font-medium text-[#0A0A0A]">{update.title}</p>
                  <p className="text-sm text-[#4A4A4A]">
                    {formatDisplayDate(update.date)} - {update.description}
                  </p>
                </div>
              </div>
            ))}
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