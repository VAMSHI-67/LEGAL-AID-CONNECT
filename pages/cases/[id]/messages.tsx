import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

interface CaseMessage {
  _id?: string;
  senderId: string;
  receiverId?: string;
  content: string;
  type?: string;
  createdAt: string;
  isRead?: boolean;
  optimistic?: boolean;
}

export default function CaseMessages() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, user } = useAuth();
  const { socket, joinCase } = useSocket();
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(()=>{ if(id && isAuthenticated) load(); },[id,isAuthenticated]);

  useEffect(()=>{
    if (id && socket) {
      joinCase(String(id));
      const onIncoming = (data: any) => {
        if (!data || data.caseId !== id) return;
        setMessages(m => [...m, { ...data.message, createdAt: data.message.createdAt || new Date().toISOString() }]);
      };
      socket.on('case_message', onIncoming);
      return () => { socket.off('case_message', onIncoming); };
    }
  },[id, socket, joinCase]);

  useEffect(()=>{ if(bottomRef.current) bottomRef.current.scrollIntoView({ behavior:'smooth' }); },[messages]);

  async function load() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cases/${id}/messages`, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load messages');
      setMessages(json.data || []);
    } catch (e) {
      setMessages([]);
    } finally { setLoading(false); }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if(!content.trim() || !id) return;
    const optimistic: CaseMessage = { _id: 'temp-'+Date.now(), content: content.trim(), senderId: user?._id || 'me', createdAt: new Date().toISOString(), optimistic: true };
    setMessages(m=>[...m, optimistic]);
    const toSend = content.trim();
    setContent('');
    try {
      setSending(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cases/${id}/messages`, { method: 'POST', headers: { 'Content-Type':'application/json','Authorization':`Bearer ${token}` }, body: JSON.stringify({ content: toSend }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Send failed');
      // Replace optimistic with server message if needed
      setMessages(m=> m.map(msg => msg === optimistic ? { ...json.data } : msg));
    } catch (err:any) {
      // Mark optimistic as failed visually
      setMessages(m=> m.map(msg => msg === optimistic ? { ...msg, content: msg.content + ' (failed)' } : msg));
      alert(err.message);
    } finally { setSending(false); }
  }

  if (loading) return <div className='p-8'>Loading messages...</div>;

  return (
    <div className='max-w-3xl mx-auto p-6 space-y-4'>
      <h1 className='text-xl font-semibold'>Case Messages</h1>
      <div className='border rounded p-4 h-96 overflow-y-auto bg-white space-y-3'>
        {messages.length === 0 && <p className='text-sm text-gray-500'>No messages yet.</p>}
        {messages.map(m => (
          <div key={m._id} className={`p-2 rounded text-sm border ${m.optimistic ? 'opacity-70 border-dashed' : 'bg-gray-50'} ${m.senderId === user?._id ? 'bg-primary-50 border-primary-100' : 'bg-gray-50 border-gray-100'}`}>
            <div className='text-gray-800 break-words'>{m.content}</div>
            <div className='text-[10px] text-gray-500 mt-1 flex justify-between'>
              <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
              {m.optimistic && <span>sending...</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className='flex gap-2'>
        <input value={content} onChange={e=>setContent(e.target.value)} className='input-field flex-1' placeholder='Type a message...' />
        <button disabled={sending} className='btn-primary'>{sending ? 'Sending...' : 'Send'}</button>
      </form>
    </div>
  );
}
