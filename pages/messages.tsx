import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import ChatRoomList from '@/components/chat/ChatRoomList';
import ChatWindow from '@/components/chat/ChatWindow';
import { Scale, MessageSquare, Search } from 'lucide-react';

interface RoomParticipant {
    name: string;
    profilePicture?: string;
}

interface RoomSummary {
    id: string;
    title: string;
    status: string;
    category: string;
    participant: RoomParticipant;
    unreadCount: number;
    lastMessage?: {
        content: string;
        createdAt: string;
    };
}

const MessagesPage = () => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const [rooms, setRooms] = useState<RoomSummary[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            fetchRooms();
        }
    }, [isAuthenticated]);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/chat/rooms`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.data.success) {
                setRooms(res.data.data);
                if (res.data.data.length > 0 && !activeRoomId) {
                    // No auto-select for cleaner UI on mobile? 
                    // setActiveRoomId(res.data.data[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch chat rooms', error);
        } finally {
            setLoading(false);
        }
    };

    const activeRoom = rooms.find((r) => r.id === activeRoomId);

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[var(--background)] flex flex-col md:flex-row overflow-hidden">
            <Head>
                <title>Messages | LegalAid Connect</title>
            </Head>

            {/* Sidebar: Chat List */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-[var(--card-border)] bg-[var(--card)] flex flex-col ${activeRoomId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-[var(--card-border)] bg-[var(--ivory)] space-y-4">
                    <div className="flex items-center gap-2">
                        <Scale className="text-[var(--primary)]" size={24} />
                        <h2 className="font-serif font-bold text-xl text-[var(--foreground)]">Case Chats</h2>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground)] opacity-40" size={18} />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--foreground)]"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <ChatRoomList
                        rooms={rooms.filter((r) =>
                            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            r.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )}
                        activeRoomId={activeRoomId || undefined}
                        onRoomSelect={setActiveRoomId}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Main Content: Chat Window */}
            <div className={`flex-1 flex flex-col bg-[var(--background)] relative ${!activeRoomId ? 'hidden md:flex' : 'flex'}`}>
                {activeRoom ? (
                    <div className="h-full p-4 md:p-6 flex flex-col">
                        {/* Back button for mobile */}
                        <button
                            onClick={() => setActiveRoomId(null)}
                            className="md:hidden absolute top-8 left-8 z-10 p-2 bg-[var(--card)] rounded-lg shadow-soft border border-[var(--card-border)] text-[var(--primary)]"
                        >
                            ← Back
                        </button>

                        <div className="flex-1">
                            <ChatWindow
                                roomId={activeRoom.id}
                                roomTitle={activeRoom.title}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
                        <div className="w-24 h-24 rounded-full bg-[var(--ivory)] flex items-center justify-center mb-6 border-2 border-dashed border-[var(--accent)]">
                            <MessageSquare size={48} className="text-[var(--primary)]" />
                        </div>
                        <h3 className="font-serif font-bold text-2xl text-[var(--foreground)] mb-2">Select a Conversation</h3>
                        <p className="text-[var(--foreground)] max-w-xs mx-auto text-sm">
                            Choose a case from the list on the left to start communicating securely with your lawyer.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;
