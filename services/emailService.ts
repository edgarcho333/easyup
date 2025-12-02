import { supabase } from '../lib/supabase';

interface SendInvitationEmailParams {
  email: string;
  organizationName: string;
  inviterName: string;
  roleName: string;
  projectName?: string;
  inviteLink: string;
  personalMessage?: string;
}

export const emailService = {
  /**
   * Send invitation email via Supabase Edge Function
   * Falls back to console.log in dev mode if Edge Function is not available
   */
  async sendInvitationEmail(params: SendInvitationEmailParams): Promise<boolean> {
    const {
      email,
      organizationName,
      inviterName,
      roleName,
      projectName,
      inviteLink,
      personalMessage
    } = params;

    try {
      // Try to call Edge Function
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          email,
          organizationName,
          inviterName,
          roleName,
          projectName,
          inviteLink,
          personalMessage
        }
      });

      if (error) {
        console.warn('Edge Function not available, logging invitation:', error.message);
        // Fall back to console logging in dev mode
        console.log('📧 [DEV MODE] Invitation Email:');
        console.log('  To:', email);
        console.log('  Organization:', organizationName);
        console.log('  Invited by:', inviterName);
        console.log('  Role:', roleName);
        if (projectName) console.log('  Project:', projectName);
        console.log('  Link:', inviteLink);
        if (personalMessage) console.log('  Message:', personalMessage);
        return true; // Return success in dev mode
      }

      console.log('✅ Invitation email sent successfully:', data);
      return true;

    } catch (err) {
      console.error('Error sending invitation email:', err);
      // In dev mode, we don't want to block the invitation flow
      console.log('📧 [DEV MODE] Would send invitation email to:', email);
      console.log('🔗 Invite link:', inviteLink);
      return true;
    }
  }
};
