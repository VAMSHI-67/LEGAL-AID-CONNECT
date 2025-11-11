import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2, X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function toggle() {
    if (!isAuthenticated) return;
    if (!open) {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    }
    setOpen(o => !o);
  }

  function shortTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={toggle} className="relative p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[95vw] bg-white border border-gray-200 shadow-lg rounded-lg z-50 flex flex-col">
          <div className="px-4 py-2 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-600" />
              <span className="font-medium text-sm">Notifications</span>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={() => markAllAsRead()} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" />Mark all
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-auto divide-y">
            {notifications.length === 0 && !loading && (
              <div className="p-6 text-center text-sm text-gray-500">No notifications.</div>
            )}
            {notifications.map(n => (
              <div key={n._id} className={`px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer ${!n.isRead ? 'bg-primary-50/40' : ''}`} onClick={() => { if (!n.isRead) markAsRead(n._id); }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-[13px] leading-snug">{n.title}</p>
                    <p className="text-gray-600 text-[12px] mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2">
                      <span>{shortTime(String(n.createdAt))}</span>
                      {n.relatedId && <Link href={`/cases/${n.relatedId}`} className="text-primary-600 hover:underline">View</Link>}
                    </div>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 bg-primary-500 rounded-full mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 border-t bg-gray-50 text-right text-[11px] text-gray-500">
            Showing {notifications.length} item{notifications.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
