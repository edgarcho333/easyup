
import { mockDb } from '../lib/mockDb';
import { Invitation, Role, TeamMember, Organization } from '../types';

export const organizationService = {
  async getTeamMembers(organizationId: string): Promise<TeamMember[]> {
    // Get Memberships
    const memberships = mockDb.filter('user_organizations', (uo: any) => uo.organization_id === organizationId && uo.status !== 'inactive');

    // Get Pending Invitations
    const invitations = mockDb.filter('invitations', (i: any) => i.organization_id === organizationId && i.status === 'pending');

    const members: TeamMember[] = [];

    // Map Active Members
    memberships.forEach((m: any) => {
      const user = mockDb.find('users', (u: any) => u.id === m.user_id);
      const role = mockDb.find('roles', (r: any) => r.id === m.role_id);
      
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
    });

    // Map Invitations
    invitations.forEach((inv: any) => {
      const role = mockDb.find('roles', (r: any) => r.id === inv.role_id);
      const inviter = mockDb.find('users', (u: any) => u.id === inv.invited_by);
      
      if (role) {
        members.push({
          membershipId: inv.id,
          email: inv.email,
          role: role as Role,
          status: 'pending',
          joined_at: inv.created_at,
          type: 'invitation',
          invited_by_name: inviter?.full_name || 'Unknown'
        });
      }
    });

    return members.sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime());
  },

  async getRoles(): Promise<Role[]> {
    return mockDb.getRoles() as Role[];
  },

  async inviteMember(email: string, roleId: string, organizationId: string, invitedBy: string, personalMessage?: string): Promise<void> {
    // Check if user is already a member
    const existingUser = mockDb.find('users', (u: any) => u.email === email);
    if (existingUser) {
      const membership = mockDb.find('user_organizations', (uo: any) => uo.user_id === existingUser.id && uo.organization_id === organizationId);
      if (membership) throw new Error("User is already a member of this organization");
    }

    // Check if already invited
    const existingInvite = mockDb.find('invitations', (i: any) => i.email === email && i.organization_id === organizationId && i.status === 'pending');
    if (existingInvite) throw new Error("User has already been invited");

    mockDb.insert('invitations', {
      email,
      organization_id: organizationId,
      role_id: roleId,
      invited_by: invitedBy,
      personal_message: personalMessage,
      status: 'pending'
    });
  },

  async updateMemberRole(membershipId: string, newRoleId: string): Promise<void> {
    mockDb.update('user_organizations', membershipId, { role_id: newRoleId });
  },

  async removeMember(membershipId: string, organizationId: string, userId: string): Promise<void> {
    // In a real app, we check permissions here. Mock assumes frontend checks passed.
    mockDb.delete('user_organizations', membershipId);
  },

  async revokeInvitation(invitationId: string): Promise<void> {
    mockDb.delete('invitations', invitationId);
  },

  async createOrganization(name: string, ownerId: string): Promise<string> {
    const org = mockDb.insert<Organization>('organizations', {
      name,
      owner_id: ownerId,
      settings: {}
    });

    const superAdminRole = mockDb.find('roles', (r: any) => r.name === 'super_admin');
    
    mockDb.insert('user_organizations', {
      user_id: ownerId,
      organization_id: org.id,
      role_id: superAdminRole?.id,
      status: 'active',
      joined_at: new Date().toISOString()
    });

    return org.id;
  },

  async updateOrganization(orgId: string, updates: { name: string }): Promise<void> {
    mockDb.update('organizations', orgId, updates);
  },

  async getUserInvitations(email: string): Promise<Invitation[]> {
    const invites = mockDb.filter('invitations', (i: any) => i.email === email && i.status === 'pending');
    
    return invites.map((inv: any) => {
      const org = mockDb.find('organizations', (o: any) => o.id === inv.organization_id);
      const role = mockDb.find('roles', (r: any) => r.id === inv.role_id);
      const inviter = mockDb.find('users', (u: any) => u.id === inv.invited_by);

      return {
        ...inv,
        organization: org,
        role: role,
        inviter: inviter
      };
    });
  },

  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    const invite: any = mockDb.find('invitations', (i: any) => i.id === invitationId);
    if (!invite) throw new Error("Invitation not found");

    mockDb.insert('user_organizations', {
      user_id: userId,
      organization_id: invite.organization_id,
      role_id: invite.role_id,
      invited_by: invite.invited_by,
      status: 'active',
      joined_at: new Date().toISOString()
    });

    mockDb.update('invitations', invitationId, { status: 'accepted' });
  }
};
