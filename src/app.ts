import { Hono } from 'hono';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import uploadsRouter from './routes/uploads';
import { requestLogger } from './middleware/logger';

export const app = new Hono();

app.use('*', requestLogger);

app.get('/healthz', (c) => c.json({ ok: true, status: 'healthy' }));

app.route('/auth', authRouter);
app.route('/users', usersRouter);
app.route('/uploads', uploadsRouter);

export type AppType = typeof app;
