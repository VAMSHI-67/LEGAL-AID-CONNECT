import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Notification } from '@/types';
import axios from 'axios';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, '_id' | 'createdAt'>) => void;
  removeNotification: (notificationId: string) => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

type NotificationAction =
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length,
      };
    case 'ADD_NOTIFICATION':
      return {
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + (action.payload.isRead ? 0 : 1),
      };
    case 'MARK_AS_READ':
      return {
        notifications: state.notifications.map(n =>
          n._id === action.payload ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_AS_READ':
      return {
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      };
    case 'REMOVE_NOTIFICATION':
      return {
        notifications: state.notifications.filter(n => n._id !== action.payload),
        unreadCount: state.notifications.find(n => n._id === action.payload)?.isRead 
          ? state.unreadCount 
          : Math.max(0, state.unreadCount - 1),
      };
    default:
      return state;
  }
};

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

export const NotificationProvider: React.FC<{ children: any }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data.data });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const addNotification = (notification: Omit<Notification, '_id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      _id: Date.now().toString(), // Temporary ID
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
  };

  const removeNotification = (notificationId: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
  };

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const value: NotificationContextType = {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 