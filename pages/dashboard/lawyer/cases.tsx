import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Folder, AlertCircle } from 'lucide-react';

export default function LawyerActiveCases() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user?.role !== 'lawyer') {
      router.push('/dashboard');
      return;
    }
    fetchCases();
  }, [isAuthenticated, user]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cases?status=assigned', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCases(data.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-600">Loading cases...</div>;
  if (error) return <div className="p-8 text-red-600 flex items-center"><AlertCircle className="w-5 h-5 mr-2" />{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center"><Folder className="w-6 h-6 text-primary-600 mr-2"/>Active Cases</h1>
        {cases.length === 0 ? (
          <p className="text-gray-600">No active cases yet.</p>
        ) : (
          <div className="space-y-4">
            {cases.map(c => (
              <div key={c._id} className="bg-white rounded-lg shadow p-5 border">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{c.title}</h2>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{c.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Category: {c.category} | Status: {c.status}</p>
                  </div>
                  <button className="btn-primary text-sm" onClick={() => router.push(`/cases/${c._id}`)}>Open</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
