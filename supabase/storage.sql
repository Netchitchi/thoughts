-- Create storage bucket for group covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('group-covers', 'group-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public access to view files
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'group-covers');

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'group-covers' AND
    auth.role() = 'authenticated'
  );

-- Policy: Allow users to update/delete their own files (optional but good)
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'group-covers' AND
    auth.uid() = owner
  );

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'group-covers' AND
    auth.uid() = owner
  );
