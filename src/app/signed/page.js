"use client";
import { useSearchParams } from "next/navigation";

export default function SignedPage() {
  const searchParams = useSearchParams();
  const envelopeId = searchParams.get("envelopeId");

  return (
    <div>
      <h1>Thank you for signing!</h1>
      <p>Envelope ID: {envelopeId}</p>
      <a
        href={`/api/download?envelopeId=${envelopeId}`}
        target="_blank"
      >
        Download Signed PDF
      </a>
    </div>
  );
}
