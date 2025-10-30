import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { ACCESS_COOKIE_NAME } from '@/lib/cookies';
import { verifyAccessToken } from '@/lib/tokens';
import { AppError, handleRouteError } from '@/lib/errors';

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, ACCESS_COOKIE_NAME);
  if (!token) {
    return handleRouteError(
      c,
      new AppError('Authentication required', { status: 401, code: 'auth_required' }),
      { message: 'Unauthorized', status: 401, code: 'auth_required' },
    );
  }
  try {
    const payload = await verifyAccessToken(token);
    c.set('user', {
      id: payload.sub,
      email: payload.email,
      role: payload.role ?? null,
    });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Unauthorized',
      status: 401,
      code: 'auth_invalid_token',
    });
  }
  await next();
};
