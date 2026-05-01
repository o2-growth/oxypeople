# Story 5.5 — Notificações in-app de feedback (UI + verificação trigger)

**Epic:** epic-05-feedback-continuo
**Sprint:** 3
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
A migration `0006` já criou trigger SQL `notify_feedback_event` que insere em `notifications` quando feedback é criado/respondido. Esta story garante que (a) trigger funciona, (b) UI exibe os novos tipos de notificação corretamente, (c) clicar leva para tela certa.

**Pre-condition:** Stories 5.1, 5.2 entregues; tabela `notifications` existe e tem UI de listagem/dropdown (verificar — provavelmente já existe na sidebar ou topbar).

## Acceptance Criteria

### AC1 — Trigger funciona
**Given** request criado (Story 5.1)
**Then** row em `notifications`:
- `user_id = respondent_id`
- `type = 'feedback_request'`
- `title = 'Você recebeu uma solicitação de feedback'`
- `message = primeiros 200 chars da pergunta`
- `reference_id = feedback_request.id`
- `reference_type = 'feedback_request'`

**Given** request mudou para `answered` (Story 5.2)
**Then** row em `notifications` para requester (type=`feedback_answered`)
**And** se `visibility IN ('shared_with_subject', 'shared_with_manager')` E subject ≠ requester → row para subject (type=`feedback_received`)

### AC2 — UI dropdown de notificações
**Given** topbar tem dropdown de notificações (existente)
**Then** suporta os novos tipos com ícones e labels:
- `feedback_request` → ícone 💬 / "Pedido de feedback"
- `feedback_answered` → ícone ✅ / "Feedback respondido"
- `feedback_received` → ícone 📨 / "Você recebeu um feedback"

### AC3 — Click leva para tela certa
**Given** clica notification `feedback_request`
**Then** vai para `/feedback/inbox` e destaca o item (`?highlight=<id>` query param)

**Given** `feedback_answered`
**Then** vai para `/feedback/sent` e destaca

**Given** `feedback_received`
**Then** vai para `/feedback/about-me` e destaca

### AC4 — Marcar como lida
**Given** notification clicada OU view list aberta
**Then** UPDATE `notifications.read_at = now()` (ou padrão existente)

### AC5 — Rate limit (defensivo)
**Given** mesma `feedback_request_id` triggers múltiplas vezes (improvável mas possível)
**Then** dedupe via UNIQUE INDEX em `notifications(user_id, type, reference_id)` se ainda não existir
**And** se índice não existe, criar em migration aditiva `0006b_notifications_dedupe.sql` (parcial: `WHERE reference_type = 'feedback_request'`)

### AC6 — Latência < 1 min
**Given** trigger é síncrono na transação do INSERT/UPDATE
**Then** notification aparece para o user em < 1s (real-time se Supabase Realtime estiver ligado em `notifications`; senão, polling de 30s já existente)

### AC7 — Settings (futuro P1)
Documentar TODO: usuário poder desligar notification por tipo (ex.: "não me notifique sobre feedback_answered"). Não implementar agora.

## Technical Notes
- **Migrations:**
  - `0006` (já tem trigger)
  - `0006b_notifications_dedupe.sql` opcional (CREATE UNIQUE INDEX … WHERE …)
- **Files novos:**
  - `src/lib/notifications/feedbackNotificationConfig.ts` (mapeamento type → icon/route)
- **Files modificados:**
  - `src/components/notifications/NotificationDropdown.tsx` (ou nome real) — adicionar branches para 3 novos types
  - `src/components/notifications/NotificationItem.tsx` — render diferenciado
- **Padrões:** ícones de `lucide-react`, sonner não se aplica (estes são in-app)

## Test Plan
- **Integration SQL:** INSERT em `feedback_requests` → SELECT em `notifications` retorna 1 row para respondent
- **Integration SQL:** UPDATE status='answered' → 1 ou 2 rows extras (depende de visibility)
- **Manual:** criar request, ver notification chegar no respondent em < 1min
- **Manual:** clicar notification, validar destaque na lista

## Dependencies
- **Depends on:** Stories 5.1, 5.2
- **Depends on:** sistema de notifications existente (verificar antes de codar)
- **Blocks:** —

## Definition of Done
- [ ] AC1-AC7 done
- [ ] Tests passing
- [ ] Lint clean
- [ ] Smoke: 3 cenários (request criado / answered shared / answered private) — notifications corretas
- [ ] PostHog `feedback_notification_clicked { type }`
