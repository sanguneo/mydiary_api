// src/types/auth/auth.types.ts

export interface IAuthenticatedUser {
  id: string;
  email: string;
  role?: string | null;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}
