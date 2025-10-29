// src/routes/diaries.ts
import { Hono } from 'hono';
import { diaryService } from '../services/diary-service';
import type { DiaryCreateInput, DiaryUpdateInput } from '../types/diary';
import { requireAuth } from '../middleware/auth';

const diariesRouter = new Hono();

// ✅ 모든 일기 라우트는 인증 필요
diariesRouter.use('*', requireAuth);

// ✏️ 일기 작성
diariesRouter.post('/', async (c) => {
  const user = c.get('user');

  if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);

  const body = await c.req.json<DiaryCreateInput>();
  const diary = await diaryService.createDiary(user.id, body);
  return c.json({ success: true, data: diary });
});

// 📋 전체 목록 조회
diariesRouter.get('/', async (c) => {
  const user = c.get('user');

  if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);

  const diaries = await diaryService.listDiaries(user.id);
  return c.json({ success: true, data: diaries });
});

// 📋 조건별 목록 조회
diariesRouter.get('/list', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);

  const { from, to, month, day, offsetYear } = c.req.query();

  const options = {
    from,
    to,
    month,
    day,
    offsetYear: offsetYear ? Number(offsetYear) : undefined,
  };

  const summaries = await diaryService.listDiarySummariesWithFilter(user.id, options);
  return c.json({ success: true, data: summaries });
});

// 📖 단일 조회
diariesRouter.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);

  const diary = await diaryService.getDiary(user.id, id);

  if (!diary) {
    return c.json({ success: false, error: 'Diary not found' }, 404);
  }

  // 잠금 처리: 비밀번호 없는 단순 잠금은 접근 허용
  if (diary.is_locked && diary.lock_password_hash) {
    return c.json({ success: false, error: 'Diary is locked' }, 403);
  }

  return c.json({ success: true, data: diary });
});

// 🔓 잠금 해제 (비밀번호 입력)
diariesRouter.post('/:id/unlock', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);

  const { password } = await c.req.json<{ password?: string }>();

  const diary = await diaryService.getDiary(user.id, id);
  if (!diary) {
    return c.json({ success: false, error: 'Diary not found' }, 404);
  }

  const ok = await diaryService.unlockDiary(diary, password ?? '');
  if (!ok) {
    return c.json({ success: false, error: 'Invalid password' }, 403);
  }

  return c.json({ success: true, data: diary });
});

// 🛠️ 수정
diariesRouter.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);

  const body = await c.req.json<DiaryUpdateInput>();
  const diary = await diaryService.updateDiary(user.id, id, body);
  return c.json({ success: true, data: diary });
});

// ❌ 삭제
diariesRouter.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);

  await diaryService.deleteDiary(user.id, id);
  return c.json({ success: true });
});

export default diariesRouter;
