ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- allow owners to select
CREATE POLICY profiles_select_owner ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- allow super_admin to select
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

-- allow owners to update
CREATE POLICY profiles_update_owner ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- allow super_admin to update
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );
