import React, { useState } from 'react';
import { Button } from './uicomponents/Button';
import { Card } from './uicomponents/Card';
import { Badge } from './uicomponents/Badge';
import { Progress } from './uicomponents/Progress';
import { Share2, Copy, Facebook, Twitter, MessageCircle, Mail, DollarSign, Users, TrendingUp, ArrowLeft } from 'lucide-react';


const ReferralSystem = ({ onBack }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareMessage, setShareMessage] = useState("Just recovered $4,297 in unclaimed property with @FindMyMoney! The process was so easy - they handled everything while I just waited for my check. Check if you have money waiting:");

  const referralCode = "FM-JM-2024-7891";
  const referralLink = `https://findmymoney.com/ref/${referralCode}`;
  
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={onBack}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="sm:text-3xl text-[24px] font-bold text-blue-900">Referral Dashboard</h1>
                <p className="text-gray-600 mt-1">Earn 1% of every successful recovery</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 text-center bg-gradient-to-r from-green-50 to-green-100 shadow-sm">
            <DollarSign className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-green-800">${referralStats.totalEarnings}</h3>
            <p className="text-green-700 text-sm">Total Earned</p>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-r from-yellow-50 to-yellow-100 shadow-sm">
            <TrendingUp className="h-10 w-10 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-yellow-800">${referralStats.pendingEarnings}</h3>
            <p className="text-yellow-700 text-sm">Pending</p>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm">
            <Users className="h-10 w-10 text-blue-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-blue-800">{referralStats.totalReferrals}</h3>
            <p className="text-blue-700 text-sm">Total Referrals</p>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-r from-purple-50 to-purple-100 shadow-sm">
            <Share2 className="h-10 w-10 text-purple-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-purple-800">{referralStats.clickThroughRate}%</h3>
            <p className="text-purple-700 text-sm">Success Rate</p>
          </Card>
        </div>

        {/* Share Your Link */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Share Your Success Story
          </h2>
          
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Success Message
              </label>
              <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none "
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Referral Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-600 bg-gray-50 w-[90%]"
                />
                <Button
                  onClick={copyReferralLink}
                  className={`px-4 py-3 ${copiedLink ? 'bg-green-600' : 'bg-blue-600'}`}
                >
                  {copiedLink ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Social Sharing Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => shareToSocial('facebook')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button
                onClick={() => shareToSocial('twitter')}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                onClick={() => shareToSocial('sms')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Text
              </Button>
              <Button
                onClick={() => shareToSocial('email')}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </Card>

        {/* Performance Insights */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Performance This Month
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Link Clicks</span>
                  <span>47</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Started Applications</span>
                  <span>16</span>
                </div>
                <Progress value={34} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Completed Cases</span>
                  <span>8</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Top Sharing Platforms
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Facebook className="h-5 w-5 text-blue-600 mr-2" />
                  <span>Facebook</span>
                </div>
                <span className="text-sm text-gray-600">42% of clicks</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span>Text Messages</span>
                </div>
                <span className="text-sm text-gray-600">31% of clicks</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-600 mr-2" />
                  <span>Email</span>
                </div>
                <span className="text-sm text-gray-600">18% of clicks</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Twitter className="h-5 w-5 text-sky-500 mr-2" />
                  <span>Twitter</span>
                </div>
                <span className="text-sm text-gray-600">9% of clicks</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Referral Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-6">
            Recent Referral Earnings
          </h3>
          <div className="space-y-4">
            {recentReferrals.map((referral, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">
                      {referral.name.split(' ')[0].charAt(0)}{referral.name.split(' ')[1].charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">{referral.name}</p>
                    <p className="text-sm text-gray-600">{referral.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${referral.amount}</p>
                  <Badge 
                    variant={referral.status === 'Paid' ? 'default' : 'secondary'}
                    className={referral.status === 'Paid' ? 'bg-green-500' : ''}
                  >
                    {referral.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tips Section */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-bold text-blue-800 mb-4">
            💡 Tips to Maximize Your Referral Earnings
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2 text-blue-700">
              <li>• Share your personal story - people trust real experiences</li>
              <li>• Post on social media when you receive your check</li>
              <li>• Target friends who have moved or changed jobs frequently</li>
              <li>• Share in local community groups and nextdoor</li>
            </ul>
            <ul className="space-y-2 text-blue-700">
              <li>• Include a photo of your check (blur sensitive info)</li>
              <li>• Mention the 10% fee is only paid on success</li>
              <li>• Emphasize how difficult the process is to do alone</li>
              <li>• Follow up with people who clicked but didn't complete</li>
            </ul>
          </div>
        </Card>

        <div className="text-center mt-8">
          <Button 
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            Return to Case Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReferralSystem