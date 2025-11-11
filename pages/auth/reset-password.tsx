import { useState } from 'react';
import { useRouter } from 'next/router';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setStatus('Passwords do not match'); return; }
    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token, password }) });
      const json = await res.json();
      if(!json.success) throw new Error(json.message || 'Reset failed');
      setStatus('Password reset successful. Redirecting to login...');
      setTimeout(()=> router.push('/auth/login'), 1500);
    } catch(e:any) {
      setStatus(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-6'>
      <form onSubmit={submit} className='bg-white p-6 rounded shadow w-full max-w-md space-y-4'>
        <h1 className='text-xl font-semibold'>Reset Password</h1>
        <input type='password' value={password} onChange={e=>setPassword(e.target.value)} placeholder='New password' className='input-field' required minLength={6} />
        <input type='password' value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder='Confirm password' className='input-field' required minLength={6} />
        <button disabled={loading} className='btn-primary w-full'>{loading?'Resetting...':'Reset Password'}</button>
        {status && <div className='text-sm text-gray-700'>{status}</div>}
      </form>
    </div>
  );
}
