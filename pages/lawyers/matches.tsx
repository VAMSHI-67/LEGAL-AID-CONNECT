import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Users } from 'lucide-react';

export default function LawyerMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Get last created caseId from query or localStorage
  const caseId = router.query.caseId || (typeof window !== 'undefined' ? localStorage.getItem('lastCaseId') : null);

  useEffect(() => {
    async function fetchMatches() {
      if (!caseId) return setLoading(false);
      setLoading(true);
      try {
        const res = await fetch(`/api/lawyers/matches?caseId=${caseId}`);
        const data = await res.json();
        setMatches(data.data || []);
      } catch (err) {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [caseId]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center">
          <Users className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Matched Lawyers</h1>
        </div>
        {loading ? (
          <p className="text-gray-600">Finding best matches...</p>
        ) : matches.length === 0 ? (
          <p className="text-gray-600">No matched lawyers found for your case.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((lawyer: any) => (
              <div key={lawyer._id} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{lawyer.firstName} {lawyer.lastName}</h2>
                <p className="text-gray-700 mb-1">Specialization: {Array.isArray(lawyer.specialization) ? lawyer.specialization.join(', ') : lawyer.specialization}</p>
                <p className="text-gray-700 mb-1">Location: {lawyer.city}, {lawyer.state}</p>
                <p className="text-gray-700 mb-1">Experience: {lawyer.yearsOfExperience} years</p>
                <p className="text-gray-700 mb-1">Rating: {lawyer.rating}/5</p>
                <button className="btn-primary mt-3" onClick={() => router.push(`/lawyers/${lawyer._id}`)}>View Profile</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
