
import { mockDb } from '../lib/mockDb';
import { TimeLog } from '../types';
import { notificationService } from './notificationService';

export const timeService = {
  async getActiveLog(userId: string): Promise<TimeLog | null> {
    const logs = mockDb.filter('time_logs', (l: any) => l.user_id === userId && !l.end_time);
    if (logs.length > 0) {
        const log = logs[0];
        // Join Project info
        const project = log.project_id ? mockDb.find('projects', (p: any) => p.id === log.project_id) : undefined;
        const task = log.task_id ? mockDb.find('tasks', (t: any) => t.id === log.task_id) : undefined;
        return { ...log, project, task } as TimeLog;
    }
    return null;
  },

  async startTimer(userId: string, orgId: string, description: string, projectId?: string, taskId?: string): Promise<TimeLog> {
    // Stop any existing timer first
    const active = await this.getActiveLog(userId);
    if (active) {
        await this.stopTimer(active.id);
    }

    const newLog = mockDb.insert<TimeLog>('time_logs', {
        user_id: userId,
        organization_id: orgId,
        project_id: projectId,
        task_id: taskId,
        description,
        start_time: new Date().toISOString(),
        duration_minutes: 0
    });

    // Return with joins
    const project = projectId ? mockDb.find('projects', (p: any) => p.id === projectId) : undefined;
    
    // --- NOTIFICATION TRIGGER ---
    // Notify system (or admins) that a user started tracking time
    // In a real app, we'd filter for admins. For this demo, we target the current user so they see the global notification working immediately.
    const user = mockDb.find('users', (u: any) => u.id === userId);
    
    await notificationService.createNotification({
        user_id: userId, // Targeting self for demo purposes to see the notification
        organization_id: orgId,
        type: 'timer_started',
        title: 'Time Tracking Started',
        message: `${user?.full_name || 'Employee'} started working on: ${description}`,
        sender_id: 'system',
        link_url: '/time'
    });

    return { ...newLog, project } as TimeLog;
  },

  async stopTimer(logId: string): Promise<void> {
    const log: any = mockDb.find('time_logs', (l: any) => l.id === logId);
    if (!log) return;

    const end = new Date();
    const start = new Date(log.start_time);
    const duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60);

    mockDb.update('time_logs', logId, {
        end_time: end.toISOString(),
        duration_minutes: duration
    });
  },

  async updateLog(logId: string, updates: Partial<TimeLog>): Promise<TimeLog> {
    mockDb.update('time_logs', logId, updates);
    
    // Retrieve updated with joins
    const log: any = mockDb.find('time_logs', (l: any) => l.id === logId);
    const project = log.project_id ? mockDb.find('projects', (p: any) => p.id === log.project_id) : undefined;
    const task = log.task_id ? mockDb.find('tasks', (t: any) => t.id === log.task_id) : undefined;
    
    return { ...log, project, task } as TimeLog;
  },

  async getUserLogs(userId: string, days: number = 7): Promise<TimeLog[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const logs = mockDb.filter('time_logs', (l: any) => l.user_id === userId && new Date(l.created_at) >= cutoff);
    
    return logs.map((l: any) => ({
        ...l,
        project: l.project_id ? mockDb.find('projects', (p: any) => p.id === l.project_id) : undefined,
        task: l.task_id ? mockDb.find('tasks', (t: any) => t.id === l.task_id) : undefined
    })).sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  },

  async getOrganizationLogs(orgId: string, days: number = 30): Promise<TimeLog[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const logs = mockDb.filter('time_logs', (l: any) => l.organization_id === orgId && new Date(l.created_at) >= cutoff);
    
    return logs.map((l: any) => ({
        ...l,
        user: mockDb.find('users', (u: any) => u.id === l.user_id),
        project: l.project_id ? mockDb.find('projects', (p: any) => p.id === l.project_id) : undefined,
        task: l.task_id ? mockDb.find('tasks', (t: any) => t.id === l.task_id) : undefined
    })).sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  },

  async createManualLog(data: Partial<TimeLog>): Promise<TimeLog> {
    return mockDb.insert<TimeLog>('time_logs', data);
  }
};
