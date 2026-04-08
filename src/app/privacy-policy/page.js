import React from "react";
import { Card } from "../components/uicomponents/Card";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">
      {/* Header */}
      <div className="glass-card border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-green-400">CatchMyCash</h1>
          <p className="text-gray-300 mt-1">Privacy Policy</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Icon Header */}
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Privacy Policy</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect,
            use, and protect your information.
          </p>
        </div>

        <Card className="glass-card p-8 border border-green-500/20 space-y-6 text-gray-300">
          <section>
            <h3 className="text-xl font-semibold text-green-300 mb-2">1. Information We Collect</h3>
            <p>
              We collect personal information such as your name, contact details,
              Social Security Number, employment history, and address information to
              process unclaimed property recovery and identity verification.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-green-300 mb-2">2. How We Use Your Information</h3>
            <p>Your information is used for the following purposes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Preparing legal documents required for recovery claims</li>
              <li>Identity verification and fraud prevention</li>
              <li>Communicating updates about your claim</li>
              <li>Complying with state and federal guidelines</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-green-300 mb-2">3. Information Sharing</h3>
            <p>
              We do not sell or rent your data. Your information is only shared with
              authorized state agencies and licensed investigators strictly for the
              purpose of processing your claim.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-green-300 mb-2">4. Data Security</h3>
            <p>
              We use 256-bit encryption, secure servers, and industry-standard
              protocols to keep your data safe. Only authorized personnel may access
              your information.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-green-300 mb-2">5. Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Request a copy of your data</li>
              <li>Ask for corrections to inaccurate data</li>
              <li>Request deletion where legally applicable</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-green-300 mb-2">6. SMS & Communication Consent</h3>
            <p>
              If you opt in to SMS updates, you agree to receive text notifications
              regarding your claim status. You can opt out at any time.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-green-300 mb-2">7. Updates to This Policy</h3>
            <p>
              This policy may be updated periodically. Continued use of our service
              indicates acceptance of any changes.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-green-300 mb-2">Contact Us</h3>
            <p>
              For questions regarding this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2 text-green-400">support@catchmycash.com</p>
          </section>
        </Card>
      </div>
    </div>
  );
}
