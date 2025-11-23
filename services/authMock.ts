import { CurrentUser, Organization } from '../types';

// Simulating database latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data
const MOCK_USER: CurrentUser = {
  id: 'user-123',
  email: 'demo@easyup.com',
  full_name: 'Alex Designer',
  avatar_url: 'https://picsum.photos/200',
  currentOrganization: {
    id: 'org-1',
    name: 'Creative Minds Agency',
    owner_id: 'user-123',
    created_at: new Date().toISOString(),
    settings: {}
  },
  currentRole: 'super_admin',
  currentMembershipId: 'membership-123',
  organizations: [
    {
      id: 'org-1',
      name: 'Creative Minds Agency',
      owner_id: 'user-123',
      created_at: new Date().toISOString(),
      settings: {}
    }
  ]
};

export const authService = {
  async login(email: string, password: string): Promise<CurrentUser> {
    await delay(1000);
    if (email === 'error@test.com') throw new Error('Invalid credentials');
    
    // Simulate a successful login returning the mock user
    // In a real Supabase app, this would call supabase.auth.signInWithPassword
    return {
      ...MOCK_USER,
      email
    };
  },

  async register(email: string, password: string, fullName: string, orgName: string): Promise<CurrentUser> {
    await delay(1500);
    
    // Simulate creating user, org, and linking them
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: orgName,
      owner_id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
      settings: {}
    };

    return {
      id: `user-${Date.now()}`,
      email,
      full_name: fullName,
      avatar_url: undefined,
      currentOrganization: newOrg,
      currentRole: 'super_admin',
      currentMembershipId: `membership-${Date.now()}`,
      organizations: [newOrg]
    };
  },

  async logout(): Promise<void> {
    await delay(500);
  },

  async resetPassword(email: string): Promise<void> {
    await delay(1000);
    // Simulate sending email
  }
};