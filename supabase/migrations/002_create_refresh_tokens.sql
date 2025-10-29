BEGIN;

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked boolean DEFAULT false,
  replaced_by uuid NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens (user_id);

COMMIT;
