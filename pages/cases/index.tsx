import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, FileText, MapPin, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, XCircle, Award, RefreshCw } from 'lucide-react';
import { Case, CaseStatus } from '@/types';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-orange-100 text-orange-800', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  escalated: { label: 'Escalated', color: 'bg-red-100 text-red-800', icon: AlertCircle }
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-green-600' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  high: { label: 'High', color: 'text-orange-600' },
  urgent: { label: 'Urgent', color: 'text-red-600' }
};

export default function CasesList() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rematchingId, setRematchingId] = useState<string | null>(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    // Fetch cases for both clients (their created) and lawyers (their assigned)
    fetchCases();
  }, [isAuthenticated, user, router]);

  const fetchCases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cases', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCases(result.data || []);
      } else {
        throw new Error('Failed to fetch cases');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRematch = async (caseId: string) => {
    try {
      setRematchingId(caseId);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cases/${caseId}/rematch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Replace the case in local state
        setCases(prev => prev.map(c => c._id === caseId ? data.data : c));
        // Optional simple feedback
        if (data.assignedMatch) {
          console.log('Rematch assigned lawyer', data.assignedMatch);
        } else {
          console.log(data.message || 'Rematch completed');
        }
      } else {
        console.warn('Rematch failed or returned no data', data.message || data.error);
      }
    } catch (e: any) {
      console.error('Rematch error', e.message);
    } finally {
      setRematchingId(null);
    }
  };

  const formatDate = (dateValue: string | Date) => {
    const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusConfig = (status: CaseStatus) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner"></div>
          <p className="text-gray-600">Loading your cases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Cases</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCases}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.role === 'lawyer' ? 'Assigned Cases' : 'My Legal Cases'}
              </h1>
              <p className="mt-2 text-gray-600">
                {user?.role === 'lawyer'
                  ? 'Review and manage the cases assigned to you'
                  : 'Track the progress of your legal cases and communicate with your lawyers'}
              </p>
            </div>
            {user?.role === 'client' && (
              <button
                onClick={() => router.push('/cases/create')}
                className="btn-primary flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Case
              </button>
            )}
          </div>
        </div>

        {/* Cases List */}
        {cases.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {user?.role === 'lawyer' ? 'No assigned cases yet' : 'No cases yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {user?.role === 'lawyer'
                ? 'You have not been assigned any cases. Once a client assigns you, they will appear here.'
                : "You haven't created any legal cases yet. Start by creating your first case."}
            </p>
            {user?.role === 'client' && (
              <button
                onClick={() => router.push('/cases/create')}
                className="btn-primary"
              >
                Create Your First Case
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {cases.map((caseItem) => {
              const statusConfig = getStatusConfig(caseItem.status);
              const priorityConfig = getPriorityConfig(caseItem.priority);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={caseItem._id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Case Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {caseItem.title}
                          </h3>
                          {(caseItem as any).matchInfo?.score !== undefined && (
                            <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium flex items-center"><Award className="w-3 h-3 mr-1"/>Score {(caseItem as any).matchInfo.score}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                            <StatusIcon className="w-4 h-4 inline mr-1" />
                            {statusConfig.label}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* Case Description */}
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {caseItem.description}
                      </p>

                      {/* Case Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">{caseItem.category}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span>
                            {caseItem.location.state}, {caseItem.location.district}
                            {caseItem.location.city && `, ${caseItem.location.city}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Created {formatDate(caseItem.createdAt)}</span>
                        </div>
                        
                        {caseItem.budget && (
                          <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                            <span>
                              {caseItem.budget.min} - {caseItem.budget.max} {caseItem.budget.currency}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {caseItem.tags && caseItem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {caseItem.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => router.push(`/cases/${caseItem._id}`)}
                          className="btn-secondary text-sm"
                        >
                          {user?.role === 'lawyer' ? 'Open Case' : 'View Details'}
                        </button>
                        <button
                          onClick={() => router.push(`/cases/${caseItem._id}/messages`)}
                          className="btn-secondary text-sm"
                        >
                          Messages
                        </button>
                        {user?.role === 'client' && caseItem.status === 'pending' && (
                          <button
                            onClick={() => router.push(`/cases/${caseItem._id}/edit`)}
                            className="btn-secondary text-sm"
                          >
                            Edit Case
                          </button>
                        )}
                        {/* Lawyer accept / decline from list (optional quick actions) */}
                        {user?.role === 'lawyer' && caseItem.lawyerId && !caseItem.lawyerAccepted && caseItem.status === 'assigned' && (
                          <>
                            <button
                              onClick={async () => {
                                const token = localStorage.getItem('token');
                                const res = await fetch(`/api/cases/${caseItem._id}/accept`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                                const data = await res.json();
                                if (data.success && data.data) setCases(prev => prev.map(c => c._id === caseItem._id ? data.data : c));
                              }}
                              className="btn-primary text-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={async () => {
                                const token = localStorage.getItem('token');
                                const res = await fetch(`/api/cases/${caseItem._id}/decline`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                                const data = await res.json();
                                if (data.success && data.data) setCases(prev => prev.filter(c => c._id !== caseItem._id));
                              }}
                              className="btn-secondary text-sm"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {/* Rematch / Find Lawyers button */}
                        {user?.role === 'client' && ['pending','assigned','in_progress'].includes(caseItem.status) && (
                          <button
                            onClick={() => handleRematch(caseItem._id)}
                            disabled={rematchingId === caseItem._id}
                            className={`btn-secondary text-sm flex items-center ${rematchingId === caseItem._id ? 'opacity-70 cursor-not-allowed' : ''}`}
                            title={caseItem.lawyerId ? 'Find alternative lawyers' : 'Find suitable lawyers'}
                          >
                            <RefreshCw className={`w-4 h-4 mr-1 ${rematchingId === caseItem._id ? 'animate-spin' : ''}`} />
                            {caseItem.lawyerId ? 'Find Other Lawyers' : 'Find Lawyers'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Stats */}
        {cases.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Case Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card text-center">
                <div className="text-2xl font-bold text-primary-600">{cases.length}</div>
                <div className="text-sm text-gray-600">Total Cases</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {cases.filter(c => c.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {cases.filter(c => c.status === 'in_progress' || c.status === 'assigned').length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-green-600">
                  {cases.filter(c => c.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
