# Story 5.1 — Pedir feedback sobre alguém

**Epic:** epic-05-feedback-continuo
**Sprint:** 3
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Hoje feedback acontece apenas durante o ciclo de avaliação. Story habilita qualquer membro da empresa a solicitar feedback ad-hoc sobre qualquer outro membro. Usa entidade `feedback_requests` com 3 papéis (requester, respondent, subject) e 3 níveis de visibility (`private_requester`, `shared_with_subject`, `shared_with_manager`).

**Pre-condition:** migration `0006_feedback_continuo.sql` aplicada; helpers `is_company_member`, `is_user_manager` disponíveis.

## Acceptance Criteria

### AC1 — Página "Pedir feedback"
**Given** member da empresa
**When** acessa `/feedback/new` (ou abre dialog em outra tela)
**Then** vê form com:
- "Sobre quem é o feedback?" (combobox com membros da empresa — `subject_user_id`)
- "Quem você quer que responda?" (combobox — `respondent_id`)
- Pergunta (`question`, textarea, 50-2000 chars)
- Tags de competência (multi-select de competências da empresa, opcional, salva em `competency_tags` jsonb)
- Visibilidade (radio group):
  - "Privada (só você verá)" → `private_requester`
  - "Compartilhada com a pessoa avaliada" → `shared_with_subject` (default)
  - "Compartilhada com a pessoa avaliada + manager dela" → `shared_with_manager`
- Prazo (date picker opcional, `due_date`)

### AC2 — Validações
**Given** form submetido
**Then** valida (Zod):
- `subject_user_id != requester_id` (não pode pedir feedback sobre si mesmo) — exceto caso especial: requester pode ser respondent se `subject = respondent` (auto-feedback solicitado)
- `respondent_id != requester_id` OR (`requester_id = subject_user_id`) — coberto pelo CHECK SQL
- `question` 50-2000 chars
- `due_date >= hoje + 1 dia` (se preenchido)

**Given** Zod falha
**Then** mostra erros inline em PT-BR

### AC3 — Submit
**Given** form válido
**Then** INSERT em `feedback_requests` com:
- `requester_id = auth.uid()`
- demais campos do form
- `status = 'requested'` (default)
- `company_id = useCurrentCompany().id`
**And** trigger `notify_feedback_event` cria notification para respondent automaticamente
**And** redirect para `/feedback/sent` (Story 5.3)
**And** toast "Pedido enviado para [Nome]"
**And** PostHog `feedback_request_sent { visibility, has_competency_tags, has_due_date }`

### AC4 — Atalhos contextuais
**Given** usuário em página de perfil de outra pessoa (`/users/:id` se existir) ou no organograma
**Then** botão "Pedir feedback sobre [Nome]" pré-preenche `subject_user_id`

### AC5 — Bloquear self-feedback indireto
**Given** requester = respondent E requester ≠ subject
**Then** Zod rejeita "Você não pode responder seu próprio pedido sobre outra pessoa"

### AC6 — Hook
**Given** novo hook `useCreateFeedbackRequest()` 
**Then** mutation que faz INSERT
**And** invalida `["feedback-sent", userId]`

### AC7 — Tags de competência
**Given** competências da empresa armazenadas em `competencies` (verificar se tabela existe; se não, MVP usa tags livres em jsonb e P1 cria tabela)
**Then** select carrega lista
**And** salva como array de IDs em `competency_tags` (ex.: `[{"id": "uuid", "label": "Comunicação"}]`)

## Technical Notes
- **Migration:** `0006_feedback_continuo.sql` aplicada
- **Files novos:**
  - `src/pages/feedback/NewFeedbackRequest.tsx` (rota `/feedback/new`)
  - `src/components/feedback/FeedbackRequestForm.tsx`
  - `src/components/feedback/UserPicker.tsx` (combobox reutilizável)
  - `src/components/feedback/VisibilityRadio.tsx`
  - `src/hooks/useCreateFeedbackRequest.ts`
  - `src/lib/validation/feedbackRequestSchema.ts`
- **Files modificados:**
  - `src/App.tsx` — rota `/feedback/new`
  - `src/components/layout/AppSidebar.tsx` — nav "Feedback" com submenu
- **Padrões:** Zod, react-hook-form, sonner, PostHog
- **RLS:** policy `Members create feedback requests` permite INSERT se `requester_id=auth.uid()` e todos os 3 user_ids são membros da empresa

## Test Plan
- **Unit:** Zod schema — `subject == requester` rejeita; question < 50 chars rejeita
- **Integration:** criar request `shared_with_subject` → respondent recebe notification em < 1s (trigger síncrono)
- **RLS test:** member B não consegue INSERT request com `requester_id` ≠ próprio uid
- **Manual:** member cria 3 requests com visibility diferente

## Dependencies
- **Depends on:** migration 0006
- **Blocks:** Stories 5.2-5.6

## Definition of Done
- [ ] AC1-AC7 done
- [ ] Tests passing
- [ ] Lint clean
- [ ] PostHog event
- [ ] Smoke: 3 requests criados, todos com notification entregue
