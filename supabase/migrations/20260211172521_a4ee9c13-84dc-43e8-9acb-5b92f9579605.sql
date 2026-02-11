
-- Table: gptw_surveys
CREATE TABLE public.gptw_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  created_by UUID NOT NULL REFERENCES public.users(id),
  target_departments UUID[] DEFAULT '{}'::uuid[],
  target_teams UUID[] DEFAULT '{}'::uuid[],
  target_users UUID[] DEFAULT '{}'::uuid[],
  target_all BOOLEAN DEFAULT false,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gptw_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage GPTW surveys"
  ON public.gptw_surveys FOR ALL
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Members can view active GPTW surveys"
  ON public.gptw_surveys FOR SELECT
  USING (is_company_member(auth.uid(), company_id) AND status = 'active');

-- Table: gptw_responses
CREATE TABLE public.gptw_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.gptw_surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  enps_score INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(survey_id, user_id)
);

ALTER TABLE public.gptw_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all GPTW responses"
  ON public.gptw_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.gptw_surveys s
    WHERE s.id = gptw_responses.survey_id
    AND is_company_admin(auth.uid(), s.company_id)
  ));

CREATE POLICY "Users can view own GPTW responses"
  ON public.gptw_responses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can submit GPTW responses"
  ON public.gptw_responses FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at on gptw_surveys
CREATE TRIGGER update_gptw_surveys_updated_at
  BEFORE UPDATE ON public.gptw_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
