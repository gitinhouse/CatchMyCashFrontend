"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearchStore } from "../store/searchStore";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// AUTO-DOWNLOAD (testing) — disable via NEXT_PUBLIC_AUTO_DOWNLOAD_AGREEMENT=false
const AUTO_DOWNLOAD_AGREEMENT =
  process.env.NEXT_PUBLIC_AUTO_DOWNLOAD_AGREEMENT === "true";

async function triggerLocalPdfDownload(downloadUrl, fileName) {
  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error("Failed to fetch PDF for local download");

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName || "FilledAgreement_form.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export default function SignedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const envelopeId = searchParams.get("envelopeId");
  const signType = searchParams.get("type");
  const userId = searchParams.get("user_id");
  const caseId = searchParams.get("case_id");
  const { setuserSignedAgreement } = useSearchStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!envelopeId) return;
    const downloadSignedPDF = async () => {
      try {
        setLoading(true);

        if (signType === "agreement") {
          if (!userId) throw new Error("Missing user_id for agreement download");

          const agreementParams = new URLSearchParams({
            envelopeId,
            user_id: userId,
          });
          if (caseId) agreementParams.set("case_id", caseId);

          const response = await fetch(
            `/api/download/agreement?${agreementParams.toString()}`,
          );
          if (!response.ok) throw new Error("Failed to download agreement PDF");

          const data = await response.json();
          localStorage.setItem("filledAgreementDoc", JSON.stringify(data));

          // AUTO-DOWNLOAD (testing) — remove block below to revert
          if (AUTO_DOWNLOAD_AGREEMENT && data.filePath) {
            await triggerLocalPdfDownload(
              `/api/download/agreement/local?fileName=${encodeURIComponent(data.filePath)}`,
              data.filePath,
            );
          }

          const existingAllDocs = JSON.parse(
            localStorage.getItem("userAllDocs") || "{}",
          );
          localStorage.setItem(
            "userAllDocs",
            JSON.stringify({
              ...existingAllDocs,
              filled_agreement_doc: data.filePath,
            }),
          );

          router.replace("/?step=documents");
          return;
        }

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
  }, [envelopeId, signType, userId, caseId, router, setuserSignedAgreement]);

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
