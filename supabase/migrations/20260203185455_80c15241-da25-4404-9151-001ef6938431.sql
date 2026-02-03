-- Criar tabela onboarding_feedbacks
CREATE TABLE public.onboarding_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Status do feedback
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Respostas estruturadas
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  positive_surprise TEXT,
  integration_level TEXT CHECK (integration_level IN ('sim_totalmente', 'sim_em_parte', 'nao_muito', 'nao')),
  has_all_access BOOLEAN,
  missing_access TEXT,
  tools_ease_rating INTEGER CHECK (tools_ease_rating >= 1 AND tools_ease_rating <= 5),
  training_rating INTEGER CHECK (training_rating >= 1 AND training_rating <= 5),
  clarity_level TEXT CHECK (clarity_level IN ('sim', 'em_parte', 'nao')),
  difficulties TEXT,
  complicated_tools TEXT,
  onboarding_rating INTEGER CHECK (onboarding_rating >= 1 AND onboarding_rating <= 5),
  what_worked_well TEXT,
  improvement_suggestions TEXT,
  pending_questions TEXT,
  overall_feeling TEXT,
  additional_comments TEXT,
  
  -- Encaminhamento
  forwarded_to UUID[] DEFAULT '{}',
  forwarded_at TIMESTAMPTZ,
  forwarded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, company_id)
);

-- Adicionar campos na company_memberships para marcar novos colaboradores
ALTER TABLE public.company_memberships 
ADD COLUMN IF NOT EXISTS is_new_hire BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS employment_type TEXT CHECK (employment_type IN ('colaborador', 'prestador', 'estagiario'));

-- Habilitar RLS
ALTER TABLE public.onboarding_feedbacks ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem gerenciar seu próprio feedback
CREATE POLICY "Users can manage own feedback"
ON public.onboarding_feedbacks FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política: Admins podem ver todos os feedbacks da empresa
CREATE POLICY "Admins can view all feedbacks"
ON public.onboarding_feedbacks FOR SELECT
USING (is_company_admin(auth.uid(), company_id));

-- Política: Admins podem atualizar feedbacks (encaminhamento)
CREATE POLICY "Admins can update feedbacks"
ON public.onboarding_feedbacks FOR UPDATE
USING (is_company_admin(auth.uid(), company_id));

-- Política: Admins podem criar feedbacks para novos colaboradores
CREATE POLICY "Admins can create feedbacks"
ON public.onboarding_feedbacks FOR INSERT
WITH CHECK (is_company_admin(auth.uid(), company_id));

-- Política: Managers podem ver feedbacks encaminhados para eles
CREATE POLICY "Managers can view forwarded feedbacks"
ON public.onboarding_feedbacks FOR SELECT
USING (auth.uid() = ANY(forwarded_to));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_onboarding_feedbacks_updated_at
BEFORE UPDATE ON public.onboarding_feedbacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Índices para performance
CREATE INDEX idx_onboarding_feedbacks_company ON public.onboarding_feedbacks(company_id);
CREATE INDEX idx_onboarding_feedbacks_user ON public.onboarding_feedbacks(user_id);
CREATE INDEX idx_onboarding_feedbacks_status ON public.onboarding_feedbacks(status);
CREATE INDEX idx_onboarding_feedbacks_due_date ON public.onboarding_feedbacks(due_date);