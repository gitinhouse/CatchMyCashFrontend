import React, { useState, useEffect } from "react";
import { Button } from "./uicomponents/Button";
import { Card } from "./uicomponents/Card";
import { Badge } from "./uicomponents/Badge";
import {
  Trophy,
  Medal,
  Award,
  Star,
  DollarSign,
  Calendar,
  ArrowLeft,
  TrendingUp,
  Users,
} from "lucide-react";
import { ImageWithFallback } from "./uicomponents/ImageWithFallback";

const Leaderboard = ({ onBack }) => {
  const [timeFilter, setTimeFilter] = useState("all-time");
  const [users, setUsers] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalRecovered, setTotalRecovered] = useState(0);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/allRecord?page=${page}&limit=10&timeFilter=${timeFilter}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch data");
        setUsers(data.data);
        setTotalRecovered(data.totalRecovered.toFixed(2));
        setUsersCount(data.totalUsers);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, timeFilter]);

  const successStories = users.map((user, index) => ({
    id: user._id,
    name: `${user.first_name} ${user.last_name}`,
    amount: user.properties?.reduce((acc, prop) => acc + (prop.amount || 0), 0),
    date: user.createdAt?.split("T")[0],
    story: `Recovered from ${user.properties?.length || 0} properties.`,
    referrals: 1,
    referralEarnings: 10,
  }));

  const getTrophyIcon = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-[#E1261C]" />;
      case 1:
        return <Medal className="h-6 w-6 text-[#888888]" />;
      case 2:
        return <Award className="h-6 w-6 text-[#B11912]" />;
      default:
        return <Star className="h-5 w-5 text-[#E1261C]" />;
    }
  };

  const totalReferralEarnings = successStories.reduce(
    (sum, story) => sum + story.referralEarnings,
    0
  );

  return (
    <div className="min-h-screen bg-[#F7F5F2] pt-4" >
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
                  Success <span className="text-[#E1261C] italic font-normal">Leaderboard</span>
                </h1>
                <p className="text-[#4A4A4A] mt-1">
                  See how much our clients have recovered
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Stats - Red Themed */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all">
            <div className="w-14 h-14 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-7 w-7 text-[#E1261C]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
              ${parseFloat(totalRecovered).toLocaleString()}
            </h3>
            <p className="text-[#4A4A4A] text-sm">Total Money Recovered</p>
          </div>
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all">
            <div className="w-14 h-14 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-7 w-7 text-[#E1261C]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">{usersCount}</h3>
            <p className="text-[#4A4A4A] text-sm">Happy Clients</p>
          </div>
          <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all">
            <div className="w-14 h-14 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-7 w-7 text-[#E1261C]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces']">
              ${totalReferralEarnings.toLocaleString()}
            </h3>
            <p className="text-[#4A4A4A] text-sm">Referral Bonuses Paid</p>
          </div>
        </div>

        {/* Hero Image - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 text-center shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1537236286751-2dcb9da2cc20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxjZWxlYnJhdGlvbiUyMHN1Y2Nlc3MlMjB3aW5uZXIlMjBtb25leXxlbnwxfHx8fDE3NTcwNDIxNTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Success celebration"
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2 font-['Fraunces']">
            Join Our <span className="text-[#E1261C] italic font-normal">Success Stories!</span>
          </h2>
          <p className="text-[#4A4A4A]">
            These are real people who recovered real money. Your story could be next!
          </p>
        </div>

        {/* Time Filter - Red Themed */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-sm border border-[#E8E6E3]">
            {["all-time", "this-month", "this-week"].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`mx-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeFilter === filter
                    ? 'bg-[#E1261C] text-white shadow-sm'
                    : 'text-[#0A0A0A] hover:bg-[#FCE9E7]'
                }`}
              >
                {filter === "all-time"
                  ? "All Time"
                  : filter === "this-month"
                  ? "This Month"
                  : "This Week"}
              </button>
            ))}
          </div>
        </div>

        {/* Success Stories List - Red Themed */}
        <div className="space-y-4">
          {successStories.map((story, index) => (
            <div
              key={story.id}
              className={`bg-white border rounded-xl p-6 shadow-md transition-all ${
                index < 3
                  ? 'border-[#E1261C]/30 bg-[#FCE9E7]'
                  : 'border-[#E8E6E3]'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    {getTrophyIcon(index)}
                    <span className="text-2xl font-bold text-[#E1261C] font-['Fraunces']">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-[#0A0A0A]">
                        {story.name}
                      </h3>
                      <Badge className="bg-[#E1261C] text-white border-none">
                        ${story.amount?.toLocaleString()} Recovered
                      </Badge>
                      {story.referrals > 0 && (
                        <Badge className="bg-[#003f2f] text-white border-none">
                          +${story.referralEarnings.toLocaleString()} Referrals
                        </Badge>
                      )}
                    </div>

                    <p className="text-[#4A4A4A] mb-2 italic">"{story.story}"</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#888888]">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-[#E1261C]" />
                        <span>{story.date}</span>
                      </div>
                      {story.referrals > 0 && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-[#E1261C]" />
                          <span>{story.referrals} successful referrals</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right md:text-left">
                  <div className="text-2xl font-bold text-[#E1261C] font-['Fraunces']">
                    ${story.amount?.toLocaleString()}
                  </div>
                  <div className="text-sm text-[#888888]">Net received</div>
                  {story.referralEarnings > 0 && (
                    <div className="text-sm text-[#003f2f] mt-1">
                      +${story.referralEarnings.toLocaleString()} bonus
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {usersCount > 10 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-10">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                page === 1
                  ? "bg-[#D4D4D4] text-[#888888] cursor-not-allowed"
                  : "bg-[#E1261C] text-white hover:bg-[#B11912] shadow-sm hover:shadow-md"
              }`}
            >
              Previous
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-[#0A0A0A] text-sm sm:text-base font-['JetBrains_Mono']">
                Page <strong className="text-[#E1261C]">{page}</strong>
              </span>
            </div>

            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={users.length < 10}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                users.length < 10
                  ? "bg-[#D4D4D4] text-[#888888] cursor-not-allowed"
                  : "bg-[#E1261C] text-white hover:bg-[#B11912] shadow-sm hover:shadow-md"
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Motivation Section - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-8 mt-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
              Could You Be <span className="text-[#E1261C] italic font-normal">Next?</span>
            </h3>
            <p className="text-[#4A4A4A] mb-6 max-w-2xl mx-auto">
              These success stories show what's possible when you let
              professionals handle the complex unclaimed property process. Don't
              let bureaucracy keep you from your money - let us do the heavy
              lifting!
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-[#FCE9E7] p-4 rounded-lg">
                <h4 className="font-bold text-[#0A0A0A] mb-2 font-['Fraunces']">
                  Why People Choose Us
                </h4>
                <ul className="text-sm text-[#4A4A4A] space-y-1 text-left">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    94% success rate vs 30% DIY success rate
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    30-60 day process vs 6-18 months
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    Professional handling of complex paperwork
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    No upfront costs - only pay when you get paid
                  </li>
                </ul>
              </div>

              <div className="bg-[#FCE9E7] p-4 rounded-lg">
                <h4 className="font-bold text-[#0A0A0A] mb-2 font-['Fraunces']">
                  Earn Through Referrals
                </h4>
                <ul className="text-sm text-[#4A4A4A] space-y-1 text-left">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    Share your success story on social media
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    Get a custom referral link
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    Earn 1% of every successful recovery
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    Some clients earn $2,000+ in bonuses!
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <button
            onClick={onBack}
            className="bg-[#E1261C] hover:bg-[#B11912] text-white px-12 py-4 text-xl font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Continue My Case
          </button>
          <p className="text-[#888888] mt-4">
            Your success story could be featured here next!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;