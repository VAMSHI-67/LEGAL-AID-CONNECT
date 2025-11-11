import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, User, AlertCircle, MapPin, Award, ShieldCheck, RefreshCcw, Users } from 'lucide-react';

export default function CaseDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMatches, setShowMatches] = useState(false);
  const [matches, setMatches] = useState<any[] | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // 'accept' | 'decline' | 'unassign'

  useEffect(() => {
    if (!id) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  async function fetchCase() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cases/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load case');
      setData(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-gray-600">Loading case...</div>;
  if (error) return <div className="p-8 text-red-600 flex items-center"><AlertCircle className="w-5 h-5 mr-2" />{error}</div>;
  if (!data) return null;

  const lawyer = data.lawyerId;
  const matchInfo = data.matchInfo;

  async function handleRematch() {
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cases/${id}/rematch`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Rematch failed');
      await fetchCase();
    } catch (e:any) {
      alert(e.message);
    }
  }

  function loadMatchesDebounced() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void loadMatches(); }, 400);
  }

  async function loadMatches() {
    if (!id) return;
    try {
      setLoadingMatches(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/lawyers/matches?caseId=${id}&limit=10`, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load matches');
      setMatches(json.data);
    } catch (e:any) {
      setMatches([]);
    } finally { setLoadingMatches(false); }
  }

  async function assignLawyer(lawyerId: string) {
    if (!id) return;
    try {
      setAssigning(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cases/${id}/assign`, { method: 'POST', headers: { 'Content-Type':'application/json','Authorization':`Bearer ${token}` }, body: JSON.stringify({ lawyerId }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Assignment failed');
      await fetchCase();
    } catch (e:any) {
      alert(e.message);
    } finally { setAssigning(false); }
  }

  async function acceptCase() {
    if (!id) return;
    try {
      setActionLoading('accept');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cases/${id}/accept`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Accept failed');
      await fetchCase();
    } catch (e:any) { alert(e.message); } finally { setActionLoading(null); }
  }

  async function declineCase() {
    if (!id) return;
    if (!confirm('Are you sure you want to decline this case?')) return;
    try {
      setActionLoading('decline');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cases/${id}/decline`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Decline failed');
      await fetchCase();
    } catch (e:any) { alert(e.message); } finally { setActionLoading(null); }
  }

  async function unassignLawyer() {
    if (!id) return;
    if (!confirm('Unassign the current lawyer?')) return;
    try {
      setActionLoading('unassign');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cases/${id}/unassign`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Unassign failed');
      await fetchCase();
    } catch (e:any) { alert(e.message); } finally { setActionLoading(null); }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="bg-white rounded-lg shadow p-6 border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold flex items-center"><FileText className="w-6 h-6 text-primary-600 mr-2" />{data.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              {matchInfo && (
                <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium flex items-center"><Award className="w-4 h-4 mr-1" />Score: {matchInfo.score}</span>
              )}
              {user?.role === 'client' && data.status === 'assigned' && (
                <button onClick={handleRematch} className="btn-secondary flex items-center text-sm"><RefreshCcw className="w-4 h-4 mr-1"/>Re-match</button>
              )}
              {user?.role === 'client' && (
                <button
                  onClick={() => { setShowMatches(!showMatches); if (!matches && !showMatches) loadMatchesDebounced(); }}
                  className="btn-secondary flex items-center text-sm"
                >
                  <Users className="w-4 h-4 mr-1"/>Matches
                </button>
              )}
              {user?.role === 'client' && lawyer && (
                <button
                  disabled={actionLoading === 'unassign'}
                  onClick={unassignLawyer}
                  className="btn-secondary flex items-center text-sm"
                >{actionLoading === 'unassign' ? 'Unassigning...' : 'Unassign'}</button>
              )}
            </div>
          </div>
          <p className="text-gray-700 mt-4 whitespace-pre-line">{data.description}</p>
          <div className="mt-4 text-sm text-gray-600 flex flex-wrap gap-4">
            <span>Category: <strong>{data.category}</strong></span>
            <span>Status: <strong>{data.status}</strong></span>
            {lawyer && data.status === 'assigned' && (
              <span>Acceptance: <strong className={!data.lawyerAccepted ? 'text-amber-600' : 'text-green-600'}>{data.lawyerAccepted ? 'Accepted' : 'Pending'}</strong></span>
            )}
            {data.priority && <span>Priority: <strong>{data.priority}</strong></span>}
            {data.location && <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400" />{data.location.state}, {data.location.district}</span>}
          </div>
        </div>

        {lawyer ? (
          <div className="bg-white rounded-lg shadow p-6 border">
            <h2 className="text-xl font-semibold flex items-center"><User className="w-5 h-5 text-primary-600 mr-2" />Assigned Lawyer</h2>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-800 font-medium">{lawyer.name}</p>
                {lawyer.barNumber && <p className="text-sm text-gray-600">Bar #: {lawyer.barNumber} ({lawyer.barState})</p>}
                {lawyer.specialization?.length > 0 && <p className="text-sm text-gray-600 mt-1">Specializations: {lawyer.specialization.join(', ')}</p>}
                <p className="text-sm text-gray-600 mt-1">Experience: {lawyer.experience || 0} yrs</p>
                {lawyer.languages?.length > 0 && <p className="text-sm text-gray-600 mt-1">Languages: {lawyer.languages.join(', ')}</p>}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Availability: <strong>{lawyer.availability || 'n/a'}</strong></p>
                <p>Rating: <strong>{lawyer.rating || 0}/5</strong></p>
                {lawyer.location && <p>Location: {lawyer.location.state}{lawyer.location.district ? ', ' + lawyer.location.district : ''}</p>}
              </div>
            </div>
            {matchInfo && (
              <div className="mt-6 bg-primary-50 border border-primary-100 rounded-md p-4">
                <div className="flex items-center mb-2"><Award className="w-4 h-4 text-primary-600 mr-2" /><span className="font-medium text-primary-700">Match Score: {matchInfo.score}</span></div>
                {matchInfo.reasons?.length > 0 && (
                  <ul className="list-disc ml-5 text-sm text-primary-800 space-y-1">
                    {matchInfo.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                )}
              </div>
            )}
            {user?.role === 'lawyer' && data.status === 'assigned' && !data.lawyerAccepted && lawyer && lawyer._id === user._id && (
              <div className="mt-4 flex gap-3">
                <button disabled={actionLoading === 'accept'} onClick={acceptCase} className="btn-primary text-sm">{actionLoading === 'accept' ? 'Accepting...' : 'Accept Case'}</button>
                <button disabled={actionLoading === 'decline'} onClick={declineCase} className="btn-secondary text-sm">{actionLoading === 'decline' ? 'Declining...' : 'Decline'}</button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 border flex items-center text-gray-600">
            <ShieldCheck className="w-5 h-5 mr-2 text-gray-400" />No lawyer assigned yet.
          </div>
        )}
        {showMatches && user?.role === 'client' && (
          <div className="bg-white rounded-lg shadow p-6 border">
            <h2 className="text-xl font-semibold flex items-center mb-4"><Users className="w-5 h-5 text-primary-600 mr-2"/>Alternative Matches</h2>
            {loadingMatches && <div className="text-gray-500 text-sm">Loading matches...</div>}
            {!loadingMatches && matches && matches.length === 0 && <div className="text-sm text-gray-600">No alternative matches available.</div>}
            <div className="space-y-4">
              {matches && matches.map((m:any) => (
                <div key={m.lawyer._id} className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{m.lawyer.name}</p>
                    <p className="text-xs text-gray-500">Score: {m.score}</p>
                    {m.matchReasons?.length > 0 && <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{m.matchReasons.join('; ')}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={assigning || (data.lawyerId && data.lawyerId._id === m.lawyer._id)}
                      onClick={() => assignLawyer(m.lawyer._id)}
                      className="btn-primary text-xs"
                    >
                      {assigning ? 'Assigning...' : (data.lawyerId && data.lawyerId._id === m.lawyer._id ? 'Assigned' : 'Assign')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
