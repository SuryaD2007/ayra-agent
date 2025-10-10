-- Add settings column to profiles table to store user preferences
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Create index for faster settings queries
CREATE INDEX IF NOT EXISTS idx_profiles_settings ON public.profiles USING GIN (settings);