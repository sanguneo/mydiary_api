export interface Profile {
  id: string;
  email: string | null;
  account_key_meta: Record<string, unknown> | null;
  settings: Record<string, unknown>;
  is_disabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  entry_date: string;
  entry_time: string | null;
  is_locked: boolean;
  ciphertext: string;
  iv: string;
  wrapped_entry_key: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEvent {
  id?: string;
  actor_id: string;
  target_user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at?: string;
}
