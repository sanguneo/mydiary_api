-- Enable RLS and create policies
alter table profiles enable row level security;
alter table entries enable row level security;
alter table audit_logs enable row level security;

-- profiles owner: users can manage their own profile
create policy profiles_owner on profiles
  for all
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- entries owner: users can manage their own entries
create policy entries_owner on entries
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- allow admin to view profiles (select only)
create policy profiles_admin on profiles
  for select
  using ( exists (select 1 from admin_roles ar where ar.user_id = auth.uid()) );

-- audit_logs: only admin can read/write
create policy audit_admin_only on audit_logs
  for all
  using ( exists (select 1 from admin_roles ar where ar.user_id = auth.uid()) );
