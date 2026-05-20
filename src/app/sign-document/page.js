"use client";

import { useState } from "react";
import { Shield, FileText, ArrowRight } from "lucide-react";

export default function SignDocumentPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const savedProperty = JSON.parse(localStorage.getItem("propertyData"));
      const savedAgreement = JSON.parse(localStorage.getItem("userAgreement"));
      const res = await fetch("/api/docusign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          searchResults: savedProperty,
          userAgreement: savedAgreement,
        }),
      });

      const data = await res.json();

      if (data.signingUrl) {
        window.location.href = data.signingUrl;
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="bg-white border border-[#E8E6E3] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-8 w-full max-w-md relative overflow-hidden">
        {/* Red top accent bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
        
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#FCE9E7] rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-[#E1261C]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#0A0A0A] mb-2 text-center font-['Fraunces']">
          Sign the <span className="text-[#E1261C] italic font-normal">Agreement</span>
        </h1>
        <p className="text-[#4A4A4A] text-sm text-center mb-6">
          Please provide your information to sign the investigator agreement
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
              First Name *
            </label>
            <input
              type="text"
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-2 border-2 border-[#E8E6E3] rounded-lg text-[#0A0A0A] placeholder-[#888888] focus:border-[#E1261C] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
              Last Name *
            </label>
            <input
              type="text"
              placeholder="Enter last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-4 py-2 border-2 border-[#E8E6E3] rounded-lg text-[#0A0A0A] placeholder-[#888888] focus:border-[#E1261C] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0A0A0A] mb-1 font-['JetBrains_Mono']">
              Email Address *
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border-2 border-[#E8E6E3] rounded-lg text-[#0A0A0A] placeholder-[#888888] focus:border-[#E1261C] focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E1261C] text-white py-3 rounded-lg font-semibold hover:bg-[#B11912] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Generating Signing Link...
              </>
            ) : (
              <>
                Sign Document
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-[#FCE9E7] border border-[#E1261C]/20 rounded-lg text-[#E1261C] text-sm text-center">
            {error}
          </div>
        )}

        {/* Security note */}
        <div className="mt-6 pt-4 border-t border-[#E8E6E3] flex items-center font-['JetBrains_Mono'] justify-center gap-2 text-xs text-[#888888]">
          <Shield className="h-3 w-3 text-[#E1261C]" />
          <span>Secure • Encrypted • DocuSign</span>
        </div>
      </div>
    </div>
  );
}