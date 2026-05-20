"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSearchStore } from "../store/searchStore";
import { Button } from "../components/uicomponents/Button";
import { DollarSign, Eye, Search, X, Users, LogOut } from "lucide-react";

const AllUsers = () => {
  const router = useRouter();
  const { userLogin, resetAll } = useSearchStore();
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 10;

  useEffect(() => {
    if (!userLogin && !localStorage.getItem("userLogin")) {
      router.push("/");
      return;
    }
    fetchCases(page, searchQuery);
  }, [page]);

  const fetchCases = async (pageNum, query = "") => {
    try {
      setLoading(true);
      const skip = (pageNum - 1) * limit;
      const storedUser = JSON.parse(localStorage.getItem("userLogin"));
      const token = storedUser?.token;

      const url = query
        ? `/api/users?search=${encodeURIComponent(
            query
          )}&limit=${limit}&skip=${skip}`
        : `/api/users?limit=${limit}&skip=${skip}`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(data.data || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCases(1, searchQuery);
      setPage(1);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      resetAll();
      localStorage.clear();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleViewDetails = async (userData) => {
    try {
      router.push(`/allCases?case_id=${userData?.cases?.[0]._id}`);
    } catch (error) {
      console.error("Failed to fetch case documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen bg-[#F7F5F2]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header Section */}
      {/* <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white border-b border-[#E8E6E3] shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center items-center gap-4 sm:gap-0">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E1261C] rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#0A0A0A] font-['Fraunces']">CatchMyCash</h1>
              <p className="text-[#4A4A4A] mt-1">
                California's Premier Unclaimed Property Recovery Service
              </p>
            </div>
          </div>

          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="self-end sm:self-auto"
          >
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#E1261C] text-white text-sm font-semibold rounded-xl hover:bg-[#B11912] transition-all shadow-md hover:shadow-lg"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </motion.div>
        </div>
      </motion.div> */}

      {/* Main Content */}
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-[#0A0A0A] font-['Fraunces'] flex items-center gap-2">
            <Users className="w-8 h-8 text-[#E1261C]" />
            All <span className="text-[#E1261C] italic font-normal">Users</span>
          </h1>

          {/* Search */}
          <div className="relative flex items-center gap-3 mb-6">
            <Search className="absolute left-4 text-[#888888] w-5 h-5" />
            <input
              type="text"
              placeholder="Search by User Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-[#E8E6E3] text-[#0A0A0A] placeholder-[#888888] focus:outline-none focus:border-[#E1261C] transition-all"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center text-[#888888] py-12 flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-[#E1261C] border-t-transparent rounded-full animate-spin"></div>
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-[#888888] py-12 bg-white border border-[#E8E6E3] rounded-xl shadow-sm">
              No users found.
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="overflow-x-auto bg-white border border-[#E8E6E3] rounded-xl shadow-md"
            >
              <table className="w-full text-sm text-[#4A4A4A]">
                <thead className="bg-[#FCE9E7] text-[#0A0A0A] uppercase text-xs">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold">User Id</th>
                    <th className="py-3 px-4 text-left font-semibold">Name</th>
                    <th className="py-3 px-4 text-left font-semibold">Email</th>
                    <th className="py-3 px-4 text-left font-semibold">Contact No</th>
                    <th className="py-3 px-4 text-left font-semibold">Address</th>
                    <th className="py-3 px-4 text-left font-semibold">Zip Code</th>
                    <th className="py-3 px-4 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-[#E8E6E3] hover:bg-[#FCE9E7] transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[#E1261C] font-medium">
                        {item._id?.slice(-8) || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {item.first_name
                          ? `${item.first_name || ""} ${
                              item.last_name || ""
                            }`.trim() || "N/A"
                          : "N/A"}
                      </td>
                      <td className="py-3 px-4">{item.email_id || "N/A"}</td>
                      <td className="py-3 px-4">{item.contact_no || "N/A"}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-[#FCE9E7] text-[#0A0A0A]">
                          {item.address} {item.city}
                        </span>
                      </td>
                      <td className="py-3 px-4">{item.zip_code || "N/A"}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="p-2 bg-[#FCE9E7] hover:bg-[#E1261C] text-[#E1261C] hover:text-white rounded-lg transition-all duration-200 cursor-pointer hover:scale-105"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                     </tr>
                  ))}
                </tbody>
               </table>
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  page === 1
                    ? "bg-[#D4D4D4] text-[#888888] cursor-not-allowed"
                    : "bg-[#E1261C] text-white hover:bg-[#B11912] shadow-sm hover:shadow-md"
                }`}
              >
                Previous
              </button>
              <div className="text-[#4A4A4A] font-['JetBrains_Mono']">
                Page <span className="text-[#E1261C] font-bold">{page}</span> of{" "}
                <span className="text-[#E1261C] font-bold">{totalPages}</span>
              </div>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  page === totalPages
                    ? "bg-[#D4D4D4] text-[#888888] cursor-not-allowed"
                    : "bg-[#E1261C] text-white hover:bg-[#B11912] shadow-sm hover:shadow-md"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllUsers;