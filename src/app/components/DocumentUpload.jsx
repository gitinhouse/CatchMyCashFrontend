'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './uicomponents/Button';
import { Card } from './uicomponents/Card';
import { Badge } from './uicomponents/Badge';
import { useWebSocket } from '../hooks/useWebSocket';
import axios from 'axios';
import {
  Upload,
  FileText,
  Camera,
  CheckCircle,
  AlertCircle,
  Scan,
  Shield,
} from 'lucide-react';
import { useSearchStore } from '../store/searchStore';
import { QRCodeSVG } from 'qrcode.react';

const DocumentUpload = ({ onNext, onFieldFilled }) => {
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [docusignComplete, setDocusignComplete] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [scanTargetDocId, setScanTargetDocId] = useState(null);
  const [socketMessage, setSocketMessage] = useState(null);
  const [qrPopupDoc, setQrPopupDoc] = useState(null);
  const fileInputRef = useRef(null);
  const scanInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDocuSignLoading, setIsDocuSignLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const hasRun = useRef(false);
  const {
    userData,
    userAgreement,
    userSignedAgreement,
    userLogin,
    setUserLogin,
    setUserData,
    setUserAgreement,
    setuserSignedAgreement,
    userCase,
    setUserCase,
    searchResults,
    setSearchResults,
  } = useSearchStore();
  const requiredDocuments = [
    { id: 'id', name: 'Government-issued Photo ID', required: true },
    { id: 'ssn', name: 'Social Security Card or W2', required: true },
    {
      id: 'address',
      name: 'Proof of Address (utility bill, bank statement)',
      required: true,
    },
    { id: 'claim', name: 'Claim Form', required: false },
    { id: 'birth', name: 'Birth Certificate', required: false },
    {
      id: 'employment',
      name: 'Employment Records (if applicable)',
      required: false,
    },
    {
      id: 'agreement',
      name: 'Signed Agreement Form',
      required: true,
    },
  ];

  const [connectSocket, setConnectSocket] = useState(false);

  const [wsUrl, setWsUrl] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
      const protocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
      const host = baseUrl.replace(/^https?:\/\//, '');
      setWsUrl(`${protocol}://${host}/api/ws`);
    }
  }, []);

  const { socket, isConnected, message } = useWebSocket(wsUrl, connectSocket);

  useEffect(() => {
    if (message && message.type === 'documents_submitted') {
      console.log('Message received:', message);
      setSocketMessage(message);

      const docs = message.documents || {};

      const docKeyMap = {
        proof_id: 'id',
        ssn_id: 'ssn',
        adress_proof: 'address',
        brith_proof: 'birth',
        employee_proof: 'employment',
        claim_doc: 'claim',
      };

      const uploadedIds = Object.entries(docs)
        .filter(([key, value]) => value === true)
        .map(([key]) => docKeyMap[key])
        .filter(Boolean);

      setUploadedDocs((prev) => {
        const merged = new Set([...prev, ...uploadedIds]);
        return Array.from(merged);
      });
    }
  }, [message]);

  useEffect(() => {
    if (!userLogin) {
      const savedUserLoginData = localStorage.getItem('userLogin');
      if (savedUserLoginData) setUserLogin(JSON.parse(savedUserLoginData));
    }
    if (!userData) {
      const savedUserData = localStorage.getItem('userData');
      if (savedUserData) setUserData(JSON.parse(savedUserData));
    }

    if (!userAgreement) {
      const savedAgreement = localStorage.getItem('userAgreement');
      if (savedAgreement) setUserAgreement(JSON.parse(savedAgreement));
    }

    if (!userSignedAgreement) {
      const savedSigned = localStorage.getItem('signedDoc');
      if (savedSigned) setuserSignedAgreement(JSON.parse(savedSigned));
    }
    if (!searchResults) {
      const savedProperty = localStorage.getItem('propertyData');
      if (savedProperty) setSearchResults(JSON.parse(savedProperty));
    }
    if (!userCase) {
      const savedUserCaseData = localStorage.getItem('userCase');
      if (savedUserCaseData) setUserCase(JSON.parse(savedUserCaseData));
    }
  }, [userData, searchResults, userSignedAgreement, userAgreement, userLogin]);

  useEffect(() => {
    if (userLogin?.user.user_type === 'Old') {
      fetchUserData(userLogin?.token, userLogin?.user?.user_id);
    }
  }, [userLogin]);

  const fetchUserData = async (token, userId) => {
    try {
      const response = await axios.get(`/api/register?user_id=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('API Response:', response?.data?._id);
      const { data } = await axios.get(
        `/api/case?case_id=${response?.data?._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSearchResults(data?.data?.[0]?.user_properties);
      localStorage.setItem(
        'propertyData',
        JSON.stringify(data?.data?.[0]?.user_properties),
      );
      setUserData(data?.data?.[0]?.user_info);
      localStorage.setItem(
        'userData',
        JSON.stringify(data?.data?.[0]?.user_info),
      );
      setUserAgreement(data?.data?.[0]?.user_details?.[0]);
      localStorage.setItem(
        'userAgreement',
        JSON.stringify(data?.data?.[0]?.user_details?.[0]),
      );
      localStorage.setItem(
        'signedDoc',
        JSON.stringify(data?.data?.[0].user_docs?.[0].signed_doc),
      );
      setuserSignedAgreement(data?.data?.[0].user_docs?.[0].signed_doc);
      setDocusignComplete(true);
      const caseData = data?.data?.[0];
      const filteredCase = {
        _id: caseData?._id,
        case_id: caseData?.case_id,
        status: caseData?.status,
        createdAt: caseData?.createdAt,
      };
      localStorage.setItem('userCase', JSON.stringify(filteredCase));
      setUserCase(filteredCase);
      localStorage.setItem(
        'userAllDocs',
        JSON.stringify(data?.data?.[0]?.user_docs?.[0]),
      );

      const userDocs = data?.data?.[0]?.user_docs?.[0] || [];
      const uploadedIds = [];

      if (userDocs.proof_id) uploadedIds.push('id');
      if (userDocs.ssn_id) uploadedIds.push('ssn');
      if (userDocs.adress_proof) uploadedIds.push('address');
      if (userDocs.brith_proof) uploadedIds.push('birth');
      if (userDocs.employee_proof) uploadedIds.push('employment');
      if (userDocs.claim_doc) uploadedIds.push('claim');

      setUploadedDocs(uploadedIds);
      console.log('Preloaded uploaded documents:', uploadedIds);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    if (docusignComplete && !connectSocket) {
      console.log('DocuSign complete — starting WebSocket listener...');
      setConnectSocket(true);
    }
  }, [docusignComplete]);

  useEffect(() => {
    const requiredDocIds = ['id', 'ssn', 'address', 'agreement'];
    const uploadedRequired = requiredDocIds.filter((id) =>
      uploadedDocs.includes(id),
    ).length;
    const docusignCount = docusignComplete ? 1 : 0;
    onFieldFilled?.(uploadedRequired + docusignCount);
  }, [uploadedDocs, docusignComplete]);

  useEffect(() => {
    async function createCaseIfSigned() {
      if (hasRun.current) return;
      hasRun.current = true;
      if (userSignedAgreement != null) {
        try {
          const userRecord = JSON.parse(
            localStorage.getItem('userData') || '{}',
          );
          const userSignedDoc = JSON.parse(
            localStorage.getItem('signedDoc') || '{}',
          );
          const userId = userData?._id || userRecord?._id;
          if (!userId) {
            console.error('No user ID found in state or localStorage');
            return;
          }

          const signedFilePath =
            userSignedAgreement?.filePath || userSignedDoc?.filePath;

          const payload = { user_id: userId };
          const response = await axios.post('/api/case', payload);

          localStorage.setItem('userCase', JSON.stringify(response.data));
          setUserCase(response.data);

          const docsPayload = {
            user_id: userId,
            case_id: response.data._id,
            signed_doc: signedFilePath,
          };
          const docsResponse = await axios.post('/api/docs', docsPayload);

          console.log('Docs response:', docsResponse.data);
          setDocusignComplete(true);
        } catch (error) {
          console.error('Error creating case:', error);
        }
      }
    }

    createCaseIfSigned();
  }, [userSignedAgreement]);

  const handleDocuSign = async () => {
    setIsDocuSignLoading(true);
    const firstName = userData?.first_name;
    const lastName = userData?.last_name;
    const email = userAgreement?.email_id;
    try {
      const res = await fetch('/api/docusign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          searchResults,
          userAgreement,
        }),
      });
      const data = await res.json();
      console.log('----', data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = (docId) => {
    setSelectedDocId(docId);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedDocId) return;

    setUploadedDocs((prev) => [
      ...prev.filter((id) => id !== selectedDocId),
      selectedDocId,
    ]);

    setUploadedFiles((prev) => ({
      ...prev,
      [selectedDocId]: file,
    }));

    if (selectedDocId === 'agreement') {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', userId);
        formData.append('case_id', caseId);

        const res = await fetch('/api/docusign/notary', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (data.signingUrl) {
          window.location.href = data.signingUrl;
        } else {
          throw new Error('No signing URL received');
        }
      } catch (err) {
        console.error('RON Error:', err);
        setError('Failed to start notarization');
      } finally {
        setLoading(false);
      }
    }

    event.target.value = '';
  };

  const getQrUrl = (docId) => {
    if (typeof window === 'undefined') return '';
    if (!userId || !caseId || !docId) return '';
    return `${window.location.origin}/userDocs?userId=${userId}&caseId=${caseId}&docId=${docId}`;
  };

  const handleScanDocument = (docId) => {
    const doc = requiredDocuments.find((d) => d.id === docId);
    if (!doc) return;
    setQrPopupDoc({
      docId: doc.id,
      docName: doc.name,
    });
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
    event.target.value = '';
  };

  const requiredDocsUploaded = requiredDocuments
    .filter((doc) => doc.required)
    .every((doc) => uploadedDocs.includes(doc.id));

  const canProceed = docusignComplete && requiredDocsUploaded;
  const userId = userData?._id;
  const caseId = userCase?._id;

  const handleSubmitCase = async () => {
    if (!userData?._id) return console.error('User ID missing');
    try {
      setIsSubmitted(true);
      if (message?.type !== 'documents_submitted') {
        const formData = new FormData();
        formData.append('case_id', userCase?._id);
        const docKeyMap = {
          id: 'proof_id',
          ssn: 'ssn_id',
          address: 'adress_proof',
          birth: 'brith_proof',
          employment: 'employee_proof',
          claim: 'claim_doc',
        };
        Object.entries(docKeyMap).forEach(([frontendKey, backendKey]) => {
          const file = uploadedFiles[frontendKey];
          if (file) formData.append(backendKey, file);
        });

        const res = await fetch('/api/docs', {
          method: 'PUT',
          body: formData,
        });
        const data = await res.json();
        localStorage.setItem('userAllDocs', JSON.stringify(data));
        await axios.get(`/api/docs?user_id=${userData?._id}`);
      }
      setIsSubmitted(false);
      onNext();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] pt-4">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E3] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-[#0A0A0A] font-['Fraunces']">
            CatchMyCash
          </h1>
          <p className="text-[#4A4A4A] mt-1">
            Document Collection & Signatures
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-[#E1261C]" />
          </div>
          <h2 className="text-3xl font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
            Sign{' '}
            <span className="text-[#E1261C] italic font-normal">Documents</span>{' '}
            & Upload ID
          </h2>
          <p className="text-[#4A4A4A] mb-6">
            Complete the legal process by signing forms and providing identity
            verification
          </p>
        </div>

        {/* Step 1: Digital Signatures - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
              Step 1: Digital{' '}
              <span className="text-[#E1261C] italic font-normal">
                Signatures
              </span>
            </h3>
            {docusignComplete && (
              <Badge className="bg-[#003f2f] text-white border-none">
                <CheckCircle className="h-4 w-4 mr-1" />
                Completed
              </Badge>
            )}
          </div>

          {!docusignComplete ? (
            <div>
              <p className="text-[#4A4A4A] mb-4">
                Sign your investigator agreement and authorization forms via
                DocuSign
              </p>
              <div className="bg-[#FCE9E7] border border-[#E8E6E3] rounded-lg p-4 mb-4">
                <h4 className="font-medium text-[#0A0A0A] mb-2 font-['JetBrains_Mono']">
                  Documents to Sign:
                </h4>
                <ul className="text-sm text-[#4A4A4A] space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    Investigator Services Agreement
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    State Controller's Office Authorization Form
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                    Identity Verification Affidavit
                  </li>
                </ul>
              </div>
              <button
                onClick={handleDocuSign}
                className="bg-[#E1261C] hover:bg-[#B11912] text-white px-4 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
                disabled={isDocuSignLoading}
              >
                {isDocuSignLoading
                  ? 'Processing for DocuSign...'
                  : 'Open DocuSign to Sign Documents'}
              </button>
            </div>
          ) : (
            <div className="flex items-center text-[#003f2f]">
              <CheckCircle className="h-6 w-6 mr-2" />
              <span className="w-[90%]">
                All documents have been signed successfully
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Upload Documents - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
              Step 2: Upload{' '}
              <span className="text-[#E1261C] italic font-normal">
                Supporting Documents
              </span>
            </h3>
            <Badge
              className={
                requiredDocsUploaded
                  ? 'bg-[#003f2f] text-white border-none'
                  : 'bg-[#D4D4D4] text-[#4A4A4A] border-none'
              }
            >
              {uploadedDocs.length}/
              {requiredDocuments.filter((d) => d.required).length} Required
            </Badge>
          </div>

          <p className="text-[#4A4A4A] mb-3">
            Upload or scan your identity documents. We automatically transfer
            these to your case file.
          </p>

          {/* Document List */}
          <div className="space-y-4">
            {requiredDocuments.map((doc) => (
              <div
                key={doc.id}
                className={`border rounded-lg p-4 transition-all ${
                  uploadedDocs.includes(doc.id)
                    ? 'border-[#003f2f]/50 bg-[#F0FFF4]'
                    : 'border-[#E8E6E3]'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center">
                    {uploadedDocs.includes(doc.id) ? (
                      <CheckCircle className="h-5 w-5 text-[#003f2f] mr-3" />
                    ) : doc.required ? (
                      <AlertCircle className="h-5 w-5 text-[#E1261C] mr-3" />
                    ) : (
                      <FileText className="h-5 w-5 text-[#888888] mr-3" />
                    )}
                    <div className="w-[90%]">
                      <h4 className="font-medium text-[#0A0A0A]">{doc.name}</h4>
                      <p className="text-sm text-[#888888]">
                        {doc.required ? 'Required' : 'Optional'} •
                        {uploadedDocs.includes(doc.id)
                          ? ' Uploaded'
                          : ' Not uploaded'}
                      </p>
                    </div>
                  </div>

                  {!uploadedDocs.includes(doc.id) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUploadClick(doc.id)}
                        disabled={isScanning}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium border border-[#E8E6E3] rounded-lg text-[#0A0A0A] hover:bg-[#FCE9E7] hover:border-[#E1261C]/50 transition-all"
                      >
                        <Upload className="h-4 w-4" />
                        Upload
                      </button>
                      <button
                        onClick={() => handleScanDocument(doc.id)}
                        disabled={isScanning}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium border border-[#E8E6E3] rounded-lg text-[#0A0A0A] hover:bg-[#FCE9E7] hover:border-[#E1261C]/50 transition-all"
                      >
                        <Camera className="h-4 w-4" />
                        Scan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isScanning && (
            <div className="bg-[#FCE9E7] border border-[#E8E6E3] rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <Scan className="h-5 w-5 text-[#E1261C] mr-2 animate-pulse" />
                <span className="text-[#0A0A0A]">
                  Scanning document... Please hold your device steady
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Completion Status - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
            Completion{' '}
            <span className="text-[#E1261C] italic font-normal">Status</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#E8E6E3]">
              <span className="text-[#4A4A4A]">Digital Signatures</span>
              {docusignComplete ? (
                <CheckCircle className="h-5 w-5 text-[#003f2f]" />
              ) : (
                <div className="w-5 h-5 border-2 border-[#D4D4D4] rounded-full"></div>
              )}
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[#4A4A4A]">Required Documents</span>
              {requiredDocsUploaded ? (
                <CheckCircle className="h-5 w-5 text-[#003f2f]" />
              ) : (
                <div className="w-5 h-5 border-2 border-[#D4D4D4] rounded-full"></div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="text-center">
          {canProceed ? (
            <div>
              <div className="mb-6">
                <div className="w-20 h-20 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-[#E1261C]" />
                </div>
                <h3 className="text-2xl font-bold text-[#0A0A0A] mb-2 font-['Fraunces']">
                  All Documents{' '}
                  <span className="text-[#E1261C] italic font-normal">
                    Collected!
                  </span>
                </h3>
                <p className="text-[#4A4A4A]">
                  Your case is ready for submission to the State Controller's
                  Office
                </p>
              </div>
              <button
                onClick={handleSubmitCase}
                className="bg-[#E1261C] hover:bg-[#B11912] text-white px-12 py-4 text-xl font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                {isSubmitted ? 'Submitting...' : 'Submit My Case'}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[#888888] mb-4">
                Please complete all required steps above to proceed
              </p>
              <button
                disabled
                className="bg-[#D4D4D4] text-[#888888] px-12 py-4 text-xl rounded-xl cursor-not-allowed"
              >
                Complete Required Steps First
              </button>
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

      {/* QR Popup - Red Themed */}
      {qrPopupDoc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-md relative shadow-xl">
            <button
              className="absolute top-3 right-3 text-[#888888] hover:text-[#E1261C] transition-colors"
              onClick={() => setQrPopupDoc(null)}
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
              Scan to Upload:{' '}
              <span className="text-[#E1261C] italic font-normal">
                {qrPopupDoc.docName}
              </span>
            </h3>
            <p className="text-[#4A4A4A] mb-4 text-sm">
              Use your mobile device to scan the QR code below to upload this
              document.
            </p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG
                value={getQrUrl(qrPopupDoc.docId)}
                size={200}
                fgColor="#E1261C"
              />
            </div>
            <p className="text-[#888888] text-xs break-words text-center">
              {getQrUrl(qrPopupDoc.docId)}
            </p>
            <div className="text-center mt-4">
              <button
                onClick={() => setQrPopupDoc(null)}
                className="bg-[#E1261C] hover:bg-[#B11912] text-white px-6 py-2 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
