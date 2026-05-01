# Story 5.3 — Ver feedbacks que pedi (status)

**Epic:** epic-05-feedback-continuo
**Sprint:** 3
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Tela `/feedback/sent` para o requester acompanhar status dos pedidos que fez. Visibilidade total para o requester (RLS já garante via `auth.uid() = requester_id`).

**Pre-condition:** Stories 5.1, 5.2 entregues.

## Acceptance Criteria

### AC1 — Lista "Pedidos enviados"
**Given** usuário acessa `/feedback/sent`
**Then** vê tabela com:
- Para quem pediu (respondent — avatar + nome)
- Sobre quem (subject — avatar + nome)
- Pergunta (truncada 100 chars)
- Status (badge: ⏳ Pendente / ✅ Respondido / ❌ Recusado / ⌛ Expirado)
- Visibilidade (badge)
- Prazo
- Data do pedido
- Ações: "Ver detalhes" (todos), "Excluir" (apenas `requested`)

### AC2 — Filtros
**Given** lista
**Then** filtros: status (multi-chip), busca por nome (subject ou respondent), intervalo de datas
**And** padrão: todos os status

### AC3 — Detalhes
**Given** clica "Ver detalhes"
**When** abre `/feedback/:id`
**Then** mostra:
- Toda info do pedido
- Se `status='answered'`: response completa, `answered_at`
- Se `status='declined'`: `declined_reason`
- Se `status='requested'`: countdown até `due_date`

### AC4 — Excluir pedido pendente
**Given** request `status='requested'`
**When** clica "Excluir"
**Then** modal "Cancelar pedido? O respondent será notificado."
**And** se confirma, DELETE (RLS `Requester or admin delete feedback`)
**And** PostHog `feedback_request_cancelled`

**Given** `status='answered'` ou outro
**Then** botão excluir oculto/desabilitado (RLS bloqueia também)

### AC5 — Exportar (P1)
Marcar TODO de export CSV em P1; não implementar agora.

### AC6 — Hook
- `useFeedbackSent()` — query com filtros, queryKey `["feedback-sent", userId, filters]`
- `useDeleteFeedbackRequest()` — mutation

### AC7 — Notificação visual de novidades
**Given** request mudou para `answered` desde última visita do user
**Then** linha tem indicador "Novo!" (compara `notifications.read_at` ou `last_visited_at` em localStorage)

## Technical Notes
- **Files novos:**
  - `src/pages/feedback/Sent.tsx`
  - `src/pages/feedback/Detail.tsx` (compartilhado entre 5.3 e 5.4)
  - `src/components/feedback/FeedbackSentTable.tsx`
  - `src/hooks/useFeedbackSent.ts`
  - `src/hooks/useDeleteFeedbackRequest.ts`
- **Files modificados:**
  - `src/App.tsx` — rotas `/feedback/sent`, `/feedback/:id`
  - `src/components/layout/AppSidebar.tsx`
- **Padrões:** AppLayout, shadcn Table, sonner

## Test Plan
- **Unit:** filtro de status retorna apenas matching
- **Integration:** criar request → ver em /sent → respondent responde → /sent mostra ✅ Respondido com `Novo!` flag
- **RLS:** user B não vê requests do user A em /sent

## Dependencies
- **Depends on:** Stories 5.1, 5.2
- **Pode rodar em paralelo com:** Story 5.4

## Definition of Done
- [ ] AC1-AC7 done
- [ ] Tests passing
- [ ] Lint clean
- [ ] Smoke admin: criar 5 requests, ver lista correta
