-- Add new columns to projects table for enhanced project management
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_links JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS project_files JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add check constraint for priority values
ALTER TABLE public.projects
ADD CONSTRAINT priority_check CHECK (priority IN ('low', 'medium', 'high'));

-- Add comment to document the JSONB structure
COMMENT ON COLUMN public.projects.project_links IS 'Array of link objects with title and url properties: [{"title": "string", "url": "string"}]';
COMMENT ON COLUMN public.projects.project_files IS 'Array of file objects with name, url, and optional size properties: [{"name": "string", "url": "string", "size": number}]';