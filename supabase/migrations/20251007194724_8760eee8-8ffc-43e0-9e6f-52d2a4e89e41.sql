-- Make the ayra-files bucket public so file URLs work
UPDATE storage.buckets
SET public = true
WHERE id = 'ayra-files';