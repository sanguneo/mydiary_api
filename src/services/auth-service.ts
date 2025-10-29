import { supabase } from '../lib/supabase';
import { clearAuthCookies, setAuthCookies } from '../lib/cookies';
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../lib/tokens';
import type { AuthenticatedUser, TokenPair } from '../types/auth';
import { profileService } from './profile-service';
import { refreshTokenService } from './refresh-token-service';
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { REFRESH_COOKIE_NAME } from '../lib/cookies';

export class AuthService {
  async signUp(email: string) {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: undefined,
    });
    if (error) {
      throw new Error(`Failed to sign up: ${error.message}`);
    }
    const user = data.user;
    if (!user) {
      throw new Error('User not created');
    }
    await profileService.ensureProfile(user.id, user.email);
    return user.id;
  }

  async verifyEmail(params: { token: string; email: string; type?: 'signup' | 'email_change' | 'recovery' }) {
    const { data, error } = await supabase.auth.verifyOtp({
      token: params.token,
      email: params.email,
      type: params.type ?? 'signup',
    });
    if (error || !data.user) {
      throw new Error(`Failed to verify email: ${error?.message ?? 'Unknown error'}`);
    }
    const user = data.user;
    await profileService.ensureProfile(user.id, user.email);
    return this.issueTokensForUser({
      id: user.id,
      email: user.email ?? params.email,
      role: (user.user_metadata as Record<string, unknown> | null)?.role as string | undefined,
    });
  }

  async issueTokensForUser(user: AuthenticatedUser): Promise<TokenPair> {
    const access = await createAccessToken(user);
    const refresh = await createRefreshToken(user);
    await refreshTokenService.saveToken({
      userId: user.id,
      tokenId: refresh.jti,
      tokenHash: hashToken(refresh.token),
      expiresAt: refresh.expiresAt,
    });
    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      refreshTokenId: refresh.jti,
      accessExpiresAt: access.expiresAt,
      refreshExpiresAt: refresh.expiresAt,
    };
  }

  async refreshSession(c: Context) {
    const refreshToken = getCookie(c, REFRESH_COOKIE_NAME);
    if (!refreshToken) {
      throw new Error('Refresh token missing');
    }
    const payload = await verifyRefreshToken(refreshToken);
    const record = await refreshTokenService.getToken(payload.jti);
    if (!record) {
      throw new Error('Refresh token not found');
    }
    if (record.revoked) {
      throw new Error('Refresh token revoked');
    }
    const expiresAt = new Date(record.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      await refreshTokenService.revokeToken(record.id);
      throw new Error('Refresh token expired');
    }
    if (hashToken(refreshToken) !== record.token_hash) {
      await refreshTokenService.revokeToken(record.id);
      throw new Error('Refresh token mismatch');
    }

    const userId = payload.sub;
    const profile = await profileService.getProfile(userId);
    const user: AuthenticatedUser = {
      id: userId,
      email: payload.email,
      role: profile?.role ?? payload.role,
    };
    const tokens = await this.issueTokensForUser(user);
    await refreshTokenService.revokeToken(record.id, tokens.refreshTokenId);
    setAuthCookies(c, tokens);
    return tokens;
  }

  async logout(c: Context) {
    const refreshToken = getCookie(c, REFRESH_COOKIE_NAME);
    if (refreshToken) {
      try {
        const payload = await verifyRefreshToken(refreshToken);
        await refreshTokenService.revokeToken(payload.jti);
      } catch (error) {
        console.warn('Failed to revoke refresh token on logout', error);
      }
    }
    clearAuthCookies(c);
  }
}

export const authService = new AuthService();
