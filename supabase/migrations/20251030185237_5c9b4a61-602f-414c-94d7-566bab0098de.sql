-- Create google_integrations table
CREATE TABLE public.google_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  drive_enabled BOOLEAN DEFAULT false,
  calendar_enabled BOOLEAN DEFAULT false,
  drive_last_sync TIMESTAMP WITH TIME ZONE,
  calendar_last_sync TIMESTAMP WITH TIME ZONE,
  drive_sync_token TEXT,
  calendar_sync_token TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create google_drive_items table
CREATE TABLE public.google_drive_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drive_id TEXT NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  web_view_link TEXT,
  modified_time TIMESTAMP WITH TIME ZONE,
  created_time TIMESTAMP WITH TIME ZONE,
  parent_folder_id TEXT,
  thumbnail_link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, drive_id)
);

-- Create google_calendar_events table
CREATE TABLE public.google_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  location TEXT,
  html_link TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  is_assignment BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Create indexes
CREATE INDEX idx_google_drive_items_user_id ON public.google_drive_items(user_id);
CREATE INDEX idx_google_drive_items_drive_id ON public.google_drive_items(drive_id);
CREATE INDEX idx_google_calendar_events_user_id ON public.google_calendar_events(user_id);
CREATE INDEX idx_google_calendar_events_event_id ON public.google_calendar_events(event_id);
CREATE INDEX idx_google_calendar_events_start_time ON public.google_calendar_events(start_time);

-- Enable RLS
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_drive_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for google_integrations
CREATE POLICY "Users can manage their own google integrations"
ON public.google_integrations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for google_drive_items
CREATE POLICY "Users can manage their own google drive items"
ON public.google_drive_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for google_calendar_events
CREATE POLICY "Users can manage their own google calendar events"
ON public.google_calendar_events
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at on google_integrations
CREATE TRIGGER update_google_integrations_updated_at
BEFORE UPDATE ON public.google_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();