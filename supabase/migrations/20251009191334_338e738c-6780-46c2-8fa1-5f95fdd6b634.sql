
-- Unban all IPs associated with pdegala@gmail.com and suryadegala9@gmail.com
DELETE FROM public.banned_ips
WHERE ip_address IN (
  SELECT DISTINCT ulh.ip_address 
  FROM public.user_login_history ulh
  JOIN public.profiles p ON ulh.user_id = p.user_id
  WHERE p.email IN ('pdegala@gmail.com', 'suryadegala9@gmail.com')
);

-- Also unban the users themselves if they were banned
UPDATE public.profiles
SET status = 'active'
WHERE email IN ('pdegala@gmail.com', 'suryadegala9@gmail.com')
AND status = 'banned';
