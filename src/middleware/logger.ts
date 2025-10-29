import type { MiddlewareHandler } from 'hono';
import { nanoid } from 'nanoid';
import { performance } from 'perf_hooks';

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  const requestId = nanoid();
  c.set('requestId', requestId);

  await next();

  const end = performance.now();
  const duration = Number((end - start).toFixed(2));

  const log = {
    timestamp: new Date().toISOString(),
    level: 'info',
    request_id: requestId,
    method: c.req.method,
    path: c.req.path,
    status_code: c.res.status,
    duration_ms: duration,
  };

  console.log(JSON.stringify(log));
};
