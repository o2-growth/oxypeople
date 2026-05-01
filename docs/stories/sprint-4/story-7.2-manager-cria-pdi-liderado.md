# Story 7.2 — Manager cria PDI para liderado

**Epic:** epic-07-pdi
**Sprint:** 4
**Status:** Approved
**Estimate:** S
**Priority:** P1
**Owner:** unassigned (Dex)

## Context
Bruno (líder) precisa criar PDI para Camila (sua liderada direta) — útil quando o liderado é júnior ou após uma avaliação. O liderado vê o PDI imediatamente após criação e pode editá-lo.

**Pre-condition:** Story 7.1 entregue. Migrations `0008_pdi.sql` e `0002_add_manager_id.sql` aplicadas. Helper `is_user_manager(manager, user, company)` disponível.

## Acceptance Criteria

### AC1 — Acessar fluxo "Liderados → Novo PDI"
**Given** usuário com pelo menos 1 liderado direto (`users.manager_id = auth.uid()`)
**When** acessa `/pdi/team` (nova rota visível apenas se `useIsManager()` true)
**Then** vê lista de liderados com status do último PDI de cada
**And** botão "Criar PDI para [Nome]" em cada linha

### AC2 — Form pré-preenchido
**Given** Bruno clica "Criar PDI para Camila"
**When** dialog abre
**Then** mesmo form do Story 7.1, mas:
  - `user_id` pré-preenchido com Camila (locked)
  - `manager_id` pré-preenchido com Bruno (auth.uid(), locked)
  - `status` inicial = 'draft' (Bruno pode optar por já ativar antes de salvar)

### AC3 — INSERT respeita RLS
**Given** Bruno submete
**When** INSERT
**Then** policy `Owner or manager creates PDI` valida `is_user_manager(auth.uid(), user_id, company_id)` → permite
**And** `pdi_plans` row criada com `user_id=Camila`, `manager_id=Bruno`

**Given** user X (não-gestor de Camila) tenta INSERT via Postman
**Then** policy bloqueia (`is_user_manager` retorna false)

### AC4 — Liderado é notificado
**Given** PDI criado pelo gestor
**Then** registro em tabela `notifications` (se existir) OU evento que UI captura via `useNotifications`
**And** se Camila tem PostHog session, evento `pdi_assigned_by_manager` (server-side se possível)
**And** próxima visita de Camila a `/pdi`, badge "Novo PDI criado por Bruno"

### AC5 — Liderado pode editar e adicionar competências
**Given** Camila acessa `/pdi/:id` criado por Bruno
**Then** policy `Owner or manager updates PDI` permite (`user_id = auth.uid()`)
**And** Camila pode adicionar/editar competências e ações como se ela tivesse criado

### AC6 — Histórico mostra autor original
**Given** detalhe do PDI
**Then** seção "Criado por: Bruno em [data]" sempre visível
**And** se Camila criou, "Criado por: Camila"

### AC7 — Validação: gestor não pode criar pra alguém de outro time
**Given** Bruno tenta criar PDI para Daniel (não é seu liderado)
**Then** combobox de "liderado" só lista direct reports
**And** se forçar, INSERT falha via RLS (`is_user_manager` false)

### AC8 — Bulk: criar PDIs para todo o time (futuro)
**Given** botão "Criar PDIs para todo o time" (P2 — não bloquear story)
**When** clica
**Then** dialog confirma criação de N PDIs em rascunho
**And** marcar como "futuro Sprint 5" se complexo demais

## Technical Notes
- **Migration:** `0008_pdi.sql` — sem mudanças. Reusa `pdi_plans`
- **Files novos:**
  - `src/pages/PDITeam.tsx`
  - `src/components/pdi/CreateForReportDialog.tsx`
  - `src/hooks/useTeamPDIs.ts`
- **Files modificados:**
  - `src/App.tsx` (rota `/pdi/team`)
  - `src/components/layout/AppSidebar.tsx` (link condicional via `useIsManager`)
- **Hook novo `useIsManager`:** retorna boolean baseado em `SELECT EXISTS (SELECT 1 FROM users WHERE manager_id = auth.uid())`
- **Padrões:** AppLayout, React Query

### RLS Notes
- INSERT policy `Owner or manager creates PDI`: valida `is_user_manager(auth.uid(), user_id, company_id)` OU `user_id = auth.uid()`
- UPDATE policy permite owner OR manager_id OR is_user_manager → liderado nunca perde acesso ao próprio PDI
- DELETE: owner se draft, ou admin. Gestor NÃO pode deletar PDI do liderado (intencional — proteção contra retaliação)

## Test Plan
- **Manual:** Bruno cria PDI para Camila; Camila acessa e edita
- **RLS:** user sem liderados tenta acessar `/pdi/team` → vê mensagem "Sem liderados"
- **RLS:** user X (não gestor) tenta INSERT pra Camila → falha
- **Manual:** Camila vê badge "Novo PDI"

## Dependencies
- Story 7.1
- Migration `0002` (manager_id)
- Bloqueia: nenhuma

## Definition of Done
- [ ] AC1-AC7 done (AC8 deferred OK)
- [ ] PR reviewed
- [ ] RLS testado (gestor de outro time bloqueado)
- [ ] Evento `pdi_assigned_by_manager`
- [ ] `useIsManager` hook reutilizável
