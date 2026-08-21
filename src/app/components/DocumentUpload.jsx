'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './uicomponents/Button';
import { Card } from './uicomponents/Card';
import { Badge } from './uicomponents/Badge';
import { useWebSocket } from '../hooks/useWebSocket';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Camera,
  CheckCircle,
  AlertCircle,
  Scan,
  Shield,
  Trash2,
  Info,
} from 'lucide-react';
import { useSearchStore } from '../store/searchStore';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Document validation rules
//
// Files:
//   - Must be PDF, TIF, PNG, or JPEG
//   - Must be greater than 1 byte and less than 10 MB
//   - Cannot be password protected
// File names:
//   - Can only contain letters, numbers, dashes, and underscores
//   - Cannot exceed 100 characters
// ---------------------------------------------------------------------------
const ALLOWED_FILE_EXTENSIONS = ['pdf', 'tif', 'tiff', 'png', 'jpg', 'jpeg'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/tiff',
  'image/png',
  'image/jpeg',
];
const MIN_FILE_SIZE_BYTES = 1; // must be greater than 1 byte
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILENAME_LENGTH = 100;

const getFileExtension = (fileName) => {
  const parts = String(fileName || '').split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

// Lightweight client-side heuristic for detecting an encrypted/password
// protected PDF: scan the raw bytes for the "/Encrypt" dictionary key that
// the PDF spec requires on encrypted files. This is not a substitute for a
// real server-side check (which should still happen), but it lets us warn
// the user immediately instead of letting them submit a file that will fail
// later.
const isPdfPasswordProtected = async (file) => {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let text = '';
    const chunkSize = 20000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      text += String.fromCharCode(...bytes.slice(i, i + chunkSize));
    }
    return /\/Encrypt/.test(text);
  } catch (err) {
    console.error('Error inspecting PDF for encryption:', err);
    // If the file can't be inspected, don't block the upload on this check alone.
    return false;
  }
};

const validateDocumentFile = async (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected. Please choose a file to upload.' };
  }

  const extension = getFileExtension(file.name);

  if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `"${file.name}" isn't a supported file type. Only PDF, TIF, PNG, or JPEG files are accepted. Please convert the file or upload a different one.`,
    };
  }

  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `"${file.name}" isn't a supported file type. Only PDF, TIF, PNG, or JPEG files are accepted. Please convert the file or upload a different one.`,
    };
  }

  if (file.size <= MIN_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `"${file.name}" appears to be empty (0 bytes). Please check the file and upload a valid document.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `"${file.name}" is ${sizeMB} MB, which exceeds the 10 MB limit. Please compress the file or upload a smaller version.`,
    };
  }

  const nameWithoutExtension = file.name.includes('.')
    ? file.name.slice(0, file.name.lastIndexOf('.'))
    : file.name;

  if (!/^[A-Za-z0-9_-]+$/.test(nameWithoutExtension)) {
    return {
      valid: false,
      error: `"${file.name}" isn't a valid file name. File names can only contain letters, numbers, dashes, and underscores. Please rename the file and upload again.`,
    };
  }

  if (file.name.length > MAX_FILENAME_LENGTH) {
    return {
      valid: false,
      error: `"${file.name}" isn't a valid file name. File names must be under 100 characters (this one is ${file.name.length}). Please rename the file and upload again.`,
    };
  }

  if (extension === 'pdf') {
    const encrypted = await isPdfPasswordProtected(file);
    if (encrypted) {
      return {
        valid: false,
        error: `"${file.name}" is password protected. Please remove the password and upload an unprotected version of the file.`,
      };
    }
  }

  return { valid: true, error: null };
};

const DocumentUpload = ({ onNext, onFieldFilled }) => {
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [docusignComplete, setDocusignComplete] = useState(false);
  const [agreementDocuSignComplete, setAgreementDocuSignComplete] =
    useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [scanTargetDocId, setScanTargetDocId] = useState(null);
  const [socketMessage, setSocketMessage] = useState(null);
  const [qrPopupDoc, setQrPopupDoc] = useState(null);
  const fileInputRef = useRef(null);
  const scanInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDocuSignLoading, setIsDocuSignLoading] = useState(false);
  const [isAgreementDocuSignLoading, setIsAgreementDocuSignLoading] =
    useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const hasRun = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseIdFromUrl = searchParams.get('case_id'); // NEW
  const [isAgreementAvailable, setIsAgreementAvailable] = useState(false);

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
    resetAll,
  } = useSearchStore();

  const [errorModal, setErrorModal] = useState({
    show: false,
    title: '',
    message: '',
  });
  const [fileErrorModal, setFileErrorModal] = useState({
    show: false,
    fileName: '',
    message: '',
  });
  const requiredDocuments = [
    {
      id: 'agreement',
      name: 'Signed Agreement Form',
      required: true,
    },
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

  const getDocPath = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value?.filePath || '';
  };

  const isInvestigatorSignedDoc = (value) => {
    const path = getDocPath(value);
    return path.includes('signed-document');
  };

  const isFilledAgreementDoc = (value) => {
    const path = getDocPath(value);
    return path.includes('FilledAgreement_form');
  };

  const areRequiredDocsComplete = (userDocs) => {
    if (!userDocs || Array.isArray(userDocs) || typeof userDocs !== 'object') {
      return false;
    }

    const hasRequiredUploads = Boolean(
      userDocs.proof_id && userDocs.ssn_id && userDocs.adress_proof,
    );
    const hasFilledAgreement = Boolean(
      userDocs.filled_agreement_doc ||
      isFilledAgreementDoc(userDocs.filled_agreement_doc) ||
      isFilledAgreementDoc(userDocs.signed_doc),
    );
    const hasInvestigatorSigned = isInvestigatorSignedDoc(userDocs.signed_doc);

    return hasRequiredUploads && hasFilledAgreement && hasInvestigatorSigned;
  };

  const hasRedirectedToTracking = useRef(false);

  const redirectToTrackingIfComplete = (userDocs) => {
    if (hasRedirectedToTracking.current) return false;
    if (!areRequiredDocsComplete(userDocs)) return false;

    hasRedirectedToTracking.current = true;
    onNext();
    return true;
  };

  const isDocComplete = (docId) => {
    if (docId === 'agreement') return agreementDocuSignComplete;
    return uploadedDocs.includes(docId);
  };

  const getRequiredCompletedCount = () =>
    requiredDocuments.filter((doc) => doc.required && isDocComplete(doc.id))
      .length;

  const splitLegalName = (legalName) => {
    const name = String(legalName || '').trim();
    if (!name) return { firstName: '', lastName: '' };

    const parts = name.split(/\s+/);
    if (parts.length === 1) {
      return { firstName: '', lastName: parts[0] };
    }

    return {
      firstName: parts[parts.length - 1],
      lastName: parts.slice(0, -1).join(' '),
    };
  };

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
      if (savedSigned) {
        try {
          const parsed = JSON.parse(savedSigned);
          setuserSignedAgreement(parsed);
          if (isInvestigatorSignedDoc(parsed)) {
            setDocusignComplete(true);
          }
        } catch {
          // ignore invalid localStorage value
        }
      }
    } else if (isInvestigatorSignedDoc(userSignedAgreement)) {
      setDocusignComplete(true);
    }
    if (!searchResults) {
      const savedProperty = localStorage.getItem('propertyData');
      if (savedProperty) setSearchResults(JSON.parse(savedProperty));
    }
    if (!userCase) {
      const savedUserCaseData = localStorage.getItem('userCase');
      if (savedUserCaseData) setUserCase(JSON.parse(savedUserCaseData));
    }

    const savedFilledAgreement = localStorage.getItem('filledAgreementDoc');
    if (savedFilledAgreement) {
      try {
        const parsed = JSON.parse(savedFilledAgreement);
        if (isFilledAgreementDoc(parsed)) {
          setAgreementDocuSignComplete(true);
        }
      } catch {
        // ignore invalid localStorage value
      }
    } else {
      const savedAllDocs = localStorage.getItem('userAllDocs');
      if (savedAllDocs) {
        try {
          const allDocs = JSON.parse(savedAllDocs);
          if (
            isFilledAgreementDoc(allDocs?.filled_agreement_doc) ||
            isFilledAgreementDoc(allDocs?.signed_doc)
          ) {
            setAgreementDocuSignComplete(true);
          }

          if (redirectToTrackingIfComplete(allDocs)) {
            return;
          }

          const uploadedIds = [];
          if (allDocs.proof_id) uploadedIds.push('id');
          if (allDocs.ssn_id) uploadedIds.push('ssn');
          if (allDocs.adress_proof) uploadedIds.push('address');
          if (allDocs.brith_proof) uploadedIds.push('birth');
          if (allDocs.employee_proof) uploadedIds.push('employment');
          if (allDocs.claim_doc) uploadedIds.push('claim');
          if (uploadedIds.length > 0) {
            setUploadedDocs((prev) =>
              Array.from(new Set([...prev, ...uploadedIds])),
            );
          }
        } catch {
          // ignore invalid localStorage value
        }
      }
    }
  }, [userData, searchResults, userSignedAgreement, userAgreement, userLogin]);

  useEffect(() => {
    if (userLogin?.user.user_type === 'Old') {
      fetchUserData(userLogin?.token, userLogin?.user?.user_id);
    }
  }, [userLogin]);

  const fetchUserData = async (token, userId) => {
    try {
      // NEW: if a specific case_id came from the dashboard's "Continue Filing"
      // link, resume THAT exact case. Otherwise fall back to the old
      // single-case lookup (unchanged behaviour for users with one claim).
      let resolvedCaseId = caseIdFromUrl;

      if (!resolvedCaseId) {
        const response = await axios.get(`/api/register?user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('API Response:', response?.data?._id);
        resolvedCaseId = response?.data?._id;
      }

      const { data } = await axios.get(
        `/api/case?case_id=${resolvedCaseId}`,
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
      const userDocs = data?.data?.[0]?.user_docs?.[0] || [];
      const signedDocValue = userDocs.signed_doc;
      const filledAgreementValue =
        userDocs.filled_agreement_doc || userDocs.signed_doc;

      if (isInvestigatorSignedDoc(signedDocValue)) {
        localStorage.setItem(
          'signedDoc',
          JSON.stringify({ filePath: signedDocValue }),
        );
        setuserSignedAgreement({ filePath: signedDocValue });
        setDocusignComplete(true);
      } else if (signedDocValue) {
        setuserSignedAgreement(signedDocValue);
      }

      if (isFilledAgreementDoc(filledAgreementValue)) {
        setAgreementDocuSignComplete(true);
      }
      const caseData = data?.data?.[0];
      const filteredCase = {
        _id: caseData?._id,
        case_id: caseData?.case_id,
        status: caseData?.status,
        claim_status: caseData?.claim_status,
        claim_process_task_status: caseData?.claim_process_task_status,
        createdAt: caseData?.createdAt,
      };
      localStorage.setItem('userCase', JSON.stringify(filteredCase));
      setUserCase(filteredCase);
      localStorage.setItem(
        'userAllDocs',
        JSON.stringify(data?.data?.[0]?.user_docs?.[0]),
      );

      // All docs already on file → skip re-submit and go to Case Tracking
      if (redirectToTrackingIfComplete(userDocs)) {
        return;
      }

      if (
        caseData?.claim_process_task_status === '' ||
        caseData?.claim_process_task_status === null ||
        caseData?.claim_process_task_status === 'queued' ||
        caseData?.claim_process_task_status === 'failed' ||
        caseData?.claim_process_task_status === 'Failed'
      ) {
        setErrorModal({
          show: true,
          title: 'Claim Process Pending',
          message:
            ' Your claim is currently being processed. Please check back later for updates.',
        });
      }
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
    const checkAgreementDocumentExists = async () => {
      if (!userData?._id) {
        setIsAgreementAvailable(false);
        return;
      }

      try {
        // Use the GET endpoint to check if agreement exists
        // const response = await fetch(`/api/docusign/agreement?user_id=${userData._id}`);
        const response = await fetch(`/api/docusign/agreement?user_id=6a7d64c5942c7410458aea7b`);
        const data = await response.json();

        if (response.ok) {
          // Check if user has filled in their details
          const hasUserDetails = !!(userAgreement?.legal_name && userAgreement?.email_id) ||
            !!(userData?.first_name && userData?.last_name);

          // Agreement is available ONLY if BOTH conditions are met:
          // 1. User details exist (name, email)
          // 2. Agreement document exists in database
          const agreementAvailable = data.hasAgreement && hasUserDetails;

          setIsAgreementAvailable(agreementAvailable);

          console.log('Agreement check result:', {
            hasAgreementDoc: data.hasAgreement,
            agreementDocPath: data.agreement_doc,
            hasUserDetails,
            agreementAvailable
          });

          // Show error modal if agreement document is missing but user has details
          if (!data.hasAgreement && hasUserDetails) {
            setErrorModal({
              show: true,
              title: 'Agreement Document Not Found',
              message: 'No agreement document has been uploaded for your account. Please contact support to get your agreement document uploaded so you can proceed with the signing process.',
            });
          }
        } else {
          setIsAgreementAvailable(false);
          console.error('Failed to check agreement:', data.error);
        }
      } catch (error) {
        console.error('Error checking agreement document:', error);
        setIsAgreementAvailable(false);
      }
    };

    if (userData?._id) {
      checkAgreementDocumentExists();
    }
  }, [userData?._id, userAgreement, userData]);

  useEffect(() => {
    const requiredDocIds = ['id', 'ssn', 'address'];
    const uploadedRequired = requiredDocIds.filter((id) =>
      uploadedDocs.includes(id),
    ).length;
    const signatureSteps =
      (docusignComplete ? 1 : 0) + (agreementDocuSignComplete ? 1 : 0);
    onFieldFilled?.(uploadedRequired + signatureSteps);
  }, [uploadedDocs, docusignComplete, agreementDocuSignComplete]);

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

          if (!isInvestigatorSignedDoc(signedFilePath)) {
            return;
          }

          const propertyIds = JSON.parse(
            localStorage.getItem('ownPropertyIds') || '[]',
          );

          const payload = { user_id: userId, property_ids: propertyIds };
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

    // Check both userAgreement and userData for required fields
    const fallbackName = splitLegalName(userAgreement?.legal_name);
    const firstName = userData?.first_name || fallbackName.firstName;
    const lastName = userData?.last_name || fallbackName.lastName;
    const email = userAgreement?.email_id || userData?.email;

    if (!firstName || !lastName || !email) {
      setError(
        'Missing name or email. Please complete the previous steps first. Agreement document not found for this user.',
      );
      setIsDocuSignLoading(false);
      // Show error modal for better visibility
      setErrorModal({
        show: true,
        title: 'Agreement Not Available',
        message: 'Please complete the Property Selection step first to generate your agreement. This requires your legal name and email address.',
      });
      return;
    }

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

      if (!res.ok) {
        throw new Error(data.error || 'Failed to open DocuSign');
      }

      if (data.signingUrl) {
        window.location.href = data.signingUrl;
        return;
      }

      throw new Error('No signing URL received');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDocuSignLoading(false);
    }
  };


  const handleAgreementDocuSign = async () => {
    const userId = userData?._id;
    if (!userId) {
      setError('User ID missing. Please complete the previous steps first.');
      setErrorModal({
        show: true,
        title: 'User ID Missing',
        message: 'Please complete the Property Selection step first to generate your agreement.',
      });
      return;
    }

    // Check if agreement is available
    if (!isAgreementAvailable) {
      setError('Agreement document not found for this user. Please complete the previous step first.');
      setErrorModal({
        show: true,
        title: 'Agreement Not Available',
        message: 'Please complete the Property Selection step first to generate your agreement. This requires your legal name and email address.',
      });
      return;
    }

    try {
      setIsAgreementDocuSignLoading(true);
      setError(null);

      // const res = await fetch('/api/docusign/agreement', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ user_id: userId }),
      // });

      const res = await fetch('/api/docusign/agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: '6a7d64c5942c7410458aea7b',
        }),
      });



      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to open DocuSign for agreement');
      }

      if (data.signingUrl) {
        window.location.href = data.signingUrl;
        return;
      }

      throw new Error('No signing URL received');
    } catch (err) {
      console.error('Agreement DocuSign error:', err);
      setError(err.message || 'Failed to open DocuSign for agreement form');
    } finally {
      setIsAgreementDocuSignLoading(false);
    }
  };

  const handleUploadClick = (docId) => {
    // Check if agreement is available before allowing upload
    if (!isAgreementAvailable) {
      setErrorModal({
        show: true,
        title: 'Cannot Upload Documents',
        message: 'You cannot upload documents until the agreement is available.',
      });
      return;
    }

    setSelectedDocId(docId);
    if (fileInputRef.current) fileInputRef.current.click();
  };


  const handleRemoveDocument = (docId) => {
    if (docId === 'agreement') return;

    setUploadedDocs((prev) => prev.filter((id) => id !== docId));
    setUploadedFiles((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    setError(null);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedDocId) return;

    const { valid, error: validationError } = await validateDocumentFile(file);
    if (!valid) {
      setFileErrorModal({
        show: true,
        fileName: file.name,
        message: validationError,
      });
      event.target.value = '';
      return;
    }

    setError(null);

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
    // Check if agreement is available before allowing scan
    if (!isAgreementAvailable) {
      setErrorModal({
        show: true,
        title: 'Cannot Scan Documents',
        message: 'Please complete the Property Selection step first to generate your agreement. You cannot scan documents until the agreement is available.',
      });
      return;
    }

    const doc = requiredDocuments.find((d) => d.id === docId);
    if (!doc) return;
    setQrPopupDoc({
      docId: doc.id,
      docName: doc.name,
    });
  };

  const handleScanChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !scanTargetDocId) {
      event.target.value = '';
      return;
    }

    const { valid, error: validationError } = await validateDocumentFile(file);
    if (!valid) {
      setFileErrorModal({ show: true, message: validationError });
      event.target.value = '';
      return;
    }

    setError(null);
    setUploadedDocs((prev) => [
      ...prev.filter((id) => id !== scanTargetDocId),
      scanTargetDocId,
    ]);
    setUploadedFiles((prev) => ({ ...prev, [scanTargetDocId]: file }));
    event.target.value = '';
  };

  const requiredDocsUploaded = requiredDocuments
    .filter((doc) => doc.required)
    .every((doc) => isDocComplete(doc.id));

  const canProceed = docusignComplete && requiredDocsUploaded;
  const userId = userData?._id;
  const caseId = userCase?._id;

  const handleSubmitCase = async () => {
    if (!userData?._id) return console.error('User ID missing');
    try {
      setIsSubmitted(true);

      const docKeyMap = {
        id: 'proof_id',
        ssn: 'ssn_id',
        address: 'adress_proof',
        birth: 'brith_proof',
        employment: 'employee_proof',
        claim: 'claim_doc',
      };

      const filesToUpload = Object.entries(docKeyMap).filter(
        ([frontendKey]) => uploadedFiles[frontendKey],
      );

      // Upload any newly selected/replaced files (including re-uploads)
      if (filesToUpload.length > 0) {
        const formData = new FormData();
        formData.append('case_id', userCase?._id);
        filesToUpload.forEach(([frontendKey, backendKey]) => {
          formData.append(backendKey, uploadedFiles[frontendKey]);
        });

        const res = await fetch('/api/docs', {
          method: 'PUT',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to upload documents');
        }
        localStorage.setItem('userAllDocs', JSON.stringify(data));
        await axios.get(`/api/docs?user_id=${userData?._id}`);
      }

      await axios.post('/api/document-upload', {
        user_id: userData._id,
        case_id: userCase?._id,
      });

      setIsSubmitted(false);
      onNext();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to submit documents');
      setIsSubmitted(false);
    }
  };

  const isLoading =
    isDocuSignLoading || isAgreementDocuSignLoading || isSubmitted;
  let loadingText = '';
  if (isDocuSignLoading) {
    loadingText = 'Redirecting you to DocuSign...';
  } else if (isAgreementDocuSignLoading) {
    loadingText = 'Preparing your agreement for signing...';
  } else if (isSubmitted) {
    loadingText = 'Submitting your case documents...';
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2] pt-4 relative">
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-[#E1261C]/30 border-t-[#E1261C] rounded-full"
          />
          <p className="mt-4 text-lg font-semibold text-[#0A0A0A]">
            {loadingText}
          </p>
          <p className="text-[#4A4A4A]">Please wait, this may take a moment.</p>
        </motion.div>
      )}
      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E3] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-[#0A0A0A] font-['Fraunces']">
              CatchMyCash
            </h1>
            <p className="text-[#4A4A4A] mt-1">
              Document Collection & Signatures
            </p>
          </Link>
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

        {/* Document Requirements Banner */}
        {/* Document Requirements Banner */}
        <div className="bg-[#FFF8F0] border border-[#FFD9B3] rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-5 w-5 text-[#E1261C] flex-shrink-0" />
            <p className="font-semibold text-[#0A0A0A] font-['JetBrains_Mono']">
              Document Requirements
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-[#E1261C] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#4A4A4A]">
                <span className="font-medium text-[#0A0A0A]">Format:</span> PDF, TIF, PNG, or JPEG
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Upload className="h-4 w-4 text-[#E1261C] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#4A4A4A]">
                <span className="font-medium text-[#0A0A0A]">File size:</span> Greater than 1 byte, less than 10 MB
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-[#E1261C] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#4A4A4A]">
                <span className="font-medium text-[#0A0A0A]">Security:</span> Cannot be password protected
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-[#E1261C] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#4A4A4A]">
                <span className="font-medium text-[#0A0A0A]">File name:</span> Letters, numbers, dashes, underscores only; max 100 characters
              </p>
            </div>
          </div>
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
                Sign your investigator agreement and authorization forms via DocuSign
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
              {!isAgreementAvailable ? (
                <div className="bg-[#FFF4E5] border border-[#FFB347] rounded-lg p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-[#FF8C00] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#0A0A0A]">Agreement Not Available</p>
                    <p className="text-sm text-[#4A4A4A]">
                      Please complete the previous step (Property Selection) first to generate your agreement.
                      The agreement requires your legal name and email address to be filled in.
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleDocuSign}
                  className="bg-[#E1261C] hover:bg-[#B11912] text-white px-4 py-3 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed w-full"
                  disabled={isDocuSignLoading || !isAgreementAvailable}
                >
                  {isDocuSignLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Processing...
                    </>
                  ) : (
                    'Open DocuSign to Sign Documents'
                  )}
                </button>
              )}
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
              {getRequiredCompletedCount()}/
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
                className={`border rounded-lg p-4 transition-all ${isDocComplete(doc.id)
                  ? doc.id === 'agreement'
                    ? 'border-[#003f2f] bg-[#F0FFF4] ring-2 ring-[#003f2f]/30'
                    : 'border-[#003f2f]/50 bg-[#F0FFF4]'
                  : 'border-[#E8E6E3]'
                  }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center">
                    {isDocComplete(doc.id) ? (
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
                        {isDocComplete(doc.id)
                          ? doc.id === 'agreement'
                            ? ' Signed via DocuSign'
                            : ' Uploaded'
                          : ' Not uploaded'}
                      </p>
                    </div>
                  </div>

                  {isDocComplete(doc.id) && doc.id !== 'agreement' ? (
                    <div className="flex space-x-2 flex-wrap gap-2">
                      <button
                        onClick={() => handleRemoveDocument(doc.id)}
                        disabled={isSubmitted}
                        title="Remove and re-upload"
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium border border-[#E1261C]/40 rounded-lg text-[#E1261C] hover:bg-[#FCE9E7] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  ) : (
                    !isDocComplete(doc.id) && (
                      <div className="flex space-x-2 flex-wrap gap-2">
                        {doc.id === 'agreement' && (
                          !isAgreementAvailable ? (
                            <div className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#FFF4E5] border border-[#FFB347] rounded-lg text-[#FF8C00] cursor-not-allowed w-full min-w-[250px]">
                              <Info className="h-4 w-4" />
                              <span className="text-left">Agreement required - Complete previous step</span>
                            </div>
                          ) : (
                            <button
                              onClick={handleAgreementDocuSign}
                              disabled={isAgreementDocuSignLoading || !isAgreementAvailable}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-[#E1261C] text-white rounded-lg hover:bg-[#B11912] transition-all disabled:opacity-60 disabled:cursor-not-allowed min-w-[250px]"
                            >
                              {isAgreementDocuSignLoading ? (
                                <>
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{
                                      duration: 1,
                                      repeat: Infinity,
                                      ease: 'linear',
                                    }}
                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                  />
                                  Opening DocuSign...
                                </>
                              ) : (
                                'Open DocuSign to Sign Document'
                              )}
                            </button>
                          )
                        )}

                        {doc.id !== 'agreement' && (
                          !isAgreementAvailable ? (
                            <div className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#FFF4E5] border border-[#FFB347] rounded-lg text-[#FF8C00] cursor-not-allowed">
                              <Info className="h-4 w-4" />
                              <span>Complete agreement first</span>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleUploadClick(doc.id)}
                                disabled={isScanning || !isAgreementAvailable}
                                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium border border-[#E8E6E3] rounded-lg text-[#0A0A0A] hover:bg-[#FCE9E7] hover:border-[#E1261C]/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#E8E6E3]"
                              >
                                <Upload className="h-4 w-4" />
                                Upload
                              </button>
                              <button
                                onClick={() => handleScanDocument(doc.id)}
                                disabled={isScanning || !isAgreementAvailable}
                                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium border border-[#E8E6E3] rounded-lg text-[#0A0A0A] hover:bg-[#FCE9E7] hover:border-[#E1261C]/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#E8E6E3]"
                              >
                                <Camera className="h-4 w-4" />
                                Scan
                              </button>
                            </>
                          )
                        )}

                      </div>
                    )
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

        {error && (
          <p className="text-center text-sm text-[#E1261C] mb-6">{error}</p>
        )}

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
                disabled={isSubmitted}
                className="bg-[#E1261C] hover:bg-[#B11912] text-white px-12 py-4 text-xl font-semibold rounded-xl transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitted ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Submitting...
                  </>
                ) : (
                  'Submit My Case'
                )}
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
        accept=".pdf,.tif,.tiff,.png,.jpg,.jpeg"
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
      <ErrorModal
        show={errorModal.show}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => {
          setErrorModal({
            show: false,
            title: '',
            message: '',
          });

          // Clear session so login can restore a clean documents flow
          resetAll();
          [
            'userLogin',
            'userData',
            'userAgreement',
            'userCase',
            'userAllDocs',
            'propertyData',
            'ownPropertyIds',
            'signedDoc',
            'filledAgreementDoc',
          ].forEach((key) => localStorage.removeItem(key));

          router.push('/userLogin');
        }}
      />

      <FileValidationErrorModal
        show={fileErrorModal.show}
        fileName={fileErrorModal.fileName}
        message={fileErrorModal.message}
        onClose={() => setFileErrorModal({ show: false, fileName: '', message: '' })}
      />

    </div>
  );
};

const ErrorModal = ({ show, title, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-[#E8E6E3] rounded-xl shadow-lg max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#FCE9E7] rounded-full flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-[#E1261C]" />
          </div>
          <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
            {title}
          </h3>
        </div>
        <p className="text-sm text-[#4A4A4A] mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 bg-[#E1261C] hover:bg-[#B11912] text-white font-semibold rounded-lg transition-all duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const FileValidationErrorModal = ({ show, fileName, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-[#E8E6E3] rounded-xl shadow-lg max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#FCE9E7] rounded-full flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-[#E1261C]" />
          </div>
          <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
            Upload Error
          </h3>
        </div>

        {fileName && (
          <div className="flex items-center gap-2 bg-[#F7F5F2] border border-[#E8E6E3] rounded-lg px-3 py-2 mb-3">
            <FileText className="h-4 w-4 text-[#888888] flex-shrink-0" />
            <span className="text-sm text-[#0A0A0A] truncate">{fileName}</span>
          </div>
        )}

        <p className="text-sm text-[#4A4A4A] mb-6">{message}</p>

        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 bg-[#E1261C] hover:bg-[#B11912] text-white font-semibold rounded-lg transition-all duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DocumentUpload;