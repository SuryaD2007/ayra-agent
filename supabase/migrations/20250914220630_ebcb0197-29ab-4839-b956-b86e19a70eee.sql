-- Add parsed_content column to items table for PDF text extraction
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS parsed_content TEXT;