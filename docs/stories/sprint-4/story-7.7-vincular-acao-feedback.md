# Story 7.7 — Vincular ação a feedback

**Epic:** epic-07-pdi
**Sprint:** 4
**Status:** Approved
**Estimate:** S
**Priority:** P1
**Owner:** unassigned (Dex)

## Context
PDI fica mais rico quando ações são respostas a feedbacks recebidos. Esta story habilita vincular uma `pdi_action.feedback_request_id` a uma entrada da tabela `feedback_requests` (Epic 5). Quando o usuário lê um feedback, oferece "Criar ação no PDI a partir deste feedback".

**Pre-condition:** Stories 7.1, 7.3 entregues. Epic 5 (Feedback Contínuo) deve estar entregue — tabela `feedback_requests` existente. Migration `0008_pdi.sql` aplicada (campo `feedback_request_id` em `pdi_actions`).

## Acceptance Criteria

### AC1 — Botão "Criar ação no PDI" no feedback
**Given** usuário visualizando feedback recebido (pertence a si)
**Then** botão "Criar ação no PDI" visível
**And** se user não tem PDI ativo, botão leva a "/pdi/novo"

### AC2 — Dialog pré-preenchido
**Given** clica
**When** dialog abre
**Then** pré-preenche título com "Trabalhar feedback de [autor]: [primeiros 80 chars]"
**And** descrição com texto completo do feedback
**And** combobox de PDI ativo (auto-select se só 1)
**And** combobox de competência opcional

### AC3 — INSERT vincula
**Given** submete
**When** INSERT em `pdi_actions`
**Then** `feedback_request_id` populado com FK
**And** ação aparece na coluna "A fazer" do kanban (Story 7.3)
**And** evento PostHog `pdi_action_created` com `{from_feedback: true}`

### AC4 — Indicador na ação
**Given** ação com `feedback_request_id` populado
**Then** badge "📨 De feedback" no card
**And** click no badge expande snippet do feedback original

### AC5 — Listar ações vindas de feedback
**Given** detalhe do PDI
**Then** filtro "Apenas ações de feedback" no kanban
**And** seção "Ações originadas em feedback" lista todas

### AC6 — Não duplicar
**Given** feedback já tem ação vinculada (`feedback_request_id` existe em alguma `pdi_actions` do user)
**Then** botão muda para "Ver ação no PDI" e leva ao card

### AC7 — Feedback deletado
**Given** feedback é deletado em `feedback_requests`
**Then** `feedback_request_id` vira NULL via `ON DELETE SET NULL`
**And** ação preservada (apenas perde o link)
**And** badge muda para "📨 De feedback (removido)"

### AC8 — Acesso restrito
**Given** user X tenta criar ação vinculando feedback de outro user
**Then** RLS de `feedback_requests` impede SELECT → combobox não lista
**And** mesmo se forçar, INSERT em `pdi_actions` requer plan ownership

## Technical Notes
- **Migration:** `0008_pdi.sql` — campo `pdi_actions.feedback_request_id uuid REFERENCES feedback_requests(id) ON DELETE SET NULL`. Sem mudanças adicionais
- **Files novos:**
  - `src/components/feedback/CreatePDIActionFromFeedback.tsx`
  - `src/components/pdi/FeedbackOriginBadge.tsx`
- **Files modificados:**
  - Página de visualização de feedback (provavelmente `src/pages/Feedback.tsx` ou similar — confirmar com Sprint 3 deliverable)
  - `src/components/pdi/ActionCard.tsx` (badge)
  - `src/components/pdi/ActionsKanban.tsx` (filtro)
- **Padrões:** React Query, sonner PT-BR

### RLS Notes
- `feedback_requests` tem suas próprias policies (Epic 5) — confiar nelas
- `pdi_actions` policies já cobrem (via JOIN com plan)
- Cross-table: ao listar ações com badge, JOIN com `feedback_requests` — RLS aplica em ambas tabelas. Se feedback foi deletado, JOIN externo retorna NULL → UI trata como "removido"

## Test Plan
- **Manual:** receber feedback → criar ação → ver no PDI
- **Manual:** tentar criar 2ª ação do mesmo feedback → botão muda para "Ver ação"
- **RLS:** user X tenta vincular feedback de Camila → bloqueado
- **Cascade:** deletar feedback → ação preservada, badge "removido"

## Dependencies
- Story 7.1, 7.3
- **Epic 5 entregue** (tabela `feedback_requests`)
- Bloqueia: nenhuma

## Definition of Done
- [ ] AC1-AC8 done
- [ ] PR reviewed
- [ ] Funciona com feedback do Sprint 3 entregue
- [ ] Evento PostHog com flag `from_feedback`
- [ ] Cascade ON DELETE SET NULL testado
