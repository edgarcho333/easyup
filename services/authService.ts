import { supabase } from '../lib/supabase';
import { CurrentUser, UserRoleName } from '../types';

/**
 * Authentication Service using Supabase Auth + Supabase Tables
 *
 * FULLY MIGRATED:
 * - Auth: Supabase Auth (users)
 * - Organizations: Supabase tables
 * - Roles: Supabase tables
 * - User-Organization relationships: Supabase tables
 */

export const authService = {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<CurrentUser> {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('No user returned from authentication');
    }

    // Build CurrentUser from Supabase user + Supabase tables
    return buildCurrentUser(authData.user.id, authData.user.email!);
  },

  /**
   * Register new user and create organization
   */
  async register(
    email: string,
    password: string,
    fullName: string,
    orgName: string
  ): Promise<CurrentUser> {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      console.error('Registration failed:', authError.message);
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('No user returned from registration');
    }

    const userId = authData.user.id;

    // Insert into public.users table (manual sync since we can't use auth triggers)
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: authData.user.email!,
        full_name: fullName,
      });

    if (userError) {
      console.error('Failed to create user profile:', userError.message);
      // Don't throw - auth user was created successfully, this is just profile sync
    }

    // Create organization in Supabase
    const orgId = crypto.randomUUID();

    const { error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: orgId,
        name: orgName,
        owner_id: userId,
        settings: {},
      });

    if (orgError) {
      console.error('Failed to create organization:', orgError.message);
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // Build orgData manually (avoids SELECT policy)
    const orgData = {
      id: orgId,
      name: orgName,
      owner_id: userId,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Find super_admin role
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'super_admin')
      .single();

    if (roleError || !roleData) {
      console.error('Failed to find super_admin role:', roleError?.message);
      throw new Error('Super admin role not found');
    }

    // Create user-organization relationship
    const { error: membershipError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: orgData.id,
        role_id: roleData.id,
        status: 'active',
      });

    if (membershipError) {
      console.error('Failed to create membership:', membershipError.message);
      throw new Error(`Failed to create membership: ${membershipError.message}`);
    }

    // Build and return CurrentUser
    return {
      id: userId,
      email: authData.user.email!,
      full_name: fullName,
      avatar_url: undefined,
      currentOrganization: orgData,
      currentRole: 'super_admin' as UserRoleName,
      currentMembershipId: null, // Will be populated on next login
      organizations: [orgData],
    };
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Get current session
   */
  async getCurrentSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message);
    }
    return data.session;
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<CurrentUser | null> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Failed to get user:', error.message);
        return null;
      }

      if (!data.user) {
        return null;
      }

      return buildCurrentUser(data.user.id, data.user.email!);
    } catch (err) {
      console.error('Error in getCurrentUser:', err);
      return null;
    }
  },
};

/**
 * Helper function to build CurrentUser from Supabase user ID
 * Fetches all data from Supabase tables
 */
async function buildCurrentUser(userId: string, email: string): Promise<CurrentUser> {
  // Get user metadata from Supabase Auth
  const { data: userData } = await supabase.auth.getUser();
  const fullName = userData?.user?.user_metadata?.full_name || '';
  const avatarUrl = userData?.user?.user_metadata?.avatar_url;

  // Get user's organization memberships with roles (JOIN query)
  const { data: memberships, error: membershipError } = await supabase
    .from('user_organizations')
    .select(`
      id,
      organization_id,
      role_id,
      status,
      organizations (
        id,
        name,
        owner_id,
        settings,
        created_at
      ),
      roles (
        id,
        name,
        display_name
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  if (membershipError) {
    console.error('Failed to fetch memberships:', membershipError.message);
    throw new Error(`Failed to fetch memberships: ${membershipError.message}`);
  }

  if (!memberships || memberships.length === 0) {
    throw new Error('No organizations found for user');
  }

  // Extract organizations
  const organizations = memberships.map((m: any) => m.organizations).filter(Boolean);

  // Get current organization (from localStorage or first one)
  const lastOrgId = localStorage.getItem('easyup_last_org_id');
  let currentMembership = memberships.find((m: any) => m.organization_id === lastOrgId);

  if (!currentMembership) {
    currentMembership = memberships[0];
    if (currentMembership?.organization_id) {
      localStorage.setItem('easyup_last_org_id', currentMembership.organization_id);
    }
  }

  const currentOrg = currentMembership?.organizations;
  const roleName = (currentMembership?.roles?.name as UserRoleName) || 'client';

  return {
    id: userId,
    email,
    full_name: fullName,
    avatar_url: avatarUrl,
    currentOrganization: currentOrg || null,
    currentRole: roleName,
    currentMembershipId: currentMembership?.id || null,
    organizations,
  };
}
