# Story 3.1 — Criar Pulse recorrente (admin UI)

**Epic:** epic-03-pulse-survey
**Sprint:** 3
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Hoje não há nenhuma forma de criar pesquisas curtas recorrentes (clima/eNPS/mood). Esta story entrega a UI admin para CRUD da entidade `pulse_surveys` definida em `0004_pulse_survey.sql`. A tela permite configurar recorrência (semanal/quinzenal/mensal), tipo de pergunta, alvo (todos/departamentos/times) e flag `anonymous`. O dispatch automático fica para a Story 3.5 — neste momento o admin deve conseguir criar e ativar/desativar pesquisas, e usuários conseguem responder por link direto (`/pulse/:id` — usado pelo widget na 3.2).

**ADR-004 (Pulse dedicado):** existe entidade própria (`pulse_surveys`) em vez de reutilizar `surveys`. Razão: Pulse precisa de cadência fixa, 1 pergunta, série temporal — modelo distinto e mais simples.

**Pre-condition:** migration `0004_pulse_survey.sql` aplicada em staging; helpers `is_company_admin`, `is_company_member` já existem (sprint 0).

## Acceptance Criteria

### AC1 — Tela admin acessível
**Given** usuário admin da empresa
**When** acessa `/admin/pulse-surveys` (link em `/admin` e em sidebar admin)
**Then** vê tabela com colunas: nome, frequência, tipo, alvo, anônimo, ativo, último envio, # de respostas (período atual)

**Given** usuário não-admin
**When** acessa `/admin/pulse-surveys`
**Then** redireciona para `/` com toast "Sem permissão" (mesmo padrão de `Periods.tsx`)

### AC2 — Criar Pulse
**Given** admin clica "Nova pesquisa Pulse"
**When** preenche o formulário com:
- nome (obrigatório, 1-80 chars)
- pergunta (obrigatória, 1-300 chars)
- `question_type` (radio: `scale_1_5` | `enps_0_10` | `mood_emoji`)
- `frequency` (`weekly` | `biweekly` | `monthly`)
- se `weekly`/`biweekly` → `day_of_week` (0-6, default 1=segunda)
- se `monthly` → `day_of_month` (1-28, default 1)
- `send_hour_utc` (default 12)
- alvo: toggle "Toda empresa" → `target_all=true` OU multi-select de departamentos/times
- toggle "Anônimo" (`anonymous`)
- `require_comment_below` (opcional, smallint 0-10)
**Then** registro é criado em `pulse_surveys` com `created_by = auth.uid()` e `active = true`
**And** lista atualiza (React Query invalidate)
**And** toast "Pesquisa criada" e PostHog `pulse_survey_created` com `{ frequency, question_type, anonymous }`

**Given** admin escolhe `question_type=mood_emoji`
**Then** UI esconde `require_comment_below` (não faz sentido com emoji)

### AC3 — Editar Pulse
**Given** admin clica "Editar" em pesquisa existente
**Then** form abre pré-preenchido
**And** todos os campos são editáveis
**And** ao salvar dispara UPDATE (RLS `Admins update pulse surveys`)
**And** toast "Pesquisa atualizada"

**Restrição:** não é possível editar `anonymous` se já houver respostas (mostrar campo desabilitado com tooltip "Não pode mudar anonimato após primeiras respostas").

### AC4 — Ativar/desativar
**Given** admin tem switch "Ativo" na linha
**When** alterna
**Then** UPDATE em `active`
**And** toast "Pesquisa pausada" / "Pesquisa ativada"
**And** PostHog `pulse_survey_toggled` com `{ active }`
**Pre-condition:** o cron da 3.5 só dispara onde `active=true`.

### AC5 — Excluir
**Given** admin clica "Excluir"
**When** confirma modal "Isso apagará todas as respostas. Tem certeza?"
**Then** DELETE cascade em `pulse_surveys` (FK `ON DELETE CASCADE` em `pulse_responses`)
**And** lista atualiza, toast "Pesquisa excluída"

### AC6 — Validação Zod
- Se `frequency=weekly|biweekly` → `day_of_week` obrigatório
- Se `frequency=monthly` → `day_of_month` obrigatório
- `target_all=false` → pelo menos 1 departamento OU 1 time
- `send_hour_utc` 0-23
- `require_comment_below` 0-10 ou null
**Then** mensagens de erro em PT-BR exibidas no form

### AC7 — Hook React Query
**Given** novo hook `usePulseSurveysAdmin()`
**Then** expõe `pulseSurveys, createPulse, updatePulse, deletePulse, togglePulse, isLoading`
**And** queryKey `["pulse-surveys-admin", companyId]`
**And** segue padrão de `usePeriodsAdmin.ts`

### AC8 — Preview da pergunta
**Given** admin no formulário
**Then** painel direito mostra preview de como o usuário vai ver (escala 1-5, slider 0-10 ou emojis 😢😐🙂😀😍)

## Technical Notes
- **Migration:** `0004_pulse_survey.sql` deve estar aplicada (tabelas `pulse_surveys`, `pulse_responses`)
- **Files novos:**
  - `src/pages/admin/PulseSurveys.tsx`
  - `src/components/admin/pulse/PulseSurveyList.tsx`
  - `src/components/admin/pulse/PulseSurveyForm.tsx`
  - `src/components/admin/pulse/PulseQuestionPreview.tsx`
  - `src/hooks/usePulseSurveysAdmin.ts`
  - `src/lib/validation/pulseSurveySchema.ts` (Zod)
- **Files modificados:**
  - `src/App.tsx` — rota `/admin/pulse-surveys`
  - `src/components/layout/AppSidebar.tsx` — link admin condicional (`useUserPermissions().isAdmin`)
  - `src/pages/admin/Index.tsx` (se existir) — card "Pulse Surveys"
- **Padrões a seguir:**
  - AppLayout wrapper, 3-state rendering (loading/empty/list)
  - React Query keys `["pulse-surveys-admin", companyId]`
  - Sonner toast PT-BR
  - Zod + react-hook-form
  - PostHog `trackEvent`
- **Tabelas envolvidas:** `pulse_surveys` (todas as colunas), join com `departments`, `teams` para preencher selects
- **RLS:** já configurada — admin pode INSERT/UPDATE/DELETE. Helper `is_company_admin(auth.uid(), company_id)`.

## Test Plan
- **Unit:** Zod schema — `frequency=weekly` sem `day_of_week` falha; `target_all=false` sem departments e teams falha
- **Integration:** criar Pulse semanal segunda-feira → buscar de volta → editar pergunta → desativar → excluir
- **Manual:** admin cria 1 Pulse para "Toda empresa" e 1 para "Departamento X"; verifica que aparecem na lista, switch ativo funciona

## Dependencies
- **Depends on:** migration `0004_pulse_survey.sql` aplicada
- **Blocks:** Story 3.2 (widget precisa de pelo menos 1 pulse ativo), Story 3.5 (dispatch lê de `pulse_surveys`)

## Definition of Done
- [ ] AC1-AC8 done
- [ ] Tests passing (npm test green)
- [ ] Lint clean (0 errors)
- [ ] Eventos PostHog `pulse_survey_created`, `pulse_survey_toggled` disparando
- [ ] Smoke test manual pelo admin (criar/editar/excluir 1 pesquisa)
