import type { Context } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import type { ITokenPair } from '@/types/auth/auth.types';
import { getAccessTokenTtlSeconds, getRefreshTokenTtlSeconds } from '@/lib/tokens';

const accessCookieName = 'app_access';
const refreshCookieName = 'app_refresh';

function getCookieCommonOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax' as const,
    path: '/',
    domain: undefined,
  };
}

export function setAuthCookies(c: Context, tokens: ITokenPair) {
  const common = getCookieCommonOptions();
  setCookie(c, accessCookieName, tokens.accessToken, {
    ...common,
    maxAge: getAccessTokenTtlSeconds(),
  });
  setCookie(c, refreshCookieName, tokens.refreshToken, {
    ...common,
    path: '/api/auth/refresh',
    maxAge: getRefreshTokenTtlSeconds(),
  });
}

export function clearAuthCookies(c: Context) {
  const common = getCookieCommonOptions();
  deleteCookie(c, accessCookieName, common);
  deleteCookie(c, refreshCookieName, {
    ...common,
    path: '/api/auth/refresh',
  });
}

export const ACCESS_COOKIE_NAME = accessCookieName;
export const REFRESH_COOKIE_NAME = refreshCookieName;
