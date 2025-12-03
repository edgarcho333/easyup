import { supabase } from '../lib/supabase';
import { Invitation, Role, TeamMember, Organization, Project } from '../types';
import { generateInviteToken, getExpiryDate } from '../lib/mockDb';

export const organizationService = {
  async getTeamMembers(organizationId: string): Promise<TeamMember[]> {
    console.log('🔵 [organizationService] getTeamMembers called for org:', organizationId);
    const members: TeamMember[] = [];

    // Get active memberships
    const { data: memberships, error: memError } = await supabase
      .from('user_organizations')
      .select('id, user_id, role_id, status, joined_at')
      .eq('organization_id', organizationId)
      .neq('status', 'inactive');

    console.log('🔵 [organizationService] Memberships result:', { memberships, memError });

    if (memError) {
      console.error('Error fetching memberships:', memError);
      return [];
    }

    // Fetch user and role info separately for each membership
    for (const m of (memberships || [])) {
      console.log('🔵 [organizationService] Processing membership:', m);

      // Get user info from users table first
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url')
        .eq('id', m.user_id)
        .maybeSingle();

      console.log('🔵 [organizationService] User result from users table:', { user, userError });

      // If user not in users table, try to get from current auth session
      if (!user) {
        console.log('⚠️ [organizationService] User not in users table, checking current session...');

        // Check if this is the current logged-in user
        const { data: sessionData } = await supabase.auth.getUser();

        if (sessionData?.user && sessionData.user.id === m.user_id) {
          user = {
            id: sessionData.user.id,
            email: sessionData.user.email || '',
            full_name: sessionData.user.user_metadata?.full_name || sessionData.user.email?.split('@')[0] || 'Unknown',
            avatar_url: sessionData.user.user_metadata?.avatar_url || null
          };
          console.log('✅ [organizationService] Got user from current session:', user);

          // Also insert into users table for future queries
          await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              avatar_url: user.avatar_url,
              created_at: new Date().toISOString()
            }, { onConflict: 'id' })
            .then(() => console.log('✅ [organizationService] User synced to users table'))
            .catch(err => console.error('⚠️ [organizationService] Failed to sync user:', err));
        }
      }

      // Get role info
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id, name, display_name')
        .eq('id', m.role_id)
        .maybeSingle();

      console.log('🔵 [organizationService] Role result:', { role, roleError });

      if (user && role) {
        members.push({
          membershipId: m.id,
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          role: role as Role,
          status: m.status,
          joined_at: m.joined_at,
          type: 'member'
        });
      } else if (role) {
        // If we still don't have user info, add with minimal info
        console.log('⚠️ [organizationService] Adding member with minimal info');
        members.push({
          membershipId: m.id,
          id: m.user_id,
          email: 'Unknown',
          full_name: 'Unknown User',
          avatar_url: null,
          role: role as Role,
          status: m.status,
          joined_at: m.joined_at,
          type: 'member'
        });
      }
    }

    console.log('✅ [organizationService] Final members:', members);

    // Get pending invitations (skip if table doesn't exist)
    try {
      const { data: invitations, error: invError } = await supabase
        .from('invitations')
        .select('id, email, role_id, invited_by, created_at')
        .eq('organization_id', organizationId)
        .eq('status', 'pending');

      if (invError) {
        console.error('Error fetching invitations:', invError);
      } else {
        // Map invitations with separate queries
        for (const inv of (invitations || [])) {
          // Get role info
          const { data: role } = await supabase
            .from('roles')
            .select('id, name, display_name')
            .eq('id', inv.role_id)
            .maybeSingle();

          if (role) {
            let inviterName = 'Unknown';
            if (inv.invited_by) {
              const { data: inviter } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', inv.invited_by)
                .maybeSingle();
              inviterName = inviter?.full_name || 'Unknown';
            }

            members.push({
              membershipId: inv.id,
              email: inv.email,
              role: role as Role,
              status: 'pending',
              joined_at: inv.created_at,
              type: 'invitation',
              invited_by_name: inviterName
            });
          }
        }
      }
    } catch (err) {
      console.error('Invitations table may not exist:', err);
    }

    return members.sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime());
  },

  async getRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('id, name, display_name');

    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }

    return (data || []) as Role[];
  },

  async inviteMember(
    email: string,
    roleId: string,
    organizationId: string,
    invitedBy: string,
    personalMessage?: string,
    projectId?: string
  ): Promise<{ token: string; inviteLink: string }> {
    // Check if user is already a member
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      const { data: membership } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('organization_id', organizationId)
        .single();

      if (membership) {
        throw new Error('User is already a member of this organization');
      }
    }

    // Check if already invited
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      throw new Error('User has already been invited');
    }

    // Generate unique token
    const token = generateInviteToken();
    const expiresAt = getExpiryDate(7); // 7 days expiry

    // Create invitation with token
    const { error } = await supabase
      .from('invitations')
      .insert({
        email,
        organization_id: organizationId,
        project_id: projectId || null,
        role_id: roleId,
        invited_by: invitedBy,
        personal_message: personalMessage || null,
        token,
        expires_at: expiresAt,
        status: 'pending'
      });

    if (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }

    // Generate invite link
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/#/invite/${token}`;

    return { token, inviteLink };
  },

  async getInvitationByToken(token: string): Promise<Invitation | null> {
    console.log('🔵 [getInvitationByToken] Looking for token:', token);

    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        organization:organizations(id, name, owner_id, created_at, settings),
        project:projects(id, name, client_name),
        role:roles(id, name, display_name)
      `)
      .eq('token', token)
      .single();

    console.log('🔵 [getInvitationByToken] Result:', { data, error });

    if (error || !data) {
      console.error('❌ [getInvitationByToken] Error or no data:', error);
      return null;
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', data.id);
      return null;
    }

    // Check if already accepted or cancelled
    if (data.status !== 'pending') {
      return null;
    }

    // Fetch inviter info
    let inviter;
    if (data.invited_by) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url')
        .eq('id', data.invited_by)
        .maybeSingle();
      inviter = userData || undefined;
    }

    return {
      ...data,
      inviter
    } as Invitation;
  },

  async acceptInvitationByToken(token: string, userId: string): Promise<void> {
    console.log('🔵 [acceptInvitationByToken] Starting...', { token, userId });

    // Get invitation details
    const invitation = await this.getInvitationByToken(token);
    console.log('🔵 [acceptInvitationByToken] Invitation:', invitation);

    if (!invitation) {
      console.error('❌ [acceptInvitationByToken] Invitation not found');
      throw new Error('Invitation not found or expired');
    }

    // Create organization membership
    console.log('🔵 [acceptInvitationByToken] Creating membership...', {
      user_id: userId,
      organization_id: invitation.organization_id,
      role_id: invitation.role_id
    });

    const { error: memError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: invitation.organization_id,
        role_id: invitation.role_id,
        status: 'active',
        invited_by: invitation.invited_by,
        joined_at: new Date().toISOString()
      });

    if (memError) {
      console.error('❌ [acceptInvitationByToken] Error creating membership:', memError);
      throw memError;
    }
    console.log('✅ [acceptInvitationByToken] Membership created');

    // If project_id exists, also add to project
    if (invitation.project_id) {
      console.log('🔵 [acceptInvitationByToken] Adding to project:', invitation.project_id);
      const { error: projMemError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitation.project_id,
          user_id: userId,
          role_id: invitation.role_id,
          is_lead: false,
          added_at: new Date().toISOString()
        });

      if (projMemError) {
        console.error('❌ [acceptInvitationByToken] Error adding to project:', projMemError);
        // Don't throw - org membership was successful
      } else {
        console.log('✅ [acceptInvitationByToken] Added to project');
      }
    }

    // Update invitation status
    console.log('🔵 [acceptInvitationByToken] Updating invitation status...');
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('❌ [acceptInvitationByToken] Error updating invitation:', updateError);
    } else {
      console.log('✅ [acceptInvitationByToken] Invitation accepted successfully');
    }
  },

  async getOrganizationProjects(organizationId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, client_name, status')
      .eq('organization_id', organizationId)
      .neq('status', 'archived');

    if (error) {
      console.error('Error fetching organization projects:', error);
      return [];
    }

    return data as Project[];
  },

  async updateMemberRole(membershipId: string, newRoleId: string): Promise<void> {
    const { error } = await supabase
      .from('user_organizations')
      .update({ role_id: newRoleId })
      .eq('id', membershipId);

    if (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  },

  async removeMember(membershipId: string, organizationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_organizations')
      .delete()
      .eq('id', membershipId);

    if (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  },

  async revokeInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Error revoking invitation:', error);
      throw error;
    }
  },

  async createOrganization(name: string, ownerId: string): Promise<string> {
    console.log('🔵 [createOrganization] Starting...', { name, ownerId });

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        owner_id: ownerId,
        settings: {}
      })
      .select('id')
      .single();

    if (orgError || !org) {
      console.error('❌ [createOrganization] Error creating organization:', orgError);
      throw new Error('Failed to create organization');
    }
    console.log('✅ [createOrganization] Organization created:', org.id);

    // Get super_admin role
    const { data: superAdminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'super_admin')
      .single();

    if (roleError || !superAdminRole) {
      console.error('❌ [createOrganization] super_admin role not found:', roleError);
      throw new Error('Super admin role not found');
    }
    console.log('✅ [createOrganization] super_admin role found:', superAdminRole.id);

    // Add owner as super_admin
    const { error: membershipError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: ownerId,
        organization_id: org.id,
        role_id: superAdminRole.id,
        status: 'active',
        joined_at: new Date().toISOString()
      });

    if (membershipError) {
      console.error('❌ [createOrganization] Error creating membership:', membershipError);
      throw new Error('Failed to add owner to organization');
    }
    console.log('✅ [createOrganization] Owner added as super_admin');

    return org.id;
  },

  async updateOrganization(orgId: string, updates: { name: string }): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId);

    if (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  },

  async getUserInvitations(email: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        organization:organizations(id, name, owner_id, created_at, settings),
        role:roles(id, name, display_name)
      `)
      .eq('email', email)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching user invitations:', error);
      return [];
    }

    // Fetch inviter info separately for each invitation
    const invitationsWithInviters = await Promise.all(
      (data || []).map(async (inv: any) => {
        let inviter;
        if (inv.invited_by) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url')
            .eq('id', inv.invited_by)
            .maybeSingle();
          inviter = userData || undefined;
        }

        return {
          id: inv.id,
          email: inv.email,
          organization_id: inv.organization_id,
          role_id: inv.role_id,
          invited_by: inv.invited_by,
          status: inv.status,
          personal_message: inv.personal_message,
          created_at: inv.created_at,
          organization: inv.organization,
          role: inv.role,
          inviter
        };
      })
    );

    return invitationsWithInviters;
  },

  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    console.log('🔵 [acceptInvitation] Starting...', { invitationId, userId });

    // Get invitation details
    const { data: invite, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    console.log('🔵 [acceptInvitation] Invitation:', invite, invError);

    if (invError || !invite) {
      throw new Error('Invitation not found');
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', invite.organization_id)
      .maybeSingle();

    if (existingMembership) {
      console.log('⚠️ [acceptInvitation] User already a member, skipping membership creation');
    } else {
      // Create membership
      console.log('🔵 [acceptInvitation] Creating membership...');
      const { error: memError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userId,
          organization_id: invite.organization_id,
          role_id: invite.role_id,
          status: 'active',
          invited_by: invite.invited_by,
          joined_at: new Date().toISOString()
        });

      if (memError) {
        console.error('❌ [acceptInvitation] Error creating membership:', memError);
        throw memError;
      }
      console.log('✅ [acceptInvitation] Membership created');
    }

    // If project_id exists, also add to project
    if (invite.project_id) {
      // Check if already a project member
      const { data: existingProjectMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('user_id', userId)
        .eq('project_id', invite.project_id)
        .maybeSingle();

      if (existingProjectMember) {
        console.log('⚠️ [acceptInvitation] User already in project, skipping');
      } else {
        console.log('🔵 [acceptInvitation] Adding to project:', invite.project_id);
        const { error: projMemError } = await supabase
          .from('project_members')
          .insert({
            project_id: invite.project_id,
            user_id: userId,
            role_id: invite.role_id,
            is_lead: false,
            added_at: new Date().toISOString()
          });

        if (projMemError) {
          console.error('❌ [acceptInvitation] Error adding to project:', projMemError);
        } else {
          console.log('✅ [acceptInvitation] Added to project');
        }
      }
    }

    // Update invitation status
    console.log('🔵 [acceptInvitation] Updating invitation status...');
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);

    if (updateError) {
      console.error('❌ [acceptInvitation] Error updating invitation status:', updateError);
      throw new Error('Failed to update invitation status');
    }

    console.log('✅ [acceptInvitation] Invitation accepted');
  }
};
