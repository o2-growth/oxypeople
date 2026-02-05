
## Plano: Criar Pagina de Desempenho com Avaliacoes

### Visao Geral
Criar uma nova pagina dedicada a Avaliacoes de Desempenho com duas visoes distintas:
- **Admin/Gestor**: Painel completo para criar, enviar, acompanhar e automatizar ciclos de avaliacao
- **Colaborador**: Visualizacao simplificada das suas proprias avaliacoes (recebidas e realizadas)

### Estrutura do Banco de Dados

Novas tabelas necessarias:

```text
performance_cycles (Ciclos de Avaliacao)
    - id: uuid
    - company_id: uuid
    - name: text (ex: "Avaliacao Anual 2024")
    - description: text
    - type: enum (self, 180, 360, leader_to_member, member_to_leader)
    - start_date: date
    - end_date: date
    - status: enum (draft, scheduled, active, completed)
    - created_by: uuid
    - target_departments: uuid[]
    - target_teams: uuid[]
    - target_users: uuid[]
    - target_all: boolean
    - created_at, updated_at

performance_evaluations (Avaliacoes Individuais)
    - id: uuid
    - cycle_id: uuid
    - company_id: uuid
    - evaluator_id: uuid (quem avalia)
    - evaluated_id: uuid (quem e avaliado)
    - relationship: text (self, peer, leader, subordinate)
    - status: enum (pending, in_progress, completed, expired)
    - due_date: date
    - completed_at: timestamp
    - overall_score: decimal
    - created_at, updated_at

performance_questions (Perguntas do Ciclo)
    - id: uuid
    - cycle_id: uuid
    - question_text: text
    - question_type: enum (rating, text, scale, multiple_choice)
    - category: text (competencias, resultados, comportamento)
    - order_index: integer
    - required: boolean
    - options: jsonb

performance_answers (Respostas)
    - id: uuid
    - evaluation_id: uuid
    - question_id: uuid
    - answer: jsonb
    - score: decimal
    - created_at
```

### Tipos de Avaliacao

```text
self        - Autoavaliacao
180         - Gestor avalia liderado + Autoavaliacao
360         - Gestor + Pares + Autoavaliacao + (opcional) Liderados
leader      - Liderado avalia Gestor
custom      - Configuracao personalizada
```

### Estrutura de Componentes

```text
src/
  pages/
    Performance.tsx              <- Nova pagina principal
  
  components/
    performance/
      PerformanceStats.tsx       <- Cards de estatisticas
      CycleCard.tsx              <- Card de ciclo de avaliacao
      CreateCycleDialog.tsx      <- Modal para criar ciclo
      CycleQuestions.tsx         <- Configurar perguntas
      EvaluationsList.tsx        <- Lista de avaliacoes (admin)
      MyEvaluations.tsx          <- Minhas avaliacoes (usuario)
      EvaluationForm.tsx         <- Formulario de resposta
      EvaluationResults.tsx      <- Resultados/relatorio
      AutomationSettings.tsx     <- Configurar automacao
  
  hooks/
    usePerformanceCycles.ts      <- CRUD de ciclos
    useEvaluations.ts            <- CRUD de avaliacoes
```

### Layout da Pagina - Visao Admin

```text
+------------------------------------------------------------------+
|  Desempenho                                    [+ Novo Ciclo]     |
|  Gerencie avaliacoes de desempenho da sua empresa                |
+------------------------------------------------------------------+
|                                                                   |
|  [Ciclos] [Avaliacoes] [Resultados] [Automacao]                  |
|                                                                   |
|  +------------+ +------------+ +------------+ +------------+      |
|  |  5         | |  127       | |  89%       | |  4.2       |     |
|  |  Ciclos    | |  Avaliacoes| |  Conclusao | |  Media     |     |
|  |  Ativos    | |  Pendentes | |            | |  Geral     |     |
|  +------------+ +------------+ +------------+ +------------+      |
|                                                                   |
|  Ciclos de Avaliacao                                             |
|  +------------------------------------------------------------+  |
|  | Avaliacao Anual 2024            360°           [Ativo]     |  |
|  | 01/Jan - 31/Jan    45/80 concluidas             [...]      |  |
|  +------------------------------------------------------------+  |
|  | Avaliacao Trimestral Q1         180°       [Agendado]      |  |
|  | 01/Fev - 28/Fev    0/80                         [...]      |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### Layout da Pagina - Visao Colaborador

```text
+------------------------------------------------------------------+
|  Desempenho                                                       |
|  Acompanhe suas avaliacoes                                       |
+------------------------------------------------------------------+
|                                                                   |
|  [Pendentes] [Historico]                                         |
|                                                                   |
|  Avaliacoes Pendentes (2)                                        |
|  +------------------------------------------------------------+  |
|  | Autoavaliacao - Ciclo Anual 2024                           |  |
|  | Prazo: 31/01/2024              [Responder]                 |  |
|  +------------------------------------------------------------+  |
|  | Avaliar: Maria Santos - Ciclo Anual 2024                   |  |
|  | Prazo: 31/01/2024              [Responder]                 |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  Historico                                                       |
|  +------------------------------------------------------------+  |
|  | Avaliacao Trimestral Q4 2023     Nota: 4.5/5  [Completo]   |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### Fluxo do Admin

1. **Criar Ciclo**: Define nome, tipo (360, 180, etc), datas e publico-alvo
2. **Configurar Perguntas**: Adiciona perguntas por categoria (competencias, resultados)
3. **Enviar/Agendar**: Dispara avaliacoes para os participantes
4. **Acompanhar**: Monitora progresso e envia lembretes
5. **Analisar**: Visualiza resultados agregados e individuais

### Automacao de Avaliacoes

Configuracoes disponiveis na aba Automacao:
- Ciclos recorrentes (trimestral, semestral, anual)
- Lembretes automaticos (7 dias, 3 dias, 1 dia antes do prazo)
- Notificacoes por email/Slack
- Gatilhos baseados em eventos (aniversario de empresa, fim de probacao)

### Secao Tecnica

**Arquivos a Criar:**

1. `src/pages/Performance.tsx` - Pagina principal
2. `src/hooks/usePerformanceCycles.ts` - Hook para ciclos
3. `src/hooks/useEvaluations.ts` - Hook para avaliacoes
4. `src/components/performance/PerformanceStats.tsx` - Estatisticas
5. `src/components/performance/CycleCard.tsx` - Card de ciclo
6. `src/components/performance/CreateCycleDialog.tsx` - Criar ciclo
7. `src/components/performance/CycleQuestions.tsx` - Perguntas
8. `src/components/performance/EvaluationsList.tsx` - Lista admin
9. `src/components/performance/MyEvaluations.tsx` - Lista usuario
10. `src/components/performance/EvaluationForm.tsx` - Formulario
11. `src/components/performance/EvaluationResults.tsx` - Resultados

**Arquivos a Modificar:**

1. `src/App.tsx` - Adicionar rota /performance
2. `src/components/layout/AppSidebar.tsx` - Adicionar item no menu

**Migracao de Banco de Dados:**

```sql
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
```

**Navegacao:**
Adicionar "Desempenho" no grupo "Engajamento" do sidebar com icone `ClipboardCheck` ou `Award`.

### Proximos Passos apos Implementacao

1. Adicionar integracao com automacoes existentes
2. Implementar relatorios e dashboards de resultados
3. Adicionar exportacao de resultados em PDF/Excel
4. Criar templates de perguntas pre-definidos
5. Implementar notificacoes por email
