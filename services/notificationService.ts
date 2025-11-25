
import { mockDb } from '../lib/mockDb';
import { Notification, NotificationType } from '../types';

export const notificationService = {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const items = mockDb.filter('notifications', (n: any) => n.user_id === userId);
    
    // Join sender info
    return items.map((n: any) => ({
      ...n,
      sender: n.sender_id ? mockDb.find('users', (u: any) => u.id === n.sender_id) : undefined
    })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getUnreadCount(userId: string): Promise<number> {
    const items = mockDb.filter('notifications', (n: any) => n.user_id === userId && !n.is_read);
    return items.length;
  },

  async markAsRead(notificationId: string): Promise<void> {
    mockDb.update('notifications', notificationId, { is_read: true });
  },

  async markAllAsRead(userId: string, projectId?: string): Promise<void> {
    let unread = mockDb.filter('notifications', (n: any) => n.user_id === userId && !n.is_read);
    
    if (projectId) {
        unread = unread.filter((n: any) => n.project_id === projectId);
    }

    unread.forEach((n: any) => {
      mockDb.update('notifications', n.id, { is_read: true });
    });
  },

  async createNotification(data: {
    user_id: string;
    organization_id: string;
    project_id?: string;
    type: NotificationType;
    title: string;
    message: string;
    sender_id?: string;
    link_url?: string;
  }): Promise<void> {
    mockDb.insert('notifications', {
      ...data,
      is_read: false
    });
  }
};