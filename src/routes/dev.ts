// routes/dev.ts
import { Hono } from 'hono';
import { createAccessToken, createRefreshToken } from '../lib/tokens';
import { requireAuth } from '../middleware/auth';
import { supabase, wrapQuery } from '../lib/supabase';
import { AppError, handleRouteError } from '../lib/errors';
import type { TApiResponse } from '../types/common/common.types';
import type { IAuthenticatedUser } from '../types/auth/auth.types';

const devRouter = new Hono();

// ⚠️ 개발 전용: 이메일 인증 없이 토큰 발급
devRouter.post('/token', async (c) => {
  if (process.env.NODE_ENV === 'production') {
    return c.json<TApiResponse<null>>({ ok: false, code: 'not_allowed', message: 'Not available in production' }, 403);
  }

  const body = (await c
    .req
    .json<{ email?: string; role?: string }>()
    .catch(() => ({}))) as Partial<{ email: string; role: string }>;

  const email = body.email?.trim();
  if (!email) {
    return c.json<TApiResponse<null>>({ ok: false, code: 'invalid_payload', message: 'Email is required' }, 400);
  }

  try {
    const profile = await wrapQuery<{ id: string; email: string } | null>(
      async () =>
        await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', email)
          .maybeSingle(),
      { message: 'Failed to lookup profile', status: 404, code: 'profile_not_found' },
    );

    if (!profile) {
      throw new AppError(`User not found for email: ${email}`, { status: 404, code: 'profile_not_found' });
    }

    const user: IAuthenticatedUser = {
      id: profile.id,
      email: profile.email,
      role: body.role ?? 'user',
    };

    const { token: accessToken } = await createAccessToken(user);
    const { token: refreshToken } = await createRefreshToken(user);

    return c.json<TApiResponse<{ user: IAuthenticatedUser; tokens: { accessToken: string; refreshToken: string } }>>({
      ok: true,
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to issue dev tokens',
      status: 500,
      code: 'dev_token_failed',
    });
  }
});

// ✅ 토큰 검증 테스트용
devRouter.get('/verify', requireAuth, async (c) => {
  const user = c.get('user');
  return c.json<TApiResponse<IAuthenticatedUser | undefined>>({ ok: true, data: user });
});

export default devRouter;
