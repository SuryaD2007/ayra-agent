-- Create admin audit log table
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Admin Access
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all email notifications"
ON public.email_notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view audit log"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit log"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- Admin Helper Functions
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  roles TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.email,
    p.name,
    p.created_at,
    COALESCE(ARRAY_AGG(ur.role::text) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::text[]) as roles
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY p.user_id, p.email, p.name, p.created_at
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.assign_role(_target_user_id UUID, _role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;

  -- Insert role (will be ignored if already exists due to unique constraint)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log the action
  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'assign_role',
    _target_user_id,
    jsonb_build_object('role', _role::text)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_role(_target_user_id UUID, _role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can remove roles';
  END IF;

  -- Prevent removing the last admin role
  IF _role = 'admin' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin user';
    END IF;
  END IF;

  -- Remove role
  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id AND role = _role;

  -- Log the action
  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'remove_role',
    _target_user_id,
    jsonb_build_object('role', _role::text)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_analytics_summary()
RETURNS TABLE (
  total_users BIGINT,
  total_events BIGINT,
  event_type TEXT,
  event_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.analytics_events) as total_events,
    ae.event_type,
    COUNT(*) as event_count
  FROM public.analytics_events ae
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY ae.event_type
  ORDER BY event_count DESC;
$$;