-- =============================================
-- NPS Surveys Table
-- =============================================
CREATE TABLE public.nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id),
  
  -- Configuração
  question TEXT NOT NULL DEFAULT 'Em uma escala de 0 a 10, o quanto você recomendaria esta empresa como um bom lugar para trabalhar?',
  target_departments UUID[] DEFAULT '{}',
  target_teams UUID[] DEFAULT '{}',
  target_all BOOLEAN DEFAULT false,
  end_date DATE NOT NULL,
  
  -- Regra de comentário obrigatório
  require_comment_below INTEGER,
  
  -- Filtro de tempo de empresa
  min_days_employed INTEGER,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- NPS Responses Table
-- =============================================
CREATE TABLE public.nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.nps_surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  
  -- Resposta
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  comment TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(survey_id, user_id)
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_nps_surveys_company ON public.nps_surveys(company_id);
CREATE INDEX idx_nps_surveys_status ON public.nps_surveys(status);
CREATE INDEX idx_nps_surveys_end_date ON public.nps_surveys(end_date);
CREATE INDEX idx_nps_responses_survey ON public.nps_responses(survey_id);
CREATE INDEX idx_nps_responses_user ON public.nps_responses(user_id);

-- =============================================
-- Updated at trigger (using existing function)
-- =============================================
CREATE TRIGGER update_nps_surveys_updated_at
  BEFORE UPDATE ON public.nps_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- Enable RLS
-- =============================================
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for nps_surveys
-- =============================================

-- Admins can do everything
CREATE POLICY "Admins can manage NPS surveys"
ON public.nps_surveys FOR ALL
USING (is_company_admin(auth.uid(), company_id));

-- Members can view active surveys from their company
CREATE POLICY "Members can view active surveys"
ON public.nps_surveys FOR SELECT
USING (is_company_member(auth.uid(), company_id) AND status = 'active');

-- =============================================
-- RLS Policies for nps_responses
-- =============================================

-- Users can submit their own responses
CREATE POLICY "Users can submit responses"
ON public.nps_responses FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can view their own responses
CREATE POLICY "Users can view own responses"
ON public.nps_responses FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all responses for their company's surveys
CREATE POLICY "Admins can view all responses"
ON public.nps_responses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.nps_surveys s
  WHERE s.id = nps_responses.survey_id
  AND is_company_admin(auth.uid(), s.company_id)
));