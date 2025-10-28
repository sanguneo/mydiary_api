import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Profile } from "./db";

export interface AppBindings {}

export interface AppVariables {
  supabaseUser: User;
  profile: Profile | null;
  isAdmin: boolean;
  supabaseClient: SupabaseClient;
}

export type AppEnv = {
  Bindings: AppBindings;
  Variables: AppVariables;
};
