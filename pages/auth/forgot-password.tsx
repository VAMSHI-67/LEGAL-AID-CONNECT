import { useState } from 'react';
import { useRouter } from 'next/router';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setStatus('If an account exists, a reset link/token was generated (demo: check server response).');
    } catch (e:any) {
      setStatus(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Forgot Password</h1>
        <p className="text-sm text-gray-600">Enter your email to request a password reset.</p>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="you@example.com" className="input-field" />
        <button disabled={loading} className="btn-primary w-full">{loading?'Sending...':'Send Reset Request'}</button>
        {status && <div className="text-sm text-gray-700">{status}</div>}
        <button type="button" onClick={()=>router.push('/auth/login')} className="text-xs text-primary-600">Back to login</button>
      </form>
    </div>
  );
}
