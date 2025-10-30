import type { MiddlewareHandler } from 'hono';
import { nanoid } from 'nanoid';
import { performance } from 'perf_hooks';
import { accessLogger } from '@/lib/logger';

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  const requestId = nanoid();
  c.set('requestId', requestId);

  try {
    await next();
  } finally {
    const end = performance.now();
    const duration = Number((end - start).toFixed(2));
    const user = c.get('user');

    accessLogger.info(
      {
        requestId,
        method: c.req.method,
        path: c.req.path,
        statusCode: c.res.status,
        durationMs: duration,
        userId: user?.id,
      },
      'request completed',
    );
  }
};
