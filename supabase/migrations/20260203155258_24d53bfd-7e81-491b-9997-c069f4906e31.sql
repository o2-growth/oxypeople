-- Create storage bucket for post attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-attachments', 'post-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Users can upload their own attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'post-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view post attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'post-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);