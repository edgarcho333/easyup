import { supabase } from '../lib/supabase';
import { Notification, NotificationType } from '../types';

export const notificationService = {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    // Fetch sender info separately for notifications that have a sender
    const notificationsWithSender = await Promise.all(
      (data || []).map(async (n: any) => {
        let sender = undefined;
        if (n.sender_id) {
          const { data: senderData } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url')
            .eq('id', n.sender_id)
            .maybeSingle();
          sender = senderData || undefined;
        }

        return {
          id: n.id,
          user_id: n.user_id,
          organization_id: n.organization_id,
          project_id: n.project_id,
          type: n.type as NotificationType,
          title: n.title,
          message: n.message,
          is_read: n.is_read,
          link_url: n.link_url,
          sender_id: n.sender_id,
          created_at: n.created_at,
          sender
        };
      })
    );

    return notificationsWithSender;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllAsRead(userId: string, projectId?: string): Promise<void> {
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
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
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.user_id,
        organization_id: data.organization_id,
        project_id: data.project_id || null,
        type: data.type,
        title: data.title,
        message: data.message,
        sender_id: data.sender_id || null,
        link_url: data.link_url || null,
        is_read: false
      });

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
};
