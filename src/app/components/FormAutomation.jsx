import React, { useState, useEffect } from 'react';
import { Button } from './uicomponents/Button';
import { Card } from './uicomponents/Card';
import { Progress } from './uicomponents/Progress';
import { Badge } from './uicomponents/Badge';
import { Globe, CheckCircle, FileText, Zap, Shield, Key, Sparkles } from 'lucide-react';
import { useSearchStore } from '../store/searchStore';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const FormAutomation = ({ userData, onNext }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const router = useRouter();
  const { setUserData, userCase, setUserCase } = useSearchStore();
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!userData) {
      const savedUserData = localStorage.getItem('userData');
      if (savedUserData) setUserData(JSON.parse(savedUserData));
    }
  }, [userData]);

  const automationSteps = [
    {
      title: 'Generating Investigator Agreement',
      description: 'Creating legal documentation with your information',
      duration: 2000,
    },
    {
      title: 'Preparing SCO Claim Forms',
      description: 'Auto-filling State Controller Office forms',
      duration: 3000,
    },
    {
      title: 'Validating Documentation',
      description: 'Ensuring all forms meet state requirements',
      duration: 2500,
    },
    {
      title: 'Preparing DocuSign Package',
      description: 'Setting up electronic signature workflow',
      duration: 1500,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsComplete(true);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const stepTimer = setTimeout(() => {
      if (currentStep < automationSteps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    }, automationSteps[currentStep]?.duration || 2000);

    return () => clearTimeout(stepTimer);
  }, [currentStep]);

  const handleContinue = async () => {
    try {
      setIsSubmitting(true);

      const userRecord = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = userData?.user_id || userRecord?._id;

      if (!userId) {
        console.error('No user ID found');
        return;
      }

      const propertyIds = JSON.parse(
        localStorage.getItem('ownPropertyIds') || '[]',
      );

      const response = await axios.post('/api/case', {
        user_id: userId,
        property_ids: propertyIds,
      });

      localStorage.setItem('userCase', JSON.stringify(response.data));
      setUserCase(response.data);

      setShowPopup(false);
      onNext(response.data);
    } catch (err) {
      console.error('Network Error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] pt-4"  >
      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E3] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-[#0A0A0A] font-['Fraunces']">CatchMyCash</h1>
          <p className="text-[#4A4A4A] mt-1">Automated Form Processing</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-[#E1261C]" />
          </div>
          <h2 className="text-3xl font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
            Automating Your <span className="text-[#E1261C] italic font-normal">Paperwork</span>
          </h2>
          <p className="text-[#4A4A4A] mb-6">
            Our AI system is preparing all required forms and documentation
          </p>

          <div className="max-w-md mx-auto">
            <div className="w-full h-2 bg-[#E8E6E3] rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-[#E1261C] to-[#B11912] transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-[#888888] font-['JetBrains_Mono']">{progress}% Complete</p>
          </div>
        </div>

        {/* Current Process */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces']">
              Live Process <span className="text-[#E1261C] italic font-normal">View</span>
            </h3>
            <Badge variant="default" className="bg-[#E1261C] text-white border-none">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              Active
            </Badge>
          </div>

          <div className="bg-[#1A1A1A] text-[#888888] font-mono text-sm p-4 rounded-lg mb-4 overflow-hidden">
            <div className="animate-pulse">
              {currentStep >= 0 && (
                <div>
                  <span className="text-[#E1261C]">[SYSTEM]</span> Initializing form automation...
                  <br />
                  <span className="text-[#cc7d33]">[INFO]</span> Loading user data
                  <br />
                </div>
              )}
              {currentStep >= 1 && (
                <div>
                  <span className="text-[#0e8f3f]">[SUCCESS]</span> Investigator agreement generated
                  <br />
                  <span className="text-[#E1261C]">[PROCESS]</span> Connecting to SCO database...
                  <br />
                </div>
              )}
              {currentStep >= 2 && (
                <div>
                  <span className="text-[#e1de1c]">[AUTO-FILL]</span> Populating UCP-1 form fields
                  <br />
                  <span className="text-[#d4e11c]">[AUTO-FILL]</span> Populating UCP-2 supplemental forms
                  <br />
                </div>
              )}
              {currentStep >= 3 && (
                <div>
                  <span className="text-[#0e8f3f]">[VALIDATION]</span> All forms validated successfully
                  <br />
                  <span className="text-[#E1261C]">[DOCUSIGN]</span> Preparing signature workflow...
                  <br />
                </div>
              )}
              <span className="animate-pulse">_</span>
            </div>
          </div>

          <div className="space-y-3">
            {automationSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                  index <= currentStep
                    ? 'bg-[#FCE9E7] border border-[#E1261C]/30'
                    : 'bg-[#F0EEEB]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    index <= currentStep ? 'bg-[#E1261C]' : 'bg-[#D4D4D4]'
                  }`}
                >
                  {index <= currentStep ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <span className="text-white font-bold font-['JetBrains_Mono']">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-medium ${
                      index <= currentStep ? 'text-[#0A0A0A]' : 'text-[#888888]'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p
                    className={`text-sm ${
                      index <= currentStep ? 'text-[#4A4A4A]' : 'text-[#888888]'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
                {index === currentStep && !isComplete && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#E1261C] border-t-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* What's Being Automated - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
            What We're <span className="text-[#E1261C] italic font-normal">Automating</span> For You
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <FileText className="h-4 w-4 text-[#E1261C]" />
                </div>
                <div>
                  <p className="font-medium text-[#0A0A0A]">Investigator Agreement</p>
                  <p className="text-sm text-[#4A4A4A]">
                    Legal authorization to act on your behalf
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Globe className="h-4 w-4 text-[#E1261C]" />
                </div>
                <div>
                  <p className="font-medium text-[#0A0A0A]">SCO Claim Forms</p>
                  <p className="text-sm text-[#4A4A4A]">
                    UCP-1, UCP-2, and supplemental documentation
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Shield className="h-4 w-4 text-[#E1261C]" />
                </div>
                <div>
                  <p className="font-medium text-[#0A0A0A]">Identity Verification</p>
                  <p className="text-sm text-[#4A4A4A]">
                    Notarization and identity proof forms
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-[#E1261C]" />
                </div>
                <div>
                  <p className="font-medium text-[#0A0A0A]">Compliance Check</p>
                  <p className="text-sm text-[#4A4A4A]">
                    Ensuring all state requirements are met
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Further Steps - Red Themed */}
        <div className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"></div>
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
            Further <span className="text-[#E1261C] italic font-normal">Steps</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <FileText className="h-4 w-4 text-[#E1261C]" />
                </div>
                <div>
                  <p className="font-medium text-[#0A0A0A]">Claim Information</p>
                  <p className="text-sm text-[#4A4A4A]">
                    Your claim has been successfully submitted.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <FileText className="h-4 w-4 text-[#E1261C]" />
                </div>
                <div>
                  <p className="font-medium text-[#0A0A0A]">Confirmation Email</p>
                  <p className="text-sm text-[#4A4A4A]">
                    You will receive a Confirmation Email, need to upload in next step.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Key className="h-4 w-4 text-[#E1261C]" />
                </div>
                <div>
                  <p className="font-medium text-[#0A0A0A]">Catch My Cash Login Details</p>
                  <p className="text-sm text-[#4A4A4A]">
                    You will receive an Email with your Login details.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-[#FCE9E7] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-[#E1261C]" />
                </div>
                <div>
                  <p className="font-medium text-[#0A0A0A]">Personal Document</p>
                  <p className="text-sm text-[#4A4A4A]">
                    Need to upload personal documents.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {isComplete ? (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowPopup(true)}
                disabled={isSubmitting}
                className={`px-2 py-2.5 bg-[#E1261C] text-white text-sm lg:text-lg font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg w-full sm:w-2/3 md:w-1/2 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#B11912]'
                }`}
              >
                {isSubmitting ? 'Creating Case...' : 'Continue to DocuSign and Claim Process'}
              </button>
            </div>
          ) : (
            <></>
          )}
        </div>

        {/* Comparison - Red Themed */}
        <div className="bg-[#FCE9E7] border border-[#E8E6E3] rounded-xl p-6 mb-8 shadow-md">
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
            Manual Process vs Our <span className="text-[#E1261C] italic font-normal">Automation</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-[#E1261C] mb-2">Doing It Yourself:</h4>
              <ul className="text-sm text-[#4A4A4A] space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                  Download and print 15+ different forms
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                  Fill out forms by hand (prone to errors)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                  Get multiple notarizations
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                  Mail or deliver in person
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                  Wait 6-18 months for processing
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#E1261C] rounded-full"></span>
                  70% chance of rejection
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[#003f2f] mb-2">With CatchMyCash:</h4>
              <ul className="text-sm text-[#4A4A4A] space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#003f2f] rounded-full"></span>
                  Automated form preparation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#003f2f] rounded-full"></span>
                  Error-free electronic submission
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#003f2f] rounded-full"></span>
                  Digital signatures via DocuSign
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#003f2f] rounded-full"></span>
                  Professional case management
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#003f2f] rounded-full"></span>
                  30-60 day processing time
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#003f2f] rounded-full"></span>
                  94% success rate
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        {isComplete ? (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-[#E1261C]" />
              </div>
              <h3 className="text-2xl font-bold text-[#0A0A0A] mb-2 font-['Fraunces']">
                Forms Ready for <span className="text-[#E1261C] italic font-normal">Signature!</span>
              </h3>
              <p className="text-[#4A4A4A]">
                All documents have been prepared and are ready for your digital signature
              </p>
            </div>
            <button
              onClick={() => setShowPopup(true)}
              disabled={isSubmitting}
              className={`px-3 py-2.5 bg-[#E1261C] text-white text-sm lg:text-lg font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#B11912]'
              }`}
            >
              {isSubmitting ? 'Creating Case...' : 'Continue to DocuSign'}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[#888888]">Please wait while we prepare your documentation...</p>
          </div>
        )}
      </div>

      {/* Popup Modal - Red Themed */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E8E6E3] shadow-xl p-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-7 w-7 text-[#E1261C]" />
              </div>
              <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2 font-['Fraunces']">
                Claim <span className="text-[#E1261C] italic font-normal">Information</span>
              </h2>
              <p className="text-[#4A4A4A]">
                We are processing your claim. After a few minutes you will receive a Claim
                Form which you need to upload on our website after login.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-[#FCE9E7] rounded-lg p-4 mb-6">
              <p className="text-sm text-[#0A0A0A] flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#E1261C]" />
                🔒 Your information is encrypted and securely stored.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowPopup(false)}
                className="w-1/2 px-4 py-2 bg-transparent border border-[#D4D4D4] text-[#4A4A4A] font-semibold rounded-lg hover:bg-[#F0EEEB] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                disabled={isSubmitting}
                className={`w-1/2 px-4 py-2 bg-[#E1261C] text-white font-semibold rounded-lg transition-all shadow-md ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#B11912] hover:shadow-lg'
                }`}
              >
                {isSubmitting ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormAutomation;