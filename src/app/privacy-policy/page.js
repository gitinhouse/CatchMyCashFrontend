import React from "react";
import { Card } from "../components/uicomponents/Card";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F7F5F2]">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Icon Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-[#E1261C]" />
          </div>
          <h2 className="text-3xl font-bold text-[#0A0A0A] mb-4 font-['Fraunces']">
            Privacy <span className="text-[#E1261C] italic font-normal">Policy</span>
          </h2>
          <p className="text-[#4A4A4A] mb-6 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect,
            use, and protect your information.
          </p>
        </div>

        <div className="bg-white border border-[#E8E6E3] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="h-1 bg-linear-to-r from-[#E1261C] to-[#B11912]"></div>
          <div className="p-6 md:p-8 space-y-6 text-[#4A4A4A]">
            <section>
              <h3 className="text-xl font-semibold text-[#0A0A0A] mb-2 font-['Fraunces']">
                1. Information <span className="text-[#E1261C] italic font-normal">We Collect</span>
              </h3>
              <p>
                We collect personal information such as your name, contact details,
                Social Security Number, employment history, and address information to
                process unclaimed property recovery and identity verification.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-[#0A0A0A] mb-2 font-['Fraunces']">
                2. How We Use <span className="text-[#E1261C] italic font-normal">Your Information</span>
              </h3>
              <p>Your information is used for the following purposes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Preparing legal documents required for recovery claims</li>
                <li>Identity verification and fraud prevention</li>
                <li>Communicating updates about your claim</li>
                <li>Complying with state and federal guidelines</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-[#0A0A0A] mb-2 font-['Fraunces']">
                3. Information <span className="text-[#E1261C] italic font-normal">Sharing</span>
              </h3>
              <p>
                We do not sell or rent your data. Your information is only shared with
                authorized state agencies and licensed investigators strictly for the
                purpose of processing your claim.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-[#0A0A0A] mb-2 font-['Fraunces']">
                4. Data <span className="text-[#E1261C] italic font-normal">Security</span>
              </h3>
              <p>
                We use 256-bit encryption, secure servers, and industry-standard
                protocols to keep your data safe. Only authorized personnel may access
                your information.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-[#0A0A0A] mb-2 font-['Fraunces']">
                5. Your <span className="text-[#E1261C] italic font-normal">Rights</span>
              </h3>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Request a copy of your data</li>
                <li>Ask for corrections to inaccurate data</li>
                <li>Request deletion where legally applicable</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-[#0A0A0A] mb-2 font-['Fraunces']">
                6. SMS & Communication <span className="text-[#E1261C] italic font-normal">Consent</span>
              </h3>
              <p>
                If you opt in to SMS updates, you agree to receive text notifications
                regarding your claim status. You can opt out at any time.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-[#0A0A0A] mb-2 font-['Fraunces']">
                7. Updates to <span className="text-[#E1261C] italic font-normal">This Policy</span>
              </h3>
              <p>
                This policy may be updated periodically. Continued use of our service
                indicates acceptance of any changes.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-[#0A0A0A] mb-2 font-['Fraunces']">
                <span className="text-[#E1261C] italic font-normal">Contact</span> Us
              </h3>
              <p>
                For questions regarding this Privacy Policy, please contact us at:
              </p>
              <p className="mt-2 text-[#E1261C]">support@catchmycash.com</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}