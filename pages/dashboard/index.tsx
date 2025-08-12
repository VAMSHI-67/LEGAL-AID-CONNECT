import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Scale, Users, FileText, MessageSquare, Bell, Settings, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderClientDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="card-hover">
        <div className="flex items-center">
          <FileText className="w-8 h-8 text-primary-600" />
          <h3 className="ml-3 text-lg font-semibold">My Cases</h3>
        </div>
        <p className="mt-2 text-gray-600">View and manage your legal cases</p>
        <button className="mt-4 btn-primary">View Cases</button>
      </div>

      <div className="card-hover">
        <div className="flex items-center">
          <Users className="w-8 h-8 text-primary-600" />
          <h3 className="ml-3 text-lg font-semibold">Find Lawyers</h3>
        </div>
        <p className="mt-2 text-gray-600">Search for qualified legal professionals</p>
        <button className="mt-4 btn-primary">Search Lawyers</button>
      </div>

      <div className="card-hover">
        <div className="flex items-center">
          <MessageSquare className="w-8 h-8 text-primary-600" />
          <h3 className="ml-3 text-lg font-semibold">Messages</h3>
        </div>
        <p className="mt-2 text-gray-600">Communicate with your lawyers</p>
        <button className="mt-4 btn-primary">Open Messages</button>
      </div>
    </div>
  );

  const renderLawyerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="card-hover">
        <div className="flex items-center">
          <FileText className="w-8 h-8 text-primary-600" />
          <h3 className="ml-3 text-lg font-semibold">Case Requests</h3>
        </div>
        <p className="mt-2 text-gray-600">Review and accept new case requests</p>
        <button className="mt-4 btn-primary">View Requests</button>
      </div>

      <div className="card-hover">
        <div className="flex items-center">
          <Users className="w-8 h-8 text-primary-600" />
          <h3 className="ml-3 text-lg font-semibold">Active Cases</h3>
        </div>
        <p className="mt-2 text-gray-600">Manage your ongoing cases</p>
        <button className="mt-4 btn-primary">View Cases</button>
      </div>

      <div className="card-hover">
        <div className="flex items-center">
          <MessageSquare className="w-8 h-8 text-primary-600" />
          <h3 className="ml-3 text-lg font-semibold">Client Messages</h3>
        </div>
        <p className="mt-2 text-gray-600">Respond to client inquiries</p>
        <button className="mt-4 btn-primary">Open Messages</button>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="card-hover">
        <div className="flex items-center">
          <Users className="w-8 h-8 text-primary-600" />
          <h3 className="ml-3 text-lg font-semibold">User Management</h3>
        </div>
        <p className="mt-2 text-gray-600">Manage users and verify accounts</p>
        <button className="mt-4 btn-primary">Manage Users</button>
      </div>

      <div className="card-hover">
        <div className="flex items-center">
          <FileText className="w-8 h-8 text-primary-600" />
          <h3 className="ml-3 text-lg font-semibold">Case Overview</h3>
        </div>
        <p className="mt-2 text-gray-600">Monitor all platform cases</p>
        <button className="mt-4 btn-primary">View Cases</button>
      </div>

      <div className="card-hover">
        <div className="flex items-center">
          <Bell className="w-8 h-8 text-primary-600" />
          <h3 className="ml-3 text-lg font-semibold">Reports</h3>
        </div>
        <p className="mt-2 text-gray-600">Generate platform analytics</p>
        <button className="mt-4 btn-primary">View Reports</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Scale className="w-8 h-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">LegalAid Connect</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            {user?.role === 'client' && 'Manage your legal cases and connect with lawyers'}
            {user?.role === 'lawyer' && 'Review case requests and manage your practice'}
            {user?.role === 'admin' && 'Monitor platform activity and manage users'}
          </p>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-8">
          {user?.role === 'client' && renderClientDashboard()}
          {user?.role === 'lawyer' && renderLawyerDashboard()}
          {user?.role === 'admin' && renderAdminDashboard()}
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary-600">5</div>
              <div className="text-sm text-gray-600">Active Cases</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-success-600">12</div>
              <div className="text-sm text-gray-600">Completed Cases</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-warning-600">3</div>
              <div className="text-sm text-gray-600">Pending Messages</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-secondary-600">4.8</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 