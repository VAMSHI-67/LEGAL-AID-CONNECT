import Link from 'next/link';
import { Scale, ArrowLeft } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Scale className="w-12 h-12 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Terms and Conditions
          </h1>
          <p className="mt-2 text-gray-600">
            LegalAid Connect - Terms of Service
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Terms Content */}
        <div className="card prose prose-lg max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using LegalAid Connect, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            LegalAid Connect is a platform that connects clients with qualified lawyers for legal assistance. We provide matchmaking services, communication tools, and case management features.
          </p>

          <h2>3. User Responsibilities</h2>
          <ul>
            <li>Provide accurate and truthful information</li>
            <li>Maintain the confidentiality of your account</li>
            <li>Use the service for lawful purposes only</li>
            <li>Respect the privacy and rights of other users</li>
          </ul>

          <h2>4. Lawyer Verification</h2>
          <p>
            Lawyers must provide valid bar credentials and undergo verification before being approved to provide services on our platform.
          </p>

          <h2>5. Privacy and Data Protection</h2>
          <p>
            We are committed to protecting your privacy and personal information. Please review our Privacy Policy for details on how we collect, use, and protect your data.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            LegalAid Connect acts as a facilitator and is not responsible for the quality of legal services provided by lawyers or the outcomes of legal cases.
          </p>

          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Users will be notified of significant changes.
          </p>

          <h2>8. Contact Information</h2>
          <p>
            For questions about these terms, please contact us at legal@legalaidconnect.com
          </p>

          <p className="text-sm text-gray-500 mt-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
