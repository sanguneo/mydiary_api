import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomUUID } from 'crypto';
import env from '../config/env';
import type { IAuthenticatedUser } from '../types/auth/auth.types';
import { AppError } from './errors';

const encoder = new TextEncoder();
const secret = encoder.encode(env.JWT_SECRET);

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role?: string | null;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  role?: string | null;
  type: 'refresh';
  jti: string;
}

const FIFTEEN_MINUTES = 15 * 60; // seconds
const SEVEN_DAYS = 7 * 24 * 60 * 60;

export function getAccessTokenTtlSeconds() {
  return FIFTEEN_MINUTES;
}

export function getRefreshTokenTtlSeconds() {
  return SEVEN_DAYS;
}

export async function createAccessToken(user: IAuthenticatedUser) {
  const expiresIn = getAccessTokenTtlSeconds();
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role ?? undefined,
    type: 'access',
  } satisfies AccessTokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(secret);

  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return { token, expiresAt } as const;
}

export async function createRefreshToken(user: IAuthenticatedUser) {
  const jti = randomUUID();
  const expiresIn = getRefreshTokenTtlSeconds();
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role ?? undefined,
    type: 'refresh',
    jti,
  } satisfies RefreshTokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(secret);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  return { token, jti, expiresAt } as const;
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.type !== 'access') {
      throw new AppError('Invalid access token', { status: 401, code: 'invalid_access_token' });
    }
    return payload as unknown as AccessTokenPayload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid access token', { status: 401, code: 'invalid_access_token', cause: error });
  }
}

export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.type !== 'refresh' || typeof payload.jti !== 'string') {
      throw new AppError('Invalid refresh token', { status: 401, code: 'invalid_refresh_token' });
    }
    return payload as unknown as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid refresh token', { status: 401, code: 'invalid_refresh_token', cause: error });
  }
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
