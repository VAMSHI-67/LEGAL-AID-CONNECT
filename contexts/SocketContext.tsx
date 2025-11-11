import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketCtx {
  socket: Socket | null;
  joinCase: (caseId: string) => void;
}

const SocketContext = createContext<SocketCtx | undefined>(undefined);

export const SocketProvider = ({ children }: { children: any }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const joinedCases = useRef<Set<string>>(new Set());

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', { autoConnect: true });
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  function joinCase(caseId: string) {
    if (!socket) return;
    if (joinedCases.current.has(caseId)) return;
    socket.emit('join_case', caseId);
    joinedCases.current.add(caseId);
  }

  return (
    <SocketContext.Provider value={{ socket, joinCase }}>
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}