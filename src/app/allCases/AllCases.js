"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchStore } from "../store/searchStore";
import { Button } from "../components/uicomponents/Button";
import { DollarSign, Eye, Search, X, LogOut, FileText, CheckCircle } from "lucide-react";

const AllCases = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseIdFromUrl = searchParams.get("case_id");

  const { userLogin, resetAll } = useSearchStore();
  const [cases, setCases] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDocs, setCaseDocs] = useState();
  const [popupLoading, setPopupLoading] = useState(false);

  const limit = 10;

  const fetchCases = useCallback(
    async (pageNum, query = "") => {
      try {
        setLoading(true);
        const skip = (pageNum - 1) * limit;
        const storedUser = JSON.parse(localStorage.getItem("userLogin"));
        const token = storedUser?.token;

        let url;

        if (caseIdFromUrl) {
          url = `/api/case?case_id=${caseIdFromUrl}`;
        } else if (query) {
          url = `/api/case?search=${encodeURIComponent(
            query
          )}&limit=${limit}&skip=${skip}`;
        } else {
          url = `/api/case?limit=${limit}&skip=${skip}`;
        }

        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status < 500,
        });
        if (data.error && data.error.includes("No matching case found")) {
          setCases([]);
          setTotalCount(0);
        } else if (data.data) {
          setCases(data.data);
          setTotalCount(data.total || 0);
        } else {
          setCases([]);
          setTotalCount(0);
        }
      } catch (err) {
        console.error(err);
        setCases([]);
      } finally {
        setLoading(false);
      }
    },
    [caseIdFromUrl]
  );

  useEffect(() => {
    if (!userLogin && !localStorage.getItem("userLogin")) {
      router.push("/");
      return;
    }
    fetchCases(page, searchQuery);
  }, [page, fetchCases, router, searchQuery, userLogin]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCases(1, searchQuery);
      setPage(1);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, fetchCases]);

  const handleLogout = async () => {
    try {
      resetAll();
      localStorage.clear();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleViewDetails = async (caseItem) => {
    try {
      setSelectedCase(caseItem);
      setPopupLoading(true);
      setCaseDocs(null);
      const storedUser = JSON.parse(localStorage.getItem("userLogin"));
      const token = storedUser?.token;

      const { data } = await axios.get(`/api/docs?case_id=${caseItem._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCaseDocs(data);
    } catch (error) {
      console.error("Failed to fetch case documents:", error);
    } finally {
      setPopupLoading(false);
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
          <h1 className="text-3xl font-bold mb-6 text-[#0A0A0A] font-['Fraunces']">
            🗂️ All <span className="text-[#E1261C] italic font-normal">Cases</span>
          </h1>

          {/* Search */}
          <div className="relative flex items-center gap-3 mb-6">
            <Search className="absolute left-4 text-[#888888] w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Case Number or user Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-[#E8E6E3] text-[#0A0A0A] placeholder-[#888888] focus:outline-none focus:border-[#E1261C] transition-all"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center text-[#888888] py-12 flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-[#E1261C] border-t-transparent rounded-full animate-spin"></div>
              Loading cases...
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center text-[#888888] py-12 bg-white border border-[#E8E6E3] rounded-xl shadow-sm">
              No cases found.
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
                    <th className="py-3 px-4 text-left font-semibold">Case Number</th>
                    <th className="py-3 px-4 text-left font-semibold">Name</th>
                    <th className="py-3 px-4 text-left font-semibold">Email</th>
                    <th className="py-3 px-4 text-left font-semibold">Contact No</th>
                    <th className="py-3 px-4 text-left font-semibold">Status</th>
                    <th className="py-3 px-4 text-left font-semibold">Created At</th>
                    <th className="py-3 px-4 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-[#E8E6E3] hover:bg-[#FCE9E7] transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[#E1261C] font-medium">
                        {item.case_id}
                      </td>
                      <td className="py-3 px-4">
                        {item.user_info
                          ? `${item.user_info.first_name || ""} ${
                              item.user_info.last_name || ""
                            }`.trim() || "N/A"
                          : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {item.user_details?.[0]?.email_id || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {item.user_details?.[0]?.contact_no || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === false
                              ? "bg-[#00C896] text-white"
                              : "bg-[#E1261C] text-white"
                          }`}
                        >
                          {item.status === false ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
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

      {/* Case Details Modal */}
      <AnimatePresence>
        {selectedCase && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCase(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh] border border-[#E8E6E3]"
            >
              {/* Red top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
              
              <button
                className="absolute top-4 right-4 text-[#888888] hover:text-[#E1261C] cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setSelectedCase(null)}
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold mb-4 text-[#0A0A0A] font-['Fraunces']">
                Case Details - <span className="text-[#E1261C]">{selectedCase.case_id}</span>
              </h2>

              <div className="space-y-2 text-[#4A4A4A] mb-4">
                <p><strong className="text-[#0A0A0A]">Name:</strong> {selectedCase.user_info?.first_name} {selectedCase.user_info?.last_name}</p>
                <p><strong className="text-[#0A0A0A]">Email:</strong> {selectedCase.user_details?.[0]?.email_id || "N/A"}</p>
                <p><strong className="text-[#0A0A0A]">Contact:</strong> {selectedCase.user_details?.[0]?.contact_no || "N/A"}</p>
                <p><strong className="text-[#0A0A0A]">Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    !selectedCase.status ? 'bg-[#00C896] text-white' : 'bg-[#E1261C] text-white'
                  }`}>
                    {!selectedCase.status ? "Approved" : "Pending"}
                  </span>
                </p>
                <p><strong className="text-[#0A0A0A]">Created At:</strong> {new Date(selectedCase.createdAt).toLocaleString()}</p>
              </div>

              {/* Properties Table */}
              <div className="mt-4 overflow-x-auto bg-white border border-[#E8E6E3] rounded-xl shadow-sm">
                <table className="min-w-full text-sm text-[#4A4A4A]">
                  <thead className="bg-[#FCE9E7] text-[#0A0A0A] uppercase text-xs">
                    <tr>
                      <th className="py-3 px-4 text-left font-semibold">Property ID</th>
                      <th className="py-3 px-4 text-left font-semibold">Property Type</th>
                      <th className="py-3 px-4 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCase.user_properties?.length > 0 ? (
                      selectedCase.user_properties.map((item, idx) => (
                        <tr key={idx} className="border-t border-[#E8E6E3]">
                          <td className="py-3 px-4 font-mono text-[#E1261C]">{item.property_id}</td>
                          <td className="py-3 px-4">{item.property_type}</td>
                          <td className="py-3 px-4 text-right font-semibold text-[#0A0A0A]">
                            ${parseFloat(item.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-4 text-[#888888]">
                          No properties available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Documents Section */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-[#0A0A0A] mb-2 font-['Fraunces']">
                  <FileText className="inline h-5 w-5 mr-2 text-[#E1261C]" />
                  Documents
                </h3>
                {popupLoading ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="w-8 h-8 border-2 border-[#E1261C] border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-[#888888]">Loading documents...</span>
                  </div>
                ) : caseDocs && Object.keys(caseDocs).length > 0 ? (
                  <ul className="space-y-2">
                    {caseDocs.signed_doc && (
                      <li>
                        <a
                          href={caseDocs.signed_doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#E1261C] hover:text-[#B11912] transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          Signed Agreement
                        </a>
                      </li>
                    )}
                    {caseDocs.proof_id && (
                      <li>
                        <a
                          href={caseDocs.proof_id}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#E1261C] hover:text-[#B11912] transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          Proof ID
                        </a>
                      </li>
                    )}
                    {caseDocs.ssn_id && (
                      <li>
                        <a
                          href={caseDocs.ssn_id}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#E1261C] hover:text-[#B11912] transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          SSN Document
                        </a>
                      </li>
                    )}
                    {caseDocs.adress_proof && (
                      <li>
                        <a
                          href={caseDocs.adress_proof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#E1261C] hover:text-[#B11912] transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          Address Proof
                        </a>
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-[#888888]">No documents uploaded.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllCases;