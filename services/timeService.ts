import { supabase } from '../lib/supabase';
import { TimeLog } from '../types';
import { notificationService } from './notificationService';

export const timeService = {
  async getActiveLog(userId: string): Promise<TimeLog | null> {
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', userId)
      .is('end_time', null)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Fetch project and task info separately
    let project = undefined;
    let task = undefined;

    if (data.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, name, organization_id')
        .eq('id', data.project_id)
        .maybeSingle();
      project = projectData || undefined;
    }

    if (data.task_id) {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('id', data.task_id)
        .maybeSingle();
      task = taskData || undefined;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      task_id: data.task_id,
      description: data.description,
      start_time: data.start_time,
      end_time: data.end_time,
      duration_minutes: data.duration_minutes,
      created_at: data.created_at,
      project,
      task
    };
  },

  async startTimer(userId: string, orgId: string, description: string, projectId?: string, taskId?: string): Promise<TimeLog> {
    // Stop any existing timer first
    const active = await this.getActiveLog(userId);
    if (active) {
      await this.stopTimer(active.id);
    }

    // Create new time log
    const { data: newLog, error } = await supabase
      .from('time_logs')
      .insert({
        user_id: userId,
        organization_id: orgId,
        project_id: projectId || null,
        task_id: taskId || null,
        description,
        start_time: new Date().toISOString(),
        duration_minutes: 0
      })
      .select('*')
      .single();

    if (error || !newLog) {
      throw new Error('Failed to start timer');
    }

    // Fetch project info separately if exists
    let project = undefined;
    if (projectId) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, name, organization_id')
        .eq('id', projectId)
        .maybeSingle();
      project = projectData || undefined;
    }

    // Get user info for notification
    const { data: user } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    // Create notification (sender_id is optional for system notifications)
    await notificationService.createNotification({
      user_id: userId,
      organization_id: orgId,
      type: 'timer_started',
      title: 'Time Tracking Started',
      message: `${user?.full_name || 'Employee'} started working on: ${description}`,
      link_url: '/time'
      // No sender_id for system notifications
    });

    return {
      id: newLog.id,
      user_id: newLog.user_id,
      organization_id: newLog.organization_id,
      project_id: newLog.project_id,
      task_id: newLog.task_id,
      description: newLog.description,
      start_time: newLog.start_time,
      end_time: newLog.end_time,
      duration_minutes: newLog.duration_minutes,
      created_at: newLog.created_at,
      project
    };
  },

  async stopTimer(logId: string): Promise<void> {
    // Get the log first
    const { data: log } = await supabase
      .from('time_logs')
      .select('start_time')
      .eq('id', logId)
      .single();

    if (!log) return;

    const end = new Date();
    const start = new Date(log.start_time);
    const duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60);

    await supabase
      .from('time_logs')
      .update({
        end_time: end.toISOString(),
        duration_minutes: duration
      })
      .eq('id', logId);
  },

  async updateLog(logId: string, updates: Partial<TimeLog>): Promise<TimeLog> {
    const { error } = await supabase
      .from('time_logs')
      .update(updates)
      .eq('id', logId);

    if (error) {
      throw error;
    }

    // Retrieve updated log
    const { data } = await supabase
      .from('time_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (!data) {
      throw new Error('Log not found');
    }

    // Fetch project and task info separately
    let project = undefined;
    let task = undefined;

    if (data.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, name, organization_id')
        .eq('id', data.project_id)
        .maybeSingle();
      project = projectData || undefined;
    }

    if (data.task_id) {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('id', data.task_id)
        .maybeSingle();
      task = taskData || undefined;
    }

    return { ...data, project, task } as TimeLog;
  },

  async getUserLogs(userId: string, days: number = 7): Promise<TimeLog[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoff.toISOString())
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching user logs:', error);
      return [];
    }

    // Fetch project and task info separately for each log
    const logsWithRelations = await Promise.all(
      (data || []).map(async (l: any) => {
        let project = undefined;
        let task = undefined;

        if (l.project_id) {
          const { data: projectData } = await supabase
            .from('projects')
            .select('id, name, organization_id')
            .eq('id', l.project_id)
            .maybeSingle();
          project = projectData || undefined;
        }

        if (l.task_id) {
          const { data: taskData } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('id', l.task_id)
            .maybeSingle();
          task = taskData || undefined;
        }

        return { ...l, project, task };
      })
    );

    return logsWithRelations;
  },

  async getOrganizationLogs(orgId: string, days: number = 30): Promise<TimeLog[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('organization_id', orgId)
      .gte('created_at', cutoff.toISOString())
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching organization logs:', error);
      return [];
    }

    // Fetch user, project and task info separately for each log
    const logsWithRelations = await Promise.all(
      (data || []).map(async (l: any) => {
        let user = undefined;
        let project = undefined;
        let task = undefined;

        if (l.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url')
            .eq('id', l.user_id)
            .maybeSingle();
          user = userData || undefined;
        }

        if (l.project_id) {
          const { data: projectData } = await supabase
            .from('projects')
            .select('id, name, organization_id')
            .eq('id', l.project_id)
            .maybeSingle();
          project = projectData || undefined;
        }

        if (l.task_id) {
          const { data: taskData } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('id', l.task_id)
            .maybeSingle();
          task = taskData || undefined;
        }

        return { ...l, user, project, task };
      })
    );

    return logsWithRelations;
  },

  async createManualLog(data: Partial<TimeLog>): Promise<TimeLog> {
    const { data: log, error } = await supabase
      .from('time_logs')
      .insert(data)
      .select()
      .single();

    if (error || !log) {
      throw new Error('Failed to create manual log');
    }

    return log as TimeLog;
  }
};
