"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "../components/uicomponents/Button";
import { Card } from "../components/uicomponents/Card";
import { jsPDF } from "jspdf";
import { FileText, CheckCircle } from "lucide-react";

const UserDocs = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userId, setUserId] = useState();
  const [caseId, setCaseId] = useState();
  const [docId, setDocId] = useState();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const Id = searchParams.get("userId") || searchParams.get("Id");
    const cId = searchParams.get("caseId");
    const dId = searchParams.get("docId");

    if (!Id || !cId || !dId) {
      router.push("/");
      return;
    }

    setUserId(Id);
    setCaseId(cId);
    setDocId(dId);
  }, [searchParams, router]);

  // ✅ Helper: read file as Base64
  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ✅ Handle file selection
  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length || !docId) return;

    try {
      setLoading(true);
      let finalFile;

      if (docId === "claim" && files.length > 1) {
        // Merge into one PDF
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.type.startsWith("image/")) continue;
          const imageData = await readFileAsDataURL(file);

          const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = imageData;
          });

          const ratio = Math.min(
            pageWidth / img.width,
            pageHeight / img.height
          );
          const imgWidth = img.width * ratio;
          const imgHeight = img.height * ratio;
          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;

          if (i > 0) pdf.addPage();
          pdf.addImage(img, "JPEG", x, y, imgWidth, imgHeight);
        }

        const pdfBlob = pdf.output("blob");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        finalFile = new File([pdfBlob], `claim_${timestamp}.pdf`, {
          type: "application/pdf",
        });
      } else {
        finalFile = files[0];
      }

      await uploadFileToServer(docId, finalFile);
      sendWebSocketUpdate({ [docId]: finalFile });
      setShowSuccessPopup(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error uploading document.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  // ✅ Upload to API
  const uploadFileToServer = async (docId, file) => {
    const formData = new FormData();
    formData.append("case_id", caseId);

    const docKeyMap = {
      id: "proof_id",
      ssn: "ssn_id",
      address: "adress_proof",
      birth: "brith_proof",
      employment: "employee_proof",
      claim: "claim_doc",
    };

    const backendKey = docKeyMap[docId];
    formData.append(backendKey, file);

    const res = await fetch("/api/docs", {
      method: "PUT",
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to upload file");
  };

  // ✅ WebSocket update
  const sendWebSocketUpdate = (uploadedFiles, attempt = 1) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
       const protocol = baseUrl.startsWith("https") ? "wss" : "ws";
    const host = baseUrl.replace(/^https?:\/\//, ""); // remove protocol
    const wsUrl = `${protocol}://${host}api/ws`;
    console.log('---', wsUrl)
const socket = new WebSocket(wsUrl);
      socket.onopen = () => {
        const documentStatus = {
          proof_id: !!uploadedFiles.id,
          ssn_id: !!uploadedFiles.ssn,
          adress_proof: !!uploadedFiles.address,
          brith_proof: !!uploadedFiles.birth,
          employee_proof: !!uploadedFiles.employment,
          claim_doc: !!uploadedFiles.claim,
        };

        const message = {
          type: "documents_submitted",
          caseId,
          userId,
          documents: documentStatus,
          timestamp: new Date().toISOString(),
        };

        socket.send(JSON.stringify(message));
        setTimeout(() => socket.close(), 500);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket.close();
        if (attempt < 3)
          setTimeout(
            () => sendWebSocketUpdate(uploadedFiles, attempt + 1),
            1000
          );
      };
    } catch (err) {
      console.error("WebSocket send failed:", err);
    }
  };

  // ✅ User tap triggers gallery
  const handleTapAnywhere = () => {
    if (!fileInputRef.current) return;
    if (docId === "claim") {
      fileInputRef.current.setAttribute("multiple", "true");
    } else {
      fileInputRef.current.removeAttribute("multiple");
    }
    fileInputRef.current.click();
  };

  useEffect(() => {
  if (showSuccessPopup) {
    const timer = setTimeout(() => {
      window.open("", "_self");
      window.close();

      // fallback redirect if tab cannot be closed
      router.push("/");
    }, 2000);

    return () => clearTimeout(timer);
  }
}, [showSuccessPopup, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
      onClick={handleTapAnywhere}
    >
      <Card className="p-8 text-center max-w-lg">
        <FileText className="h-10 w-10 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white-900 mb-2">
          Tap Anywhere to Upload Your Document
        </h2>
        <p className="text-white-600 mb-4">
          Once selected, your document will be uploaded automatically.
        </p>

        {loading && <p className="text-blue-600 font-medium">Uploading...</p>}
        {error && <p className="text-red-500 mt-2">{error}</p>}

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center max-w-sm w-full">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Document Uploaded!
              </h3>
              <p className="text-gray-600 mb-4">
                Your document has been uploaded successfully.
              </p>
              <Button
                onClick={() => {
                  setShowSuccessPopup(false);
                  window.open("", "_self");
                  window.close();
                  setTimeout(() => {
                    router.push("/");
                  }, 500);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserDocs;
