
import { mockDb } from '../lib/mockDb';
import { Task, TaskStatus, TaskComment, TaskAttachment } from '../types';

export const taskService = {
  async getProjectTasks(projectId: string): Promise<Task[]> {
    const tasks = mockDb.filter('tasks', (t: any) => t.project_id === projectId);
    
    return tasks.map((t: any) => ({
        ...t,
        assignee: t.assigned_to ? mockDb.find('users', (u: any) => u.id === t.assigned_to) : undefined,
        creator: mockDb.find('users', (u: any) => u.id === t.created_by)
    })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getUserTasks(userId: string): Promise<Task[]> {
    const tasks = mockDb.filter('tasks', (t: any) => t.assigned_to === userId);
    
    return tasks.map((t: any) => ({
        ...t,
        assignee: mockDb.find('users', (u: any) => u.id === t.assigned_to),
        creator: mockDb.find('users', (u: any) => u.id === t.created_by),
        project: mockDb.find('projects', (p: any) => p.id === t.project_id)
    })).sort((a: any, b: any) => {
       // Sort by Due Date asc (nulls last)
       if (!a.due_date) return 1;
       if (!b.due_date) return -1;
       return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    return mockDb.insert('tasks', { ...taskData, checklist: [] });
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

  // NEW: Helper to add attachment from an existing URL (e.g., from Idea reference)
  async addTaskAttachmentFromUrl(taskId: string, fileUrl: string, fileName: string, userId: string): Promise<TaskAttachment> {
    const attachment = mockDb.insert<TaskAttachment>('task_attachments', {
      task_id: taskId,
      file_url: fileUrl,
      file_name: fileName,
      file_type: 'image/jpeg', // Assumed for reference carryover
      file_size: 0,
      uploaded_by: userId
    });
    
    const user = mockDb.find('users', (u: any) => u.id === userId);
    return { ...attachment, uploader: user };
  },

  async deleteTaskAttachment(attachmentId: string): Promise<void> {
    mockDb.delete('task_attachments', attachmentId);
  }
};
