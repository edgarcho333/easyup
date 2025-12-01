import { supabase } from '../lib/supabase';
import { Task, TaskStatus, TaskComment, TaskAttachment, NotificationType, User, ProjectSettings } from '../types';
import { notificationService } from './notificationService';

export const taskService = {
  async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch tasks:', error.message);
        throw new Error(`Failed to fetch tasks: ${error.message}`);
      }

      if (!tasks) return [];

      // For each task, fetch creator and assignee details
      const tasksWithRelations = await Promise.all(
        tasks.map(async (task: any) => {
          // Fetch creator info
          let creator = undefined;
          if (task.created_by) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, email, full_name, avatar_url')
              .eq('id', task.created_by)
              .maybeSingle();
            creator = userData || undefined;
          }

          // Fetch assignees
          const assigneeIds = task.assigned_to || [];
          let assignees: any[] = [];
          if (assigneeIds.length > 0) {
            const { data: assigneesData } = await supabase
              .from('users')
              .select('id, email, full_name, avatar_url')
              .in('id', assigneeIds);
            assignees = assigneesData || [];
          }

          return { ...task, creator, assignees };
        })
      );

      return tasksWithRelations;
    } catch (err) {
      console.error('Error in getProjectTasks:', err);
      throw err;
    }
  },

  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      // Fetch tasks where user is in assigned_to array
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .contains('assigned_to', [userId])
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Failed to fetch user tasks:', error.message);
        throw new Error(`Failed to fetch user tasks: ${error.message}`);
      }

      if (!tasks) return [];

      // For each task, fetch creator, project, and assignee details
      const tasksWithRelations = await Promise.all(
        tasks.map(async (task: any) => {
          // Fetch creator info
          let creator = undefined;
          if (task.created_by) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, email, full_name, avatar_url')
              .eq('id', task.created_by)
              .maybeSingle();
            creator = userData || undefined;
          }

          // Fetch project info
          let project = undefined;
          if (task.project_id) {
            const { data: projectData } = await supabase
              .from('projects')
              .select('id, name, client_name, organization_id')
              .eq('id', task.project_id)
              .maybeSingle();
            project = projectData || undefined;
          }

          // Fetch assignees
          const assigneeIds = task.assigned_to || [];
          let assignees: any[] = [];
          if (assigneeIds.length > 0) {
            const { data: assigneesData } = await supabase
              .from('users')
              .select('id, email, full_name, avatar_url')
              .in('id', assigneeIds);
            assignees = assigneesData || [];
          }

          return { ...task, creator, project, assignees };
        })
      );

      return tasksWithRelations;
    } catch (err) {
      console.error('Error in getUserTasks:', err);
      throw err;
    }
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      // Ensure assigned_to is array
      const assignees = Array.isArray(taskData.assigned_to)
        ? taskData.assigned_to
        : (taskData.assigned_to ? [taskData.assigned_to] : []);

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          assigned_to: assignees,
          checklist: taskData.checklist || []
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create task:', error.message);
        throw new Error(`Failed to create task: ${error.message}`);
      }

      if (!task) {
        throw new Error('No task returned from insert');
      }

      // TRIGGER NOTIFICATION for each assignee
      if (assignees.length > 0) {
        const { data: project } = await supabase
          .from('projects')
          .select('id, name, organization_id')
          .eq('id', task.project_id)
          .single();

        if (project) {
          for (const userId of assignees) {
            if (userId !== task.created_by) {
              await notificationService.createNotification({
                user_id: userId,
                organization_id: project.organization_id,
                project_id: task.project_id,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `You have been assigned to "${task.title}" in ${project.name}`,
                sender_id: task.created_by,
                link_url: `/projects/${task.project_id}?tab=tasks`
              });
            }
          }
        }
      }

      return task;
    } catch (err) {
      console.error('Error in createTask:', err);
      throw err;
    }
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update task:', error.message);
        throw new Error(`Failed to update task: ${error.message}`);
      }

      if (!task) {
        throw new Error('Task not found');
      }

      return task;
    } catch (err) {
      console.error('Error in updateTask:', err);
      throw err;
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Failed to delete task:', error.message);
        throw new Error(`Failed to delete task: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in deleteTask:', err);
      throw err;
    }
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) {
        console.error('Failed to update task status:', error.message);
        throw new Error(`Failed to update task status: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in updateTaskStatus:', err);
      throw err;
    }
  },

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    try {
      const { data: comments, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch task comments:', error.message);
        throw new Error(`Failed to fetch task comments: ${error.message}`);
      }

      if (!comments) return [];

      // Fetch user info separately for each comment
      const commentsWithUsers = await Promise.all(
        comments.map(async (comment: any) => {
          let user = undefined;
          if (comment.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, email, full_name, avatar_url')
              .eq('id', comment.user_id)
              .maybeSingle();
            user = userData || undefined;
          }
          return { ...comment, user };
        })
      );

      return commentsWithUsers;
    } catch (err) {
      console.error('Error in getTaskComments:', err);
      throw err;
    }
  },

  async addTaskComment(taskId: string, userId: string, content: string): Promise<TaskComment> {
    try {
      const { data: comment, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          content
        })
        .select('*')
        .single();

      if (error) {
        console.error('Failed to add task comment:', error.message);
        throw new Error(`Failed to add task comment: ${error.message}`);
      }

      if (!comment) {
        throw new Error('No comment returned from insert');
      }

      // Fetch user info separately
      let user = undefined;
      if (comment.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .eq('id', comment.user_id)
          .maybeSingle();
        user = userData || undefined;
      }

      return { ...comment, user };
    } catch (err) {
      console.error('Error in addTaskComment:', err);
      throw err;
    }
  },

  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    try {
      const { data: attachments, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch task attachments:', error.message);
        throw new Error(`Failed to fetch task attachments: ${error.message}`);
      }

      if (!attachments) return [];

      // Fetch uploader info separately for each attachment
      const attachmentsWithUploaders = await Promise.all(
        attachments.map(async (attachment: any) => {
          let uploader = undefined;
          if (attachment.uploaded_by) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, email, full_name, avatar_url')
              .eq('id', attachment.uploaded_by)
              .maybeSingle();
            uploader = userData || undefined;
          }
          return { ...attachment, uploader };
        })
      );

      return attachmentsWithUploaders;
    } catch (err) {
      console.error('Error in getTaskAttachments:', err);
      throw err;
    }
  },

  async addTaskAttachment(taskId: string, file: File, userId: string): Promise<TaskAttachment> {
    try {
      // Simulate URL creation (in production, use Supabase Storage)
      const fileUrl = URL.createObjectURL(file);

      const { data: attachment, error } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          file_url: fileUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: userId
        })
        .select('*')
        .single();

      if (error) {
        console.error('Failed to add task attachment:', error.message);
        throw new Error(`Failed to add task attachment: ${error.message}`);
      }

      if (!attachment) {
        throw new Error('No attachment returned from insert');
      }

      // Fetch uploader info separately
      let uploader = undefined;
      if (attachment.uploaded_by) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .eq('id', attachment.uploaded_by)
          .maybeSingle();
        uploader = userData || undefined;
      }

      return { ...attachment, uploader };
    } catch (err) {
      console.error('Error in addTaskAttachment:', err);
      throw err;
    }
  },

  async addTaskAttachmentFromUrl(taskId: string, fileUrl: string, fileName: string, userId: string): Promise<TaskAttachment> {
    try {
      const { data: attachment, error } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          file_url: fileUrl,
          file_name: fileName,
          file_type: 'image/jpeg',
          file_size: 0,
          uploaded_by: userId
        })
        .select('*')
        .single();

      if (error) {
        console.error('Failed to add task attachment from URL:', error.message);
        throw new Error(`Failed to add task attachment from URL: ${error.message}`);
      }

      if (!attachment) {
        throw new Error('No attachment returned from insert');
      }

      // Fetch uploader info separately
      let uploader = undefined;
      if (attachment.uploaded_by) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .eq('id', attachment.uploaded_by)
          .maybeSingle();
        uploader = userData || undefined;
      }

      return { ...attachment, uploader };
    } catch (err) {
      console.error('Error in addTaskAttachmentFromUrl:', err);
      throw err;
    }
  },

  async deleteTaskAttachment(attachmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) {
        console.error('Failed to delete task attachment:', error.message);
        throw new Error(`Failed to delete task attachment: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in deleteTaskAttachment:', err);
      throw err;
    }
  },

  async checkForDueReminders(userId: string): Promise<void> {
    try {
      // Fetch tasks assigned to user that are not done and have due dates
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .contains('assigned_to', [userId])
        .neq('status', 'done')
        .not('due_date', 'is', null);

      if (error) {
        console.error('Failed to fetch tasks for reminders:', error.message);
        return;
      }

      if (!tasks) return;

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

        if (type && task.project_id) {
          // Fetch project info separately
          const { data: project } = await supabase
            .from('projects')
            .select('id, name, organization_id, settings')
            .eq('id', task.project_id)
            .maybeSingle();

          if (project) {
            // Create notification for due/overdue tasks
            await notificationService.createNotification({
              user_id: userId,
              organization_id: project.organization_id,
              project_id: task.project_id,
              type,
              title,
              message,
              link_url: `/my-tasks`
            });

            // Check if we should "send an email"
            const settings = project.settings as any;
            if (settings?.notifications?.email_on_task_due) {
              console.info(`[Mock Email Service] Sending "${title}" email to user ${userId} for task: ${task.title}`);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in checkForDueReminders:', err);
    }
  }
};
