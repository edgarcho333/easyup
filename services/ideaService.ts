import { supabase } from '../lib/supabase';
import { Idea, IdeaComment, IdeaStatus, IdeaApproval } from '../types';

export const ideaService = {
  async getProjectIdeas(projectId: string): Promise<Idea[]> {
    try {
      const { data: ideas, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch ideas:', error.message);
        throw new Error(`Failed to fetch ideas: ${error.message}`);
      }

      if (!ideas) return [];

      // Fetch creator info separately for each idea
      const ideasWithCreators = await Promise.all(
        ideas.map(async (idea: any) => {
          let creator = undefined;
          if (idea.created_by) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, email, full_name, avatar_url')
              .eq('id', idea.created_by)
              .maybeSingle();
            creator = userData || undefined;
          }
          return { ...idea, creator };
        })
      );

      return ideasWithCreators;
    } catch (err) {
      console.error('Error in getProjectIdeas:', err);
      throw err;
    }
  },

  async getIdea(ideaId: string): Promise<Idea> {
    try {
      const { data: idea, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .single();

      if (error) {
        console.error('Failed to fetch idea:', error.message);
        throw new Error('Idea not found');
      }

      if (!idea) {
        throw new Error('Idea not found');
      }

      // Fetch creator info separately
      let creator = undefined;
      if (idea.created_by) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .eq('id', idea.created_by)
          .maybeSingle();
        creator = userData || undefined;
      }

      return { ...idea, creator };
    } catch (err) {
      console.error('Error in getIdea:', err);
      throw err;
    }
  },

  async createIdea(idea: Partial<Idea>): Promise<Idea> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .insert(idea)
        .select()
        .single();

      if (error) {
        console.error('Failed to create idea:', error.message);
        throw new Error(`Failed to create idea: ${error.message}`);
      }

      if (!data) {
        throw new Error('No idea returned from insert');
      }

      return data;
    } catch (err) {
      console.error('Error in createIdea:', err);
      throw err;
    }
  },

  async updateIdea(id: string, updates: Partial<Idea>): Promise<void> {
    try {
      const { error } = await supabase
        .from('ideas')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Failed to update idea:', error.message);
        throw new Error(`Failed to update idea: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in updateIdea:', err);
      throw err;
    }
  },

  async deleteIdea(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete idea:', error.message);
        throw new Error(`Failed to delete idea: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in deleteIdea:', err);
      throw err;
    }
  },

  async updateStatusWithApproval(
    id: string,
    status: IdeaStatus,
    userId: string,
    userRole: string,
    action: 'approved' | 'rejected' | 'requested_changes',
    comments?: string
  ): Promise<void> {
    try {
      const updates: any = { status };
      if (status === 'pending_approval') updates.submitted_at = new Date().toISOString();
      if (status === 'scheduled') updates.approved_at = new Date().toISOString();

      // Update idea status
      const { error: updateError } = await supabase
        .from('ideas')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error('Failed to update idea status:', updateError.message);
        throw new Error(`Failed to update idea status: ${updateError.message}`);
      }

      // Create approval record (except for pending_approval status)
      if (status !== 'pending_approval') {
        const { error: approvalError } = await supabase
          .from('idea_approvals')
          .insert({
            idea_id: id,
            approver_id: userId,
            approver_role: userRole,
            action,
            comments
          });

        if (approvalError) {
          console.error('Failed to create approval:', approvalError.message);
          // Don't throw, status was updated successfully
        }
      }
    } catch (err) {
      console.error('Error in updateStatusWithApproval:', err);
      throw err;
    }
  },

  async getComments(ideaId: string): Promise<IdeaComment[]> {
    try {
      const { data: comments, error } = await supabase
        .from('idea_comments')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch comments:', error.message);
        throw new Error(`Failed to fetch comments: ${error.message}`);
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
      console.error('Error in getComments:', err);
      throw err;
    }
  },

  async addComment(ideaId: string, userId: string, content: string): Promise<IdeaComment> {
    try {
      const { data: comment, error } = await supabase
        .from('idea_comments')
        .insert({
          idea_id: ideaId,
          user_id: userId,
          content
        })
        .select('*')
        .single();

      if (error) {
        console.error('Failed to add comment:', error.message);
        throw new Error(`Failed to add comment: ${error.message}`);
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
      console.error('Error in addComment:', err);
      throw err;
    }
  },

  async getApprovals(ideaId: string): Promise<IdeaApproval[]> {
    try {
      const { data: approvals, error } = await supabase
        .from('idea_approvals')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch approvals:', error.message);
        throw new Error(`Failed to fetch approvals: ${error.message}`);
      }

      if (!approvals) return [];

      // Fetch approver info separately for each approval
      const approvalsWithUsers = await Promise.all(
        approvals.map(async (approval: any) => {
          let approver = undefined;
          if (approval.approver_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, email, full_name, avatar_url')
              .eq('id', approval.approver_id)
              .maybeSingle();
            approver = userData || undefined;
          }
          return { ...approval, approver };
        })
      );

      return approvalsWithUsers;
    } catch (err) {
      console.error('Error in getApprovals:', err);
      throw err;
    }
  }
};
