
-- Check if checkin_attachments exists, if not create it
-- (previous migration may have partially applied)
CREATE TABLE IF NOT EXISTS public.checkin_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL REFERENCES public.okr_checkins(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure soft delete column exists
ALTER TABLE public.okr_checkins ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_okr_checkins_deleted_at ON public.okr_checkins (deleted_at) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.checkin_attachments ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (from partial run) then recreate
DROP POLICY IF EXISTS "Members can view checkin attachments" ON public.checkin_attachments;
DROP POLICY IF EXISTS "Checkin author can add attachments" ON public.checkin_attachments;
DROP POLICY IF EXISTS "Checkin author can delete attachments" ON public.checkin_attachments;

CREATE POLICY "Members can view checkin attachments"
ON public.checkin_attachments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.okr_checkins c
  WHERE c.id = checkin_attachments.checkin_id
    AND public.is_company_member(auth.uid(), c.company_id)
));

CREATE POLICY "Checkin author can add attachments"
ON public.checkin_attachments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.okr_checkins c
  WHERE c.id = checkin_attachments.checkin_id
    AND c.user_id = auth.uid()
    AND c.deleted_at IS NULL
));

CREATE POLICY "Checkin author can delete attachments"
ON public.checkin_attachments FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.okr_checkins c
  WHERE c.id = checkin_attachments.checkin_id
    AND c.user_id = auth.uid()
));

-- Storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('checkin-attachments', 'checkin-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Drop storage policies if exist then recreate
DROP POLICY IF EXISTS "Users can upload checkin attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can read checkin attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own checkin attachments" ON storage.objects;

CREATE POLICY "Users can upload checkin attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'checkin-attachments'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read checkin attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'checkin-attachments'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete own checkin attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'checkin-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Enable realtime for key_results only (okr_checkins already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'key_results'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.key_results;
  END IF;
END $$;
