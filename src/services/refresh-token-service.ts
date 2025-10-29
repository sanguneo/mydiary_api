import { supabase } from '../lib/supabase';

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked: boolean;
  replaced_by?: string | null;
  created_at?: string;
}

export class RefreshTokenService {
  async saveToken(args: { userId: string; tokenId: string; tokenHash: string; expiresAt: Date }) {
    const { error } = await supabase.from('refresh_tokens').insert({
      id: args.tokenId,
      user_id: args.userId,
      token_hash: args.tokenHash,
      expires_at: args.expiresAt.toISOString(),
    });
    if (error) {
      throw new Error(`Failed to store refresh token: ${error.message}`);
    }
  }

  async getToken(tokenId: string) {
    const { data, error } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('id', tokenId)
      .maybeSingle<RefreshTokenRecord>();
    if (error) {
      throw new Error(`Failed to load refresh token: ${error.message}`);
    }
    return data ?? null;
  }

  async revokeToken(tokenId: string, replacedBy?: string) {
    const updates: Record<string, unknown> = { revoked: true };
    if (replacedBy) {
      updates.replaced_by = replacedBy;
    }
    const { error } = await supabase.from('refresh_tokens').update(updates).eq('id', tokenId);
    if (error) {
      throw new Error(`Failed to revoke refresh token: ${error.message}`);
    }
  }
}

export const refreshTokenService = new RefreshTokenService();
