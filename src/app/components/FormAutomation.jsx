import React, { useState, useEffect } from 'react';
import { Button } from './uicomponents/Button';
import { Card } from './uicomponents/Card';
import { Progress } from './uicomponents/Progress';
import { Badge } from './uicomponents/Badge';
import { Globe, CheckCircle, FileText, Zap, Shield } from 'lucide-react';

const FormAutomation = ({ userData, onNext }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const automationSteps = [
    {
      title: 'Generating Investigator Agreement',
      description: 'Creating legal documentation with your information',
      duration: 2000
    },
    {
      title: 'Preparing SCO Claim Forms',
      description: 'Auto-filling State Controller Office forms',
      duration: 3000
    },
    {
      title: 'Validating Documentation',
      description: 'Ensuring all forms meet state requirements',
      duration: 2500
    },
    {
      title: 'Preparing DocuSign Package',
      description: 'Setting up electronic signature workflow',
      duration: 1500
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
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
        setCurrentStep(prev => prev + 1);
      }
    }, automationSteps[currentStep]?.duration || 2000);

    return () => clearTimeout(stepTimer);
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-blue-900">FindMyMoney</h1>
          <p className="text-gray-600 mt-1">Automated Form Processing</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Zap className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Automating Your Paperwork
          </h2>
          <p className="text-gray-600 mb-6">
            Our AI system is preparing all required forms and documentation
          </p>
          
          <div className="max-w-md mx-auto">
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-gray-500">{progress}% Complete</p>
          </div>
        </div>

        {/* Current Process */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Live Process View</h3>
            <Badge variant="default" className="bg-green-500">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              Active
            </Badge>
          </div>
          
          <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded mb-4 overflow-hidden">
            <div className="animate-pulse">
              {currentStep >= 0 && (
                <div>
                  <span className="text-yellow-400">[SYSTEM]</span> Initializing form automation...
                  <br />
                  <span className="text-blue-400">[INFO]</span> Loading user data: {userData.fullName}
                  <br />
                </div>
              )}
              {currentStep >= 1 && (
                <div>
                  <span className="text-green-400">[SUCCESS]</span> Investigator agreement generated
                  <br />
                  <span className="text-yellow-400">[PROCESS]</span> Connecting to SCO database...
                  <br />
                </div>
              )}
              {currentStep >= 2 && (
                <div>
                  <span className="text-blue-400">[AUTO-FILL]</span> Populating UCP-1 form fields
                  <br />
                  <span className="text-blue-400">[AUTO-FILL]</span> Populating UCP-2 supplemental forms
                  <br />
                </div>
              )}
              {currentStep >= 3 && (
                <div>
                  <span className="text-green-400">[VALIDATION]</span> All forms validated successfully
                  <br />
                  <span className="text-yellow-400">[DOCUSIGN]</span> Preparing signature workflow...
                  <br />
                </div>
              )}
              <span className="animate-pulse">_</span>
            </div>
          </div>

          <div className="space-y-3">
            {automationSteps.map((step, index) => (
              <div key={index} className={`flex items-center p-3 rounded ${
                index <= currentStep ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  index <= currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {index <= currentStep ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <span className="text-white font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${index <= currentStep ? 'text-green-800' : 'text-gray-600'}`}>
                    {step.title}
                  </h4>
                  <p className={`text-sm ${index <= currentStep ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.description}
                  </p>
                </div>
                {index === currentStep && !isComplete && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* What's Being Automated */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">What We're Automating For You</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-blue-600 mr-2 mt-1" />
                <div>
                  <p className="font-medium">Investigator Agreement</p>
                  <p className="text-sm text-gray-600">Legal authorization to act on your behalf</p>
                </div>
              </div>
              <div className="flex items-start">
                <Globe className="h-5 w-5 text-blue-600 mr-2 mt-1" />
                <div>
                  <p className="font-medium">SCO Claim Forms</p>
                  <p className="text-sm text-gray-600">UCP-1, UCP-2, and supplemental documentation</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-blue-600 mr-2 mt-1" />
                <div>
                  <p className="font-medium">Identity Verification</p>
                  <p className="text-sm text-gray-600">Notarization and identity proof forms</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-1" />
                <div>
                  <p className="font-medium">Compliance Check</p>
                  <p className="text-sm text-gray-600">Ensuring all state requirements are met</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Comparison */}
        <Card className="p-6 mb-8 bg-red-50 border-red-200">
          <h3 className="text-lg font-bold text-red-800 mb-4">
            Manual Process vs Our Automation
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-red-700 mb-2">Doing It Yourself:</h4>
              <ul className="text-sm text-red-600 space-y-1">
                <li>• Download and print 15+ different forms</li>
                <li>• Fill out forms by hand (prone to errors)</li>
                <li>• Get multiple notarizations</li>
                <li>• Mail or deliver in person</li>
                <li>• Wait 6-18 months for processing</li>
                <li>• 70% chance of rejection</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-700 mb-2">With FindMyMoney:</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Automated form preparation</li>
                <li>• Error-free electronic submission</li>
                <li>• Digital signatures via DocuSign</li>
                <li>• Professional case management</li>
                <li>• 30-60 day processing time</li>
                <li>• 90% success rate</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* CTA */}
        {isComplete ? (
          <div className="text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-800 mb-2">
                Forms Ready for Signature!
              </h3>
              <p className="text-gray-600">
                All documents have been prepared and are ready for your digital signature
              </p>
            </div>
            <Button 
              onClick={onNext}
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-xl rounded-lg"
            >
              Continue to DocuSign
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600">
              Please wait while we prepare your documentation...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FormAutomation