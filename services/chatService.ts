
import { mockDb } from '../lib/mockDb';
import { Conversation, Message } from '../types';

export const chatService = {
  async getConversations(userId: string, orgId: string): Promise<Conversation[]> {
    const parts = mockDb.filter('conversation_participants', (cp: any) => cp.user_id === userId);
    const convIds = parts.map((cp: any) => cp.conversation_id);
    
    const convs = mockDb.filter('conversations', (c: any) => convIds.includes(c.id) && c.organization_id === orgId);
    
    return convs.map((c: any) => {
        const participants = mockDb.filter('conversation_participants', (cp: any) => cp.conversation_id === c.id)
            .map((cp: any) => mockDb.find('users', (u: any) => u.id === cp.user_id));
        return { ...c, participants };
    }).sort((a: any, b: any) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  },

  async getProjectConversation(projectId: string, type: 'project' | 'client'): Promise<Conversation> {
    const existing = mockDb.find('conversations', (c: any) => c.project_id === projectId && c.type === type);
    
    if (existing) {
       return existing as Conversation;
    }

    // If not exists, create one (auto-generated for demo)
    const project: any = mockDb.find('projects', (p: any) => p.id === projectId);
    if (!project) throw new Error("Project not found");

    const name = type === 'project' ? `${project.name} - Team` : `${project.name} - Client`;
    
    const conv = mockDb.insert<Conversation>('conversations', {
      organization_id: project.organization_id,
      type,
      name,
      project_id: projectId,
      last_message_at: new Date().toISOString()
    });

    // Add members automatically based on project members
    const members = mockDb.filter('project_members', (pm: any) => pm.project_id === projectId);
    members.forEach((m: any) => {
        // Filter clients out of internal chat if needed, or vice versa
        // For simplicity, add all for now
        mockDb.insert('conversation_participants', {
            conversation_id: conv.id,
            user_id: m.user_id,
            joined_at: new Date().toISOString()
        });
    });

    return conv;
  },

  async createConversation(
    orgId: string, 
    type: 'dm' | 'project' | 'client', 
    participantIds: string[],
    name?: string,
    projectId?: string
  ): Promise<string> {
    const conv = mockDb.insert<Conversation>('conversations', {
      organization_id: orgId,
      type,
      name,
      project_id: projectId,
      last_message_at: new Date().toISOString()
    });

    participantIds.forEach(uid => {
        mockDb.insert('conversation_participants', {
            conversation_id: conv.id,
            user_id: uid,
            joined_at: new Date().toISOString()
        });
    });

    return conv.id;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const msgs = mockDb.filter('messages', (m: any) => m.conversation_id === conversationId);
    return msgs.map((m: any) => ({
        ...m,
        user: mockDb.find('users', (u: any) => u.id === m.user_id)
    })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async sendMessage(conversationId: string, userId: string, content: string): Promise<Message> {
    const msg = mockDb.insert<Message>('messages', {
        conversation_id: conversationId,
        user_id: userId,
        content
    });

    mockDb.update('conversations', conversationId, { last_message_at: new Date().toISOString() });
    
    const user = mockDb.find('users', (u: any) => u.id === userId);
    return { ...msg, user };
  },

  subscribeToMessages(conversationId: string, callback: (msg: Message) => void) {
    // Mock subscription
    return { unsubscribe: () => {} };
  }
};
