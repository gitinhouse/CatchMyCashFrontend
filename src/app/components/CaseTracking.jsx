import React, { useState, useRef, useEffect } from "react";
import { Button } from "./uicomponents/Button";
import { Card } from "./uicomponents/Card";
import { Badge } from "./uicomponents/Badge";
import { Progress } from "./uicomponents/Progress";
import {
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  Trophy,
  Share2,
  Bell,
} from "lucide-react";
import { useSearchStore } from "../store/searchStore";
import axios from "axios";

const CaseTracking = ({ onViewLeaderboard, onCreateReferral }) => {
  const [notifications, setNotifications] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const [shareAmount, setShareAmount] = useState("");
  const [hasShared, setHasShared] = useState(false);
  const dropdownRef = useRef(null);
  const [estimatedPayout, setEstimatedPayout] = useState(0);
  const [estimatedFee, setEstimatedFee] = useState(0.1);
  const [estimatedNet, setEstimatedNet] = useState(0);
  const [milestones, setMilestones] = useState([]);
const [smsEnabled, setSmsEnabled] = useState(false);

  const caseProgress = 75;

  const {
    userData,
    userAgreement,
    userSignedAgreement,
    userCase,
    searchResults,
    setSearchResults,
  } = useSearchStore();

  useEffect(() => {
    if (!searchResults) {
      const savedProperty = localStorage.getItem("propertyData");
      if (savedProperty) setSearchResults(JSON.parse(savedProperty));
    }
  }, [searchResults, setSearchResults]);

  useEffect(() => {
    if (searchResults && Array.isArray(searchResults)) {
      const total = searchResults.reduce((sum, item) => {
        const value = parseFloat(item.current_cash_balance || 0);
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
      setEstimatedPayout(total);
      const fee = total * 0.1;
      setEstimatedFee(fee);
      setEstimatedNet(total - fee);
    }
  }, [searchResults]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!userData?._id) return;

        const res = await axios.get(`/api/notification?userId=${userData._id}`);

        if (res.data.success) {
          console.log("User notifications:", res.data.data);
          setAllNotifications(res.data.data);
          setNotifications(res.data.data.length > 0);
        } else {
          console.error("Failed to fetch notifications:", res.data.error);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [userData]);

  const formatDate = (date) => date.toISOString().split("T")[0];
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const baseMilestones = [
    "Case Submitted",
    "Initial Review",
    "Documentation Verified",
    "State Processing",
    "Payment Authorization",
    "Funds Distributed",
  ];

  useEffect(() => {
    const today = new Date();
    const generated = baseMilestones.map((name, index) => {
      const milestoneDate = addDays(today, index * 7);
      return {
        name,
        date: formatDate(milestoneDate),
        completed: index < 3,
        current: index === 3,
        estimated: index >= 3 ? formatDate(milestoneDate) : undefined,
      };
    });
    setMilestones(generated);
  }, []);

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notificationId) => {
    try {
      // Call PUT API to mark notification as read
      const res = await axios.put(`/api/notification?id=${notificationId}`, {
        status: true,
      });

      if (res.data.success) {
        // Re-fetch notifications to refresh UI
        const updated = await axios.get(
          `/api/notification?userId=${userData._id}`
        );
        if (updated.data.success) {
          setAllNotifications(updated.data.data);
          setNotifications(updated.data.data.length > 0);
        }
      } else {
        console.error("Failed to update notification:", res.data.error);
      }
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  const handleSmsToggle = async () => {
  const newState = !smsEnabled;
  setSmsEnabled(newState);
  
  // Add your API call here to save the preference
  try {
    // await updateSmsPreference(newState);
    console.log('SMS notifications:', newState ? 'enabled' : 'disabled');
  } catch (error) {
    console.error('Failed to update SMS preference:', error);
    // Revert on error
    setSmsEnabled(!newState);
  }
};
  const shareToSocial = (platform) => {
    let url = "";

    switch (platform) {
      case "email":
        url = `mailto:test@gmai.com`;
        break;
      case "call":
        url = `telto:5551234567`;
        break;
    }

    if (url) window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      {/* Header */}
      <div className="glass-card border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-green-400">CatchMyCash</h1>
              <p className="text-gray-300 mt-1">Case #CM-2024-001234</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleSmsToggle}
                className={`flex items-center ${
                  smsEnabled ? "bg-green-600 text-white" : ""
                }`}
              >
                <span className="h-4 w-4 sm:mr-2">📱</span>
                <span className="sm:inline-block hidden">
                  SMS {smsEnabled ? "On" : "Off"}
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={onViewLeaderboard}
                className="flex items-center "
              >
                <Trophy className="h-4 w-4 sm:mr-2" />
                <span className="sm:inline-block hidden">Leaderboard</span>
              </Button>

              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="outline"
                  onClick={() => setNotifications(!notifications)}
                  className={`flex items-center ${
                    notifications ? "bg-primary/90 text-white" : ""
                  }`}
                >
                  <Bell className="h-4 w-4 sm:mr-2" />
                  <span className="sm:inline-block hidden">Notifications</span>
                  {allNotifications.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-[1px] rounded-full">
                      {allNotifications.length}
                    </span>
                  )}
                </Button>

                {/* Dropdown */}
                {notifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-gray-900 border border-green-600/30 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto backdrop-blur-md bg-opacity-95">
                    <div className="p-3 border-b border-green-600/20 text-green-400 font-semibold">
                      Notifications
                    </div>

                    {allNotifications.length > 0 ? (
                      <ul className="divide-y divide-green-600/10">
                        {allNotifications.map((n, i) => (
                          <li
                            key={i}
                            className="p-3 hover:bg-green-700/10 transition duration-200 cursor-pointer"
                            onClick={() => handleNotificationClick(n._id)}
                          >
                            <p className="text-sm text-white font-medium">
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-400">{n.message}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-gray-400 text-sm">
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
        {/* Progress Overview */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Your Case Progress
            </h2>
            <Badge className="bg-blue-500 text-white">In Progress</Badge>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress
              </span>
              <span className="text-sm font-medium text-[#ffffff7a]">
                {caseProgress}%
              </span>
            </div>
            <Progress value={caseProgress} className="mb-4" />
            <p className="text-sm text-gray-600">
              Your case is progressing well. Estimated completion in 3-4 weeks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-bold text-green-800">Estimated Payout</h3>
              <p className="text-2xl font-bold text-green-600">
                ${estimatedPayout.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-bold text-blue-800">Service Fee (10%)</h3>
              <p className="text-2xl font-bold text-blue-600">
                ${estimatedFee.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <CheckCircle className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-bold text-purple-800">Your Net Amount</h3>
              <p className="text-2xl font-bold text-purple-600">
                ${estimatedNet.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Milestone Timeline */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-6">Case Timeline</h3>
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                    milestone.completed
                      ? "bg-green-500"
                      : milestone.current
                      ? "bg-blue-500 animate-pulse"
                      : "bg-gray-300"
                  }`}
                >
                  {milestone.completed ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : milestone.current ? (
                    <Clock className="h-5 w-5 text-white" />
                  ) : (
                    <span className="text-white font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-medium ${
                      milestone.completed
                        ? "text-green-800"
                        : milestone.current
                        ? "text-blue-800"
                        : "text-gray-600"
                    }`}
                  >
                    {milestone.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {milestone.completed
                      ? `Completed ${milestone.date}`
                      : milestone.current
                      ? `In progress - Est. ${milestone.estimated}`
                      : `Estimated ${milestone.estimated}`}
                  </p>
                </div>
                {milestone.current && (
                  <Badge className="bg-blue-500">Current</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Share Success Story */}
        <Card className="p-6 mb-8 bg-yellow-50 border-yellow-200">
          <div className="flex items-center mb-4">
            <Share2 className="h-6 w-6 text-yellow-600 mr-3" />
            <h3 className="text-lg font-bold text-yellow-800">
              Share Your Success & Earn More!
            </h3>
          </div>

          {!hasShared ? (
            <div>
              <p className="text-yellow-700 mb-4">
                Once you receive your money, share your success story and earn
                1% of any new customer recoveries from your referral link!
              </p>

              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-gray-600 mb-2">
                  Preview Your Success Post:
                </h4>
                <div className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded">
                  "Just recovered $[amount] in unclaimed property with
                  @FindMyMoney! The process was so easy - they handled
                  everything while I just waited for my check. Check if you have
                  money waiting: [your_referral_link]"
                </div>
              </div>

              <div className="mt-4 flex items-center flex-wrap space-x-4 gap-2">
                <input
                  type="number"
                  placeholder="Amount you received"
                  value={shareAmount}
                  onChange={(e) => setShareAmount(e.target.value)}
                  className="px-3 py-2 mr-0 border text-gray-600 border-amber-300 rounded flex-1 "
                />
                <Button
                  onClick={handleShareSuccess}
                  disabled={!shareAmount}
                  className="bg-yellow-600 hover:bg-yellow-700 w-[100%] sm:w-fit"
                >
                  Create My Referral Link
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h4 className="font-bold text-green-800 mb-2">
                Success Story Shared!
              </h4>
              <p className="text-green-700 mb-4">
                You'll earn 1% of any recoveries from people who use your
                referral link.
              </p>
              <Button
                onClick={onCreateReferral}
                className="bg-green-600 hover:bg-green-700"
              >
                View My Referral Dashboard
              </Button>
            </div>
          )}
        </Card>

        {/* Recent Updates */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Updates</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
              <div className="w-[90%]">
                <p className="font-medium">Documentation Verified</p>
                <p className="text-sm text-gray-600">
                  Jan 28, 2024 - All your documents have been validated by the
                  state
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
              <div className="w-[90%]">
                <p className="font-medium">
                  Case Entered State Processing Queue
                </p>
                <p className="text-sm text-gray-600">
                  Jan 25, 2024 - Your case is now in the official state
                  processing system
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
              <div className="w-[90%]">
                <p className="font-medium">Initial Review Completed</p>
                <p className="text-sm text-gray-600">
                  Jan 22, 2024 - State Controller's office has begun processing
                  your claim
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Info */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            Questions about your case? Our team is here to help.
          </p>
          <div className="flex justify-center flex-wrap gap-2 space-x-4">
            <Button variant="outline" onClick={() => shareToSocial("email")}>
              📧 Email Support
            </Button>
            <Button variant="outline" onClick={() => shareToSocial("call")}>
              📞 Call (555) 123-4567
            </Button>
            <Button variant="outline" onClick={onViewLeaderboard}>
              <Trophy className="h-4 w-4 mr-2" />
              View Success Stories
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseTracking;
