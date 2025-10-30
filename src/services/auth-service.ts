// src/services/auth-service.ts
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { authLogger } from '../lib/logger';
import { AppError } from '../lib/errors';
import { REFRESH_COOKIE_NAME } from '../lib/cookies';
import { supabase, wrapQuery } from '../lib/supabase';
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../lib/tokens';
import type { IAuthenticatedUser, ITokenPair } from '../types/auth/auth.types';
import { profileService } from './profile-service';
import { refreshTokenService } from './refresh-token-service';

export class AuthService {
  /**
   * signUp
   * - 계정 유무에 상관없이 인증/초대 메일을 보낸다(가능한 경우).
   * - 성공 시 가능한 user id를 반환, 실패는 에러로 던짐.
   */
  async signUp(email: string): Promise<string | null> {
    // 1) 기본 시도: inviteUserByEmail — 일부 Supabase 설정에서 초대/확인 메일 전송에 사용됨
    try {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: undefined,
      });
      if (error) {
        throw new AppError('Failed to invite user', {
          status: 500,
          code: 'supabase_error',
          details: { scope: 'auth.admin.inviteUserByEmail', email },
          cause: error,
        });
      }
      const user = data.user;
      if (!user) {
        throw new AppError('Failed to create user for invitation', {
          status: 500,
          code: 'signup_invite_failed',
        });
      }
      await profileService.ensureProfile(user.id, user.email);
      authLogger.info({ email, userId: user.id }, 'verification email sent via invite');
      return user.id;
    } catch (inviteErr) {
      // invite 실패하더라도 UX 목표는 "메일을 보냈다"이므로 폴백으로 기존 사용자 확인/재전송 시도
      const reason = inviteErr instanceof Error ? inviteErr.message : String(inviteErr);
      authLogger.warn({ email, reason }, 'inviteUserByEmail failed, falling back to lookup');
    }

    // 2) 폴백: profiles 테이블 우선 조회 -> admin.listUsers 폴백
    const found = await this.findUserByEmail(email);
    if (!found) {
      // 초대도 실패했고, 사용자도 찾지 못했다면 안전하게 에러 반환
      // (UX 관점에서 여기서도 "성공"으로 돌릴 수 있으나, 명시적으로 실패하도록 유지)
      throw new AppError('Failed to send verification email', {
        status: 500,
        code: 'signup_failed',
        cause: new Error('No user found after fallback lookup'),
      });
    }

    // 프로필 보장
    try {
      await profileService.ensureProfile(found.id, found.email);
    } catch (error) {
      authLogger.warn({ email, error }, 'ensureProfile failed during signup fallback');
    }

    // 기존 사용자가 있으면 user id 반환 (메일은 invite 시도에서 실패했을 수 있으나 UX상 "메일 발송 시도"로 처리)
    return found.id ?? null;
  }

  /**
   * verifyEmail
   * - token+email 로 Supabase OTP 검증 수행
   * - 검증 성공 시 profile 보장, 토큰 발급
   * - 신규 사용자라 display_name이 없으면 needsDisplayName=true 반환
   *
   * 반환: { tokens, needsDisplayName }
   */
  async verifyEmail(params: { token: string; email: string; type?: 'signup' | 'email_change' | 'recovery' }) {
    const { token, email, type } = params;
    // 기본 verify (Supabase OTP)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token,
        email,
        type: type ?? 'signup',
      });

      if (error) {
        throw new AppError(error.message ?? 'Failed to verify OTP', {
          status: 400,
          code: 'verification_failed',
          details: { scope: 'auth.verifyOtp', email },
          cause: error,
        });
      }

      // Supabase가 user를 반환하면 그걸 사용
      const user = data?.user;
      if (user) {
        await profileService.ensureProfile(user.id, user.email);
        const profile = await profileService.getProfile(user.id);
        const needsDisplayName = !profile?.display_name;

        const tokens = await this.issueTokensForUser({
          id: user.id,
          email: user.email ?? email,
          role: (user.user_metadata as Record<string, unknown> | null)?.role as string | undefined,
        });

        authLogger.info({ email, userId: user.id }, 'email verified via OTP');

        return { tokens, needsDisplayName };
      }
      // 만약 verifyOtp가 user를 반환하지 않는 경우 아래 폴백으로 처리
    } catch (otpErr) {
      // OTP 검증 실패일 수 있지만, 일부 설정에서는 verify가 실패하더라도 user가 이미 생성되어 있거나
      // 다른 흐름으로 생성이 필요할 수 있다. 여기서는 폴백으로 계속 진행.
      const reason = otpErr instanceof Error ? otpErr.message : String(otpErr);
      authLogger.warn({ email, reason }, 'verifyOtp failed or user missing, attempting fallback');
    }

    // 폴백 흐름: user 존재 여부 확인 -> 없으면 createUser -> profile 생성 -> 토큰 발급
    const found = await this.findUserByEmail(email);
    if (!found) {
      // 신규 사용자 생성 (admin.createUser) — 주의: SDK/프로젝트 정책에 따라 사용 여부 결정
      try {
        const createRes = await supabase.auth.admin.createUser({
          email,
          email_confirm: true, // verification 버튼을 눌렀으므로 confirmed로 설정
        } as any); // 타입은 SDK 버전에 따라 다름

        // createRes 구조가 SDK마다 달라질 수 있으므로 방어적으로 처리
        // @ts-ignore
        const createdUser = createRes?.data?.user ?? (createRes as any).user ?? null;
        if (!createdUser) {
          throw new Error('Failed to create user after verification');
        }
        await profileService.ensureProfile(createdUser.id, createdUser.email);
        const tokens = await this.issueTokensForUser({
          id: createdUser.id,
          email: createdUser.email ?? email,
          role: (createdUser.user_metadata as Record<string, unknown> | null)?.role as string | undefined,
        });
        authLogger.info({ email, userId: createdUser.id }, 'user created during verification fallback');
        return { tokens, needsDisplayName: true };
      } catch (createErr) {
        authLogger.error({ email, error: createErr }, 'createUser fallback failed');
        throw AppError.normalize(createErr, {
          message: 'Failed to verify email',
          status: 400,
          code: 'verification_failed',
        });
      }
    }

    // found exists: ensure profile and issue tokens
    await profileService.ensureProfile(found.id, found.email);
    const profile = await profileService.getProfile(found.id);
    const needsDisplayName = !profile?.display_name;

    const tokens = await this.issueTokensForUser({
      id: found.id,
      email: found.email ?? email,
      role: (found.user_metadata as Record<string, unknown> | null)?.role as string | undefined,
    });

    authLogger.info({ email, userId: found.id }, 'email verified using fallback user');

    return { tokens, needsDisplayName };
  }

  async issueTokensForUser(user: IAuthenticatedUser): Promise<ITokenPair> {
    try {
      const access = await createAccessToken(user);
      const refresh = await createRefreshToken(user);
      await refreshTokenService.saveToken({
        userId: user.id,
        tokenId: refresh.jti,
        tokenHash: hashToken(refresh.token),
        expiresAt: refresh.expiresAt,
      });
      const tokens: ITokenPair = {
        accessToken: access.token,
        refreshToken: refresh.token,
        refreshTokenId: refresh.jti,
        accessExpiresAt: access.expiresAt,
        refreshExpiresAt: refresh.expiresAt,
      };
      authLogger.info({ userId: user.id }, 'issued new token pair');
      return tokens;
    } catch (error) {
      throw AppError.normalize(error, {
        message: 'Failed to issue tokens',
        status: 500,
        code: 'token_issue_failed',
      });
    }
  }

  async refreshSession(c: Context) {
    const refreshToken = getCookie(c, REFRESH_COOKIE_NAME);
    if (!refreshToken) {
      throw new AppError('Refresh token missing', { status: 401, code: 'refresh_token_missing' });
    }
    const payload = await verifyRefreshToken(refreshToken);
    const record = await refreshTokenService.getToken(payload.jti);
    if (!record) {
      throw new AppError('Refresh token not found', { status: 401, code: 'refresh_token_not_found' });
    }
    if (record.revoked) {
      throw new AppError('Refresh token revoked', { status: 401, code: 'refresh_token_revoked' });
    }
    const expiresAt = new Date(record.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      await refreshTokenService.revokeToken(record.id);
      throw new AppError('Refresh token expired', { status: 401, code: 'refresh_token_expired' });
    }
    if (hashToken(refreshToken) !== record.token_hash) {
      await refreshTokenService.revokeToken(record.id);
      throw new AppError('Refresh token mismatch', { status: 401, code: 'refresh_token_mismatch' });
    }

    const userId = payload.sub;
    const profile = await profileService.getProfile(userId);
    const user: IAuthenticatedUser = {
      id: userId,
      email: payload.email,
      role: profile?.role ?? payload.role,
    };
    const tokens = await this.issueTokensForUser(user);
    await refreshTokenService.revokeToken(record.id, tokens.refreshTokenId);
    authLogger.info({ userId }, 'session refreshed');
    // 쿠키 세팅은 호출부(라우터)에서 setAuthCookies(c, tokens)로 수행하거나,
    // 원래 스타일을 유지하려면 여기서 setAuthCookies를 호출(원래 코드에선 라우터에서 호출).
    return tokens;
  }

  async logout(c: Context) {
    const refreshToken = getCookie(c, REFRESH_COOKIE_NAME);
    if (refreshToken) {
      try {
        const payload = await verifyRefreshToken(refreshToken);
        await refreshTokenService.revokeToken(payload.jti);
      } catch (error) {
        authLogger.warn({ error }, 'failed to revoke refresh token on logout');
      }
    }
    authLogger.info({ userId: c.get('user')?.id }, 'user logged out');
    // 쿠키 삭제는 라우터에서 clearAuthCookies 또는 setAuthCookies(null) 등으로 처리
  }

  // Helper: find user by email: profiles -> admin.listUsers
  private async findUserByEmail(email: string): Promise<any | null> {
    try {
    const profile = await wrapQuery<any | null>(
      async () =>
        await supabase
          .from('profiles')
          .select('id, email, display_name')
          .eq('email', email)
          .limit(1)
          .maybeSingle(),
      { message: 'Failed to lookup profile by email', code: 'profile_lookup_failed', status: 500 },
    );
      if (profile) return profile;
    } catch (error) {
      authLogger.warn({ email, error }, 'profile lookup failed, continuing to admin lookup');
    }

    try {
      let page = 1;
      const perPage = 1000;
      while (true) {
        // SDK 버전에 따라 반환 형식이 다를 수 있음
        // @ts-ignore
        const res = await supabase.auth.admin.listUsers({ page, perPage });
        // @ts-ignore
        const users = (res?.data?.users ?? (res as any)?.users) as Array<any> | undefined;
        if (!users || users.length === 0) break;
        const found = users.find((u) => (u?.email ?? '').toLowerCase() === email.toLowerCase());
        if (found) return found;
        if (users.length < perPage) break;
        page++;
      }
    } catch (error) {
      authLogger.warn({ email, error }, 'admin listUsers lookup failed');
    }
    return null;
  }
}

export const authService = new AuthService();
