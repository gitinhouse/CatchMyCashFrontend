import React, { useState, useRef, useEffect } from "react";
import { Button } from "./uicomponents/Button";
import { Card } from "./uicomponents/Card";
import { Badge } from "./uicomponents/Badge";
import axios from "axios";
import {
  Upload,
  FileText,
  Camera,
  CheckCircle,
  AlertCircle,
  Scan,
} from "lucide-react";
import { useSearchStore } from "../store/searchStore";
import { QRCodeSVG } from "qrcode.react";

const DocumentUpload = ({ onNext }) => {
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [docusignComplete, setDocusignComplete] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [scanTargetDocId, setScanTargetDocId] = useState(null);

  const fileInputRef = useRef(null);
  const scanInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    userData,
    userAgreement,
    userSignedAgreement,
    setUserData,
    setUserAgreement,
    setuserSignedAgreement,
  } = useSearchStore();
  const requiredDocuments = [
    { id: "id", name: "Government-issued Photo ID", required: true },
    { id: "ssn", name: "Social Security Card or W2", required: true },
    {
      id: "address",
      name: "Proof of Address (utility bill, bank statement)",
      required: true,
    },
    { id: "birth", name: "Birth Certificate", required: false },
    {
      id: "employment",
      name: "Employment Records (if applicable)",
      required: false,
    },
  ];

  useEffect(() => {
    if (!userData) {
      const savedUserData = localStorage.getItem("userData");
      if (savedUserData) setUserData(JSON.parse(savedUserData));
    }

    if (!userAgreement) {
      const savedAgreement = localStorage.getItem("userAgreement");
      if (savedAgreement) setUserAgreement(JSON.parse(savedAgreement));
    }

    if (!userSignedAgreement) {
      const savedSigned = localStorage.getItem("signedDoc");
      if (savedSigned) setuserSignedAgreement(JSON.parse(savedSigned));
    }
  }, []);

  useEffect(() => {
    console.log("48---", userData, userAgreement, userSignedAgreement);
    if (userSignedAgreement != null) {
      setDocusignComplete(true);
    }
  }, [userSignedAgreement]);

  const handleDocuSign = async () => {
    const firstName = userData?.first_name;
    const lastName = userData?.last_name;
    const email = userAgreement?.email_id;
    try {
      const res = await fetch("/api/docusign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      const data = await res.json();

      if (data.signingUrl) {
        // redirect to DocuSign embedded signing
        window.location.href = data.signingUrl;
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // window.open("about:blank", "_blank");
    // setTimeout(() => {
    //   setDocusignComplete(true);
    // }, 3000);
  };

  const handleUploadClick = (docId) => {
    setSelectedDocId(docId);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && selectedDocId) {
      setUploadedDocs((prev) => [
        ...prev.filter((id) => id !== selectedDocId),
        selectedDocId,
      ]); // optional: avoid duplicates
      setUploadedFiles((prev) => ({ ...prev, [selectedDocId]: file }));
    }
    event.target.value = "";
  };

  const handleScanDocument = (docId) => {
    setScanTargetDocId(docId);
    if (scanInputRef.current) scanInputRef.current.click();
  };

  const handleScanChange = (event) => {
    const file = event.target.files[0];
    if (file && scanTargetDocId) {
      setUploadedDocs((prev) => [
        ...prev.filter((id) => id !== scanTargetDocId),
        scanTargetDocId,
      ]);
      setUploadedFiles((prev) => ({ ...prev, [scanTargetDocId]: file }));
    }
    event.target.value = "";
  };

  const requiredDocsUploaded = requiredDocuments
    .filter((doc) => doc.required)
    .every((doc) => uploadedDocs.includes(doc.id));

  const canProceed = docusignComplete && requiredDocsUploaded;
  const userId = userData?._id;
  const qrUrl = userId ? `${window.location.origin}/upload?id=${userId}` : null;

  const handleSubmitCase = async () => {
    if (!userData?._id) return console.error("User ID missing");

    const formData = new FormData();
    formData.append("user_id", userData._id);
    formData.append("case_id", "12");
    formData.append("signed_doc", "ok");
    // Map frontend doc IDs to backend field names
    const docKeyMap = {
      id: "proof_id",
      ssn: "ssn_id",
      address: "adress_proof",
      birth: "brith_proof",
      employment: "employee_proof",
    };
    Object.entries(docKeyMap).forEach(([frontendKey, backendKey]) => {
      const file = uploadedFiles[frontendKey];
      if (file) formData.append(backendKey, file); 
    });

    try {
      const res = await fetch("/api/docs", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("Upload successful:", data);
      onNext();
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-blue-900">FindMyMoney</h1>
          <p className="text-gray-600 mt-1">Document Collection & Signatures</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Sign Documents & Upload ID
          </h2>
          <p className="text-gray-600 mb-6">
            Complete the legal process by signing forms and providing identity
            verification
          </p>
        </div>

        {/* Step 1: Digital Signatures */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              Step 1: Digital Signatures
            </h3>
            {docusignComplete && (
              <Badge className="bg-green-500">
                <CheckCircle className="h-4 w-4 mr-1" />
                Completed
              </Badge>
            )}
          </div>

          {!docusignComplete ? (
            <div>
              <p className="text-gray-600 mb-4">
                Sign your investigator agreement and authorization forms via
                DocuSign
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  Documents to Sign:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Investigator Services Agreement</li>
                  <li>• State Controller's Office Authorization Form</li>
                  <li>• Identity Verification Affidavit</li>
                </ul>
              </div>
              <Button
                onClick={handleDocuSign}
                className="bg-orange-600 hover:bg-orange-700 text-white cursor-pointer sm:px-4 px-2"
              >
                Open DocuSign to Sign Documents
              </Button>
            </div>
          ) : (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-6 w-6 mr-2" />
              <span className="w-[90%]">
                All documents have been signed successfully
              </span>
            </div>
          )}
        </Card>

        {/* Step 2: QR Code & Upload Documents */}
        <Card className="p-6 mb-8">
          {/* {userId && (
            <Card className="p-4 mb-4 text-center bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Access Your Case on Mobile
              </h3>
              <p className="text-gray-600 mb-4">
                Scan this QR code with your mobile device to upload your
                document
              </p>
              <div className="inline-block p-4 rounded-lg bg-gray-100">
                <QRCodeSVG value={qrUrl} size={180} fgColor="#1D4ED8" />
              </div>
              <p className="text-gray-500 mt-2 text-sm break-words">{qrUrl}</p>
            </Card>
          )} */}

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
              <span>Digital Signatures</span>
              {docusignComplete ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
              )}
            </div>
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
                  Your case is ready for submission to the State Controller's
                  Office
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
    </div>
  );
};

export default DocumentUpload;
