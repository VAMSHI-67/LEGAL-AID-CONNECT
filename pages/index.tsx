import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Scale, 
  Users, 
  MessageSquare, 
  Shield, 
  ArrowRight, 
  CheckCircle,
  Star,
  MapPin,
  Clock,
  FileText
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'client' | 'lawyer'>('client');

  const features = [
    {
      icon: <Scale className="w-8 h-8 text-primary-600" />,
      title: 'Intelligent Matchmaking',
      description: 'Advanced algorithm matches you with the perfect lawyer based on expertise, location, and availability.'
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-primary-600" />,
      title: 'Secure Communication',
      description: 'Built-in chat system for seamless communication between clients and lawyers.'
    },
    {
      icon: <Shield className="w-8 h-8 text-primary-600" />,
      title: 'Verified Professionals',
      description: 'All lawyers are verified and rated by the community for your peace of mind.'
    },
    {
      icon: <FileText className="w-8 h-8 text-primary-600" />,
      title: 'Document Management',
      description: 'Upload, store, and manage all your legal documents securely in one place.'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Verified Lawyers' },
    { number: '5000+', label: 'Cases Resolved' },
    { number: '50+', label: 'Legal Domains' },
    { number: '4.8', label: 'Average Rating' }
  ];

  const legalDomains = [
    'Civil Law', 'Criminal Law', 'Corporate Law', 'Family Law',
    'Property Law', 'Tax Law', 'Intellectual Property', 'Labor Law'
  ];

  return (
    <>
      <Head>
        <title>LegalAid Connect - Bridging Legal Access Through Technology</title>
        <meta name="description" content="Connect with verified lawyers and get legal assistance through our intelligent matchmaking platform." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Scale className="w-8 h-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">LegalAid Connect</span>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="#features" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Features
                </Link>
                <Link href="#how-it-works" className="text-gray-600 hover:text-primary-600 transition-colors">
                  How it Works
                </Link>
                <Link href="#domains" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Legal Domains
                </Link>
                <Link href="/auth/login" className="btn-secondary">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Bridging Legal Access Through{' '}
              <span className="gradient-text">Technology</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with verified lawyers instantly. Our intelligent matchmaking platform 
              ensures you find the right legal professional for your specific needs.
            </p>
            
            {/* Role Selection */}
            <div className="bg-white rounded-2xl shadow-soft p-8 max-w-2xl mx-auto mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">I am a:</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('client')}
                  className={`flex-1 py-3 px-6 rounded-lg border-2 transition-all ${
                    activeTab === 'client'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-5 h-5 mx-auto mb-2" />
                  <span className="font-medium">Client</span>
                </button>
                <button
                  onClick={() => setActiveTab('lawyer')}
                  className={`flex-1 py-3 px-6 rounded-lg border-2 transition-all ${
                    activeTab === 'lawyer'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Scale className="w-5 h-5 mx-auto mb-2" />
                  <span className="font-medium">Lawyer</span>
                </button>
              </div>
              
              <div className="mt-6">
                <Link 
                  href={`/auth/register?role=${activeTab}`}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  Get Started as {activeTab === 'client' ? 'Client' : 'Lawyer'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose LegalAid Connect?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our platform combines cutting-edge technology with legal expertise 
                to provide you with the best possible legal assistance experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="card-hover text-center">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Getting legal help has never been easier. Follow these simple steps 
                to connect with the right lawyer for your case.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Post Your Case</h3>
                <p className="text-gray-600">
                  Describe your legal issue and provide relevant details. 
                  Our system will analyze your requirements.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Matched</h3>
                <p className="text-gray-600">
                  Our intelligent algorithm matches you with qualified lawyers 
                  based on expertise, location, and availability.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Connect & Resolve</h3>
                <p className="text-gray-600">
                  Communicate directly with your lawyer, share documents, 
                  and track your case progress in real-time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Legal Domains Section */}
        <section id="domains" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Comprehensive Legal Coverage
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our platform covers a wide range of legal domains, ensuring 
                you find expertise in any area of law you need.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {legalDomains.map((domain, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 text-center hover:bg-primary-50 transition-colors">
                  <span className="text-gray-700 font-medium">{domain}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of clients and lawyers who trust LegalAid Connect 
              for their legal needs. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register?role=client" className="btn-secondary bg-white text-primary-600 hover:bg-gray-50">
                I Need Legal Help
              </Link>
              <Link href="/auth/register?role=lawyer" className="btn-secondary bg-white text-primary-600 hover:bg-gray-50">
                I'm a Lawyer
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center mb-4">
                  <Scale className="w-8 h-8 text-primary-400" />
                  <span className="ml-2 text-xl font-bold">LegalAid Connect</span>
                </div>
                <p className="text-gray-400">
                  Bridging legal access through technology, making justice accessible to all.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Platform</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
                  <li><Link href="#domains" className="hover:text-white transition-colors">Legal Domains</Link></li>
                  <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Connect</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                  <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/partners" className="hover:text-white transition-colors">Partners</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 LegalAid Connect. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 