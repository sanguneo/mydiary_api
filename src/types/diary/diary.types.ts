// src/types/diary/diary.types.ts

/**
 * DB 모델
 */
export interface IDiary {
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
export type TDiaryPublic = Omit<IDiary, 'lock_password_hash'>;

/**
 * 일기 생성 시 입력 필드
 */
export interface IDiaryCreateInput {
  title?: string;
  content: string;
  is_locked?: boolean;
  lock_password?: string;
}

/**
 * 일기 수정 시 입력 필드
 */
export interface IDiaryUpdateInput {
  title?: string;
  content?: string;
  is_locked?: boolean;
  lock_password?: string | null;
}

/**
 * 일기 리스트(요약)용 DTO
 */
export interface IDiarySummary {
  id: string;
  title: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 일기 리스트 조회용 필터 옵션
 */
export interface IDiaryListFilter {
  from?: string;
  to?: string;
  month?: string;
  day?: string;
  offsetYear?: number;
}
