import React, { useState, useRef } from 'react';
import { Button } from './uicomponents/Button';
import { Card } from './uicomponents/Card';
import { Badge } from './uicomponents/Badge';
import { Upload, FileText, Camera, CheckCircle, AlertCircle, Scan } from 'lucide-react';

const DocumentUpload = ({ onNext }) => {
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [docusignComplete, setDocusignComplete] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [scanTargetDocId, setScanTargetDocId] = useState(null);
  const fileInputRef = useRef(null);
  const scanInputRef = useRef(null)

  const requiredDocuments = [
    { id: 'id', name: 'Government-issued Photo ID', required: true },
    { id: 'ssn', name: 'Social Security Card or W2', required: true },
    { id: 'address', name: 'Proof of Address (utility bill, bank statement)', required: true },
    { id: 'birth', name: 'Birth Certificate', required: false },
    { id: 'employment', name: 'Employment Records (if applicable)', required: false }
  ];

  const handleDocuSign = () => {
    window.open('about:blank', '_blank');
    setTimeout(() => {
      setDocusignComplete(true);
    }, 3000);
  };

  const handleUploadClick = (docId) => {
    setSelectedDocId(docId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && selectedDocId && !uploadedDocs.includes(selectedDocId)) {
      setUploadedDocs(prev => [...prev, selectedDocId]);
    }
    event.target.value = '';
  };

//   const handleScanDocument = (docId) => {
//     setIsScanning(true);
//     setTimeout(() => {
//       setIsScanning(false);
//       if (!uploadedDocs.includes(docId)) {
//         setUploadedDocs(prev => [...prev, docId]);
//       }
//     }, 2000);
//   };

  const handleScanDocument = (docId) => {
  setScanTargetDocId(docId);
  if (scanInputRef.current) {
    scanInputRef.current.click();
  }
};

const handleScanChange = (event) => {
  const file = event.target.files[0];
  if (file && scanTargetDocId && !uploadedDocs.includes(scanTargetDocId)) {
    setUploadedDocs(prev => [...prev, scanTargetDocId]);
  }
  event.target.value = '';
};

  const requiredDocsUploaded = requiredDocuments
    .filter(doc => doc.required)
    .every(doc => uploadedDocs.includes(doc.id));

  const canProceed = docusignComplete && requiredDocsUploaded;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-blue-900">FindMyMoney</h1>
          <p className="text-gray-600 mt-1">Document Collection & Signatures</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Sign Documents & Upload ID
          </h2>
          <p className="text-gray-600 mb-6">
            Complete the legal process by signing forms and providing identity verification
          </p>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Step 1: Digital Signatures</h3>
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
                Sign your investigator agreement and authorization forms via DocuSign
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Documents to Sign:</h4>
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
              <span className='w-[90%]'>All documents have been signed successfully</span>
            </div>
          )}
        </Card>

        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Step 2: Upload Supporting Documents</h3>
            <Badge variant={requiredDocsUploaded ? "default" : "secondary"} className={requiredDocsUploaded ? "bg-green-500" : ""}>
              {uploadedDocs.length}/{requiredDocuments.filter(d => d.required).length} Required
            </Badge>
          </div>
          
          <p className="text-gray-600 mb-6">
            Upload or scan your identity documents. We automatically transfer these to your case file.
          </p>

          <div className="space-y-4">
            {requiredDocuments.map((doc) => (
              <div key={doc.id} className={`border rounded-lg p-4 ${
                uploadedDocs.includes(doc.id) ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center">
                    {uploadedDocs.includes(doc.id) ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    ) : doc.required ? (
                      <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    <div className='w-[90%]'>
                      <h4 className="font-medium">{doc.name}</h4>
                      <p className="text-sm text-gray-500">
                        {doc.required ? 'Required' : 'Optional'} • 
                        {uploadedDocs.includes(doc.id) ? ' Uploaded' : ' Not uploaded'}
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
                <span className="text-blue-800">Scanning document... Please hold your device steady</span>
              </div>
            </Card>
          )}
        </Card>

        <Card className="p-6 mb-8 bg-green-50 border-green-200">
          <h3 className="text-lg font-bold text-green-800 mb-4">
            What Happens After Upload
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">1</span>
              </div>
              <span className='text-green-800 w-[90%]'>Documents are automatically processed and validated</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <span  className='text-green-800 w-[90%]' >Information is transferred to your official claim forms</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <span  className='text-green-800 w-[90%]' >Complete case file is built and submitted to the state</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">4</span>
              </div>
              <span  className='text-green-800 w-[90%]'>You receive updates and tracking information</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Completion Status</h3>
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

        <div className="text-center">
          {canProceed ? (
            <div>
              <div className="mb-6">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-800 mb-2">
                  All Documents Collected!
                </h3>
                <p className="text-gray-600">
                  Your case is ready for submission to the State Controller's Office
                </p>
              </div>
              <Button 
                onClick={onNext}
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

      <input
        type="file"
        accept="image/*,.pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className='hidden'
      />
       <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={scanInputRef}
        onChange={handleScanChange}
        className='hidden'
        />
    </div>
  );
};

export default DocumentUpload;
