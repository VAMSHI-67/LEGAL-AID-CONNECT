import Link from 'next/link';
import { Scale, ArrowLeft, Shield, Lock, Eye } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Scale className="w-12 h-12 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Privacy Policy
          </h1>
          <p className="mt-2 text-gray-600">
            LegalAid Connect - Data Protection and Privacy
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

        {/* Privacy Content */}
        <div className="card prose prose-lg max-w-none">
          <h2 className="flex items-center">
            <Shield className="w-6 h-6 mr-2 text-primary-600" />
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, submit a case, or communicate with other users.
          </p>
          <ul>
            <li>Personal identification information (name, email, phone)</li>
            <li>Professional credentials (for lawyers)</li>
            <li>Case details and legal documents</li>
            <li>Communication records</li>
          </ul>

          <h2 className="flex items-center">
            <Eye className="w-6 h-6 mr-2 text-primary-600" />
            2. How We Use Your Information
          </h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services:
          </p>
          <ul>
            <li>Facilitate lawyer-client connections</li>
            <li>Provide customer support</li>
            <li>Send important updates and notifications</li>
            <li>Improve our platform and services</li>
            <li>Ensure platform security and prevent fraud</li>
          </ul>

          <h2 className="flex items-center">
            <Lock className="w-6 h-6 mr-2 text-primary-600" />
            3. Information Sharing and Disclosure
          </h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except:
          </p>
          <ul>
            <li>To facilitate lawyer-client communication</li>
            <li>When required by law or legal process</li>
            <li>To protect our rights and safety</li>
            <li>With your explicit consent</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2>5. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your data at any time.
          </p>

          <h2>6. Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent at any time</li>
          </ul>

          <h2>7. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to enhance your experience and analyze platform usage. You can control cookie settings through your browser.
          </p>

          <h2>8. Third-Party Services</h2>
          <p>
            Our platform may integrate with third-party services. These services have their own privacy policies, and we are not responsible for their practices.
          </p>

          <h2>9. Children's Privacy</h2>
          <p>
            Our services are not intended for children under 18. We do not knowingly collect personal information from children under 18.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any material changes via email or platform notification.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or our data practices, please contact us at privacy@legalaidconnect.com
          </p>

          <p className="text-sm text-gray-500 mt-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
