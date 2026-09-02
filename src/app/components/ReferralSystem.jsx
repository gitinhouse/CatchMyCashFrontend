'use client';
import React, { useState, useEffect } from 'react';
import { Badge } from './uicomponents/Badge';
import axios from 'axios';
import { Share2, Copy, Facebook, Twitter, MessageCircle, Mail, DollarSign, Users, TrendingUp, ArrowLeft, CheckCircle } from 'lucide-react';

const ReferralSystem = ({ onBack, referralCode }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareMessage, setShareMessage] = useState(
    "Just recovered money in unclaimed property with @CatchMyCash! The process was so easy - they handled everything while I just waited for my check. Check if you have money waiting:"
  );
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    totalReferrals: 0,
    successfulCases: 0,
  });
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  const referralLink =
    referralCode && typeof window !== 'undefined'
      ? `${window.location.origin}/ref/${referralCode}`
      : '';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const storedLoginRaw = localStorage.getItem('userLogin');
        const storedLogin = storedLoginRaw ? JSON.parse(storedLoginRaw) : null;
        const userId = storedLogin?.user?.user_id;
        if (!userId) {
          setLoading(false);
          return;
        }

        const res = await axios.get(`/api/referral?user_id=${userId}`);
        const { stats: apiStats, referrals } = res.data;

        setStats({
          totalEarnings: apiStats?.totalEarnings || 0,
          pendingEarnings: apiStats?.pendingEarnings || 0,
          totalReferrals: apiStats?.totalReferrals || 0,
          successfulCases: apiStats?.successfulCases || 0,
        });

        setRecentReferrals(
          (referrals || []).map((r) => ({
            id: r._id,
            name: r.linked_user_name || 'Referred User',
            amount: r.comission || 0,
            status: r.status ? 'Paid' : 'Processing',
            date: new Date(r.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
          }))
        );
      } catch (err) {
        console.error('Error fetching referral stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const copyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareToSocial = (platform) => {
    if (!referralLink) return;
    const encodedMessage = encodeURIComponent(`${shareMessage} ${referralLink}`);
    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodedMessage}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
        break;
      case 'email':
        url = `mailto:?subject=Check if you have unclaimed money!&body=${encodedMessage}`;
        break;
      case 'sms':
        url = `sms:?body=${encodedMessage}`;
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
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="flex items-center gap-2 mr-4 px-3 py-2 border border-[#E8E6E3] rounded-lg text-[#0A0A0A] hover:bg-[#FCE9E7] transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div>
                <h1 className="sm:text-3xl text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
                  Referral <span className="text-[#E1261C] italic font-normal">Dashboard</span>
                </h1>
                <p className="text-[#4A4A4A] mt-1">Earn 1% of every successful recovery</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!referralCode && (
          <div className="mb-6 p-4 bg-[#FFF4E5] border border-[#FFB347] rounded-xl text-sm text-[#0A0A0A]">
            No referral link found for this session. Go back and click "Create My Referral Link" first.
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-6 w-6 text-[#E1261C]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
              ${stats.totalEarnings.toFixed(2)}
            </h3>
            <p className="text-[#4A4A4A] text-sm">Total Earned</p>
          </div>
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-[#E1261C]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
              ${stats.pendingEarnings.toFixed(2)}
            </h3>
            <p className="text-[#4A4A4A] text-sm">Pending</p>
          </div>
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-[#E1261C]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">{stats.totalReferrals}</h3>
            <p className="text-[#4A4A4A] text-sm">Total Referrals</p>
          </div>
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
              <Share2 className="h-6 w-6 text-[#E1261C]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">{stats.successfulCases}</h3>
            <p className="text-[#4A4A4A] text-sm">Successful Cases</p>
          </div>
        </div>

        {/* Share Your Link */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-8 mb-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6 text-center font-['Fraunces']">
            Share Your <span className="text-[#E1261C] italic font-normal">Success Story</span>
          </h2>

          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
                Your Success Message
              </label>
              <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="w-full p-3 border-2 border-[#E8E6E3] rounded-lg resize-none text-[#0A0A0A] placeholder-[#888888] focus:border-[#E1261C] focus:outline-none transition-all"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
                Your Referral Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referralLink || 'Link not available yet'}
                  readOnly
                  className="flex-1 p-3 border-2 border-[#E8E6E3] rounded-lg text-[#0A0A0A] bg-[#F0EEEB]"
                />
                <button
                  onClick={copyReferralLink}
                  disabled={!referralLink}
                  className={`px-4 py-3 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    copiedLink ? 'bg-[#003f2f] text-white' : 'bg-[#E1261C] text-white hover:bg-[#B11912]'
                  }`}
                >
                  {copiedLink ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedLink ? 'Copied!' : ''}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => shareToSocial('facebook')}
                disabled={!referralLink}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#1664D9] transition-all disabled:opacity-50"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </button>
              <button
                onClick={() => shareToSocial('twitter')}
                disabled={!referralLink}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1A91DA] transition-all disabled:opacity-50"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </button>
              <button
                onClick={() => shareToSocial('sms')}
                disabled={!referralLink}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#003f2f] text-white rounded-lg hover:bg-[#00B886] transition-all disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" />
                Text
              </button>
              <button
                onClick={() => shareToSocial('email')}
                disabled={!referralLink}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#4A4A4A] text-white rounded-lg hover:bg-[#3A3A3A] transition-all disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>
          </div>
        </div>

        {/* Recent Referral Activity */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-6 font-['Fraunces']">
            Recent Referral <span className="text-[#E1261C] italic font-normal">Earnings</span>
          </h3>
          {loading ? (
            <p className="text-[#888888] text-center py-4">Loading...</p>
          ) : recentReferrals.length === 0 ? (
            <p className="text-[#888888] text-center py-4">
              No referrals yet. Share your link to start earning!
            </p>
          ) : (
            <div className="space-y-4">
              {recentReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 bg-[#F0EEEB] rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-[#FCE9E7] rounded-full flex items-center justify-center">
                      <span className="text-[#E1261C] font-bold">
                        {referral.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[#0A0A0A]">{referral.name}</p>
                      <p className="text-sm text-[#4A4A4A]">{referral.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#E1261C] font-['Fraunces']">
                      $ <span className="text-[#0A0A0A]">{referral.amount.toFixed(2)}</span>
                    </p>
                    <Badge
                      className={
                        referral.status === 'Paid'
                          ? 'bg-[#003f2f] text-white border-none'
                          : 'bg-[#D4D4D4] text-[#4A4A4A] border-none'
                      }
                    >
                      {referral.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onBack}
            className="bg-[#E1261C] hover:bg-[#B11912] text-white px-8 py-3 font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Return to Case Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralSystem;