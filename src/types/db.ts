export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  email: string | null;
  account_key_meta: Json;
  settings: Json;
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
  meta: Json;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEvent {
  actor_id: string;
  target_user_id: string | null;
  action: string;
  details: Json;
}

export interface AuditLogRow extends AuditLogEvent {
  id: string;
  created_at: string;
}

export interface AdminRole {
  user_id: string;
  role: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email?: string | null;
          account_key_meta?: Json;
          settings?: Json;
          is_disabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          email: string | null;
          account_key_meta: Json;
          settings: Json;
          is_disabled: boolean;
          updated_at: string;
        }>;
      };
      entries: {
        Row: DiaryEntry;
        Insert: {
          user_id: string;
          entry_date: string;
          entry_time?: string | null;
          ciphertext: string;
          iv: string;
          wrapped_entry_key?: string | null;
          meta?: Json;
          is_locked?: boolean;
        };
        Update: Partial<{
          entry_date: string;
          entry_time: string | null;
          ciphertext: string;
          iv: string;
          wrapped_entry_key: string | null;
          meta: Json;
          is_locked: boolean;
          updated_at: string;
        }>;
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: {
          actor_id?: string | null;
          target_user_id?: string | null;
          action: string;
          details?: Json;
        };
        Update: Partial<AuditLogEvent>;
      };
      admin_roles: {
        Row: AdminRole;
        Insert: {
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: Partial<Pick<AdminRole, "role" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
