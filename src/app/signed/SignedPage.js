"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearchStore } from "../store/searchStore";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function SignedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const envelopeId = searchParams.get("envelopeId");
  const { setuserSignedAgreement } = useSearchStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!envelopeId) return;
    const downloadSignedPDF = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/download?envelopeId=${envelopeId}`);
        if (!response.ok) throw new Error("Failed to download PDF");
        const data = await response.json();
        localStorage.setItem("signedDoc", JSON.stringify(data));
        setuserSignedAgreement(data.filePath);
        router.replace("/?step=documents");
      } catch (err) {
        console.error("Download error:", err);
      } finally {
        setLoading(false);
      }
    };

    downloadSignedPDF();
  }, [envelopeId, router, setuserSignedAgreement]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center  text-black relative">
      <h1 className="text-2xl font-semibold text-[#E1261C] mb-2">
        Processing your signed document...
      </h1>
      <p className="text-gray-400">
        Please wait while your signed PDF is being downloaded.
      </p>

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-black/70 z-50"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-[#E1261C]" />
          </motion.div>
          <p className="mt-4 text-gray-300">Downloading your signed file...</p>
        </motion.div>
      )}
    </div>
  );
}
