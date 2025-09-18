-- Create table for storing processed videos
CREATE TABLE public.processed_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  title TEXT,
  transcript TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing user interactions with videos
CREATE TABLE public.video_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_title TEXT,
  user_query TEXT,
  ai_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.processed_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for processed_videos (publicly readable, system managed)
CREATE POLICY "Anyone can view processed videos"
ON public.processed_videos
FOR SELECT
USING (true);

-- RLS policies for video_interactions (users can only see their own)
CREATE POLICY "Users can view their own video interactions"
ON public.video_interactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video interactions"
ON public.video_interactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_processed_videos_video_id ON public.processed_videos(video_id);
CREATE INDEX idx_video_interactions_user_id ON public.video_interactions(user_id);
CREATE INDEX idx_video_interactions_video_id ON public.video_interactions(video_id);