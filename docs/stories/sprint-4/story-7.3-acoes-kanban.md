# Story 7.3 — Ações em kanban (To do/Doing/Done/Blocked)

**Epic:** epic-07-pdi
**Sprint:** 4
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
PDI vira realidade através de ações concretas. Cada ação tem título, descrição, status (todo/doing/done/blocked), data limite, e pode ser vinculada a uma competência. Apresentação em kanban com drag-and-drop entre colunas. O DB tem trigger `recalc_pdi_progress` que recalcula automaticamente o `progress` do plano (% de ações done).

**Pre-condition:** Story 7.1 entregue. Migration `0008_pdi.sql` aplicada — tabela `pdi_actions` com trigger `trg_recalc_pdi_progress`.

## Acceptance Criteria

### AC1 — Kanban no detalhe do PDI
**Given** usuário em `/pdi/:id` (PDI ativo ou rascunho)
**Then** vê tab "Ações" com kanban de 4 colunas: A fazer, Em andamento, Concluído, Bloqueado
**And** cada coluna mostra contador (ex: "Em andamento (3)")

### AC2 — Criar ação
**Given** usuário clica "Adicionar ação" em qualquer coluna
**When** form abre (dialog ou inline)
**Then** campos: título (obrig 1-200), descrição (opc), competência vinculada (combobox de `pdi_competencies` do plano, opcional), data limite (`due_date`, opc), status inicial = coluna onde clicou
**And** INSERT em `pdi_actions` com `pdi_plan_id` corrente
**And** trigger `trg_recalc_pdi_progress` recalcula `pdi_plans.progress`
**And** evento PostHog `pdi_action_created` com `{has_due_date, has_competency}`

### AC3 — Mover ação entre colunas (drag-and-drop)
**Given** ação em "A fazer"
**When** usuário arrasta para "Em andamento"
**Then** UPDATE `status='doing'`
**And** se destino = 'done', `completed_at = now()`
**And** se sai de 'done' para outra, `completed_at = NULL`
**And** trigger recalcula progresso
**And** evento PostHog `pdi_action_status_changed` com `{from, to}` e `pdi_action_completed` se destino='done'

### AC4 — Editar ação
**Given** click em ação
**When** dialog abre
**Then** mesmo form de criação, com valores preenchidos
**And** salvar dispara UPDATE

### AC5 — Deletar ação
**Given** ação selecionada
**When** clica deletar e confirma
**Then** DELETE — trigger recalcula progresso (uma a menos no total)

### AC6 — Filtros e ordenação
**Given** kanban
**Then** filtro por competência (combobox) e por "vencimento próximo" (próximas 7 dias)
**And** ordenação dentro da coluna: por `order_index`, e `due_date` quando disponível

### AC7 — Indicadores visuais
- Ação com `due_date < today` e status ≠ 'done': badge vermelho "Atrasada"
- Ação com `due_date` em ≤ 3 dias: badge amarelo "Vence em breve"
- Ação `blocked`: ícone alerta laranja, e exigir nota no campo descrição (UI guidance, sem hard validation)

### AC8 — Progress bar reflete trigger
**Given** PDI com 4 ações: 2 done, 1 doing, 1 todo
**Then** `pdi_plans.progress = 50` (calculado via trigger)
**And** UI mostra "Progresso: 50%"
**And** mudar 1 ação para done → recalc automático → 75%

### AC9 — Empty state
**Given** PDI sem ações
**Then** mostra ilustração + texto "Nenhuma ação ainda. Comece adicionando o que vai te ajudar a desenvolver suas competências"

## Technical Notes
- **Migration:** `0008_pdi.sql` — tabela `public.pdi_actions` (`id, pdi_plan_id, competency_id, feedback_request_id, title, description, status, due_date, completed_at, evidence_url, order_index`). Trigger `trg_recalc_pdi_progress` AFTER INSERT/UPDATE OF status/DELETE
- **Files novos:**
  - `src/components/pdi/ActionsKanban.tsx`
  - `src/components/pdi/ActionCard.tsx`
  - `src/components/pdi/ActionForm.tsx`
  - `src/hooks/usePDIActions.ts`
- **Files modificados:**
  - `src/pages/PDIDetail.tsx` (adicionar tab Ações)
- **Drag-and-drop:** `@dnd-kit/core` (mesmo do 6.2). Se já não está nas deps, instalar OU fallback com setas e botão "mover para..."
- **Padrões:** React Query optimistic update no drag, sonner PT-BR
- `feedback_request_id` aparece no schema mas é usado em Story 7.7 — não obrigatório aqui

### RLS Notes
- Mesmas policies do plano (via JOIN). Owner + manager_id + is_user_manager + admin (SELECT). INSERT/UPDATE/DELETE: owner OU manager_id (não admin)
- Trigger `recalc_pdi_progress` é `LANGUAGE plpgsql` SECURITY INVOKER (default) — usa permissions do user — funciona porque user já tem UPDATE na tabela do plano dele

## Test Plan
- **Manual:** criar ação, mover entre colunas, marcar done, ver progress
- **Integration:** criar 4 ações, marcar 2 done → `pdi_plans.progress = 50`
- **Integration:** deletar 1 done de PDI 100% → progress recalcula
- **Edge:** PDI sem ações → progress = 0 (não NaN/divisão por zero)
- **DnD:** reordenar dentro da mesma coluna persiste `order_index`

## Dependencies
- Story 7.1
- Bloqueia: 7.4 (evidência anexa a ação), 7.7 (vincular feedback à ação)

## Definition of Done
- [ ] AC1-AC9 done
- [ ] PR reviewed
- [ ] Trigger validado com 5+ ações (DoD do epic)
- [ ] Eventos PostHog `pdi_action_created`, `pdi_action_status_changed`, `pdi_action_completed`
- [ ] Drag-and-drop funcional OU fallback aceitável
