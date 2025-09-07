-- Enable real-time updates for the items table
ALTER TABLE public.items REPLICA IDENTITY FULL;

-- Add the items table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;