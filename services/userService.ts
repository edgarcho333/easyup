
import { mockDb } from '../lib/mockDb';
import { CurrentUser } from '../types';

export const userService = {
  async updateProfile(userId: string, data: { full_name?: string; avatar_url?: string }): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    mockDb.update('users', userId, data);
  },

  async changePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app, we would verify oldPass hash here
    if (newPass.length < 8) throw new Error("Password must be at least 8 characters");
    // Mock update
    mockDb.update('users', userId, { password_hash: 'new_mock_hash' });
  },

  async updatePreferences(userId: string, prefs: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real app, this would update a preferences column or table
    console.log('Preferences updated for', userId, prefs);
  }
};
