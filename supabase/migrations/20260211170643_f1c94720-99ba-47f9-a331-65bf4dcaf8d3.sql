
-- Create company_events table
CREATE TABLE public.company_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  event_type TEXT NOT NULL DEFAULT 'other',
  color TEXT DEFAULT '#3B82F6',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_events ENABLE ROW LEVEL SECURITY;

-- Members can view company events
CREATE POLICY "Members can view company events"
ON public.company_events
FOR SELECT
USING (is_company_member(auth.uid(), company_id));

-- Admins can create events
CREATE POLICY "Admins can create events"
ON public.company_events
FOR INSERT
WITH CHECK (is_company_admin(auth.uid(), company_id));

-- Admins can update events
CREATE POLICY "Admins can update events"
ON public.company_events
FOR UPDATE
USING (is_company_admin(auth.uid(), company_id));

-- Admins can delete events
CREATE POLICY "Admins can delete events"
ON public.company_events
FOR DELETE
USING (is_company_admin(auth.uid(), company_id));

-- Updated_at trigger
CREATE TRIGGER update_company_events_updated_at
BEFORE UPDATE ON public.company_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
