-- Add user status tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'banned', 'suspended'));

-- Create function to ban a user
CREATE OR REPLACE FUNCTION public.ban_user(_target_user_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can ban users';
  END IF;

  -- Prevent banning other admins
  IF public.has_role(_target_user_id, 'admin') THEN
    RAISE EXCEPTION 'Cannot ban admin users';
  END IF;

  -- Update user status
  UPDATE public.profiles
  SET status = 'banned'
  WHERE user_id = _target_user_id;

  -- Log the action
  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'ban_user',
    _target_user_id,
    jsonb_build_object('reason', _reason, 'timestamp', now())
  );
END;
$$;

-- Create function to unban a user
CREATE OR REPLACE FUNCTION public.unban_user(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can unban users';
  END IF;

  -- Update user status
  UPDATE public.profiles
  SET status = 'active'
  WHERE user_id = _target_user_id;

  -- Log the action
  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'unban_user',
    _target_user_id,
    jsonb_build_object('timestamp', now())
  );
END;
$$;

-- Create function to delete a user (soft delete by marking as deleted)
CREATE OR REPLACE FUNCTION public.delete_user_account(_target_user_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Prevent deleting other admins
  IF public.has_role(_target_user_id, 'admin') THEN
    RAISE EXCEPTION 'Cannot delete admin users';
  END IF;

  -- Mark profile as deleted (you may want to handle this differently)
  UPDATE public.profiles
  SET status = 'banned',
      name = '[Deleted User]',
      description = NULL
  WHERE user_id = _target_user_id;

  -- Remove all user roles except 'user'
  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id AND role != 'user';

  -- Log the action
  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'delete_user',
    _target_user_id,
    jsonb_build_object('reason', _reason, 'timestamp', now())
  );
END;
$$;

-- Drop and recreate the get_all_users_with_roles function to include status
DROP FUNCTION IF EXISTS public.get_all_users_with_roles();

CREATE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(user_id uuid, email text, name text, created_at timestamp with time zone, roles text[], status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.email,
    p.name,
    p.created_at,
    COALESCE(ARRAY_AGG(ur.role::text) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::text[]) as roles,
    COALESCE(p.status, 'active') as status
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY p.user_id, p.email, p.name, p.created_at, p.status
  ORDER BY p.created_at DESC;
$$;