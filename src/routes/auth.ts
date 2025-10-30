// routes/auth.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { authService } from '../services/auth-service';
import { setAuthCookies, clearAuthCookies } from '../lib/cookies';
import { handleRouteError } from '../lib/errors';

const signupSchema = z.object({
  email: z.string().email(),
});

const authRouter = new Hono();

authRouter.post('/signup', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, message: 'Invalid payload', issues: parsed.error.flatten() }, 400);
  }

  const { email } = parsed.data;

  try {
    const userId = await authService.signUp(email);

    // ✅ 로그인 이메일(magic link) 발송 (계정 유무 상관없이)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.BACKEND_ORIGIN ?? 'https://api.example.com'}/auth/verify`,
        shouldCreateUser: true,
      },
    });
    if (error) console.warn('signInWithOtp failed:', error);

    // UX 목표: 메일 전송 여부와 관계없이 성공 응답
    return c.json({
      ok: true,
      message: 'Verification email sent (if configured)',
      user_id: userId ?? null,
    });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to send verification email',
      status: 500,
      code: 'signup_failed',
    });
  }
});


// verify endpoint: 토큰 클릭 -> 토큰 발급, 쿠키 설정, 리다이렉트
authRouter.get('/verify', async (c) => {
  const token = c.req.query('token');
  const email = c.req.query('email');
  const type = (c.req.query('type') as 'signup' | 'email_change' | 'recovery' | undefined) ?? 'signup';
  if (!token || !email) {
    return c.json({ ok: false, message: 'Missing token or email' }, 400);
  }

  try {
    const { tokens, needsDisplayName } = await authService.verifyEmail({ token, email, type });

    // 쿠키 설정
    setAuthCookies(c, tokens);

    // redirect UX: display_name 필요하면 온보딩으로, 아니면 루트로
    const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://app.example.com';
    if (needsDisplayName) {
      const redirectUrl = `${FRONTEND_URL}/onboarding?display_name_required=1`;
      return c.redirect(redirectUrl);
    }
    return c.redirect(FRONTEND_URL);
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to verify token',
      status: 400,
      code: 'verification_failed',
    });
  }
});

authRouter.post('/refresh', async (c) => {
  try {
    const tokens = await authService.refreshSession(c);
    setAuthCookies(c, tokens);
    return c.json({ ok: true, message: 'Session refreshed' });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to refresh session',
      status: 401,
      code: 'refresh_failed',
    });
  }
});

authRouter.post('/logout', async (c) => {
  try {
    await authService.logout(c);
  } catch (e) {
    console.warn('Logout warning', e);
  }
  // clear cookies for client
  clearAuthCookies(c);
  return c.json({ ok: true });
});

export default authRouter;
