"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearchStore } from "../store/searchStore";

export default function SignedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const envelopeId = searchParams.get("envelopeId");
  const { setuserSignedAgreement } = useSearchStore();

  useEffect(() => {
    if (!envelopeId) return;
    const downloadSignedPDF = async () => {
      try {
        const response = await fetch(`/api/download?envelopeId=${envelopeId}`);
        if (!response.ok) throw new Error("Failed to download PDF");
        const data = await response.json(); 
        localStorage.setItem("signedDoc", JSON.stringify(data));
        setuserSignedAgreement(data.filePath);
        router.replace("/?step=documents");
      } catch (err) {
        console.error("Download error:", err);
      }
    };

    downloadSignedPDF();
  }, [envelopeId, router,setuserSignedAgreement]);

  return (
    <div>
      <h1>Processing your signed document...</h1>
      <p>Please wait while your signed PDF is being downloaded.</p>
    </div>
  );
}
