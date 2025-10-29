import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { ACCESS_COOKIE_NAME } from '../lib/cookies';
import { verifyAccessToken } from '../lib/tokens';

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, ACCESS_COOKIE_NAME);
  if (!token) {
    return c.json({ ok: false, message: 'Unauthorized' }, 401);
  }
  try {
    const payload = await verifyAccessToken(token);
    c.set('user', {
      id: payload.sub,
      email: payload.email,
      role: payload.role ?? null,
    });
  } catch (error) {
    return c.json({ ok: false, message: 'Unauthorized' }, 401);
  }
  await next();
};
