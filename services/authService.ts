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
    console.log('🔵 Starting registration...', { email, fullName, orgName });

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
      console.error('❌ Auth signup error:', authError);
      throw new Error(authError.message);
    }

    if (!authData.user) {
      console.error('❌ No user returned from registration');
      throw new Error('No user returned from registration');
    }

    const userId = authData.user.id;
    console.log('✅ User created in Supabase Auth:', userId);

    // Add user to users table for profile info
    console.log('🔵 Adding user to users table...');
    const { error: userInsertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: fullName,
        avatar_url: null,
        created_at: new Date().toISOString()
      });

    if (userInsertError) {
      console.error('⚠️ Error adding user to users table:', userInsertError);
      // Don't throw - this might fail if user already exists or trigger handles it
    } else {
      console.log('✅ User added to users table');
    }

    // If orgName is empty, this is an invitation-based registration
    // Don't create organization - user will be added via invitation acceptance
    if (!orgName || orgName.trim() === '') {
      console.log('🔵 No org name provided - invitation-based registration');
      return {
        id: userId,
        email: authData.user.email!,
        full_name: fullName,
        avatar_url: undefined,
        currentOrganization: null,
        currentRole: null,
        currentMembershipId: null,
        organizations: [],
      };
    }

    // Create organization in Supabase
    console.log('🔵 Creating organization...', { name: orgName, owner_id: userId });

    // Generate org ID manually to avoid .select() which triggers SELECT policy recursion
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
      console.error('❌ Organization creation error:', orgError);
      console.error('Error details:', JSON.stringify(orgError, null, 2));
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

    console.log('✅ Organization created:', orgData);

    // Find super_admin role
    console.log('🔵 Finding super_admin role...');
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'super_admin')
      .single();

    if (roleError || !roleData) {
      console.error('❌ Role fetch error:', roleError);
      throw new Error('Super admin role not found');
    }

    console.log('✅ Role found:', roleData);

    // Create user-organization relationship
    console.log('🔵 Creating user-organization membership...');
    const { error: membershipError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: orgData.id,
        role_id: roleData.id,
        status: 'active',
      });

    if (membershipError) {
      console.error('❌ Membership creation error:', membershipError);
      throw new Error(`Failed to create membership: ${membershipError.message}`);
    }

    console.log('✅ Membership created successfully');

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
    console.log('🔵 [authService] getCurrentUser() called');

    try {
      console.log('🔵 [authService] Calling supabase.auth.getUser()...');

      // Add timeout to detect hanging promises
      const getUserPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('getUser() timeout after 5s')), 5000)
      );

      const { data, error } = await Promise.race([getUserPromise, timeoutPromise]) as any;

      console.log('🔵 [authService] getUser() returned:', { hasData: !!data, hasError: !!error, hasUser: !!data?.user });

      if (error) {
        console.error('❌ [authService] getUser() error:', error);
        return null;
      }

      if (!data.user) {
        console.log('⚠️ [authService] No user in session');
        return null;
      }

      console.log('✅ [authService] User found in session:', data.user.id, data.user.email);
      const result = await buildCurrentUser(data.user.id, data.user.email!);
      console.log('✅ [authService] buildCurrentUser completed');
      return result;
    } catch (err) {
      console.error('❌ [authService] Unexpected error in getCurrentUser:', err);
      return null;
    }
  },
};

/**
 * Helper function to build CurrentUser from Supabase user ID
 * Fetches all data from Supabase tables
 */
async function buildCurrentUser(userId: string, email: string): Promise<CurrentUser> {
  console.log('🔵 Building current user...', { userId, email });

  // Get user metadata from Supabase Auth
  const { data: userData } = await supabase.auth.getUser();
  const fullName = userData?.user?.user_metadata?.full_name || '';
  const avatarUrl = userData?.user?.user_metadata?.avatar_url;
  console.log('✅ User metadata:', { fullName, avatarUrl });

  // Get user's organization memberships with roles (JOIN query)
  console.log('🔵 Fetching memberships for user:', userId);
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
    console.error('❌ Membership fetch error:', membershipError);
    throw new Error(`Failed to fetch memberships: ${membershipError.message}`);
  }

  console.log('✅ Memberships fetched:', memberships);

  if (!memberships || memberships.length === 0) {
    console.log('⚠️ No organizations found for user - returning user without org');
    // Return user without organization - they may have pending invitations
    return {
      id: userId,
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
      currentOrganization: null,
      currentRole: null,
      currentMembershipId: null,
      organizations: [],
    };
  }

  // Extract organizations
  const organizations = memberships.map((m: any) => m.organizations).filter(Boolean);
  console.log('✅ Organizations extracted:', organizations);

  // Get current organization (from localStorage or first one)
  const lastOrgId = localStorage.getItem('easyup_last_org_id');
  console.log('🔵 Last org ID from localStorage:', lastOrgId);

  let currentMembership = memberships.find((m: any) => m.organization_id === lastOrgId);

  if (!currentMembership) {
    console.log('⚠️ Last org not found, using first membership');
    currentMembership = memberships[0];
    if (currentMembership?.organization_id) {
      localStorage.setItem('easyup_last_org_id', currentMembership.organization_id);
    }
  }

  const currentOrg = currentMembership?.organizations;
  const roleName = (currentMembership?.roles?.name as UserRoleName) || 'client';

  console.log('✅ Current user built:', {
    id: userId,
    email,
    currentOrg: currentOrg?.name,
    role: roleName
  });

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
