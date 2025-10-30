// src/routes/diaries.ts
import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { AppError, handleRouteError } from '../lib/errors';
import type { TApiResponse } from '../types/common/common.types';
import type { IDiary, IDiaryCreateInput, IDiarySummary, IDiaryUpdateInput } from '../types/diary/diary.types';
import { diaryService } from '../services/diary-service';

const diariesRouter = new Hono();

// ✅ 모든 일기 라우트는 인증 필요
diariesRouter.use('*', requireAuth);

// ✏️ 일기 작성
diariesRouter.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      throw new AppError('Unauthorized', { status: 401, code: 'auth_required' });
    }

    const body = await c.req.json<IDiaryCreateInput>();
    const diary = await diaryService.createDiary(user.id, body);
    return c.json<TApiResponse<IDiary>>({ ok: true, data: diary });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to create diary',
      status: 500,
      code: 'diary_create_failed',
    });
  }
});

// 📋 전체 목록 조회
diariesRouter.get('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      throw new AppError('Unauthorized', { status: 401, code: 'auth_required' });
    }

    const diaries = await diaryService.listDiaries(user.id);
    return c.json<TApiResponse<IDiary[]>>({ ok: true, data: diaries });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to fetch diaries',
      status: 500,
      code: 'diary_list_failed',
    });
  }
});

// 📋 조건별 목록 조회
diariesRouter.get('/list', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      throw new AppError('Unauthorized', { status: 401, code: 'auth_required' });
    }

    const { from, to, month, day, offsetYear } = c.req.query();

    const options = {
      from,
      to,
      month,
      day,
      offsetYear: offsetYear ? Number(offsetYear) : undefined,
    };

    const summaries = await diaryService.listDiarySummariesWithFilter(user.id, options);
    return c.json<TApiResponse<IDiarySummary[]>>({ ok: true, data: summaries });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to fetch diary summaries',
      status: 500,
      code: 'diary_filtered_list_failed',
    });
  }
});

// 📖 단일 조회
diariesRouter.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user) {
      throw new AppError('Unauthorized', { status: 401, code: 'auth_required' });
    }

    const diary = await diaryService.getDiary(user.id, id);

    if (!diary) {
      throw new AppError('Diary not found', { status: 404, code: 'diary_not_found' });
    }

    if (diary.is_locked && diary.lock_password_hash) {
      throw new AppError('Diary is locked', { status: 403, code: 'diary_locked' });
    }

    return c.json<TApiResponse<IDiary>>({ ok: true, data: diary });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to fetch diary',
      status: 500,
      code: 'diary_fetch_failed',
    });
  }
});

// 🔓 잠금 해제 (비밀번호 입력)
diariesRouter.post('/:id/unlock', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user) {
      throw new AppError('Unauthorized', { status: 401, code: 'auth_required' });
    }

    const { password } = await c.req.json<{ password?: string }>();

    const diary = await diaryService.getDiary(user.id, id);
    if (!diary) {
      throw new AppError('Diary not found', { status: 404, code: 'diary_not_found' });
    }

    const ok = await diaryService.unlockDiary(diary, password ?? '');
    if (!ok) {
      throw new AppError('Invalid password', { status: 403, code: 'diary_invalid_password' });
    }

    return c.json<TApiResponse<IDiary>>({ ok: true, data: diary });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to unlock diary',
      status: 403,
      code: 'diary_unlock_failed',
    });
  }
});

// 🛠️ 수정
diariesRouter.patch('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user) {
      throw new AppError('Unauthorized', { status: 401, code: 'auth_required' });
    }

    const body = await c.req.json<IDiaryUpdateInput>();
    const diary = await diaryService.updateDiary(user.id, id, body);
    return c.json<TApiResponse<IDiary>>({ ok: true, data: diary });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to update diary',
      status: 500,
      code: 'diary_update_failed',
    });
  }
});

// ❌ 삭제
diariesRouter.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    if (!user) {
      throw new AppError('Unauthorized', { status: 401, code: 'auth_required' });
    }

    await diaryService.deleteDiary(user.id, id);
    return c.json<TApiResponse<null>>({ ok: true, data: null });
  } catch (error) {
    return handleRouteError(c, error, {
      message: 'Failed to delete diary',
      status: 500,
      code: 'diary_delete_failed',
    });
  }
});

export default diariesRouter;
