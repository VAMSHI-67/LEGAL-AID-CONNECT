import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Scale, User, Briefcase, ArrowRight } from 'lucide-react';

export default function RegisterRoleSelection() {
  const router = useRouter();

  const handleRoleSelection = (role: 'client' | 'lawyer') => {
    router.push(`/auth/register/${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Scale className="w-16 h-16 text-primary-600" />
          </div>
          <h2 className="mt-6 text-4xl font-bold text-gray-900">
            Join LegalAid Connect
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Choose your role to get started with legal assistance
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {/* Client Card */}
          <div 
            className="card cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary-200"
            onClick={() => handleRoleSelection('client')}
          >
            <div className="text-center p-8">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-600" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                I'm a Client
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                I need legal assistance and want to connect with qualified lawyers for my case.
              </p>
              <div className="flex items-center justify-center text-primary-600 font-medium">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          </div>

          {/* Lawyer Card */}
          <div 
            className="card cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary-200"
            onClick={() => handleRoleSelection('lawyer')}
          >
            <div className="text-center p-8">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-10 h-10 text-primary-600" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                I'm a Lawyer
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                I'm a qualified legal professional and want to help clients with their cases.
              </p>
              <div className="flex items-center justify-center text-primary-600 font-medium">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
