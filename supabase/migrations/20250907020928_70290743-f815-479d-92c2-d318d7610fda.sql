-- Fix RLS policy for items to allow soft deletion
-- Drop the existing policy
DROP POLICY IF EXISTS "own items" ON public.items;

-- Create separate policies for different operations
-- SELECT policy - only show non-deleted items
CREATE POLICY "Users can view their own non-deleted items" 
ON public.items 
FOR SELECT 
USING ((auth.uid() = user_id) AND (deleted_at IS NULL));

-- INSERT policy - users can create their own items
CREATE POLICY "Users can create their own items" 
ON public.items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy - users can update their own items (including soft delete)
CREATE POLICY "Users can update their own items" 
ON public.items 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy - users can hard delete their own items (if needed)
CREATE POLICY "Users can delete their own items" 
ON public.items 
FOR DELETE 
USING (auth.uid() = user_id);