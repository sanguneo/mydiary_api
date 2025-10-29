import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { profileService } from '../services/profile-service';
import { AppError, handleRouteError } from '../lib/errors';

const updateSchema = z.object({
  display_name: z.string().max(120).optional(),
  settings: z.record(z.any()).optional(),
});

const usersRouter = new Hono();

usersRouter.use('*', requireAuth);

usersRouter.get('/me', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ ok: false, message: 'Unauthorized' }, 401);
  }
  try {
    const profile = await profileService.getProfile(user.id);
    if (!profile) {
      return handleRouteError(
        c,
        new AppError('Profile not found', { status: 404, code: 'profile_not_found' }),
        {
          message: 'Profile not found',
          status: 404,
          code: 'profile_not_found',
        },
      );
    }
    return c.json({ ok: true, profile });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to load profile',
      status: 500,
      code: 'profile_load_failed',
    });
  }
});

usersRouter.put('/me', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ ok: false, message: 'Unauthorized' }, 401);
  }
  const body = await c.req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, message: 'Invalid payload', issues: parsed.error.flatten() }, 400);
  }
  try {
    const profile = await profileService.updateProfile(user.id, {
      display_name: parsed.data.display_name,
      settings: parsed.data.settings,
    });
    return c.json({ ok: true, profile });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to update profile',
      status: 500,
      code: 'profile_update_failed',
    });
  }
});

export default usersRouter;
