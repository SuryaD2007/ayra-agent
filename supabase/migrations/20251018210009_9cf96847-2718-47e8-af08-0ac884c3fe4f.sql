-- Create Canvas integrations table
CREATE TABLE IF NOT EXISTS public.canvas_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_url text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create Canvas items table
CREATE TABLE IF NOT EXISTS public.canvas_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canvas_id text NOT NULL,
  type text NOT NULL,
  course_name text,
  title text,
  description text,
  due_date timestamptz,
  url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, canvas_id)
);

-- Enable RLS on canvas_integrations
ALTER TABLE public.canvas_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for canvas_integrations
CREATE POLICY "Users can view their own canvas integrations"
ON public.canvas_integrations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own canvas integrations"
ON public.canvas_integrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own canvas integrations"
ON public.canvas_integrations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own canvas integrations"
ON public.canvas_integrations
FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on canvas_items
ALTER TABLE public.canvas_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for canvas_items
CREATE POLICY "Users can view their own canvas items"
ON public.canvas_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own canvas items"
ON public.canvas_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own canvas items"
ON public.canvas_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own canvas items"
ON public.canvas_items
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_canvas_integrations_user_id ON public.canvas_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_items_user_id ON public.canvas_items(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_items_due_date ON public.canvas_items(due_date) WHERE due_date IS NOT NULL;