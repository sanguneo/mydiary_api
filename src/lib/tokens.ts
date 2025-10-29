import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomUUID } from 'node:crypto';
import env from '../config/env';
import type { AuthenticatedUser } from '../types/auth';

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

export async function createAccessToken(user: AuthenticatedUser) {
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

export async function createRefreshToken(user: AuthenticatedUser) {
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
  const { payload } = await jwtVerify(token, secret);
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload as unknown as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  if (payload.type !== 'refresh' || typeof payload.jti !== 'string') {
    throw new Error('Invalid token type');
  }
  return payload as unknown as RefreshTokenPayload;
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
