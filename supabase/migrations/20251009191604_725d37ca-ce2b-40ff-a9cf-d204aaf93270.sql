
-- Unban the IP address 192.231.40.120 directly
DELETE FROM public.banned_ips
WHERE ip_address = '192.231.40.120';

-- Also ensure both user accounts are active
UPDATE public.profiles
SET status = 'active'
WHERE email IN ('pdegela@gmail.com', 'suryadegala9@gmail.com')
AND status = 'banned';
