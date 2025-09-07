-- Create default spaces for users
-- This will allow proper space-specific filtering for default spaces like "OSS", "Second Brain", etc.

-- Insert default spaces for existing users (if any)
-- We'll create these with predictable IDs so we can reference them in the frontend

-- Shared spaces
INSERT INTO public.spaces (id, name, emoji, visibility, user_id) 
SELECT 
  gen_random_uuid(),
  'Second Brain',
  '🧠',
  'shared',
  id
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.spaces 
  WHERE user_id = auth.users.id AND name = 'Second Brain'
);

INSERT INTO public.spaces (id, name, emoji, visibility, user_id) 
SELECT 
  gen_random_uuid(),
  'OSS',
  '⚡',
  'shared',
  id
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.spaces 
  WHERE user_id = auth.users.id AND name = 'OSS'
);

INSERT INTO public.spaces (id, name, emoji, visibility, user_id) 
SELECT 
  gen_random_uuid(),
  'Artificial Intelligence',
  '🤖',
  'shared',
  id
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.spaces 
  WHERE user_id = auth.users.id AND name = 'Artificial Intelligence'
);

-- Team spaces
INSERT INTO public.spaces (id, name, emoji, visibility, user_id) 
SELECT 
  gen_random_uuid(),
  'Brainboard Competitors',
  '🎯',
  'team',
  id
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.spaces 
  WHERE user_id = auth.users.id AND name = 'Brainboard Competitors'
);

INSERT INTO public.spaces (id, name, emoji, visibility, user_id) 
SELECT 
  gen_random_uuid(),
  'Visualize Terraform',
  '🏗️',
  'team',
  id
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.spaces 
  WHERE user_id = auth.users.id AND name = 'Visualize Terraform'
);

INSERT INTO public.spaces (id, name, emoji, visibility, user_id) 
SELECT 
  gen_random_uuid(),
  'CI/CD Engine',
  '⚙️',
  'team',
  id
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.spaces 
  WHERE user_id = auth.users.id AND name = 'CI/CD Engine'
);

-- Private spaces
INSERT INTO public.spaces (id, name, emoji, visibility, user_id) 
SELECT 
  gen_random_uuid(),
  'UXUI',
  '🎨',
  'private',
  id
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.spaces 
  WHERE user_id = auth.users.id AND name = 'UXUI'
);

INSERT INTO public.spaces (id, name, emoji, visibility, user_id) 
SELECT 
  gen_random_uuid(),
  'Space',
  '🚀',
  'private',
  id
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.spaces 
  WHERE user_id = auth.users.id AND name = 'Space'
);

INSERT INTO public.spaces (id, name, emoji, visibility, user_id) 
SELECT 
  gen_random_uuid(),
  'Cloud Computing',
  '☁️',
  'private',
  id
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.spaces 
  WHERE user_id = auth.users.id AND name = 'Cloud Computing'
);

-- Create a function to automatically create default spaces for new users
CREATE OR REPLACE FUNCTION public.create_default_spaces_for_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default spaces for new user
  INSERT INTO public.spaces (name, emoji, visibility, user_id) VALUES
  -- Shared spaces
  ('Second Brain', '🧠', 'shared', user_id),
  ('OSS', '⚡', 'shared', user_id),
  ('Artificial Intelligence', '🤖', 'shared', user_id),
  -- Team spaces
  ('Brainboard Competitors', '🎯', 'team', user_id),
  ('Visualize Terraform', '🏗️', 'team', user_id),
  ('CI/CD Engine', '⚙️', 'team', user_id),
  -- Private spaces
  ('UXUI', '🎨', 'private', user_id),
  ('Space', '🚀', 'private', user_id),
  ('Cloud Computing', '☁️', 'private', user_id);
END;
$$;

-- Create a trigger to automatically create default spaces for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default spaces for the new user
  PERFORM public.create_default_spaces_for_user(NEW.id);
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users (if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();