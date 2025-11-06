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
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Star className="h-5 w-5 text-blue-500" />;
    }
  };

  const totalReferralEarnings = successStories.reduce(
    (sum, story) => sum + story.referralEarnings,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      {/* Header */}
      <div className="glass-card border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={onBack}
                className="mr-4 glass-button border-green-500/30 text-white hover:text-green-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="sm:text-3xl text-[24px] font-bold text-green-400">
                  Success Leaderboard
                </h1>
                <p className="text-gray-300 mt-1">
                  See how much our clients have recovered
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center bg-gradient-to-r from-yellow-50 to-yellow-100">
            <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-yellow-800">
              ${totalRecovered.toLocaleString()}
            </h3>
            <p className="text-yellow-700">Total Money Recovered</p>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-r from-green-50 to-green-100">
            <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-green-800">{usersCount}</h3>
            <p className="text-green-700">Happy Clients</p>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-r from-purple-50 to-purple-100">
            <Star className="h-12 w-12 text-purple-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-purple-800">
              ${totalReferralEarnings.toLocaleString()}
            </h3>
            <p className="text-purple-700">Referral Bonuses Paid</p>
          </Card>
        </div>

        {/* Hero Image */}
        <Card className="p-6 mb-8 text-center">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1537236286751-2dcb9da2cc20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxjZWxlYnJhdGlvbiUyMHN1Y2Nlc3MlMjB3aW5uZXIlMjBtb25leXxlbnwxfHx8fDE3NTcwNDIxNTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Success celebration"
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <h2 className="text-2xl font-bold text-white mb-2">
            Join Our Success Stories!
          </h2>
          <p className="text-gray-600">
            These are real people who recovered real money. Your story could be
            next!
          </p>
        </Card>

        {/* Time Filter */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            {["all-time", "this-month", "this-week"].map((filter) => (
              <Button
                key={filter}
                variant={timeFilter === filter ? "default" : "ghost"}
                onClick={() => setTimeFilter(filter)}
                className="mx-1 text-gray-900"
              >
                {filter === "all-time"
                  ? "All Time"
                  : filter === "this-month"
                  ? "This Month"
                  : "This Week"}
              </Button>
            ))}
          </div>
        </div>

        {/* Success Stories List */}
        <div className="space-y-4">
          {successStories.map((story, index) => (
            <Card
              key={story.id}
              className={`p-6 ${
                index < 3
                  ? "border-2 border-yellow-200 bg-yellow-50 text-gray-900"
                  : "text-[#ffffff7a]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start sm:flex-row flex-col space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    {getTrophyIcon(index)}
                    <span className="text-2xl font-bold text-gray-600">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-1 space-x-3 mb-2">
                      <h3 className="text-xl font-bold ">{story.name}</h3>
                      <Badge className="bg-green-500 text-white">
                        ${story.amount.toLocaleString()} Recovered
                      </Badge>
                      {story.referrals > 0 && (
                        <Badge variant="secondary">
                          +${story.referralEarnings.toLocaleString()} Referrals
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-700 mb-2 italic">"{story.story}"</p>

                    <div className="flex items-center flex-wrap gap-1 space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{story.date}</span>
                      </div>
                      {story.referrals > 0 && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1" />
                          <span>{story.referrals} successful referrals</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ${story.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Net received</div>
                  {story.referralEarnings > 0 && (
                    <div className="text-sm text-purple-600 mt-1">
                      +${story.referralEarnings.toLocaleString()} bonus
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        {usersCount > 10 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-10">
            <Button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg font-semibold ${
                page === 1
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              <span className="text-white text-sm sm:text-base">
                Page <strong>{page}</strong>
              </span>
            </div>

            <Button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={users.length < 10}
              className={`px-4 py-2 rounded-lg font-semibold ${
                users.length < 10
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              Next
            </Button>
          </div>
        )}
        {/* Motivation Section */}
        <Card className="p-8 mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Could You Be Next?
            </h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              These success stories show what's possible when you let
              professionals handle the complex unclaimed property process. Don't
              let bureaucracy keep you from your money - let us do the heavy
              lifting!
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-bold text-gray-900 mb-2">
                  Why People Choose Us
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 text-left">
                  <li>• 90% success rate vs 30% DIY success rate</li>
                  <li>• 30-60 day process vs 6-18 months</li>
                  <li>• Professional handling of complex paperwork</li>
                  <li>• No upfront costs - only pay when you get paid</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-bold text-gray-900 mb-2">
                  Earn Through Referrals
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 text-left">
                  <li>• Share your success story on social media</li>
                  <li>• Get a custom referral link</li>
                  <li>• Earn 1% of every successful recovery</li>
                  <li>• Some clients earn $2,000+ in bonuses!</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center mt-8">
          <Button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-xl rounded-lg"
          >
            Continue My Case
          </Button>
          <p className="text-gray-500 mt-4">
            Your success story could be featured here next!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
