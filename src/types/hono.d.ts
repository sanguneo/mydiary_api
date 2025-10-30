import type { IAuthenticatedUser } from './auth/auth.types';

declare module 'hono' {
  interface ContextVariableMap {
    user?: IAuthenticatedUser;
    requestId?: string;
  }
}
