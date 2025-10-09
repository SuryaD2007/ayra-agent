-- Create table to track user IP addresses and login history
CREATE TABLE IF NOT EXISTS public.user_login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text NOT NULL,
  user_agent text,
  logged_in_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on login history
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all login history
CREATE POLICY "Admins can view all login history"
ON public.user_login_history
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own login history
CREATE POLICY "Users can view their own login history"
ON public.user_login_history
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert login history
CREATE POLICY "System can insert login history"
ON public.user_login_history
FOR INSERT
WITH CHECK (true);

-- Create table for banned IPs
CREATE TABLE IF NOT EXISTS public.banned_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  reason text,
  banned_at timestamp with time zone DEFAULT now(),
  banned_by uuid REFERENCES auth.users(id),
  expires_at timestamp with time zone
);

-- Enable RLS on banned IPs
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;

-- Admins can manage banned IPs
CREATE POLICY "Admins can manage banned IPs"
ON public.banned_ips
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to ban user's IPs
CREATE OR REPLACE FUNCTION public.ban_user_ips(_target_user_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_ip text;
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can ban IPs';
  END IF;

  -- Get all IPs used by the user and ban them
  FOR user_ip IN 
    SELECT DISTINCT ip_address 
    FROM public.user_login_history 
    WHERE user_id = _target_user_id
  LOOP
    INSERT INTO public.banned_ips (ip_address, reason, banned_by)
    VALUES (user_ip, _reason, auth.uid())
    ON CONFLICT (ip_address) DO NOTHING;
  END LOOP;
END;
$$;

-- Create function to unban user's IPs
CREATE OR REPLACE FUNCTION public.unban_user_ips(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can unban IPs';
  END IF;

  -- Remove all IP bans for this user's IPs
  DELETE FROM public.banned_ips
  WHERE ip_address IN (
    SELECT DISTINCT ip_address 
    FROM public.user_login_history 
    WHERE user_id = _target_user_id
  );
END;
$$;

-- Create function to check if IP is banned
CREATE OR REPLACE FUNCTION public.is_ip_banned(_ip_address text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.banned_ips
    WHERE ip_address = _ip_address
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Update ban_user function to also ban IPs
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

  -- Ban all IPs used by this user
  PERFORM public.ban_user_ips(_target_user_id, _reason);

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

-- Update unban_user function to also unban IPs
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

  -- Unban all IPs used by this user
  PERFORM public.unban_user_ips(_target_user_id);

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

-- Update delete_user_account function to also ban IPs
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

  -- Ban all IPs used by this user
  PERFORM public.ban_user_ips(_target_user_id, COALESCE(_reason, 'Account deleted'));

  -- Mark profile as deleted
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

-- Create index for faster IP lookups
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON public.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_ip ON public.user_login_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_banned_ips_ip ON public.banned_ips(ip_address);