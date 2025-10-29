// src/types/diary.ts

/**
 * DB 모델
 */
export interface Diary {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_locked: boolean;
  lock_password_hash?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Client-facing DTO (비밀번호 해시 제외)
 */
export type DiaryPublic = Omit<Diary, 'lock_password_hash'>;

/**
 * 일기 생성 시 입력 필드
 */
export interface DiaryCreateInput {
  title: string;
  content: string;
  is_locked?: boolean;
  lock_password?: string; // 평문 입력받음 → bcrypt 해시 저장
}

/**
 * 일기 수정 시 입력 필드
 */
export interface DiaryUpdateInput {
  title?: string;
  content?: string;
  is_locked?: boolean;
  lock_password?: string | null; // null이면 기존 해시 제거
}

/**
 * 일기 리스트(요약)용 DTO
 */
export interface DiarySummary {
  id: string;
  title: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 일기 리스트 조회용 필터 옵션
 * - from/to: 명시적 기간
 * - month: 월별
 * - day: 일별
 * - offsetYear: 1년전, 2년전 등 상대적 조회
 */
export interface DiaryListFilter {
  from?: string;
  to?: string;
  month?: string; // YYYY-MM
  day?: string;   // YYYY-MM-DD
  offsetYear?: number; // ex: 1 → 1년 전 같은 주/요일
}
