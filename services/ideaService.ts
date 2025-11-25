
import { mockDb } from '../lib/mockDb';
import { Idea, IdeaComment, IdeaStatus, IdeaApproval } from '../types';

export const ideaService = {
  async getProjectIdeas(projectId: string): Promise<Idea[]> {
    const ideas = mockDb.filter('ideas', (i: any) => i.project_id === projectId);
    
    return ideas.map((i: any) => ({
        ...i,
        creator: mockDb.find('users', (u: any) => u.id === i.created_by)
    })).sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },

  async getIdea(ideaId: string): Promise<Idea> {
    const idea: any = mockDb.find('ideas', (i: any) => i.id === ideaId);
    if (!idea) throw new Error("Idea not found");
    
    const creator = mockDb.find('users', (u: any) => u.id === idea.created_by);
    return { ...idea, creator };
  },

  async createIdea(idea: Partial<Idea>): Promise<Idea> {
    return mockDb.insert('ideas', idea);
  },

  async updateIdea(id: string, updates: Partial<Idea>): Promise<void> {
    mockDb.update('ideas', id, updates);
  },

  async deleteIdea(id: string): Promise<void> {
    mockDb.delete('ideas', id);
  },

  async updateStatusWithApproval(
    id: string, 
    status: IdeaStatus, 
    userId: string, 
    userRole: string,
    action: 'approved' | 'rejected' | 'requested_changes',
    comments?: string
  ): Promise<void> {
    
    const updates: any = { status };
    if (status === 'pending_approval') updates.submitted_at = new Date().toISOString();
    if (status === 'scheduled') updates.approved_at = new Date().toISOString();

    mockDb.update('ideas', id, updates);

    if (status !== 'pending_approval') {
      mockDb.insert('idea_approvals', {
        idea_id: id,
        approver_id: userId,
        approver_role: userRole,
        action,
        comments
      });
    }
  },

  async getComments(ideaId: string): Promise<IdeaComment[]> {
    const comments = mockDb.filter('idea_comments', (c: any) => c.idea_id === ideaId);
    return comments.map((c: any) => ({
        ...c,
        user: mockDb.find('users', (u: any) => u.id === c.user_id)
    })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async addComment(ideaId: string, userId: string, content: string): Promise<IdeaComment> {
    const comment = mockDb.insert<IdeaComment>('idea_comments', {
        idea_id: ideaId,
        user_id: userId,
        content
    });
    const user = mockDb.find('users', (u: any) => u.id === userId);
    return { ...comment, user };
  },

  async getApprovals(ideaId: string): Promise<IdeaApproval[]> {
    const approvals = mockDb.filter('idea_approvals', (a: any) => a.idea_id === ideaId);
    return approvals.map((a: any) => ({
        ...a,
        approver: mockDb.find('users', (u: any) => u.id === a.approver_id)
    })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
};
