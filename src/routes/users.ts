import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { profileService } from '@/services/profile-service';
import { AppError, handleRouteError } from '@/lib/errors';
import type { TApiResponse } from '@/types/common/common.types';
import type { IProfile } from '@/types/profile/profile.types';

const updateSchema = z.object({
  display_name: z.string().max(120).optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

const usersRouter = new Hono();

usersRouter.use('*', requireAuth);

usersRouter.get('/me', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      throw new AppError('Unauthorized', { status: 401, code: 'auth_required' });
    }
    const profile = await profileService.getProfile(user.id);
    if (!profile) {
      throw new AppError('Profile not found', { status: 404, code: 'profile_not_found' });
    }
    return c.json<TApiResponse<IProfile>>({ ok: true, data: profile });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to load profile',
      status: 500,
      code: 'profile_load_failed',
    });
  }
});

usersRouter.put('/me', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json<TApiResponse<null>>(
      { ok: false, code: 'invalid_payload', message: 'Invalid payload', details: parsed.error.flatten() },
      400,
    );
  }
  try {
    const user = c.get('user');
    if (!user) {
      throw new AppError('Unauthorized', { status: 401, code: 'auth_required' });
    }
    const profile = await profileService.updateProfile(user.id, {
      display_name: parsed.data.display_name,
      settings: parsed.data.settings,
    });
    return c.json<TApiResponse<IProfile>>({ ok: true, data: profile });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to update profile',
      status: 500,
      code: 'profile_update_failed',
    });
  }
});

export default usersRouter;
