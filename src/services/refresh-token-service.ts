import { supabase, wrapQuery } from '../lib/supabase';

export interface IRefreshTokenRecord {
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
    await wrapQuery<null | IRefreshTokenRecord[]>(
      async () =>
        await supabase.from('refresh_tokens').insert({
          id: args.tokenId,
          user_id: args.userId,
          token_hash: args.tokenHash,
          expires_at: args.expiresAt.toISOString(),
        }),
      { message: 'Failed to store refresh token', code: 'refresh_token_store_failed', status: 500 },
    );
  }

  async getToken(tokenId: string) {
    const record = await wrapQuery<IRefreshTokenRecord | null>(
      async () =>
        await supabase
          .from('refresh_tokens')
          .select('*')
          .eq('id', tokenId)
          .maybeSingle<IRefreshTokenRecord>(),
      { message: 'Failed to load refresh token', code: 'refresh_token_lookup_failed', status: 500 },
    );
    return record ?? null;
  }

  async revokeToken(tokenId: string, replacedBy?: string) {
    const updates: Record<string, unknown> = { revoked: true };
    if (replacedBy) {
      updates.replaced_by = replacedBy;
    }
    await wrapQuery<IRefreshTokenRecord | null>(
      async () =>
        await supabase
          .from('refresh_tokens')
          .update(updates)
          .eq('id', tokenId)
          .select('id')
          .maybeSingle(),
      { message: 'Failed to revoke refresh token', code: 'refresh_token_revoke_failed', status: 500 },
    );
  }
}

export const refreshTokenService = new RefreshTokenService();
