import { Hono } from 'hono';
import { requestLogger } from '@/middleware/logger';
import { handleRouteError } from '@/lib/errors';
import authRouter from '@/routes/auth';
import usersRouter from '@/routes/users';
import uploadsRouter from '@/routes/uploads';
import diariesRouter from '@/routes/diaries';
import devRouter from '@/routes/dev';

export const app = new Hono();

app.use('*', requestLogger);

app.get('/api/healthz', (c) => c.json({ ok: true, status: 'healthy' }));

app.route('/api/auth', authRouter);
app.route('/api/users', usersRouter);
app.route('/api/uploads', uploadsRouter);
app.route('/api/diaries', diariesRouter);
app.route('/api/dev', devRouter);

app.onError((error, c) =>
  handleRouteError(
    c,
    error,
    { message: 'Internal server error', status: 500, code: 'internal_error' },
  ),
);

export type AppType = typeof app;
