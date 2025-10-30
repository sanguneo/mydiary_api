// src/types/profile/profile.types.ts

export interface IProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  settings: Record<string, unknown> | null;
  role: string | null;
}
