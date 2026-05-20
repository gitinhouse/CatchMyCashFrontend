import React, { useState } from 'react';
import { Button } from './uicomponents/Button';
import { Card } from './uicomponents/Card';
import { Badge } from './uicomponents/Badge';
import { Progress } from './uicomponents/Progress';
import { Share2, Copy, Facebook, Twitter, MessageCircle, Mail, DollarSign, Users, TrendingUp, ArrowLeft, CheckCircle } from 'lucide-react';

const ReferralSystem = ({ onBack }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareMessage, setShareMessage] = useState("Just recovered $4,297 in unclaimed property with @CatchMyCash! The process was so easy - they handled everything while I just waited for my check. Check if you have money waiting:");

  const referralCode = "CM-JM-2024-7891";
  const referralLink = `https://catchmycash.com/ref/${referralCode}`;
  
  // Mock referral data
  const referralStats = {
    totalEarnings: 847.50,
    pendingEarnings: 234.75,
    totalReferrals: 23,
    successfulCases: 8,
    clickThroughRate: 34.8
  };

  const recentReferrals = [
    { name: 'Sarah K.', amount: 156.50, status: 'Paid', date: '2024-01-20' },
    { name: 'Mike R.', amount: 203.25, status: 'Processing', date: '2024-01-18' },
    { name: 'Jennifer L.', amount: 89.75, status: 'Paid', date: '2024-01-15' },
    { name: 'David M.', amount: 127.00, status: 'Processing', date: '2024-01-12' },
    { name: 'Lisa T.', amount: 271.00, status: 'Paid', date: '2024-01-10' }
  ];

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareToSocial = (platform) => {
    const encodedMessage = encodeURIComponent(`${shareMessage} ${referralLink}`);
    let url = '';
    
    switch(platform) {
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
        {/* Stats Overview - Red Themed */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-6 w-6 text-[#E1261C]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">${referralStats.totalEarnings}</h3>
            <p className="text-[#4A4A4A] text-sm">Total Earned</p>
          </div>
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-[#E1261C]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">${referralStats.pendingEarnings}</h3>
            <p className="text-[#4A4A4A] text-sm">Pending</p>
          </div>
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-[#E1261C]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">{referralStats.totalReferrals}</h3>
            <p className="text-[#4A4A4A] text-sm">Total Referrals</p>
          </div>
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
              <Share2 className="h-6 w-6 text-[#E1261C]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">{referralStats.clickThroughRate}%</h3>
            <p className="text-[#4A4A4A] text-sm">Success Rate</p>
          </div>
        </div>

        {/* Share Your Link - Red Themed */}
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
                  value={referralLink}
                  readOnly
                  className="flex-1 p-3 border-2 border-[#E8E6E3] rounded-lg text-[#0A0A0A] bg-[#F0EEEB]"
                />
                <button
                  onClick={copyReferralLink}
                  className={`px-4 py-3 rounded-lg transition-all flex items-center gap-2 ${
                    copiedLink ? 'bg-[#003f2f] text-white' : 'bg-[#E1261C] text-white hover:bg-[#B11912]'
                  }`}
                >
                  {copiedLink ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedLink ? 'Copied!' : ''}
                </button>
              </div>
            </div>

            {/* Social Sharing Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => shareToSocial('facebook')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#1664D9] transition-all"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </button>
              <button
                onClick={() => shareToSocial('twitter')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1A91DA] transition-all"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </button>
              <button
                onClick={() => shareToSocial('sms')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#003f2f] text-white rounded-lg hover:bg-[#00B886] transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                Text
              </button>
              <button
                onClick={() => shareToSocial('email')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#4A4A4A] text-white rounded-lg hover:bg-[#3A3A3A] transition-all"
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>
          </div>
        </div>

        {/* Performance Insights - Red Themed */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
            <h3 className="text-lg font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
              Performance <span className="text-[#E1261C] italic font-normal">This Month</span>
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#4A4A4A]">Link Clicks</span>
                  <span className="text-[#E1261C] font-semibold">47</span>
                </div>
                <div className="w-full h-2 bg-[#E8E6E3] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#E1261C] to-[#B11912] rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#4A4A4A]">Started Applications</span>
                  <span className="text-[#E1261C] font-semibold">16</span>
                </div>
                <div className="w-full h-2 bg-[#E8E6E3] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#E1261C] to-[#B11912] rounded-full" style={{ width: '34%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#4A4A4A]">Completed Cases</span>
                  <span className="text-[#E1261C] font-semibold">8</span>
                </div>
                <div className="w-full h-2 bg-[#E8E6E3] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#E1261C] to-[#B11912] rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
            <h3 className="text-lg font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
              Top Sharing <span className="text-[#E1261C] italic font-normal">Platforms</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#E8E6E3]">
                <div className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-[#1877F2]" />
                  <span className="text-[#0A0A0A]">Facebook</span>
                </div>
                <span className="text-sm text-[#E1261C] font-semibold">42% of clicks</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#E8E6E3]">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-[#003f2f]" />
                  <span className="text-[#0A0A0A]">Text Messages</span>
                </div>
                <span className="text-sm text-[#E1261C] font-semibold">31% of clicks</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#E8E6E3]">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[#4A4A4A]" />
                  <span className="text-[#0A0A0A]">Email</span>
                </div>
                <span className="text-sm text-[#E1261C] font-semibold">18% of clicks</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                  <span className="text-[#0A0A0A]">Twitter</span>
                </div>
                <span className="text-sm text-[#E1261C] font-semibold">9% of clicks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Referral Activity - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-6 font-['Fraunces']">
            Recent Referral <span className="text-[#E1261C] italic font-normal">Earnings</span>
          </h3>
          <div className="space-y-4">
            {recentReferrals.map((referral, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-[#F0EEEB] rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#FCE9E7] rounded-full flex items-center justify-center">
                    <span className="text-[#E1261C] font-bold">
                      {referral.name.split(' ')[0].charAt(0)}{referral.name.split(' ')[1].charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-[#0A0A0A]">{referral.name}</p>
                    <p className="text-sm text-[#4A4A4A]">{referral.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#E1261C] font-['Fraunces']">$ <span className="text-[#0A0A0A]">{referral.amount}</span></p>
                  <Badge 
                    variant={referral.status === 'Paid' ? 'default' : 'secondary'}
                    className={referral.status === 'Paid' ? 'bg-[#003f2f] text-white border-none' : 'bg-[#D4D4D4] text-[#4A4A4A] border-none'}
                  >
                    {referral.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mt-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
            💡 Tips to Maximize Your <span className="text-[#E1261C] italic font-normal">Referral Earnings</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2 text-[#4A4A4A]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                Share your personal story - people trust real experiences
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                Post on social media when you receive your check
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                Target friends who have moved or changed jobs frequently
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                Share in local community groups and nextdoor
              </li>
            </ul>
            <ul className="space-y-2 text-[#4A4A4A]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                Include a photo of your check (blur sensitive info)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                Mention the 10% fee is only paid on success
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                Emphasize how difficult the process is to do alone
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                Follow up with people who clicked but didn't complete
              </li>
            </ul>
          </div>
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