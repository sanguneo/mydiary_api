import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { profileService } from '../services/profile-service';

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
      return c.json({ ok: false, message: 'Profile not found' }, 404);
    }
    return c.json({ ok: true, profile });
  } catch (error) {
    console.error('Profile fetch error', error);
    return c.json({ ok: false, message: 'Failed to load profile' }, 500);
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
    console.error('Profile update error', error);
    return c.json({ ok: false, message: 'Failed to update profile' }, 500);
  }
});

export default usersRouter;
