import { Hono } from 'hono';
import { randomUUID } from 'crypto';
import { createAccessToken, createRefreshToken } from '../lib/tokens';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const devRouter = new Hono();

// ⚠️ 개발 전용: 이메일 인증 없이 토큰 발급
devRouter.post('/token', async (c) => {
  if (process.env.NODE_ENV === 'production') {
    return c.json({ success: false, error: 'Not available in production' }, 403);
  }

  const body = await c.req.json<{ id?: string; email?: string; role?: string }>().catch(() => ({}));

  const email = body.email ?? `anon-${userId.slice(0, 8)}@local.test`;

  // 🔍 Supabase에서 auth.users 조회
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (error || !profile) {
    return c.json({ success: false, error: `User not found for email: ${email}` }, 404);
  }

  const { token: accessToken, expiresAt: accessTokenExpiresAt } = await createAccessToken({
    id: profile.id,
    email: profile.email,
    role: profile.role ?? 'user',
  });

  const { token: refreshToken, expiresAt: refreshTokenExpiresAt } = await createRefreshToken({
    id: profile.id,
    email: profile.email,
    role: profile.role ?? 'user',
  });

  return c.json({
    success: true,
    data: {
      user: { id: profile.id, email },
      tokens: {
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
      },
    },
  });
});

// ✅ 토큰 검증 테스트용
devRouter.get('/verify', requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({ success: true, user });
});

export default devRouter;
