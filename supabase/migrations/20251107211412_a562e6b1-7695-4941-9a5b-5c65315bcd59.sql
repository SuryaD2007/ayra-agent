-- Drop the trigger that creates default spaces for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function that handles new user creation
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the function that creates default spaces
DROP FUNCTION IF EXISTS public.create_default_spaces_for_user(uuid);