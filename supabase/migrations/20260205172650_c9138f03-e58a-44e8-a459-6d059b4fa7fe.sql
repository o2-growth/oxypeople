-- Enum para tipo de ciclo
CREATE TYPE public.performance_cycle_type AS ENUM (
  'self', '180', '360', 'leader', 'custom'
);

-- Enum para status do ciclo
CREATE TYPE public.performance_cycle_status AS ENUM (
  'draft', 'scheduled', 'active', 'completed', 'cancelled'
);

-- Enum para status da avaliacao
CREATE TYPE public.evaluation_status AS ENUM (
  'pending', 'in_progress', 'completed', 'expired'
);

-- Tabela de ciclos
CREATE TABLE public.performance_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type performance_cycle_type NOT NULL DEFAULT '180',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status performance_cycle_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.users(id),
  target_departments UUID[] DEFAULT '{}',
  target_teams UUID[] DEFAULT '{}',
  target_users UUID[] DEFAULT '{}',
  target_all BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de avaliacoes individuais
CREATE TABLE public.performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.performance_cycles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES public.users(id),
  evaluated_id UUID NOT NULL REFERENCES public.users(id),
  relationship TEXT NOT NULL,
  status evaluation_status NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  overall_score DECIMAL(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de perguntas
CREATE TABLE public.performance_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.performance_cycles(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL DEFAULT 'rating',
  category TEXT DEFAULT 'geral',
  order_index INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT true,
  options JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de respostas
CREATE TABLE public.performance_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.performance_evaluations(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.performance_questions(id) ON DELETE CASCADE,
  answer JSONB NOT NULL,
  score DECIMAL(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(evaluation_id, question_id)
);

-- Indices
CREATE INDEX idx_cycles_company ON public.performance_cycles(company_id);
CREATE INDEX idx_evaluations_cycle ON public.performance_evaluations(cycle_id);
CREATE INDEX idx_evaluations_evaluator ON public.performance_evaluations(evaluator_id);
CREATE INDEX idx_evaluations_evaluated ON public.performance_evaluations(evaluated_id);

-- RLS
ALTER TABLE public.performance_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_answers ENABLE ROW LEVEL SECURITY;

-- Policies para cycles (admins gerenciam, membros visualizam)
CREATE POLICY "Admins can manage cycles"
ON public.performance_cycles FOR ALL
USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Members can view active cycles"
ON public.performance_cycles FOR SELECT
USING (is_company_member(auth.uid(), company_id) AND status != 'draft');

-- Policies para evaluations
CREATE POLICY "Admins can view all evaluations"
ON public.performance_evaluations FOR SELECT
USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can view own evaluations"
ON public.performance_evaluations FOR SELECT
USING (evaluator_id = auth.uid() OR evaluated_id = auth.uid());

CREATE POLICY "Admins can create evaluations"
ON public.performance_evaluations FOR INSERT
WITH CHECK (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can update own evaluations"
ON public.performance_evaluations FOR UPDATE
USING (evaluator_id = auth.uid());

-- Policies para questions
CREATE POLICY "Admins can manage questions"
ON public.performance_questions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.performance_cycles c
  WHERE c.id = cycle_id AND is_company_admin(auth.uid(), c.company_id)
));

CREATE POLICY "Members can view questions"
ON public.performance_questions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.performance_cycles c
  WHERE c.id = cycle_id AND is_company_member(auth.uid(), c.company_id)
));

-- Policies para answers
CREATE POLICY "Users can manage own answers"
ON public.performance_answers FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.performance_evaluations e
  WHERE e.id = evaluation_id AND e.evaluator_id = auth.uid()
));

CREATE POLICY "Admins can view all answers"
ON public.performance_answers FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.performance_evaluations e
  WHERE e.id = evaluation_id AND is_company_admin(auth.uid(), e.company_id)
));

-- Trigger para updated_at
CREATE TRIGGER update_performance_cycles_updated_at
  BEFORE UPDATE ON public.performance_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_performance_evaluations_updated_at
  BEFORE UPDATE ON public.performance_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();