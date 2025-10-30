// src/services/diary-service.ts
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekday from 'dayjs/plugin/weekday';
import { supabase } from '../lib/supabase';
import type {
  Diary,
  DiaryCreateInput,
  DiaryUpdateInput,
  DiarySummary,
  DiaryListFilter,
} from '../types/diary';

dayjs.extend(isoWeek);
dayjs.extend(weekday);

export const diaryService = {
  /**
   * ✏️ 새 일기 작성
   */
  async createDiary(userId: string, input: DiaryCreateInput): Promise<Diary> {
    const { title, content, is_locked = false, lock_password } = input;

    const lock_password_hash =
      is_locked && lock_password ? await bcrypt.hash(lock_password, 10) : null;

    const { data, error } = await supabase
      .from('diaries')
      .insert({
        user_id: userId,
        title: title ?? content.slice(0, 20),
        content,
        is_locked,
        lock_password_hash,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * 📋 전체 일기 목록 조회 (본문 포함)
   */
  async listDiaries(userId: string): Promise<Diary[]> {
    const { data, error } = await supabase
      .from('id, title, is_locked, created_at, updated_at')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * 📃 요약 리스트 조회 (가벼운 목록)
   */
  async listDiarySummaries(userId: string): Promise<DiarySummary[]> {
    const { data, error } = await supabase
      .from('diaries')
      .select('id, title, is_locked, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * 📆 필터 기반 리스트 조회
   * - 기간 / 월별 / 일별 / 1년전 N년전 같은 요일
   */
  async listDiarySummariesWithFilter(
    userId: string,
    options: DiaryListFilter,
  ): Promise<DiarySummary[]> {
    let fromDate: string | undefined;
    let toDate: string | undefined;

    // 1️⃣ 명시적 from/to
    if (options.from && options.to) {
      fromDate = options.from;
      toDate = options.to;
    }

    // 2️⃣ month 지정
    else if (options.month) {
      const start = dayjs(options.month).startOf('month');
      const end = dayjs(options.month).endOf('month');
      fromDate = start.toISOString();
      toDate = end.toISOString();
    }

    // 3️⃣ day 지정
    else if (options.day) {
      const start = dayjs(options.day).startOf('day');
      const end = dayjs(options.day).endOf('day');
      fromDate = start.toISOString();
      toDate = end.toISOString();
    }

    // 4️⃣ offsetYear 지정 (1년 전 / 2년 전 등)
    else if (options.offsetYear) {
      const today = dayjs();
      const target = today.subtract(options.offsetYear, 'year');
      const targetWeek = target.isoWeek(today.isoWeek());
      const targetWeekday = target.weekday(today.weekday());
      fromDate = targetWeekday.startOf('day').toISOString();
      toDate = targetWeekday.endOf('day').toISOString();
    }

    let query = supabase
      .from('diaries')
      .select('id, title, is_locked, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fromDate && toDate) {
      query = query.gte('created_at', fromDate).lte('created_at', toDate);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * 📖 단일 일기 조회
   */
  async getDiary(userId: string, diaryId: string): Promise<Diary | null> {
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', userId)
      .eq('id', diaryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  },

  /**
   * 🛠️ 일기 수정
   */
  async updateDiary(userId: string, diaryId: string, input: DiaryUpdateInput): Promise<Diary> {
    const updates: Record<string, any> = { ...input };

    if (input.lock_password !== undefined) {
      if (input.lock_password === null) {
        updates.lock_password_hash = null;
      } else {
        updates.lock_password_hash = await bcrypt.hash(input.lock_password, 10);
      }
      delete updates.lock_password;
    }

    const { data, error } = await supabase
      .from('diaries')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', diaryId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * ❌ 일기 삭제
   */
  async deleteDiary(userId: string, diaryId: string): Promise<void> {
    const { error } = await supabase
      .from('diaries')
      .delete()
      .eq('user_id', userId)
      .eq('id', diaryId);

    if (error) throw new Error(error.message);
  },

  /**
   * 🔓 잠금 해제 (비밀번호 검증)
   */
  async unlockDiary(diary: Diary, password: string): Promise<boolean> {
    if (!diary.is_locked) return true;
    if (!diary.lock_password_hash) return true;
    return await bcrypt.compare(password, diary.lock_password_hash);
  },
};
