import { supabase } from '../lib/supabase';
import { Invitation, Role, TeamMember, Organization } from '../types';

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

      // Get user info
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url')
        .eq('id', m.user_id)
        .maybeSingle();

      console.log('🔵 [organizationService] User result:', { user, userError });

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

  async inviteMember(email: string, roleId: string, organizationId: string, invitedBy: string, personalMessage?: string): Promise<void> {
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

    // Create invitation
    const { error } = await supabase
      .from('invitations')
      .insert({
        email,
        organization_id: organizationId,
        role_id: roleId,
        invited_by: invitedBy,
        personal_message: personalMessage || null,
        status: 'pending'
      });

    if (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
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
      console.error('Error creating organization:', orgError);
      throw new Error('Failed to create organization');
    }

    // Get super_admin role
    const { data: superAdminRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'super_admin')
      .single();

    if (superAdminRole) {
      // Add owner as super_admin
      await supabase
        .from('user_organizations')
        .insert({
          user_id: ownerId,
          organization_id: org.id,
          role_id: superAdminRole.id,
          status: 'active',
          joined_at: new Date().toISOString()
        });
    }

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
    // Get invitation details
    const { data: invite, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (invError || !invite) {
      throw new Error('Invitation not found');
    }

    // Create membership
    const { error: memError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: invite.organization_id,
        role_id: invite.role_id,
        status: 'active',
        joined_at: new Date().toISOString()
      });

    if (memError) {
      console.error('Error creating membership:', memError);
      throw memError;
    }

    // Update invitation status
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);
  }
};
