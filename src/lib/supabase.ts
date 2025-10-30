import {
  createClient,
  type PostgrestError,
  type PostgrestMaybeSingleResponse,
  type PostgrestResponse,
  type PostgrestSingleResponse,
} from '@supabase/supabase-js';
import env from '../config/env';
import { AppError } from './errors';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type SupabaseClient = typeof supabase;

type SupabaseResult<T> =
  | PostgrestSingleResponse<T>
  | PostgrestMaybeSingleResponse<T>
  | PostgrestResponse<T>;

type WrapQueryOptions = {
  message?: string;
  status?: number;
  code?: string;
  details?: unknown;
};

export async function wrapQuery<T>(
  execute: () => Promise<SupabaseResult<T>>,
  options: WrapQueryOptions = {},
): Promise<T> {
  const result = await execute();
  const { data, error } = result;

  if (error) {
    const details: Record<string, unknown> = {
      supabase: {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      },
    };

    if (options.details !== undefined) {
      details.context = options.details;
    }

    throw new AppError(options.message ?? 'Supabase query failed', {
      status: options.status ?? 500,
      code: options.code ?? 'supabase_error',
      details,
      cause: error,
    });
  }

  return data as T;
}
