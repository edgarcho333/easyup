
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Notification } from '../types';
import { notificationService } from '../services/notificationService';
import { taskService } from '../services/taskService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number; // Total
  globalUnreadCount: number; // System/Global Only
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (projectId?: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children?: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setGlobalUnreadCount(0);
      return;
    }

    if (notifications.length === 0) setIsLoading(true);
    
    try {
      const [data, count] = await Promise.all([
        notificationService.getUserNotifications(user.id),
        notificationService.getUnreadCount(user.id)
      ]);
      setNotifications(data);
      setUnreadCount(count);
      
      // Calculate Global Unread (System types or no project_id)
      const globalUnread = data.filter(n => 
        !n.is_read && 
        (!n.project_id || ['system', 'timer_started', 'project_created'].includes(n.type))
      ).length;
      setGlobalUnreadCount(globalUnread);

    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // Simulate Real-time polling
    const interval = setInterval(() => {
      if (user) {
        // Check for reminders
        taskService.checkForDueReminders(user.id).catch(console.error);

        // Silent fetch
        notificationService.getUserNotifications(user.id).then(data => {
            setNotifications(data);
            const unread = data.filter(n => !n.is_read).length;
            const globalUnread = data.filter(n => 
              !n.is_read && 
              (!n.project_id || ['system', 'timer_started', 'project_created'].includes(n.type))
            ).length;
            
            setUnreadCount(unread);
            setGlobalUnreadCount(globalUnread);
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchNotifications, user]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    const updatedNotifications = notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
    setNotifications(updatedNotifications);
    
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Recalculate global unread
    const globalUnread = updatedNotifications.filter(n => 
      !n.is_read && 
      (!n.project_id || ['system', 'timer_started', 'project_created'].includes(n.type))
    ).length;
    setGlobalUnreadCount(globalUnread);
    
    await notificationService.markAsRead(id);
  };

  const markAllAsRead = async (projectId?: string) => {
    const updatedNotifications = notifications.map(n => {
        if (projectId && n.project_id !== projectId) return n; 
        return { ...n, is_read: true };
    });
    setNotifications(updatedNotifications);
    
    // Recalculate counts
    const unread = updatedNotifications.filter(n => !n.is_read).length;
    const globalUnread = updatedNotifications.filter(n => 
      !n.is_read && 
      (!n.project_id || ['system', 'timer_started', 'project_created'].includes(n.type))
    ).length;

    setUnreadCount(unread);
    setGlobalUnreadCount(globalUnread);

    if (user) {
        await notificationService.markAllAsRead(user.id, projectId);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      globalUnreadCount,
      isLoading, 
      markAsRead, 
      markAllAsRead,
      refreshNotifications: fetchNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
