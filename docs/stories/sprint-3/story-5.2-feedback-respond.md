# Story 5.2 — Responder feedbacks pendentes

**Epic:** epic-05-feedback-continuo
**Sprint:** 3
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Caixa de entrada do respondent. Lista pedidos `status='requested'` direcionados ao usuário, permite responder (`response`) ou recusar (`declined_reason`). Trigger SQL dispara notificação para requester e (se visibility permite) para subject.

**Pre-condition:** Story 5.1 entregue.

## Acceptance Criteria

### AC1 — Inbox de feedbacks
**Given** usuário acessa `/feedback/inbox`
**Then** vê lista de feedback_requests onde `respondent_id = auth.uid() AND status = 'requested'`
**And** ordenada por `due_date ASC NULLS LAST, created_at ASC`
**And** cada item mostra:
- Nome do requester (avatar)
- "Pediu feedback sobre [Nome do subject]"
- Pergunta (truncada 200 chars + "ver mais")
- Tags de competência (badges)
- Visibility (badge: 🔒 Privada / 👤 Compartilhada / 👥 Com manager)
- Prazo (se houver) com cor: verde > 3 dias, amarelo 1-3 dias, vermelho atrasado
- Botões "Responder" / "Recusar"

**Given** inbox vazio
**Then** empty state "Nenhum feedback pendente"

### AC2 — Responder
**Given** clica "Responder"
**Then** abre dialog (ou rota `/feedback/:id/respond`) com:
- Contexto (mesma info da lista)
- Textarea `response` (50-5000 chars)
- Botão "Enviar resposta"
**And** botão desabilitado até 50 chars

**Given** envia
**Then** UPDATE em `feedback_requests`:
- `response = <texto>`
- `status = 'answered'`
- `answered_at = now()`
**And** trigger `notify_feedback_event` notifica requester e (se visibility permite) subject
**And** redirect para inbox, toast "Resposta enviada"
**And** PostHog `feedback_response_submitted { time_to_respond_hours, char_count, visibility }`

### AC3 — Recusar
**Given** clica "Recusar"
**Then** modal "Por que você não pode responder?":
- Textarea `declined_reason` (10-500 chars, obrigatória)
- Botão "Recusar pedido"

**Given** confirma
**Then** UPDATE `status='declined', declined_reason=<texto>`
**And** trigger notification (atualizar trigger 0006? — verificar; se não notifica `declined`, adicionar em migration aditiva 0006a se necessário)
**And** PostHog `feedback_response_declined { time_to_decline_hours, reason_length }`

### AC4 — Edição não permitida após enviar
**Given** request `status='answered'`
**Then** RLS `Respondent answers feedback` (que requer `status='requested'`) bloqueia novo UPDATE
**And** UI mostra apenas "Resposta enviada em DD/MM HH:MM"

### AC5 — Filtros
**Given** inbox
**Then** filtros: "Pendentes" (default), "Respondidos", "Recusados", "Todos"
**And** chip de prazo: "Atrasados" (`due_date < today AND status='requested'`)

### AC6 — Indicador de não-lidos
**Given** notifications de `type='feedback_request'` não lidas
**Then** sidebar/topbar mostra badge com count
**And** ao abrir `/feedback/inbox`, marca como lidas (UPDATE `notifications.read_at`)

### AC7 — Hook
- `useFeedbackInbox()` — query com filtros
- `useRespondFeedback()` — mutation
- `useDeclineFeedback()` — mutation
- queryKey `["feedback-inbox", userId, filters]`

## Technical Notes
- **Migration aditiva opcional:** `0006a_feedback_decline_notify.sql` — se trigger atual não notifica `declined`, adicionar branch `IF NEW.status='declined' THEN INSERT notification ...` (aditivo, seguro). Avaliar se vale.
- **Files novos:**
  - `src/pages/feedback/Inbox.tsx`
  - `src/components/feedback/FeedbackInboxItem.tsx`
  - `src/components/feedback/RespondDialog.tsx`
  - `src/components/feedback/DeclineDialog.tsx`
  - `src/hooks/useFeedbackInbox.ts`
  - `src/hooks/useRespondFeedback.ts`
  - `src/hooks/useDeclineFeedback.ts`
- **Files modificados:**
  - `src/App.tsx` — rota `/feedback/inbox`
  - `src/components/layout/AppSidebar.tsx` — link "Inbox feedback" com badge
- **Padrões:** AppLayout, sonner, Zod, shadcn Dialog

## Test Plan
- **Unit:** Zod respond — < 50 chars rejeita; decline sem reason rejeita
- **Integration:** criar request → responder → request status='answered', notification chega no requester, e em subject se shared
- **RLS test:** user A não consegue UPDATE request de outro user (`respondent_id ≠ auth.uid()`)
- **Manual:** responder e recusar, validar fluxo

## Dependencies
- **Depends on:** Story 5.1
- **Blocks:** Stories 5.3, 5.4, 5.6 (precisam de respostas para mostrar)

## Definition of Done
- [ ] AC1-AC7 done
- [ ] Tests passing
- [ ] Lint clean
- [ ] PostHog events
- [ ] Smoke: 3 respostas + 1 decline reais
