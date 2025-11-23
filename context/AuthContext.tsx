
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AuthState, CurrentUser, UserRoleName } from '../types';
import { mockDb } from '../lib/mockDb';
import { organizationService } from '../services/organizationService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, orgName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  switchOrganization: (orgId: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    localStorage.getItem('easyup_last_org_id')
  );

  // Helper to build the full user object with joins
  const buildUser = (userRecord: any, preferredOrgId?: string | null): CurrentUser => {
    // Get memberships
    const memberships = mockDb.filter('user_organizations', (uo: any) => uo.user_id === userRecord.id && uo.status === 'active');
    
    // Get organizations details
    const organizations = memberships.map((m: any) => {
      const org = mockDb.find('organizations', (o: any) => o.id === m.organization_id);
      return org;
    }).filter(Boolean);

    let currentMembership: any = null;
    let currentOrg: any = null;

    if (organizations.length > 0) {
      // Try to find preferred
      if (preferredOrgId) {
        currentOrg = organizations.find((o: any) => o.id === preferredOrgId);
        if (currentOrg) {
          currentMembership = memberships.find((m: any) => m.organization_id === preferredOrgId);
        }
      }

      // Fallback to first
      if (!currentOrg) {
        currentOrg = organizations[0];
        currentMembership = memberships[0];
        if (currentOrg) {
          localStorage.setItem('easyup_last_org_id', currentOrg.id);
        }
      }
    }

    // Get Role Name
    let roleName: UserRoleName | null = null;
    if (currentMembership) {
      const role = mockDb.find('roles', (r: any) => r.id === currentMembership.role_id);
      if (role) roleName = role.name as UserRoleName;
    }

    return {
      id: userRecord.id,
      email: userRecord.email,
      full_name: userRecord.full_name,
      avatar_url: userRecord.avatar_url,
      currentOrganization: currentOrg || null,
      currentRole: roleName,
      currentMembershipId: currentMembership?.id || null,
      organizations: organizations as any[],
    };
  };

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      const storedUserId = localStorage.getItem('easyup_session_user_id');
      
      if (storedUserId) {
        const userRecord = mockDb.find('users', (u: any) => u.id === storedUserId);
        if (userRecord) {
          const currentUser = buildUser(userRecord, selectedOrgId);
          setState({
            user: currentUser,
            isAuthenticated: true,
            isLoading: false
          });
          return;
        }
      }

      // No session found
      setState({ user: null, isAuthenticated: false, isLoading: false });
    };

    // Simulate a small delay for "loading"
    setTimeout(loadSession, 500);
  }, []);

  // Handle Org Switch Effect
  useEffect(() => {
    if (state.user && selectedOrgId && state.user.currentOrganization?.id !== selectedOrgId) {
      // Rebuild user with new org
      const rawUser = mockDb.find('users', (u: any) => u.id === state.user!.id);
      if (rawUser) {
        const updatedUser = buildUser(rawUser, selectedOrgId);
        setState(prev => ({ ...prev, user: updatedUser }));
      }
    }
  }, [selectedOrgId]);

  const login = async (email: string, pass: string) => {
    // Simulating auth check
    const userRecord = mockDb.find('users', (u: any) => u.email === email);
    
    if (!userRecord) {
      throw new Error('Invalid credentials');
    }

    // In a real mock, we might check password, but for now we trust email
    localStorage.setItem('easyup_session_user_id', userRecord.id);
    
    const currentUser = buildUser(userRecord, selectedOrgId);
    setState({ user: currentUser, isAuthenticated: true, isLoading: false });
  };

  const register = async (email: string, pass: string, name: string, orgName: string) => {
    // Check if exists
    const existing = mockDb.find('users', (u: any) => u.email === email);
    if (existing) throw new Error('User already exists');

    // Create User
    const newUser = mockDb.insert<any>('users', {
      email,
      full_name: name,
      password_hash: 'mock_hash', // dummy
    });

    // Create Org
    if (orgName) {
      await organizationService.createOrganization(orgName, newUser.id);
    }

    // Auto-Join Invitation Logic (Mock Trigger)
    const pendingInvites = mockDb.filter('invitations', (i: any) => i.email === email && i.status === 'pending');
    pendingInvites.forEach((invite: any) => {
      mockDb.insert('user_organizations', {
        user_id: newUser.id,
        organization_id: invite.organization_id,
        role_id: invite.role_id,
        invited_by: invite.invited_by,
        status: 'active',
        joined_at: new Date().toISOString()
      });
      mockDb.update('invitations', invite.id, { status: 'accepted' });
    });

    // Login immediately
    localStorage.setItem('easyup_session_user_id', newUser.id);
    const currentUser = buildUser(newUser, null);
    setState({ user: currentUser, isAuthenticated: true, isLoading: false });
  };

  const logout = async () => {
    localStorage.removeItem('easyup_session_user_id');
    localStorage.removeItem('easyup_last_org_id');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };
  
  const resetPassword = async (email: string) => {
    console.log(`Mock password reset email sent to ${email}`);
  };

  const updatePassword = async (password: string) => {
    console.log('Mock password updated');
  };

  const switchOrganization = (orgId: string) => {
    localStorage.setItem('easyup_last_org_id', orgId);
    setSelectedOrgId(orgId);
  };

  const refreshProfile = async () => {
    if (state.user) {
      const rawUser = mockDb.find('users', (u: any) => u.id === state.user!.id);
      if (rawUser) {
        const updatedUser = buildUser(rawUser, selectedOrgId);
        setState(prev => ({ ...prev, user: updatedUser }));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, resetPassword, updatePassword, switchOrganization, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
