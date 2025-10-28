import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database, Profile } from "./db";

export interface AppBindings {}

export interface AppVariables {
  supabaseUser: User;
  profile: Profile | null;
  isAdmin: boolean;
  supabaseClient: SupabaseClient<Database>;
}

export type AppEnv = {
  Bindings: AppBindings;
  Variables: AppVariables;
};
