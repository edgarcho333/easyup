
import { mockDb } from '../lib/mockDb';
import { Task, TaskStatus, TaskComment, TaskAttachment, NotificationType, User, ProjectSettings } from '../types';
import { notificationService } from './notificationService';

export const taskService = {
  async getProjectTasks(projectId: string): Promise<Task[]> {
    const tasks = mockDb.filter('tasks', (t: any) => t.project_id === projectId);
    
    return tasks.map((t: any) => {
        // Handle new array format or fallback to legacy string if migration failed
        let assigneeIds: string[] = [];
        if (Array.isArray(t.assigned_to)) {
            assigneeIds = t.assigned_to;
        } else if (typeof t.assigned_to === 'string') {
            assigneeIds = [t.assigned_to];
        }

        const assignees = assigneeIds.map(id => mockDb.find('users', (u: any) => u.id === id)).filter(Boolean) as User[];

        return {
            ...t,
            assigned_to: assigneeIds, // Ensure normalized array
            assignees,
            creator: mockDb.find('users', (u: any) => u.id === t.created_by)
        };
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getUserTasks(userId: string): Promise<Task[]> {
    const tasks = mockDb.filter('tasks', (t: any) => {
        if (Array.isArray(t.assigned_to)) return t.assigned_to.includes(userId);
        return t.assigned_to === userId;
    });
    
    return tasks.map((t: any) => {
        let assigneeIds: string[] = [];
        if (Array.isArray(t.assigned_to)) {
            assigneeIds = t.assigned_to;
        } else if (typeof t.assigned_to === 'string') {
            assigneeIds = [t.assigned_to];
        }

        const assignees = assigneeIds.map(id => mockDb.find('users', (u: any) => u.id === id)).filter(Boolean) as User[];

        return {
            ...t,
            assigned_to: assigneeIds,
            assignees,
            creator: mockDb.find('users', (u: any) => u.id === t.created_by),
            project: mockDb.find('projects', (p: any) => p.id === t.project_id)
        };
    }).sort((a: any, b: any) => {
       // Sort by Due Date asc (nulls last)
       if (!a.due_date) return 1;
       if (!b.due_date) return -1;
       return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    // Ensure assigned_to is array
    const assignees = Array.isArray(taskData.assigned_to) ? taskData.assigned_to : (taskData.assigned_to ? [taskData.assigned_to] : []);
    
    const task = mockDb.insert<Task>('tasks', { ...taskData, assigned_to: assignees, checklist: [] });
    
    // TRIGGER NOTIFICATION for each assignee
    if (assignees.length > 0) {
       const project = mockDb.find('projects', (p: any) => p.id === task.project_id);
       
       for (const userId of assignees) {
           if (userId !== task.created_by) {
               await notificationService.createNotification({
                  user_id: userId,
                  organization_id: project?.organization_id || 'org-default',
                  project_id: task.project_id,
                  type: 'task_assigned',
                  title: 'New Task Assigned',
                  message: `You have been assigned to "${task.title}" in ${project?.name}`,
                  sender_id: task.created_by,
                  link_url: `/projects/${task.project_id}?tab=tasks`
               });
           }
       }
    }

    return task;
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const updated = mockDb.update('tasks', taskId, updates);
    if (!updated) throw new Error("Task not found");
    return updated;
  },

  async deleteTask(taskId: string): Promise<void> {
    mockDb.delete('tasks', taskId);
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    mockDb.update('tasks', taskId, { status });
  },

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    const comments = mockDb.filter('task_comments', (c: any) => c.task_id === taskId);
    return comments.map((c: any) => ({
        ...c,
        user: mockDb.find('users', (u: any) => u.id === c.user_id)
    })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async addTaskComment(taskId: string, userId: string, content: string): Promise<TaskComment> {
    const comment = mockDb.insert<TaskComment>('task_comments', {
        task_id: taskId,
        user_id: userId,
        content
    });
    const user = mockDb.find('users', (u: any) => u.id === userId);
    return { ...comment, user };
  },

  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    const attachments = mockDb.filter('task_attachments', (a: any) => a.task_id === taskId);
    return attachments.map((a: any) => ({
        ...a,
        uploader: mockDb.find('users', (u: any) => u.id === a.uploaded_by)
    })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async addTaskAttachment(taskId: string, file: File, userId: string): Promise<TaskAttachment> {
    // Simulate URL creation
    const fileUrl = URL.createObjectURL(file);
    
    const attachment = mockDb.insert<TaskAttachment>('task_attachments', {
      task_id: taskId,
      file_url: fileUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: userId
    });
    
    const user = mockDb.find('users', (u: any) => u.id === userId);
    return { ...attachment, uploader: user };
  },

  async addTaskAttachmentFromUrl(taskId: string, fileUrl: string, fileName: string, userId: string): Promise<TaskAttachment> {
    const attachment = mockDb.insert<TaskAttachment>('task_attachments', {
      task_id: taskId,
      file_url: fileUrl,
      file_name: fileName,
      file_type: 'image/jpeg', 
      file_size: 0,
      uploaded_by: userId
    });
    
    const user = mockDb.find('users', (u: any) => u.id === userId);
    return { ...attachment, uploader: user };
  },

  async deleteTaskAttachment(attachmentId: string): Promise<void> {
    mockDb.delete('task_attachments', attachmentId);
  },

  async checkForDueReminders(userId: string): Promise<void> {
    const tasks = mockDb.filter('tasks', (t: any) => {
        const assignees = Array.isArray(t.assigned_to) ? t.assigned_to : (t.assigned_to ? [t.assigned_to] : []);
        return assignees.includes(userId) && t.status !== 'done' && t.due_date;
    });
    
    const now = new Date();

    for (const task of tasks) {
      const due = new Date(task.due_date!);
      const diffMs = due.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      let type: NotificationType | null = null;
      let title = '';
      let message = '';

      if (diffHours > 0 && diffHours <= 24) {
        type = 'task_due_soon';
        title = 'Task Due Soon';
        message = `"${task.title}" is due in less than 24 hours.`;
      } else if (diffHours < 0) {
        type = 'task_overdue';
        title = 'Task Overdue';
        message = `"${task.title}" is overdue.`;
      }

      if (type) {
        // Check for existing notification in last 24h to avoid spam
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        
        const existing = mockDb.filter('notifications', (n: any) => 
          n.user_id === userId && 
          n.type === type && 
          n.message.includes(task.title) &&
          new Date(n.created_at) > oneDayAgo
        );

        if (existing.length === 0) {
           const project: any = mockDb.find('projects', (p: any) => p.id === task.project_id);
           
           await notificationService.createNotification({
             user_id: userId,
             organization_id: project?.organization_id || 'org-default',
             project_id: task.project_id,
             type,
             title,
             message,
             link_url: `/my-tasks`,
             sender_id: 'system'
           });

           // Check if we should "send an email"
           if (project && project.settings?.notifications?.email_on_task_due) {
              console.info(`[Mock Email Service] Sending "${title}" email to user ${userId} for task: ${task.title}`);
           }
        }
      }
    }
  }
};
