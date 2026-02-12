
-- Create saved_filters table for users to save filter combinations
CREATE TABLE public.saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own saved filters
CREATE POLICY "Users can manage own saved filters"
ON public.saved_filters
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add index for fast lookup
CREATE INDEX idx_saved_filters_user_company ON public.saved_filters(user_id, company_id);
