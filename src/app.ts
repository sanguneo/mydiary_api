import { Hono } from 'hono';
import { requestLogger } from './middleware/logger';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import uploadsRouter from './routes/uploads';
import diariesRouter from './routes/diaries';
import devRouter from './routes/dev';

export const app = new Hono();

app.use('*', requestLogger);

app.get('/healthz', (c) => c.json({ ok: true, status: 'healthy' }));

app.route('/auth', authRouter);
app.route('/users', usersRouter);
app.route('/uploads', uploadsRouter);
app.route('/diaries', diariesRouter);

app.route('/api/dev', devRouter);

export type AppType = typeof app;
