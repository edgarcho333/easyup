import { supabase } from '../lib/supabase';

export const userService = {
  async updateProfile(userId: string, data: { full_name?: string; avatar_url?: string }): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async changePassword(oldPass: string, newPass: string): Promise<void> {
    if (newPass.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPass
    });

    if (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  async updatePreferences(userId: string, prefs: any): Promise<void> {
    // Update user metadata in Supabase Auth
    const { error } = await supabase.auth.updateUser({
      data: { preferences: prefs }
    });

    if (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user profile
    await this.updateProfile(userId, { avatar_url: data.publicUrl });

    return data.publicUrl;
  }
};
