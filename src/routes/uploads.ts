// routes/uploads.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { storageService } from '@/services/storage-service';
import { handleRouteError } from '@/lib/errors';
import type { TApiResponse } from '@/types/common/common.types';

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
    return c.json<TApiResponse<null>>(
      { ok: false, code: 'invalid_payload', message: 'Invalid payload', details: parsed.error.flatten() },
      400,
    );
  }
  try {
    const result = await storageService.createPresignedUploadUrl(parsed.data);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    return c.json<TApiResponse<{ url: string; key: string; expires_at: string }>>({
      ok: true,
      data: {
        url: result.url,
        key: result.path,
        expires_at: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to create upload URL',
      status: 500,
      code: 'storage_presign_failed',
    });
  }
});

export default uploadsRouter;
