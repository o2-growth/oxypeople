# Story 5.4 — Ver feedbacks sobre mim (com visibility)

**Epic:** epic-05-feedback-continuo
**Sprint:** 3
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
O subject vê feedbacks compartilhados (visibility ∈ `shared_with_subject`, `shared_with_manager`). Tela `/feedback/about-me`. **CRÍTICO:** RLS do `0006` deve garantir que feedbacks `private_requester` NUNCA aparecem para o subject. Esta story também é o ponto onde o **manager direto** vê feedbacks `shared_with_manager` sobre seus reports.

**Pre-condition:** Stories 5.1, 5.2 entregues. `is_user_manager` helper existe.

## Acceptance Criteria

### AC1 — Lista "Sobre mim"
**Given** usuário acessa `/feedback/about-me`
**Then** vê tabela com feedbacks onde:
- `subject_user_id = auth.uid()` AND
- `visibility IN ('shared_with_subject', 'shared_with_manager')` AND
- `status = 'answered'`
**And** colunas: requester (avatar+nome), respondent (avatar+nome), pergunta, resposta, tags de competência, data
**And** ordenação: `answered_at DESC`

### AC2 — Filtro privacidade visual
**Given** lista
**Then** banner informativo "Você só vê feedbacks que foram compartilhados com você. Feedbacks privados ao requester não aparecem."

### AC3 — Detalhe completo
**Given** clica em linha
**When** abre `/feedback/:id`
**Then** mesma tela da Story 5.3 mas com perspectiva do subject
**And** se subject NÃO tem visibility (`private_requester`), página retorna 403 "Sem acesso"

### AC4 — Visão do manager
**Given** usuário é manager direto de outro user (verificado por `is_user_manager`)
**When** acessa `/feedback/about-me?view=team`
**Then** vê feedbacks onde:
- `subject_user_id IN (subordinados diretos do manager)` AND
- `visibility = 'shared_with_manager'`
**And** badges deixam claro "Sobre [Nome do report]"

### AC5 — Filtros
**Given** lista
**Then** filtros: tag de competência, intervalo de datas, requester específico
**And** busca por texto na resposta

### AC6 — Estatísticas pessoais (mini)
**Given** topo da página
**Then** mostra cards: "Total de feedbacks recebidos", "Por competência (top 3)", "Últimos 30 dias"
**And** clicáveis para filtrar a lista

### AC7 — RLS test (CRÍTICO)
**Given** request com `visibility='private_requester'` E `subject_user_id = user X`
**When** user X faz query
**Then** RLS NÃO retorna esse request (testado via SQL: `SELECT * FROM feedback_requests WHERE subject_user_id = 'X'` autenticado como X retorna 0 desse)

## Technical Notes
- **Files novos:**
  - `src/pages/feedback/AboutMe.tsx`
  - `src/components/feedback/FeedbackAboutMeList.tsx`
  - `src/components/feedback/CompetencyStatsCard.tsx`
  - `src/hooks/useFeedbackAboutMe.ts`
  - `src/hooks/useFeedbackForTeam.ts` (manager view)
- **Files modificados:**
  - `src/App.tsx` — rota `/feedback/about-me`
  - `src/pages/feedback/Detail.tsx` — proteger acesso (403 se não autorizado)
- **Padrões:** AppLayout, recharts (small bar chart das competências), sonner
- **RLS:** policy `Feedback parties can view` já cobre — esta story é mais sobre UI fiel à RLS

## Test Plan
- **RLS test (CRÍTICO):** seedar 4 requests:
  1. private_requester → user X NUNCA vê
  2. shared_with_subject → user X vê
  3. shared_with_manager → user X vê + manager M vê
  4. Outro company → user X NUNCA vê
- **Unit:** estatísticas de competência calculadas corretamente
- **Manual:** fazer demo com 3 logins (requester, subject, manager) → cada um vê o que deve

## Dependencies
- **Depends on:** Stories 5.1, 5.2
- **Pode rodar em paralelo com:** Story 5.3

## Definition of Done
- [ ] AC1-AC7 done
- [ ] **Test RLS dos 4 cenários PASSANDO** (DoD da Epic 5)
- [ ] Tests passing
- [ ] Lint clean
- [ ] PostHog `feedback_about_me_viewed`
- [ ] Smoke 3-login validado
