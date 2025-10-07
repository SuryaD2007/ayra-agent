-- Enable RLS policies for the ayra-files storage bucket

-- Allow authenticated users to upload files to their own folders
CREATE POLICY "Users can upload their own project files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ayra-files' 
  AND (storage.foldername(name))[1] = 'project-files'
);

-- Allow authenticated users to view files
CREATE POLICY "Users can view project files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ayra-files'
  AND (storage.foldername(name))[1] = 'project-files'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own project files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ayra-files'
  AND (storage.foldername(name))[1] = 'project-files'
);