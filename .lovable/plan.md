
## Plano: Sistema Completo de Pesquisa e-NPS

### Visao Geral
Implementar um sistema de pesquisa e-NPS (Employee Net Promoter Score) com as seguintes capacidades:
- Admin pode criar pesquisas NPS com segmentacao por departamento/equipe
- Admin pode ver todos os resultados na pagina Pessoas (aba NPS)
- Colaboradores veem apenas suas proprias respostas na pagina Pesquisas
- Pergunta padrao: "Em uma escala de 0 a 10, o quanto voce recomendaria esta empresa como um bom lugar para trabalhar?"

### Estrutura do Formulario NPS (baseado na imagem)

**Campos para criacao:**
1. Pergunta da pesquisa (editavel, padrao: pergunta eNPS classica)
2. Selecao de departamentos (multi-select)
3. Selecao de grupos/equipes (multi-select)
4. Data de encerramento
5. Comentario obrigatorio para nota abaixo de X (toggle + escala 0-10)
6. Filtro: apenas participantes com data de admissao inferior a X dias

### Mudancas no Banco de Dados

#### 1. Nova Tabela: `nps_surveys`

Armazena as pesquisas NPS criadas:

```sql
CREATE TABLE nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Configuracao
  question TEXT NOT NULL DEFAULT 'Em uma escala de 0 a 10, o quanto voce recomendaria esta empresa como um bom lugar para trabalhar?',
  target_departments UUID[] DEFAULT '{}',
  target_teams UUID[] DEFAULT '{}',
  target_all BOOLEAN DEFAULT false,
  end_date DATE NOT NULL,
  
  -- Regra de comentario obrigatorio
  require_comment_below INTEGER, -- null = sem obrigatoriedade, 0-10 = nota limite
  
  -- Filtro de tempo de empresa
  min_days_employed INTEGER, -- null = todos, numero = apenas quem tem X+ dias
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- draft, active, completed
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 2. Nova Tabela: `nps_responses`

Armazena as respostas individuais:

```sql
CREATE TABLE nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES nps_surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Resposta
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  comment TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(survey_id, user_id)
);
```

#### 3. RLS Policies

```sql
-- NPS Surveys
CREATE POLICY "Admins can manage NPS surveys"
ON nps_surveys FOR ALL
USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Members can view active surveys"
ON nps_surveys FOR SELECT
USING (is_company_member(auth.uid(), company_id) AND status = 'active');

-- NPS Responses
CREATE POLICY "Users can submit responses"
ON nps_responses FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own responses"
ON nps_responses FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all responses"
ON nps_responses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM nps_surveys s
  WHERE s.id = nps_responses.survey_id
  AND is_company_admin(auth.uid(), s.company_id)
));
```

### Mudancas no Frontend

#### 1. Pagina Surveys - Visao Admin

**Nova secao no topo:** Card de criacao NPS (conforme imagem)

Componentes a criar:
- `src/components/surveys/CreateNPSSurveyCard.tsx` - Formulario de criacao conforme imagem
- `src/components/surveys/NPSSurveyCard.tsx` - Card individual de pesquisa NPS
- `src/components/surveys/NPSSurveyResults.tsx` - Dialog com resultados detalhados

**Campos do formulario:**
- Pergunta (textarea editavel com texto padrao)
- Departamentos (multi-select usando componente existente)
- Equipes/Grupos (multi-select)
- Data de encerramento (date picker)
- Comentario obrigatorio (checkbox + slider 0-10)
- Filtro tempo de empresa (input de dias)

#### 2. Pagina Surveys - Visao Colaborador

**Banner de pesquisa pendente:** Se tem NPS pendente para responder

Componentes:
- `src/components/surveys/NPSResponseDialog.tsx` - Modal para responder
- Escala visual 0-10 com cores (vermelho = detrator, amarelo = neutro, verde = promotor)
- Campo de comentario (obrigatorio se nota <= X)

#### 3. Pagina People - Aba NPS (Admin)

Habilitar a aba NPS que esta desabilitada atualmente.

Componentes:
- `src/components/people/NPSTab.tsx` - Tab principal com dashboard
- Metricas: Score geral, promotores/neutros/detratores
- Lista de pesquisas com resultados
- Grafico de evolucao do NPS
- Detalhes por departamento
- Exportacao CSV

#### 4. Hook de Dados

**`src/hooks/useNPSSurveys.ts`**
- `useNPSSurveys()` - Lista pesquisas da empresa
- `useActiveNPSSurvey()` - Pesquisa ativa para o usuario
- `useCreateNPSSurvey()` - Criar nova pesquisa
- `useSubmitNPSResponse()` - Enviar resposta
- `useNPSResults(surveyId)` - Resultados agregados
- `useMyNPSResponses()` - Respostas do usuario logado

### Fluxo de Uso

#### Para o Admin (criacao):

1. Acessa pagina Pesquisas
2. Ve card de criacao NPS no topo
3. Configura: pergunta, publico-alvo, data, regras
4. Clica "Criar Pesquisa"
5. Pesquisa fica ativa ate a data de encerramento

#### Para o Colaborador (resposta):

1. Acessa pagina Pesquisas
2. Ve banner/card de pesquisa pendente
3. Clica para responder
4. Seleciona nota 0-10
5. Adiciona comentario (se obrigatorio ou opcional)
6. Envia resposta

#### Para o Admin (resultados):

1. Acessa Pessoas > NPS
2. Ve dashboard com score geral
3. Detalhamento por pesquisa
4. Pode exportar dados

### Interface Visual - Criacao NPS

```text
+----------------------------------------------------------+
| E-NPS | Employee Net Promoter Score                       |
| Avalie os principais problemas em sua equipe e empresa    |
+----------------------------------------------------------+
|                                                          |
| Pergunta da pesquisa E-NPS (Para alterar clique aqui)    |
| +------------------------------------------------------+ |
| | Em uma escala de 0 a 10, o quanto voce recomendaria  | |
| | esta empresa como um bom lugar para trabalhar?       | |
| +------------------------------------------------------+ |
|                                                          |
| Selecione os departamentos     | Selecione os grupos     |
| +-------------------------+    | +---------------------+ |
| | [Multi-select]          |    | | [Multi-select]      | |
| +-------------------------+    | +---------------------+ |
|                                                          |
| Data de Encerramento                                     |
| +-------------------------+                              |
| | [Date Picker]           |                              |
| +-------------------------+                              |
|                                                          |
| Comentario obrigatorio para nota abaixo de:              |
| [x] Habilitar / [ ] Desabilitar                          |
| O 0  O 1  O 2  O 3  O 4  O 5  O 6  O 7  O 8  O 9  O 10  |
|                                                          |
| Apenas participantes com data de admissao inferior a     |
| +-------------------------+                              |
| | [Input dias]            |                              |
| +-------------------------+                              |
|                                       [Criar Pesquisa]   |
+----------------------------------------------------------+
```

### Interface Visual - Dashboard NPS (Pessoas)

```text
+----------------------------------------------------------+
| NPS Score                                                 |
+----------------------------------------------------------+
| +--------+  +--------+  +--------+  +--------+           |
| |  +45   |  |  62%   |  |  23%   |  |  15%   |           |
| | Score  |  |Promotor|  |Neutros |  |Detrat. |           |
| +--------+  +--------+  +--------+  +--------+           |
+----------------------------------------------------------+
| Historico de Pesquisas                    [Exportar CSV] |
+----------------------------------------------------------+
| | eNPS Janeiro 2024  | Score: +45 | 72/80 | Encerrada | |
| | eNPS Dezembro 2023 | Score: +38 | 68/75 | Encerrada | |
+----------------------------------------------------------+
```

### Secao Tecnica

**Estrutura de arquivos:**
```
src/components/surveys/
  ├── CreateNPSSurveyCard.tsx    # Formulario de criacao
  ├── NPSSurveyCard.tsx          # Card de pesquisa
  ├── NPSResponseDialog.tsx      # Modal de resposta
  ├── NPSSurveyResults.tsx       # Resultados detalhados
  └── NPSScoreScale.tsx          # Escala visual 0-10

src/components/people/
  └── NPSTab.tsx                 # Dashboard NPS para admin

src/hooks/
  └── useNPSSurveys.ts           # Hook de dados NPS
```

**Calculo do NPS Score:**
```typescript
const calculateNPS = (responses: { score: number }[]) => {
  const promoters = responses.filter(r => r.score >= 9).length;
  const detractors = responses.filter(r => r.score <= 6).length;
  const total = responses.length;
  
  if (total === 0) return 0;
  
  return Math.round(((promoters - detractors) / total) * 100);
};

// Classificacao:
// 0-6 = Detratores (vermelho)
// 7-8 = Neutros (amarelo)
// 9-10 = Promotores (verde)
```

**Segmentacao de publico:**
- Se target_all = true: todos da empresa
- Se target_departments tem IDs: apenas membros desses departamentos
- Se target_teams tem IDs: apenas membros dessas equipes
- Combinacao: usuarios que pertencem a qualquer departamento OU equipe selecionada

**Filtro tempo de empresa:**
```typescript
// Filtrar usuarios com hire_date >= (hoje - min_days_employed)
const eligibleUsers = users.filter(u => {
  if (!survey.min_days_employed) return true;
  const daysSinceHire = differenceInDays(new Date(), u.hire_date);
  return daysSinceHire >= survey.min_days_employed;
});
```

### Ordem de Implementacao

1. **Migracao do banco** - criar tabelas nps_surveys e nps_responses
2. **Hook useNPSSurveys** - CRUD e queries
3. **CreateNPSSurveyCard** - Formulario de criacao (admin)
4. **NPSScoreScale** - Componente visual da escala 0-10
5. **NPSResponseDialog** - Modal para colaborador responder
6. **NPSSurveyCard** - Cards na listagem
7. **NPSTab** - Dashboard na pagina Pessoas
8. **Atualizar Surveys.tsx** - Integrar componentes
9. **Atualizar People.tsx** - Habilitar aba NPS
