
## Plano: Sistema de Feedback 30 Dias para Novos Colaboradores

### Visao Geral
Criar um sistema completo de feedback de integracao para novos colaboradores, que sera enviado automaticamente 30 dias apos a entrada na empresa. O admin podera visualizar as respostas, exportar relatorios e encaminhar para os lideres correspondentes.

### Estrutura do Formulario (baseado nos PDFs)

As perguntas do feedback de 30 dias incluem:

**Informacoes Basicas:**
1. Nome completo (preenchido automaticamente)
2. Cargo / Area (preenchido automaticamente)
3. Data de inicio na empresa (preenchido automaticamente)
4. Gestor direto (preenchido automaticamente ou selecionavel)

**Perguntas de Avaliacao:**
1. Como voce avalia seus primeiros 30 dias no geral? (Escala 1-5)
2. O que mais te surpreendeu positivamente nesses primeiros dias? (Texto)
3. Voce se sente bem integrado(a) a equipe ate agora? (Escolha unica: Sim totalmente / Sim em parte / Nao muito / Nao)
4. Voce tem todos os acessos necessarios para o seu trabalho? (Sim/Nao)
5. Se faltou algum acesso ou recurso, descreva quais (Texto opcional)
6. As ferramentas e sistemas que voce usa sao faceis de usar e entender? (Escala 1-5)
7. O treinamento/onboarding inicial foi suficiente para comecar com confianca? (Escala 1-5)
8. Voce tem clareza total sobre suas responsabilidades e expectativas? (Escolha unica: Sim / Em parte / Nao)
9. Quais foram as maiores dificuldades ou obstaculos nesses 30 dias? (Texto)
10. Houve algum processo ou ferramenta que te pareceu mais complicado do que o esperado? (Texto)
11. Como voce avalia o processo de onboarding ate aqui? (Escala 1-5)
12. O que funcionou bem no onboarding? (Texto)
13. O que poderiamos melhorar ou adicionar para facilitar a adaptacao? (Texto)
14. Ha alguma duvida pendente ou algo que voce gostaria de suporte adicional? (Texto)
15. No geral, descreva como voce esta se sentindo nesses primeiros dias (Texto)
16. Algum comentario adicional? (Texto opcional)

### Mudancas no Banco de Dados

#### 1. Nova Tabela: `onboarding_feedbacks`

Armazena o feedback principal de cada usuario:

```sql
CREATE TABLE onboarding_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES users(id),
  manager_id UUID REFERENCES users(id),
  
  -- Status do feedback
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, expired
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Respostas estruturadas
  overall_rating INTEGER, -- 1-5
  positive_surprise TEXT,
  integration_level TEXT, -- sim_totalmente, sim_em_parte, nao_muito, nao
  has_all_access BOOLEAN,
  missing_access TEXT,
  tools_ease_rating INTEGER, -- 1-5
  training_rating INTEGER, -- 1-5
  clarity_level TEXT, -- sim, em_parte, nao
  difficulties TEXT,
  complicated_tools TEXT,
  onboarding_rating INTEGER, -- 1-5
  what_worked_well TEXT,
  improvement_suggestions TEXT,
  pending_questions TEXT,
  overall_feeling TEXT,
  additional_comments TEXT,
  
  -- Encaminhamento
  forwarded_to UUID[] DEFAULT '{}',
  forwarded_at TIMESTAMPTZ,
  forwarded_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, company_id)
);
```

#### 2. Adicionar campo na `company_memberships`

Para marcar novos colaboradores:

```sql
ALTER TABLE company_memberships 
ADD COLUMN is_new_hire BOOLEAN DEFAULT false,
ADD COLUMN hire_date DATE,
ADD COLUMN employment_type TEXT; -- colaborador, prestador, estagiario
```

#### 3. RLS Policies

```sql
-- Usuarios podem ver e editar seu proprio feedback
CREATE POLICY "Users can manage own feedback"
ON onboarding_feedbacks FOR ALL
USING (user_id = auth.uid());

-- Admins podem ver todos os feedbacks da empresa
CREATE POLICY "Admins can view all feedbacks"
ON onboarding_feedbacks FOR SELECT
USING (is_company_admin(auth.uid(), company_id));

-- Managers podem ver feedbacks encaminhados para eles
CREATE POLICY "Managers can view forwarded feedbacks"
ON onboarding_feedbacks FOR SELECT
USING (auth.uid() = ANY(forwarded_to));
```

### Mudancas no Frontend

#### 1. Nova Aba na Pagina People

Adicionar tabs na pagina `/people`:
- **Colaboradores** (atual)
- **Feedback 30 Dias** (nova - visivel para admins)
- **NPS** (futura)

#### 2. Novos Componentes

**`src/components/people/FeedbackTab.tsx`**
- Lista de feedbacks pendentes e completos
- Filtros por status, departamento, data
- Cards com resumo de cada feedback

**`src/components/people/FeedbackFormDialog.tsx`**
- Formulario completo para o colaborador preencher
- Todas as 16 perguntas do PDF
- Validacao com Zod

**`src/components/people/FeedbackResponseView.tsx`**
- Visualizacao detalhada de uma resposta
- Graficos para questoes de escala
- Botao para encaminhar ao lider

**`src/components/people/FeedbackExport.tsx`**
- Exportar para CSV/Excel
- Filtrar por periodo
- Selecao de campos

**`src/components/people/ForwardFeedbackDialog.tsx`**
- Dialog para selecionar destinatario
- Lista de lideres de equipe/departamento
- Envio de notificacao

#### 3. Novo Hook

**`src/hooks/useOnboardingFeedback.ts`**
- Query para listar feedbacks
- Mutation para criar/atualizar
- Mutation para encaminhar

#### 4. Notificacao para Novos Colaboradores

**`src/components/people/PendingFeedbackBanner.tsx`**
- Banner fixo no topo quando usuario tem feedback pendente
- Link direto para o formulario
- Mostra prazo restante

### Fluxo de Uso

#### Para o Admin/RH:

1. Ao adicionar novo membro, marca checkbox "Novo Colaborador"
2. Define tipo: Colaborador / Prestador / Estagiario
3. Define data de inicio (hire_date)
4. Sistema calcula automaticamente due_date = hire_date + 30 dias
5. Cria registro em `onboarding_feedbacks` com status "pending"

#### Para o Novo Colaborador:

1. Ao fazer login, ve banner "Voce tem um feedback pendente"
2. Clica e abre o formulario
3. Preenche todas as perguntas obrigatorias
4. Envia e status muda para "completed"

#### Para o Admin (visualizacao):

1. Acessa People > Feedback 30 Dias
2. Ve lista de feedbacks com status
3. Pode filtrar por pendente/completo/expirado
4. Clica para ver detalhes da resposta
5. Pode encaminhar para o lider do departamento
6. Pode exportar relatorio em CSV

### Interface Visual

```text
+-----------------------------------------------+
| Pessoas                          [Convidar]   |
+-----------------------------------------------+
| [Colaboradores] [Feedback 30 Dias] [NPS]     |
+-----------------------------------------------+
| Filtros: [Todos ▼] [Todos Dep ▼] [Periodo ▼] |
|                               [Exportar CSV]  |
+-----------------------------------------------+
| +-----------------------------------------+   |
| | Maria Silva          | Tecnologia       |   |
| | Inicio: 05/01/2026   | Status: Pendente |   |
| | Prazo: 04/02/2026    | [Ver] [Lembrar]  |   |
| +-----------------------------------------+   |
| | Joao Costa           | Comercial        |   |
| | Inicio: 20/12/2025   | Status: Completo |   |
| | Respondido: 19/01    | [Ver] [Encaminh] |   |
| +-----------------------------------------+   |
+-----------------------------------------------+
```

### Secao Tecnica

**Estrutura de arquivos:**
```
src/components/people/
  ├── FeedbackTab.tsx           # Tab principal
  ├── FeedbackFormDialog.tsx    # Formulario de preenchimento
  ├── FeedbackResponseView.tsx  # Visualizacao de resposta
  ├── FeedbackExport.tsx        # Exportacao CSV
  ├── ForwardFeedbackDialog.tsx # Encaminhar para lider
  ├── PendingFeedbackBanner.tsx # Banner para usuario
  └── NewHireCheckbox.tsx       # Checkbox no InviteModal

src/hooks/
  └── useOnboardingFeedback.ts  # Hook de dados
```

**Schema Zod para validacao:**
```typescript
const feedbackSchema = z.object({
  overall_rating: z.number().min(1).max(5),
  positive_surprise: z.string().min(1, "Campo obrigatorio"),
  integration_level: z.enum(["sim_totalmente", "sim_em_parte", "nao_muito", "nao"]),
  has_all_access: z.boolean(),
  missing_access: z.string().optional(),
  tools_ease_rating: z.number().min(1).max(5),
  training_rating: z.number().min(1).max(5),
  clarity_level: z.enum(["sim", "em_parte", "nao"]),
  difficulties: z.string().min(1, "Campo obrigatorio"),
  complicated_tools: z.string().optional(),
  onboarding_rating: z.number().min(1).max(5),
  what_worked_well: z.string().min(1, "Campo obrigatorio"),
  improvement_suggestions: z.string().min(1, "Campo obrigatorio"),
  pending_questions: z.string().optional(),
  overall_feeling: z.string().min(1, "Campo obrigatorio"),
  additional_comments: z.string().optional(),
});
```

**Exportacao CSV:**
```typescript
const exportToCSV = (feedbacks: Feedback[]) => {
  const headers = [
    "Nome", "Cargo", "Departamento", "Data Inicio", "Data Resposta",
    "Avaliacao Geral", "Integracao", "Acessos OK", "Ferramentas",
    "Treinamento", "Clareza", "Onboarding", "Dificuldades",
    "Sugestoes", "Sentimento Geral"
  ];
  // Gerar CSV com headers e dados
};
```

### Ordem de Implementacao

1. **Migracao do banco** - criar tabela e alterar company_memberships
2. **Hook useOnboardingFeedback** - CRUD de feedbacks
3. **FeedbackFormDialog** - formulario completo
4. **PendingFeedbackBanner** - notificar usuario
5. **FeedbackTab** - listagem para admin
6. **FeedbackResponseView** - visualizacao detalhada
7. **ForwardFeedbackDialog** - encaminhamento
8. **FeedbackExport** - exportacao CSV
9. **Atualizar InviteModal** - adicionar opcao "Novo Colaborador"
10. **Atualizar People.tsx** - adicionar tabs
