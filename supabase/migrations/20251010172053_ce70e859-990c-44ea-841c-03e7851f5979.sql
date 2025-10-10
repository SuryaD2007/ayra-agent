-- Create integration_settings table
CREATE TABLE public.integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('google_drive', 'notion', 'github')),
  is_connected BOOLEAN NOT NULL DEFAULT false,
  access_token TEXT,
  refresh_token TEXT,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency TEXT NOT NULL DEFAULT 'manual' CHECK (sync_frequency IN ('manual', 'hourly', 'daily', 'weekly')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, integration_type)
);

-- Enable RLS
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own integration settings"
  ON public.integration_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integration settings"
  ON public.integration_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integration settings"
  ON public.integration_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integration settings"
  ON public.integration_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create update trigger
CREATE TRIGGER update_integration_settings_updated_at
  BEFORE UPDATE ON public.integration_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- Create integration_sync_logs table for activity tracking
CREATE TABLE public.integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'in_progress')),
  items_synced INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sync logs
CREATE POLICY "Users can view their own sync logs"
  ON public.integration_sync_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
  ON public.integration_sync_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);