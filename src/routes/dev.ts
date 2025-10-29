import { Hono } from 'hono';
import { createAccessToken, createRefreshToken } from '../lib/tokens';
import { supabase } from '../lib/supabase';

const devRouter = new Hono();

// ⚠️ 개발 전용: Supabase Auth 유저로부터 토큰 발급
// curl -X POST http://localhost:3000/api/dev/token -d '{"email":"test@example.com"}'
devRouter.post('/token', async (c) => {
  if (process.env.NODE_ENV === 'production') {
    return c.json({ success: false, error: 'Not available in production' }, 403);
  }

  const body = await c.req.json<{ email?: string }>().catch(() => ({email: undefined}));
  const email = body.email ?? 'test@example.com';

  // 🔍 Supabase에서 auth.users 조회
  const { data: user, error } = await supabase.from('auth.users').select('id, email, role').eq('email', email).maybeSingle();

  if (error || !user) {
    return c.json({ success: false, error: `User not found for email: ${email}` }, 404);
  }

  // ✅ JWT 발급
  const { token: accessToken, expiresAt: accessTokenExpiresAt } = await createAccessToken({
    id: user.id,
    email: user.email,
    role: user.role ?? 'user',
  });

  const { token: refreshToken, expiresAt: refreshTokenExpiresAt } = await createRefreshToken({
    id: user.id,
    email: user.email,
    role: user.role ?? 'user',
  });

  return c.json({
    success: true,
    data: {
      user,
      tokens: {
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
      },
    },
  });
});

export default devRouter;
