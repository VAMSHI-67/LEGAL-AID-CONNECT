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
      icon: <Scale className="w-10 h-10 text-secondary-600" />,
      title: 'Intelligent Matchmaking',
      description: 'Advanced algorithm matches you with the perfect lawyer based on expertise, location, and availability.'
    },
    {
      icon: <MessageSquare className="w-10 h-10 text-secondary-600" />,
      title: 'Secure Communication',
      description: 'Built-in chat system for seamless communication between clients and lawyers.'
    },
    {
      icon: <Shield className="w-10 h-10 text-secondary-600" />,
      title: 'Verified Professionals',
      description: 'All lawyers are verified and rated by the community for your peace of mind.'
    },
    {
      icon: <FileText className="w-10 h-10 text-secondary-600" />,
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
        <title>LegalAid Connect - Empowering Justice, Connecting India</title>
        <meta name="description" content="Connect with verified lawyers across India. Get legal assistance through our intelligent matchmaking platform." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-ivory-100">
        {/* Navigation */}
        <nav className="bg-white shadow-maroon border-b-4 border-primary-900 relative">
          <div className="tricolor-line absolute top-0 left-0 right-0"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-3">
                <Scale className="w-10 h-10 text-primary-900" />
                <div>
                  <span className="text-2xl font-serif font-bold text-primary-900">LegalAid Connect</span>
                  <p className="text-xs text-secondary-600 font-heading">Empowering Justice, Connecting India 🇮🇳</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="#features" className="text-charcoal-700 hover:text-secondary-600 transition-colors font-heading font-semibold">
                  Features
                </Link>
                <Link href="#how-it-works" className="text-charcoal-700 hover:text-secondary-600 transition-colors font-heading font-semibold">
                  How it Works
                </Link>
                <Link href="#domains" className="text-charcoal-700 hover:text-secondary-600 transition-colors font-heading font-semibold">
                  Legal Domains
                </Link>
                <Link href="/auth/login" className="btn-secondary text-sm">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-maroon-saffron scales-watermark overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 to-secondary-600/90"></div>
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
                Connect with Verified Lawyers
                <br />
                <span className="text-accent-300">Across India</span>
              </h1>
              <p className="text-xl md:text-2xl text-ivory-100 mb-10 max-w-3xl mx-auto font-sans leading-relaxed">
                Legal support at your fingertips — anytime, anywhere.
                <br />
                <span className="text-accent-200 font-semibold">Justice Made Accessible for Every Indian</span>
              </p>
            </div>
            
            {/* Role Selection */}
            <div className="card-law p-10 max-w-2xl mx-auto mb-12 animate-scale-in">
              <h3 className="text-xl font-serif font-bold text-charcoal-900 mb-6 text-center">Choose Your Path</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('client')}
                  className={`flex-1 py-4 px-6 rounded-xl border-3 transition-all duration-300 transform hover:scale-105 ${
                    activeTab === 'client'
                      ? 'border-accent-500 bg-gradient-to-br from-accent-50 to-secondary-50 text-primary-900 shadow-gold'
                      : 'border-charcoal-300 text-charcoal-700 hover:border-secondary-400 bg-white'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-heading font-bold">Client</span>
                </button>
                <button
                  onClick={() => setActiveTab('lawyer')}
                  className={`flex-1 py-4 px-6 rounded-xl border-3 transition-all duration-300 transform hover:scale-105 ${
                    activeTab === 'lawyer'
                      ? 'border-accent-500 bg-gradient-to-br from-accent-50 to-secondary-50 text-primary-900 shadow-gold'
                      : 'border-charcoal-300 text-charcoal-700 hover:border-secondary-400 bg-white'
                  }`}
                >
                  <Scale className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-heading font-bold">Lawyer</span>
                </button>
              </div>
              
              <div className="mt-8">
                <Link 
                  href={`/auth/register?role=${activeTab}`}
                  className="btn-gold w-full flex items-center justify-center text-lg"
                >
                  Get Started as {activeTab === 'client' ? 'Client' : 'Lawyer'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-accent-300/30 hover:bg-white/20 transition-all duration-300">
                  <div className="text-4xl md:text-5xl font-serif font-bold text-accent-300 mb-2">{stat.number}</div>
                  <div className="text-ivory-100 font-heading font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-ivory-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary-900 mb-6">
                Why Choose <span className="gradient-text-gold">LegalAid Connect?</span>
              </h2>
              <p className="text-xl text-charcoal-700 max-w-3xl mx-auto leading-relaxed">
                Our platform combines cutting-edge technology with legal expertise 
                to provide you with the best possible legal assistance experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="card-law text-center group hover:shadow-gold transition-all duration-300">
                  <div className="flex justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-xl font-serif font-bold text-primary-900 mb-4">{feature.title}</h3>
                  <p className="text-charcoal-700 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 bg-white relative">
          <div className="absolute inset-0 scales-watermark opacity-30"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary-900 mb-6">
                How It <span className="gradient-text">Works</span>
              </h2>
              <p className="text-xl text-charcoal-700 max-w-3xl mx-auto leading-relaxed">
                Getting legal help has never been easier. Follow these simple steps 
                to connect with the right lawyer for your case.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-accent-400 to-secondary-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-gold transform group-hover:scale-110 transition-all duration-300">
                  <span className="text-3xl font-serif font-bold text-white">1</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-primary-900 mb-4">Post Your Case</h3>
                <p className="text-charcoal-700 leading-relaxed">
                  Describe your legal issue and provide relevant details. 
                  Our system will analyze your requirements.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-br from-accent-400 to-secondary-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-gold transform group-hover:scale-110 transition-all duration-300">
                  <span className="text-3xl font-serif font-bold text-white">2</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-primary-900 mb-4">Get Matched</h3>
                <p className="text-charcoal-700 leading-relaxed">
                  Our intelligent algorithm matches you with qualified lawyers 
                  based on expertise, location, and availability.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-br from-accent-400 to-secondary-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-gold transform group-hover:scale-110 transition-all duration-300">
                  <span className="text-3xl font-serif font-bold text-white">3</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-primary-900 mb-4">Connect & Resolve</h3>
                <p className="text-charcoal-700 leading-relaxed">
                  Communicate directly with your lawyer, share documents, 
                  and track your case progress in real-time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Legal Domains Section */}
        <section id="domains" className="py-24 bg-ivory-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary-900 mb-6">
                Comprehensive <span className="gradient-text-gold">Legal Coverage</span>
              </h2>
              <p className="text-xl text-charcoal-700 max-w-3xl mx-auto leading-relaxed">
                Our platform covers a wide range of legal domains, ensuring 
                you find expertise in any area of law you need.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {legalDomains.map((domain, index) => (
                <div key={index} className="bg-white border-2 border-primary-200 rounded-xl p-6 text-center hover:border-accent-400 hover:shadow-gold transition-all duration-300 transform hover:scale-105 group">
                  <Scale className="w-6 h-6 mx-auto mb-3 text-secondary-600 group-hover:text-accent-600 transition-colors" />
                  <span className="text-charcoal-900 font-heading font-bold">{domain}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-maroon-saffron relative overflow-hidden">
          <div className="absolute inset-0 scales-watermark"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-secondary-600/80"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
              Ready to Get <span className="text-accent-300">Started?</span>
            </h2>
            <p className="text-xl text-ivory-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of clients and lawyers who trust LegalAid Connect 
              for their legal needs. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth/register?role=client" className="btn-gold text-lg px-8 py-4">
                I Need Legal Help
              </Link>
              <Link href="/auth/register?role=lawyer" className="btn-secondary bg-white text-primary-900 hover:bg-ivory-50 text-lg px-8 py-4">
                I'm a Lawyer
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary-900 text-white py-16 relative">
          <div className="tricolor-line absolute top-0 left-0 right-0"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-10">
              <div>
                <div className="flex items-center mb-6">
                  <Scale className="w-10 h-10 text-accent-400" />
                  <span className="ml-3 text-2xl font-serif font-bold">LegalAid Connect</span>
                </div>
                <p className="text-ivory-200 leading-relaxed mb-4">
                  Empowering Justice, Connecting India.
                </p>
                <p className="text-ivory-300 text-sm">
                  Making legal access accessible to every Indian through technology.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-heading font-bold mb-6 text-accent-300">Platform</h3>
                <ul className="space-y-3 text-ivory-200">
                  <li><Link href="#features" className="hover:text-accent-300 transition-colors flex items-center"><ArrowRight className="w-4 h-4 mr-2" />Features</Link></li>
                  <li><Link href="#how-it-works" className="hover:text-accent-300 transition-colors flex items-center"><ArrowRight className="w-4 h-4 mr-2" />How it Works</Link></li>
                  <li><Link href="#domains" className="hover:text-accent-300 transition-colors flex items-center"><ArrowRight className="w-4 h-4 mr-2" />Legal Domains</Link></li>
                  <li><Link href="/about" className="hover:text-accent-300 transition-colors flex items-center"><ArrowRight className="w-4 h-4 mr-2" />About Us</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-heading font-bold mb-6 text-accent-300">Support</h3>
                <ul className="space-y-3 text-ivory-200">
                  <li><Link href="/help" className="hover:text-accent-300 transition-colors flex items-center"><ArrowRight className="w-4 h-4 mr-2" />Help Center</Link></li>
                  <li><Link href="/contact" className="hover:text-accent-300 transition-colors flex items-center"><ArrowRight className="w-4 h-4 mr-2" />Contact Us</Link></li>
                  <li><Link href="/privacy" className="hover:text-accent-300 transition-colors flex items-center"><ArrowRight className="w-4 h-4 mr-2" />Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-accent-300 transition-colors flex items-center"><ArrowRight className="w-4 h-4 mr-2" />Terms of Service</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-heading font-bold mb-6 text-accent-300">Connect</h3>
                <ul className="space-y-3 text-ivory-200">
                  <li><Link href="/blog" className="hover:text-accent-300 transition-colors flex items-center"><ArrowRight className="w-4 h-4 mr-2" />Blog</Link></li>
                  <li><Link href="/careers" className="hover:text-accent-300 transition-colors flex items-center"><ArrowRight className="w-4 h-4 mr-2" />Careers</Link></li>
                  <li><Link href="/partners" className="hover:text-accent-300 transition-colors flex items-center"><ArrowRight className="w-4 h-4 mr-2" />Partners</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t-2 border-accent-500/30 mt-12 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center text-ivory-200">
                <p className="font-heading mb-4 md:mb-0">
                  Made for Legal India 🇮🇳 | &copy; 2025 LegalAid Connect. All rights reserved.
                </p>
                <div className="flex space-x-4">
                  <span className="text-sm text-ivory-300">Language:</span>
                  <button className="text-sm hover:text-accent-300 transition-colors font-semibold">English</button>
                  <span className="text-ivory-400">|</span>
                  <button className="text-sm hover:text-accent-300 transition-colors">हिंदी</button>
                  <span className="text-ivory-400">|</span>
                  <button className="text-sm hover:text-accent-300 transition-colors">తెలుగు</button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}