-- Fix RLS policies to allow soft deletion
-- Drop the existing UPDATE policy that might be too restrictive
DROP POLICY IF EXISTS "Users can update their own items" ON public.items;

-- Create a new UPDATE policy that allows soft deletion
CREATE POLICY "Users can update their own items" 
ON public.items 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also ensure the SELECT policy works correctly with deleted items
DROP POLICY IF EXISTS "Users can view their own non-deleted items" ON public.items;

-- Create a SELECT policy that shows non-deleted items by default
CREATE POLICY "Users can view their own non-deleted items" 
ON public.items 
FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Add a separate policy to allow viewing deleted items if needed (for admin purposes)
CREATE POLICY "Users can view their own deleted items" 
ON public.items 
FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NOT NULL);