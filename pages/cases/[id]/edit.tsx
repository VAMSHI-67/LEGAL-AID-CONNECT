import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export default function EditCase() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id && isAuthenticated) load(); }, [id, isAuthenticated]);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`/api/cases/${id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setForm({ title: json.data.title, description: json.data.description, category: json.data.category, priority: json.data.priority, tags: (json.data.tags || []).join(', ') });
    } catch (e:any) { setError(e.message); } finally { setLoading(false); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      const payload = { ...form, tags: form.tags };
      const res = await fetch(`/api/cases/${id}`, { method: 'PUT', headers: { 'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      router.push(`/cases/${id}`);
    } catch (e:any) { setError(e.message); } finally { setSaving(false); }
  }

  if (loading) return <div className='p-8'>Loading...</div>;
  if (error) return <div className='p-8 text-red-600'>{error}</div>;
  if (!form) return null;

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <h1 className='text-xl font-semibold mb-4'>Edit Case</h1>
      <form onSubmit={save} className='space-y-4'>
        <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className='input-field w-full' />
        <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className='input-field w-full h-40' />
        <input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className='input-field w-full' />
        <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className='input-field w-full'>
          {['low','medium','high','urgent'].map(p=> <option key={p}>{p}</option>)}
        </select>
        <input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} className='input-field w-full' placeholder='comma separated tags' />
        <div className='flex gap-3'>
          <button disabled={saving} className='btn-primary'>{saving?'Saving...':'Save Changes'}</button>
          <button type='button' onClick={()=>router.push(`/cases/${id}`)} className='btn-secondary'>Cancel</button>
        </div>
      </form>
    </div>
  );
}
