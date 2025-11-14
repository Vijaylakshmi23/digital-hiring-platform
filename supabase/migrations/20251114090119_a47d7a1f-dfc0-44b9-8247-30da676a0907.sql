-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true);

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload chat files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view chat files they're involved in
CREATE POLICY "Users can view chat files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chat-files');

-- Allow users to delete their own uploaded files
CREATE POLICY "Users can delete own chat files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);