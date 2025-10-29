import type { AuthenticatedUser } from './auth';

declare module 'hono' {
  interface ContextVariableMap {
    user?: AuthenticatedUser;
    requestId?: string;
  }
}
