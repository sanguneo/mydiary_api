-- create extension and core tables
create extension if not exists "pgcrypto";

-- profiles: additional user metadata for auth.users
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  account_key_meta jsonb,
  settings jsonb default '{}'::jsonb,
  is_disabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- entries : encrypted diary entries
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  entry_date date not null,
  entry_time time,
  is_locked boolean default false,
  ciphertext text not null,
  iv text not null,
  wrapped_entry_key text,
  meta jsonb,
  constraint entries_user_date_unique unique (user_id, id)
);

create index if not exists idx_entries_user_date on entries (user_id, entry_date);

-- admin_roles
create table if not exists admin_roles (
  user_id uuid references auth.users(id),
  role text,
  created_at timestamptz default now(),
  primary key (user_id)
);

-- audit_logs
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  target_user_id uuid,
  action text,
  details jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_audit_actor on audit_logs(actor_id);
create index if not exists idx_audit_target on audit_logs(target_user_id);
