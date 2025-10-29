export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}
