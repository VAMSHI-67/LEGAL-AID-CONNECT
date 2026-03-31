import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Loader2, User, FileText, Download, MessageSquare } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

interface Message {
    _id?: string;
    senderId: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    content: string;
    type: 'text' | 'file' | 'image';
    createdAt: string;
    isRead: boolean;
    attachments?: any[];
}

interface ChatWindowProps {
    roomId: string;
    roomTitle: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ roomId, roomTitle }) => {
    const { user } = useAuth();
    const { socket, joinCase } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (roomId) {
            joinCase(roomId);
            fetchMessages();
            markAsRead();
        }
    }, [roomId]);

    const markAsRead = async () => {
        try {
            await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/chat/rooms/${roomId}/read`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        } catch (e) { /* ignore */ }
    };

    useEffect(() => {
        if (socket) {
            const handleMessage = (message: any) => {
                if (message.caseId === roomId) {
                    setMessages(prev => [...prev, message]);
                    markAsRead();
                }
            };

            socket.on('case_message', handleMessage);
            return () => { socket.off('case_message', handleMessage); };
        }
    }, [socket, roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/chat/rooms/${roomId}/messages`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.data.success) {
                setMessages(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (res.data.success) {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/chat/rooms/${roomId}/messages`, {
                    content: `Shared a file: ${file.name}`,
                    type: 'file',
                    attachments: [res.data.data]
                }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            }
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/chat/rooms/${roomId}/messages`, {
                content: newMessage,
                type: 'text'
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.data.success) {
                setNewMessage('');
            }
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--card)] rounded-xl shadow-maroon overflow-hidden border border-[var(--card-border)]">
            {/* Header */}
            <div className="p-4 border-b border-[var(--card-border)] bg-[var(--ivory)] flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white">
                        <User size={20} />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-[var(--primary)] text-lg leading-tight">{roomTitle}</h3>
                        <p className="text-[10px] text-[var(--accent)] font-bold tracking-widest uppercase">🛡️ Protected Channel</p>
                    </div>
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--background)]">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-[var(--primary)]" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--foreground)] opacity-40 italic space-y-2">
                        <MessageSquare size={32} />
                        <p>Your legal conversation starts here...</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.senderId._id === user?.id || (typeof msg.senderId === 'string' && msg.senderId === user?.id);
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-3 shadow-soft ${isMe
                                        ? 'bg-[var(--primary)] text-white rounded-br-none'
                                        : 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] rounded-bl-none'
                                    }`}>
                                    {msg.type === 'file' && msg.attachments?.[0] && (
                                        <div className={`mb-2 p-3 rounded-xl flex items-center gap-3 border ${isMe ? 'bg-white/10 border-white/20' : 'bg-[var(--ivory)] border-[var(--card-border)]'
                                            }`}>
                                            <FileText size={20} className={isMe ? 'text-white' : 'text-[var(--primary)]'} />
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-xs font-bold truncate">{msg.attachments[0].name}</p>
                                                <p className="text-[10px] opacity-70">{(msg.attachments[0].size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <a
                                                href={msg.attachments[0].url}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`p-2 rounded-lg transition-colors ${isMe ? 'hover:bg-white/20' : 'hover:bg-[var(--background)]'
                                                    }`}
                                            >
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <div className="flex justify-end mt-1 items-center gap-1">
                                        <span className={`text-[10px] ${isMe ? 'text-white/70' : 'text-[var(--foreground)]/50'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && (
                                            <span className="text-[10px]" title={msg.isRead ? 'Read' : 'Delivered'}>
                                                {msg.isRead ? '✔️✔️' : '✔️'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-[var(--ivory)] border-t border-[var(--card-border)] flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3 text-[var(--primary)] hover:bg-[var(--background)] rounded-xl transition-all ${uploading ? 'animate-pulse' : 'active:scale-90'}`}
                    title="Attach files"
                >
                    {uploading ? <Loader2 size={24} className="animate-spin" /> : <Paperclip size={24} />}
                </button>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your legal inquiry..."
                    className="flex-1 bg-[var(--card)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--foreground)] shadow-inner"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || sending || uploading}
                    className="p-3 bg-[var(--primary)] text-white rounded-xl hover:shadow-maroon disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center min-w-[48px]"
                >
                    {sending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
