import { AppError } from '../lib/errors';
import { supabase, wrapQuery } from '../lib/supabase';
import type { IProfile } from '../types/profile/profile.types';

export class ProfileService {
  async ensureProfile(userId: string, email?: string | null): Promise<void> {
    await wrapQuery<IProfile[] | null>(
      async () =>
        await supabase.from('profiles').upsert({
          id: userId,
          email: email ?? null,
        }),
      { message: 'Failed to upsert profile', code: 'profile_upsert_failed', status: 500 },
    );
  }

  async getProfile(userId: string): Promise<IProfile | null> {
    const profile = await wrapQuery<IProfile | null>(
      async () =>
        await supabase
          .from('profiles')
          .select('id, email, display_name, settings, role')
          .eq('id', userId)
          .maybeSingle<IProfile>(),
      { message: 'Failed to load profile', code: 'profile_fetch_failed', status: 500 },
    );
    return profile ?? null;
  }

  async updateProfile(
    userId: string,
    updates: { display_name?: string; settings?: Record<string, unknown> },
  ): Promise<IProfile> {
    const payload: Record<string, unknown> = {};
    if (typeof updates.display_name !== 'undefined') {
      payload.display_name = updates.display_name;
    }
    if (typeof updates.settings !== 'undefined') {
      payload.settings = updates.settings ?? {};
    }
    const profile = await wrapQuery<IProfile | null>(
      async () =>
        await supabase
          .from('profiles')
          .update(payload)
          .eq('id', userId)
          .select('id, email, display_name, settings, role')
          .maybeSingle<IProfile>(),
      { message: 'Failed to update profile', code: 'profile_update_failed', status: 500 },
    );

    if (!profile) {
      throw new AppError('Profile not found', { status: 404, code: 'profile_not_found' });
    }

    return profile;
  }
}

export const profileService = new ProfileService();
