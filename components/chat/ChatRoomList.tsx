import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, User } from 'lucide-react';

interface Participant {
    name: string;
    profilePicture?: string;
}

interface ChatRoom {
    id: string;
    title: string;
    category: string;
    participant: Participant;
    lastMessage?: {
        content: string;
        createdAt: string;
    };
    unreadCount: number;
}

interface ChatRoomListProps {
    rooms: ChatRoom[];
    activeRoomId?: string;
    onRoomSelect: (roomId: string) => void;
    loading?: boolean;
}

const ChatRoomList: React.FC<ChatRoomListProps> = ({ rooms, activeRoomId, onRoomSelect, loading }) => {
    if (loading) {
        return (
            <div className="flex flex-col space-y-4 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-[var(--ivory)] animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (rooms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageSquare size={48} className="text-[var(--accent)] opacity-20 mb-4" />
                <p className="text-[var(--foreground)] opacity-60">No active conversations found.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {rooms.map((room) => (
                <button
                    key={room.id}
                    onClick={() => onRoomSelect(room.id)}
                    className={`flex items-center p-4 border-b border-[var(--card-border)] transition-all duration-300 ${activeRoomId === room.id
                            ? 'bg-[var(--ivory)] border-r-4 border-r-[var(--secondary)]'
                            : 'hover:bg-[var(--ivory)]'
                        }`}
                >
                    <div className="relative">
                        {room.participant.profilePicture ? (
                            <img
                                src={room.participant.profilePicture}
                                alt={room.participant.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-[var(--accent)]"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white">
                                <User size={24} />
                            </div>
                        )}
                        {room.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-[var(--secondary)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-[var(--card)]">
                                {room.unreadCount}
                            </span>
                        )}
                    </div>

                    <div className="ml-4 flex-1 text-left">
                        <div className="flex justify-between items-start">
                            <h4 className="font-serif font-bold text-[var(--foreground)] truncate max-w-[150px]">
                                {room.title}
                            </h4>
                            {room.lastMessage && (
                                <span className="text-[10px] text-[var(--foreground)] opacity-40">
                                    {formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: true })}
                                </span>
                            )}
                        </div>

                        <p className="text-xs text-[var(--accent)] font-medium mb-1">{room.participant.name}</p>

                        <p className="text-sm text-[var(--foreground)] opacity-60 truncate">
                            {room.lastMessage ? room.lastMessage.content : `Case ID: ${room.id.slice(-6)}`}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default ChatRoomList;
