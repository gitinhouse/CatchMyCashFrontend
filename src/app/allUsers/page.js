"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSearchStore } from "../store/searchStore";
import { Button } from "../components/uicomponents/Button";
import { DollarSign, Eye, Search, X, Users } from "lucide-react";

const AllUsers = () => {
  const router = useRouter();
  const { userLogin, resetAll } = useSearchStore();
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDocs, setCaseDocs] = useState();
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
    <div className="min-h-screen relative">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card border-b border-teal-500/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-mint-green rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-navy-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-teal-400">CatchMyCash</h1>
              <p className="text-gray-300 mt-1">
                California's Premier Unclaimed Property Recovery Service
              </p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            className="glass-button text-white px-10 py-4 rounded-xl hover:text-teal-200 pulse-glow"
          >
            Logout
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="min-h-screen p-8 bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-teal-400 flex items-center gap-2">
            <Users className="w-8 h-8 text-teal-400" />
            All Users
          </h1>

          {/* Search */}
          <div className="relative flex items-center gap-3 mb-6">
            <Search className="absolute left-4 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by User Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              No cases found.
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="overflow-x-auto bg-gray-900/60 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg"
            >
              <table className="w-full text-sm text-gray-300">
                <thead className="bg-gray-800 text-gray-100 uppercase text-xs">
                  <tr>
                    <th className="py-3 px-4 text-left">User Id</th>
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Contact No</th>
                    <th className="py-3 px-4 text-left">Address</th>
                    <th className="py-3 px-4 text-left">Zip Code</th>
                    <th className="py-3 px-4 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-teal-300">
                        {item._id}
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
                        <span className="px-3 py-1 rounded-full text-xs">
                          {item.address} {item.city}
                        </span>
                      </td>
                      <td className="py-3 px-4">{item.zip_code}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="p-2 bg-gray-800 hover:bg-teal-600 text-white rounded-lg transition-all duration-200 cursor-pointer hover:scale-105"
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
              <Button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="bg-gray-800 hover:bg-teal-600 text-white px-4 py-2 rounded-xl disabled:opacity-40"
              >
                Previous
              </Button>
              <div className="text-gray-300">
                Page <span className="text-teal-400">{page}</span> of{" "}
                <span className="text-teal-400">{totalPages}</span>
              </div>
              <Button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="bg-gray-800 hover:bg-teal-600 text-white px-4 py-2 rounded-xl disabled:opacity-40"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedCase && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
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
              className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh]"
            >
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-teal-400"
                onClick={() => setSelectedCase(null)}
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold mb-4 text-teal-400">
                Case Details - {selectedCase.case_id}
              </h2>

              <div className="space-y-2 text-gray-300">
                <p>
                  <strong>Name:</strong> {selectedCase.user_info?.first_name}{" "}
                  {selectedCase.user_info?.last_name}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {selectedCase.user_details?.[0]?.email_id || "N/A"}
                </p>
                <p>
                  <strong>Contact:</strong>{" "}
                  {selectedCase.user_details?.[0]?.contact_no || "N/A"}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {!selectedCase.status ? "Approved" : "Pending"}
                </p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {new Date(selectedCase.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="mt-4 overflow-x-auto bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg">
                <table className="min-w-full text-sm text-gray-300">
                  <thead className="bg-gray-800 text-gray-100 uppercase text-xs">
                    <tr>
                      <th className="py-3 px-4 text-left font-semibold border-b border-gray-700">
                        Property ID
                      </th>
                      <th className="py-3 px-4 text-left font-semibold border-b border-gray-700">
                        Property Type
                      </th>
                      <th className="py-3 px-4 text-right font-semibold border-b border-gray-700">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCase.user_properties?.length > 0 ? (
                      selectedCase.user_properties.map((item, idx) => (
                        <tr
                          key={idx}
                          className="border-t border-gray-800 hover:bg-gray-800/60 transition-colors"
                        >
                          <td className="py-3 px-4">{item.property_id}</td>
                          <td className="py-3 px-4">{item.property_type}</td>
                          <td className="py-3 px-4 text-right">
                            ${item.amount}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="text-center py-4 text-gray-500"
                        >
                          No properties available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-teal-300 mb-2">
                  Documents
                </h3>
                {caseDocs && Object.keys(caseDocs).length > 0 ? (
                  <ul className="list-disc list-inside text-gray-400 space-y-2">
                    {caseDocs.signed_doc && (
                      <li>
                        <a
                          href={caseDocs.signed_doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          📄 Signed Agreement
                        </a>
                      </li>
                    )}
                    {caseDocs.proof_id && (
                      <li>
                        <a
                          href={caseDocs.proof_id}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          🧾 Proof ID
                        </a>
                      </li>
                    )}
                    {caseDocs.ssn_id && (
                      <li>
                        <a
                          href={caseDocs.ssn_id}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          🪪 SSN Document
                        </a>
                      </li>
                    )}
                    {caseDocs.adress_proof && (
                      <li>
                        <a
                          href={caseDocs.adress_proof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          🏠 Address Proof
                        </a>
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-gray-500">No documents uploaded.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllUsers;
