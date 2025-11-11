import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare } from 'lucide-react';

export default function LawyerMessages() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user?.role !== 'lawyer') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center"><MessageSquare className="w-6 h-6 text-primary-600 mr-2"/>Client Messages</h1>
        <p className="text-gray-600">Messaging system placeholder. Integrate real-time chat here.</p>
      </div>
    </div>
  );
}
