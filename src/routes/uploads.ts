import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { storageService } from '../services/storage-service';

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  bucket: z.literal('content'),
});

const uploadsRouter = new Hono();

uploadsRouter.use('*', requireAuth);

uploadsRouter.post('/presign', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, message: 'Invalid payload', issues: parsed.error.flatten() }, 400);
  }
  try {
    const result = await storageService.createPresignedUploadUrl(parsed.data);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    return c.json({ ok: true, url: result.url, key: result.path, expires_at: expiresAt.toISOString() });
  } catch (error) {
    console.error('Presign error', error);
    return c.json({ ok: false, message: 'Failed to create upload URL' }, 500);
  }
});

export default uploadsRouter;
