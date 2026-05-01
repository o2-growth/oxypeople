# Story 6.1 — Agendar 1:1 com recorrência

**Epic:** epic-06-one-on-ones
**Sprint:** 4
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Não existe ritual estruturado de 1:1 entre líder e liderado. Story cria fluxo mínimo: agendar reunião entre dois usuários da empresa, com data/hora, duração, local opcional e regra de recorrência (none / weekly / biweekly / monthly). É a base para todas as outras stories do Epic 6.

ADR-005 (consequência): NÃO usaremos OAuth Google — integração com calendário se dá por download `.ics` (Story 6.5). Story 6.1 apenas persiste a reunião no DB.

ADR-008 (consequência): Notas de visibilidade variável ficam em tabela separada (`one_on_one_notes`) — Story 6.1 NÃO toca em notas, só na entidade `one_on_ones`.

**Pre-condition:** migration `0007_one_on_ones.sql` aplicada em staging. Verificar `is_company_member()` existente em DB.

## Acceptance Criteria

### AC1 — Acessar fluxo de agendamento
**Given** usuário membro da empresa autenticado
**When** acessa `/one-on-ones` (novo link em `AppSidebar` para todos os membros)
**Then** vê lista de 1:1s onde é `leader_id` ou `member_id` (passados, futuros e canceladas)
**And** botão "Agendar 1:1" visível no topo

### AC2 — Form de criação
**Given** usuário clica "Agendar 1:1"
**When** dialog abre
**Then** vê campos: contraparte (search/combobox de usuários da empresa, exceto self), data/hora (`scheduled_at`), duração em minutos (default 30, min 5, max 480), local opcional (texto livre), recorrência (none/weekly/biweekly/monthly)
**And** quem agenda é por padrão `leader_id`, mas há toggle "Sou o liderado nessa reunião" que troca leader↔member

### AC3 — Submissão válida cria 1:1
**Given** form válido (Zod: `scheduled_at` futuro, contraparte ≠ self, duração no range)
**When** submete
**Then** insere em `public.one_on_ones` com `status='scheduled'`, `company_id` do usuário corrente
**And** React Query invalida key `["one-on-ones", userId]`
**And** toast PT-BR "1:1 agendada com [nome]"
**And** evento PostHog `one_on_one_scheduled` com `{recurrence, duration_minutes, role: 'leader'|'member'}`

### AC4 — Validação RLS bloqueia inválidos
**Given** usuário tenta agendar com contraparte de OUTRA empresa
**Then** policy `Members create 1on1` bloqueia (WITH CHECK falha em `is_company_member(member_id, company_id)`)
**And** UI mostra erro amigável "Usuário não pertence à sua empresa"

**Given** usuário tenta agendar consigo mesmo
**Then** constraint `one_on_one_distinct_users` falha
**And** UI mostra "Selecione outra pessoa"

### AC5 — Editar reunião agendada
**Given** 1:1 com `status='scheduled'` e usuário é uma das partes
**When** clica "Editar"
**Then** pode alterar `scheduled_at`, `duration_minutes`, `location`
**And** trigger `update_updated_at` mantém `updated_at` correto

### AC6 — Cancelar reunião
**Given** 1:1 `scheduled` e usuário é parte
**When** clica "Cancelar" e informa `canceled_reason` opcional
**Then** atualiza `status='canceled'` e salva motivo
**And** evento `one_on_one_canceled`

### AC7 — Marcar como completada
**Given** 1:1 `scheduled` cuja `scheduled_at` já passou
**When** parte clica "Marcar como concluída"
**Then** `status='completed'`, `completed_at=now()`
**And** se `recurrence != 'none'`, dispara lógica da Story 6.6 (cron) — mas Story 6.1 só persiste o estado

### AC8 — Recorrência salva ponteiro
**Given** form com `recurrence='weekly'`
**When** salva
**Then** linha tem `recurrence='weekly'` e `recurrence_parent_id IS NULL` (esta é a "raiz")
**And** instâncias futuras (Story 6.6) terão `recurrence_parent_id = id_dessa_raiz`

## Technical Notes
- **Migration:** `0007_one_on_ones.sql` — tabela `public.one_on_ones`. Colunas: `id, company_id, leader_id, member_id, scheduled_at, duration_minutes, location, status, recurrence, recurrence_parent_id, completed_at, canceled_reason`
- **Files novos:**
  - `src/pages/OneOnOnes.tsx` (lista)
  - `src/components/one-on-ones/OneOnOneForm.tsx`
  - `src/components/one-on-ones/OneOnOneList.tsx`
  - `src/hooks/useOneOnOnes.ts`
- **Files modificados:**
  - `src/App.tsx` (rota `/one-on-ones`)
  - `src/components/layout/AppSidebar.tsx` (link "1:1s")
- **Padrões a seguir:** AppLayout wrapper, React Query keys `["one-on-ones", userId]`, react-hook-form + Zod, sonner toast em PT-BR, PostHog `trackEvent`
- **Combobox de usuários:** reusar padrão de `useObjectiveCollaborators` para listar membros da empresa

### RLS Privacy Notes (CRÍTICO)
- Tabela `one_on_ones` tem 4 policies (SELECT/INSERT/UPDATE/DELETE) — NÃO sobrescrever
- `SELECT`: `auth.uid() IN (leader_id, member_id) OR is_company_admin(...)` — admin VÊ a existência da reunião (sem ver notas)
- `INSERT`: ambas as partes precisam ser membros da company; quem cria deve ser uma das partes
- `DELETE`: só se `status='scheduled'` (passado fica como histórico)
- A consulta no `useOneOnOnes` NÃO precisa filtrar manualmente por user — RLS já restringe. Mas adicionar `.eq('company_id', companyId)` por consistência e perf

## Test Plan
- **Manual:** agendar com colega, editar data, cancelar, completar
- **Integration:** tentar agendar com user de outra company (deve falhar via RLS)
- **Integration:** tentar self-1:1 (deve falhar via constraint)
- **RLS:** logado como user X (não-parte, não-admin), `SELECT * FROM one_on_ones WHERE id = <id criado por L e M>` retorna 0 linhas

## Dependencies
- Migration `0007` aplicada
- Helpers `is_company_member`, `is_company_admin` existentes (migration `0001`)
- Bloqueia: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7

## Definition of Done
- [ ] AC1-AC8 done
- [ ] PR reviewed
- [ ] RLS smoke test passou (user fora da reunião não enxerga)
- [ ] Evento `one_on_one_scheduled` no PostHog
- [ ] Toast PT-BR
- [ ] Documentado no RUNBOOK
