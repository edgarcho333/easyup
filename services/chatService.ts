import { supabase } from '../lib/supabase';
import { Conversation, Message, ConversationType } from '../types';

export const chatService = {
  async getConversations(userId: string, orgId: string): Promise<Conversation[]> {
    // First get conversation IDs where user is participant
    const { data: participantData, error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (partError) {
      console.error('Error fetching conversation participants:', partError);
      return [];
    }

    const convIds = participantData?.map(p => p.conversation_id) || [];
    if (convIds.length === 0) return [];

    // Get conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .eq('organization_id', orgId)
      .order('last_message_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return [];
    }

    // Fetch participants for each conversation
    const conversationsWithParticipants = await Promise.all(
      (conversations || []).map(async (c: any) => {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', c.id);

        const users = await Promise.all(
          (participants || []).map(async (p: any) => {
            const { data: user } = await supabase
              .from('users')
              .select('id, email, full_name, avatar_url')
              .eq('id', p.user_id)
              .maybeSingle();
            return user;
          })
        );

        return {
          id: c.id,
          organization_id: c.organization_id,
          type: c.type as ConversationType,
          name: c.name,
          project_id: c.project_id,
          last_message_at: c.last_message_at,
          created_at: c.created_at,
          participants: users.filter(Boolean)
        };
      })
    );

    return conversationsWithParticipants;
  },

  async getProjectConversation(projectId: string, type: 'project' | 'client'): Promise<Conversation> {
    // Check if conversation exists
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', type)
      .maybeSingle();

    if (existing) {
      return existing as Conversation;
    }

    // Get project info to create conversation
    const { data: project, error: projError } = await supabase
      .from('projects')
      .select('id, name, organization_id')
      .eq('id', projectId)
      .single();

    if (projError || !project) {
      throw new Error('Project not found');
    }

    const name = type === 'project' ? `${project.name} - Team` : `${project.name} - Client`;

    // Create conversation
    const { data: conv, error: createError } = await supabase
      .from('conversations')
      .insert({
        organization_id: project.organization_id,
        type,
        name,
        project_id: projectId,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError || !conv) {
      throw new Error('Failed to create conversation');
    }

    // Add project members as participants
    const { data: members } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId);

    if (members && members.length > 0) {
      const participants = members.map(m => ({
        conversation_id: conv.id,
        user_id: m.user_id,
        joined_at: new Date().toISOString()
      }));

      await supabase.from('conversation_participants').insert(participants);
    }

    return conv as Conversation;
  },

  async createConversation(
    orgId: string,
    type: 'dm' | 'project' | 'client',
    participantIds: string[],
    name?: string,
    projectId?: string
  ): Promise<string> {
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({
        organization_id: orgId,
        type,
        name: name || null,
        project_id: projectId || null,
        last_message_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error || !conv) {
      throw new Error('Failed to create conversation');
    }

    // Add participants
    const participants = participantIds.map(uid => ({
      conversation_id: conv.id,
      user_id: uid,
      joined_at: new Date().toISOString()
    }));

    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert(participants);

    if (partError) {
      console.error('Error adding participants:', partError);
    }

    return conv.id;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    // Fetch user info separately for each message
    const messagesWithUsers = await Promise.all(
      (data || []).map(async (m: any) => {
        const { data: user } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .eq('id', m.user_id)
          .maybeSingle();

        return {
          id: m.id,
          conversation_id: m.conversation_id,
          user_id: m.user_id,
          content: m.content,
          attachment_url: m.attachment_url,
          attachment_name: m.attachment_name,
          attachment_type: m.attachment_type,
          created_at: m.created_at,
          user: user || undefined
        };
      })
    );

    return messagesWithUsers;
  },

  async sendMessage(conversationId: string, userId: string, content: string, file?: File): Promise<Message> {
    let attachmentData: { attachment_url?: string; attachment_name?: string; attachment_type?: string } = {};

    if (file) {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${conversationId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName);

        attachmentData = {
          attachment_url: urlData.publicUrl,
          attachment_name: file.name,
          attachment_type: file.type.startsWith('image/') ? 'image' : 'file'
        };
      }
    }

    const { data: msg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        content,
        ...attachmentData
      })
      .select('*')
      .single();

    if (error || !msg) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }

    // Fetch user info separately
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return {
      id: msg.id,
      conversation_id: msg.conversation_id,
      user_id: msg.user_id,
      content: msg.content,
      attachment_url: msg.attachment_url,
      attachment_name: msg.attachment_name,
      attachment_type: msg.attachment_type,
      created_at: msg.created_at,
      user: user || undefined
    };
  },

  subscribeToMessages(conversationId: string, callback: (msg: Message) => void) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch user info for the new message
          const { data: user } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          callback({
            ...payload.new as Message,
            user: user || undefined
          });
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};
