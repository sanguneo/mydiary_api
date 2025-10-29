import { Hono } from 'hono';
import { z } from 'zod';
import { authService } from '../services/auth-service';
import { setAuthCookies } from '../lib/cookies';

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
  try {
    const userId = await authService.signUp(parsed.data.email);
    return c.json({ ok: true, message: 'Signup initiated', user_id: userId });
  } catch (error) {
    console.error('Signup error', error);
    return c.json({ ok: false, message: 'Failed to sign up' }, 500);
  }
});

authRouter.get('/verify', async (c) => {
  const token = c.req.query('token');
  const email = c.req.query('email');
  const type = (c.req.query('type') as 'signup' | 'email_change' | 'recovery' | undefined) ?? 'signup';
  if (!token || !email) {
    return c.json({ ok: false, message: 'Missing token or email' }, 400);
  }
  try {
    const tokens = await authService.verifyEmail({ token, email, type });
    setAuthCookies(c, tokens);
    return c.json({ ok: true, message: 'Email verified' });
  } catch (error) {
    console.error('Verify error', error);
    return c.json({ ok: false, message: 'Failed to verify token' }, 400);
  }
});

authRouter.post('/refresh', async (c) => {
  try {
    await authService.refreshSession(c);
    return c.json({ ok: true, message: 'Session refreshed' });
  } catch (error) {
    console.error('Refresh error', error);
    return c.json({ ok: false, message: 'Failed to refresh session' }, 401);
  }
});

authRouter.post('/logout', async (c) => {
  await authService.logout(c);
  return c.json({ ok: true });
});

export default authRouter;
