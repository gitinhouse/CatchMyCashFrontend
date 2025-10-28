import React, { useState } from "react";
import { Button } from "./uicomponents/Button";
import { Card } from "./uicomponents/Card";
import { Textarea } from "./uicomponents/Textarea";
import { Shield, FileText, Clock } from "lucide-react";
import { InputField } from "./uicomponents/InputField";
import { useSearchStore } from "../store/searchStore";
import axios from "axios";

const UserInformation = ({ onNext }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "CA",
    zipCode: "",
    dateOfBirth: "",
    ssn: "",
    currentEmployer: "",
    formerEmployers: "",
    previousAddresses: "",
  });
  const { userData, setUserAgreement } = useSearchStore();
  const [errors, setErrors] = useState({
    phone: "",
    ssn: "",
  });
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "address",
      "city",
      "zipCode",
      "dateOfBirth",
      "ssn",
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      console.log(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    let newErrors = {};

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }

    const ssnDigits = formData.ssn.replace(/\D/g, "");
    if (ssnDigits.length !== 9) {
      newErrors.ssn = "SSN must be exactly 9 digits.";
    }

    // Stop submission if any validation fails
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      const payload = {
        user_id: userData._id,
        legal_name: formData.fullName,
        date_of_birth: formData.dateOfBirth,
        email_id: formData.email,
        contact_no: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        ssn_id: formData.ssn,
        company_name: formData.currentEmployer,
        formal_employer: formData.formerEmployers,
        previous_address: formData.previousAddresses,
      };
      const { data } = await axios.post("/api/legalDetails", payload);
      setUserAgreement(data);
      localStorage.setItem("userAgreement", JSON.stringify(data));
      onNext(data);
    } catch (err) {
      console.error("Error saving user properties:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      {/* Header */}
      <div className="glass-card border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-green-400">CatchMyCash</h1>
          <p className="text-gray-300 mt-1">
            Investigator Agreement Information
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Header */}
        <div className="text-center mb-8">
          <FileText className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Investigator Agreement
          </h2>
          <p className="text-gray-300 mb-6">
            We need some information to prepare your legal documents and begin
            the recovery process
          </p>
        </div>

        {/* Security Notice */}
        <Card className="glass-card-green p-6 border border-green-500/30 mb-8">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-green-400 mr-3" />
            <h3 className="font-bold text-green-300">
              Your Information is Secure
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-green-400">
            <div>• 256-bit encryption</div>
            <div>• GDPR compliant</div>
            <div>• Licensed investigators</div>
          </div>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="glass-card p-8 border border-green-500/20">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-bold text-white mb-4">
                  Personal Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Legal Name *
                </label>
                <InputField
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  placeholder="As it appears on government documents"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <InputField
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    handleInputChange("dateOfBirth", e.target.value)
                  }
                  required
                  className={`block`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <InputField
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <InputField
                  type="number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  maxLength={10}
                  required
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Social Security Number *
                </label>
                <InputField
                  type="number"
                  value={formData.ssn}
                  onChange={(e) => handleInputChange("ssn", e.target.value)}
                  placeholder="XXX-XX-XXXX"
                  maxLength={9}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for identity verification
                </p>
                {errors.ssn && (
                  <p className="text-red-500 text-xs mt-1">{errors.ssn}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Employer
                </label>
                <InputField
                  type="text"
                  value={formData.currentEmployer}
                  onChange={(e) =>
                    handleInputChange("currentEmployer", e.target.value)
                  }
                  placeholder="Company name"
                />
              </div>

              {/* Address Information */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Current Address
                </h3>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <InputField
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Main St, Apt 1A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <InputField
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Los Angeles"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <InputField
                  type="number"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  placeholder="90210"
                  required
                />
              </div>

              {/* Additional Information */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Additional Information
                </h3>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Former Employers (if applicable)
                </label>
                <Textarea
                  value={formData.formerEmployers}
                  onChange={(e) =>
                    handleInputChange("formerEmployers", e.target.value)
                  }
                  placeholder="List any companies you've worked for that might have unclaimed property..."
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Previous Addresses (if applicable)
                </label>
                <Textarea
                  value={formData.previousAddresses}
                  onChange={(e) =>
                    handleInputChange("previousAddresses", e.target.value)
                  }
                  placeholder="List any previous addresses where you might have lived..."
                  rows={3}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">Agreement Terms</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• FindMyMoney will act as your authorized investigator</li>
                <li>• Our fee is 10% of any successfully recovered property</li>
                <li>• No upfront costs or fees</li>
                <li>• You only pay if we successfully recover your money</li>
                <li>• All information provided is confidential and secure</li>
              </ul>
            </div>

            <div className="flex items-center flex-wrap gap-1.5 justify-between mt-8">
              <div className="flex items-center  text-blue-600">
                <Clock className="h-5 w-5 mr-2" />
                <span className="text-sm">
                  Next: Automatic form preparation
                </span>
              </div>
              <Button
                type="submit"
                className="glass-button text-white px-8 py-3 hover:text-green-200"
              >
                Continue to Form Automation
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default UserInformation;
