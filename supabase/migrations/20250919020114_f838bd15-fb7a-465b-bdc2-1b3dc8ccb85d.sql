-- Create beta_signups table for Mac/Windows beta signups
CREATE TABLE public.beta_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  os TEXT NOT NULL, -- 'mac' or 'windows'
  note TEXT,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (no authentication required for beta signup)
CREATE POLICY "Anyone can insert beta signups" 
ON public.beta_signups 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance on email lookups
CREATE INDEX idx_beta_signups_email ON public.beta_signups(email);
CREATE INDEX idx_beta_signups_os ON public.beta_signups(os);