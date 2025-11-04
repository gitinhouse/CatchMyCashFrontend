"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "../components/uicomponents/Button";
import { Card } from "../components/uicomponents/Card";
import { Badge } from "../components/uicomponents/Badge";
import { jsPDF } from "jspdf";
import {
  Upload,
  FileText,
  Camera,
  CheckCircle,
  AlertCircle,
  Scan,
} from "lucide-react";

const UserDocs = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userId, setUserId] = useState();
  const [caseId, setCaseId] = useState();

  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isScanning, setIsScanning] = useState(false);

  const [selectedDocId, setSelectedDocId] = useState(null);
  const [scanTargetDocId, setScanTargetDocId] = useState(null);

  const fileInputRef = useRef(null);
  const scanInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const Id = searchParams.get("Id");
    const caseId = searchParams.get("caseId");
    setUserId(Id);
    setCaseId(caseId);

    if (!Id && !caseId) {
      router.push("/");
    }
  }, [searchParams, router]);

  const requiredDocuments = [
    { id: "id", name: "Government-issued Photo ID", required: true },
    { id: "ssn", name: "Social Security Card or W2", required: true },
    {
      id: "address",
      name: "Proof of Address (utility bill, bank statement)",
      required: true,
    },
    { id: "claim", name: "Claim Form", required: false },
    { id: "birth", name: "Birth Certificate", required: false },
    {
      id: "employment",
      name: "Employment Records (if applicable)",
      required: false,
    },
  ];


const handleUploadClick = (docId) => {
  setSelectedDocId(docId);
  requestAnimationFrame(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("data-docid", docId);
      if (docId === "claim") {
        fileInputRef.current.setAttribute("multiple", "true");
      } else {
        fileInputRef.current.removeAttribute("multiple");
      }
      fileInputRef.current.click();
    }
  });
};

 const handleFileChange = async (event) => {
   const files = Array.from(event.target.files);
  const currentDocId = selectedDocId || event.target.getAttribute("data-docid");
  if (files.length === 0 || !currentDocId) return;

  try {
    let finalFile;

    if (currentDocId === "claim" && files.length > 1) {
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < files.length; i++) {
        const imageData = await readFileAsDataURL(files[i]);
        const img = new Image();
        img.src = imageData;
        await new Promise((resolve) => (img.onload = resolve));

        const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
        const imgWidth = img.width * ratio;
        const imgHeight = img.height * ratio;
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        if (i > 0) pdf.addPage();
        pdf.addImage(img, "JPEG", x, y, imgWidth, imgHeight);
      }

      const pdfBlob = pdf.output("blob");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const pdfFileName = `claim_${timestamp}.pdf`;
      finalFile = new File([pdfBlob], pdfFileName, { type: "application/pdf" });
    } else {
      finalFile = files[0];
    }

    setUploadedFiles((prev) => ({ ...prev, [currentDocId]: finalFile }));

    setUploadedDocs((prev) => {
      const updated = new Set(prev);
      updated.add(currentDocId);
      return Array.from(updated);
    });

  } catch (err) {
    console.error("Error processing file:", err);
    setError("Failed to process file. Please try again.");
  } finally {
    event.target.value = "";
  }
};


  // helper function to read file as base64
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

 const handleScanDocument = (docId) => {
  setScanTargetDocId(docId);
  requestAnimationFrame(() => {
    if (scanInputRef.current) {
      scanInputRef.current.setAttribute("data-docid", docId);
    
      if (docId === "claim") {
        scanInputRef.current.setAttribute("multiple", "true");
      } else {
        scanInputRef.current.removeAttribute("multiple");
      }
      scanInputRef.current.click();
    }
  });
};

const handleScanChange = async (event) => {
  const files = Array.from(event.target.files);
  const currentDocId = scanTargetDocId || event.target.getAttribute("data-docid");
  if (files.length === 0 || !currentDocId) return;

  try {
    let finalFile;

    if (currentDocId === "claim" && files.length > 1) {
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < files.length; i++) {
        const imageData = await readFileAsDataURL(files[i]);
        const img = new Image();
        img.src = imageData;
        await new Promise((resolve) => (img.onload = resolve));

        const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
        const imgWidth = img.width * ratio;
        const imgHeight = img.height * ratio;
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        if (i > 0) pdf.addPage();
        pdf.addImage(img, "JPEG", x, y, imgWidth, imgHeight);
      }

      const pdfBlob = pdf.output("blob");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const pdfFileName = `claim_${timestamp}.pdf`;
      finalFile = new File([pdfBlob], pdfFileName, { type: "application/pdf" });
    } else {
      finalFile = files[0];
    }

    
    setUploadedFiles((prev) => ({ ...prev, [currentDocId]: finalFile }));

    setUploadedDocs((prev) => {
      const updated = new Set(prev);
      updated.add(currentDocId);
      return Array.from(updated);
    });
  } catch (err) {
    console.error("Error processing scanned file:", err);
    setError("Failed to process scanned file. Please try again.");
  } finally {
    event.target.value = "";
  }
};


  const requiredDocsUploaded = requiredDocuments
    .filter((doc) => doc.required)
    .every((doc) => uploadedDocs.includes(doc.id));

  const canProceed = requiredDocsUploaded;

  const handleSubmitCase = async () => {
    try {
      setLoading(true);
      setError(null);
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
      Object.entries(docKeyMap).forEach(([frontendKey, backendKey]) => {
        const file = uploadedFiles[frontendKey];
        if (file) formData.append(backendKey, file);
      });

      const res = await fetch("/api/docs", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      sendWebSocketUpdate(uploadedFiles);
      setShowSuccessPopup(true);
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendWebSocketUpdate = (uploadedFiles, attempt = 1) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
      const wsUrl = baseUrl.replace(/^http/, "ws");
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        const documentStatus = {
          proof_id: !!uploadedFiles.id,
          ssn_id: !!uploadedFiles.ssn,
          adress_proof: !!uploadedFiles.address,
          brith_proof: !!uploadedFiles.birth,
          employee_proof: !!uploadedFiles.employment,
          claim_doc: !! uploadedFiles.claim
        };

        const message = {
          type: "documents_submitted",
          caseId,
          userId,
          documents: documentStatus,
          timestamp: new Date().toISOString(),
        };

        console.log(" Sending WebSocket message:", message);
        socket.send(JSON.stringify(message));

        setTimeout(() => {
          console.log(" Closing WebSocket connection...");
          socket.close();
        }, 500);
      };

      socket.onerror = (err) => {
        console.error(` WebSocket error (attempt ${attempt}):`, err);
        socket.close();
        if (attempt < 3) {
          console.log(
            ` Retrying WebSocket connection (attempt ${attempt + 1})...`
          );
          setTimeout(
            () => sendWebSocketUpdate(uploadedFiles, attempt + 1),
            1000
          );
        }
      };

      socket.onclose = (e) => {
        console.log(` WebSocket closed (code: ${e.code})`);
      };
    } catch (err) {
      console.error(" WebSocket send failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-blue-900">FindMyMoney</h1>
          <p className="text-gray-600 mt-1">Document Collection </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Upload Proofs
          </h2>
          <p className="text-gray-600 mb-6">
            Complete the legal process by signing forms and providing identity
            verification
          </p>
        </div>

        {/* Step 2: QR Code & Upload Documents */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              Step 2: Upload Supporting Documents
            </h3>
            <Badge
              variant={requiredDocsUploaded ? "default" : "secondary"}
              className={requiredDocsUploaded ? "bg-green-500" : ""}
            >
              {uploadedDocs.length}/
              {requiredDocuments.filter((d) => d.required).length} Required
            </Badge>
          </div>

          <p className="text-gray-600 mb-6">
            Upload or scan your identity documents. We automatically transfer
            these to your case file.
          </p>

          {/* Document List */}
          <div className="space-y-4">
            {requiredDocuments.map((doc) => (
              <div
                key={doc.id}
                className={`border rounded-lg p-4 ${
                  uploadedDocs.includes(doc.id)
                    ? "border-green-200 text-green-700 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center">
                    {uploadedDocs.includes(doc.id) ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    ) : doc.required ? (
                      <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    <div className="w-[90%]">
                      <h4 className="font-medium">{doc.name}</h4>
                      <p className="text-sm text-gray-500">
                        {doc.required ? "Required" : "Optional"} •
                        {uploadedDocs.includes(doc.id)
                          ? " Uploaded"
                          : " Not uploaded"}
                      </p>
                    </div>
                  </div>

                  {!uploadedDocs.includes(doc.id) && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadClick(doc.id)}
                        disabled={isScanning}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScanDocument(doc.id)}
                        disabled={isScanning}
                      >
                        {isScanning ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1"></div>
                        ) : (
                          <Camera className="h-4 w-4 mr-1" />
                        )}
                        Scan
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isScanning && (
            <Card className="p-4 mt-4 bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <Scan className="h-5 w-5 text-blue-600 mr-2 animate-pulse" />
                <span className="text-blue-800">
                  Scanning document... Please hold your device steady
                </span>
              </div>
            </Card>
          )}
        </Card>

        {/* Completion Status */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">
            Completion Status
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Required Documents</span>
              {requiredDocsUploaded ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
              )}
            </div>
          </div>
        </Card>

        {/* Submit Section */}
        <div className="text-center">
          {canProceed ? (
            <div>
              <div className="mb-6">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-800 mb-2">
                  All Documents Collected!
                </h3>
                <p className="text-gray-600">
                  {
                    "Your case is ready for submission to the State Controller's Office"
                  }
                </p>
              </div>
              <Button
                onClick={handleSubmitCase}
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-xl rounded-lg"
              >
                Submit My Case
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Please complete all required steps above to proceed
              </p>
              <Button
                disabled
                className="bg-gray-400 text-white sm:px-12 px-6 py-4 text-xl rounded-lg sm:text-[20px] text-[16px] cursor-not-allowed"
              >
                Complete Required Steps First
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*,.pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={scanInputRef}
        onChange={handleScanChange}
        className="hidden"
      />

      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Documents Submitted!
            </h2>
            <p className="text-gray-600 mb-6">
              Your documents have been successfully uploaded and linked to your
              case.
            </p>
            <Button
              onClick={() => {
                setShowSuccessPopup(false);
                router.push("/");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDocs;
