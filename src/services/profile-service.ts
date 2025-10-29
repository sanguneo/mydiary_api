import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  settings: Record<string, unknown> | null;
  role: string | null;
}

export class ProfileService {
  async ensureProfile(userId: string, email?: string | null) {
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      email: email ?? null,
    });
    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }
  }

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, settings, role')
      .eq('id', userId)
      .maybeSingle<Profile>();
    if (error) {
      throw new Error(`Failed to load profile: ${error.message}`);
    }
    if (!data) {
      return null;
    }
    return data;
  }

  async updateProfile(userId: string, updates: { display_name?: string; settings?: Record<string, unknown> }) {
    const payload: Record<string, unknown> = {};
    if (typeof updates.display_name !== 'undefined') {
      payload.display_name = updates.display_name;
    }
    if (typeof updates.settings !== 'undefined') {
      payload.settings = updates.settings ?? {};
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('id, email, display_name, settings, role')
      .maybeSingle<Profile>();
    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
    return data;
  }
}

export const profileService = new ProfileService();
