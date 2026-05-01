# Story 3.2 — Widget Pulse no Dashboard (resposta 1-clique)

**Epic:** epic-03-pulse-survey
**Sprint:** 3
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Para alcançar response rate ≥ 50% (DoD da Epic 3), o usuário precisa responder em 1 clique sem mudar de tela. Esta story entrega um widget no Dashboard (`/`) que carrega o Pulse pendente da semana e dispara INSERT em `pulse_responses` com escala 1-5 / eNPS / emoji. Também cria a página `/pulse/:id` usada pelos links enviados pelo `pulse-dispatch` (3.5) e por notificações in-app.

**Pre-condition:** Story 3.1 entregue (existe ao menos 1 `pulse_surveys.active=true`).

## Acceptance Criteria

### AC1 — Widget aparece no Dashboard
**Given** usuário membro da empresa, com `pulse_surveys.active=true` que abrange o usuário (target_all OU department_id/team_id do usuário em `target_departments`/`target_teams`)
**And** o usuário ainda não respondeu o período corrente (calculado: `period_start = data segunda-feira da semana` para weekly; quinzena para biweekly; primeiro dia do mês para monthly)
**When** carrega `/` (Dashboard)
**Then** vê card "Pulse da semana" com a `question` e os controles do `question_type`

**Given** usuário já respondeu o período corrente (existe row em `pulse_responses` com `(pulse_survey_id, user_id, period_start)` ou anonymous flag)
**Then** widget não aparece (oculto), ou exibe estado "Respondido. Obrigado!"

### AC2 — Resposta scale_1_5
**Given** `question_type = scale_1_5`
**Then** widget mostra 5 botões (1, 2, 3, 4, 5) com label "Discordo totalmente" → "Concordo totalmente"
**When** usuário clica `4`
**Then** INSERT em `pulse_responses` com `score=4`
**And** se `4 < require_comment_below` → abre textarea obrigatória "Conte mais (opcional)" — **se score < threshold, o submit do score só finaliza após o comment**
**And** toast "Obrigado pelo feedback!" e widget some
**And** PostHog `pulse_response_submitted` com `{ pulse_survey_id, score, anonymous }`

### AC3 — Resposta enps_0_10
**Given** `question_type = enps_0_10`
**Then** mostra slider 0-10 com legenda detratores (0-6) / passivos (7-8) / promotores (9-10)
**And** mesmo fluxo de submit/validação de comentário

### AC4 — Resposta mood_emoji
**Given** `question_type = mood_emoji`
**Then** mostra 5 emojis (😢=1, 😐=2, 🙂=3, 😀=4, 😍=5)
**When** usuário clica
**Then** INSERT com `score=N` e `emoji=texto`
**And** sem campo de comentário (irrelevante)

### AC5 — Anonimato
**Given** `pulse_surveys.anonymous = true`
**Then** widget mostra badge "Anônimo" e texto "Sua resposta não será associada ao seu nome"
**When** submit
**Then** INSERT com `user_id = NULL` (RLS exige `(ps.anonymous = true AND user_id IS NULL)`)
**And** UNIQUE NULLS NOT DISTINCT da tabela impede o mesmo `auth.uid()` responder 2x — porém como user_id é NULL, a unicidade vira `(pulse_survey_id, NULL, period_start)` e só permite UMA resposta anônima por período por survey, o que é incorreto multi-usuário. **Ver Technical Notes para mitigação.**

### AC6 — Página /pulse/:id (uso por links externos / push)
**Given** usuário navega para `/pulse/:pulseSurveyId`
**Then** vê tela full-page com mesma question/controles do widget
**And** após submit, redireciona para `/` com toast

**Given** pulse não existe ou está `active=false`
**Then** mostra "Esta pesquisa não está mais ativa" e link "Voltar ao início"

### AC7 — Limite "1 widget ativo por usuário/semana"
**Given** existem 3 pulses ativos para o usuário no mesmo período
**Then** widget mostra apenas 1 (o `pulse_surveys.created_at` mais recente que ainda não foi respondido) para evitar fadiga
**And** os outros ficam acessíveis via página `/pulse/:id` ou via aba "Outras pesquisas pendentes" (P1)

### AC8 — Hooks
- `usePendingPulse(userId, companyId)` — retorna `{ pulse, periodStart, hasResponded }`
- `useSubmitPulseResponse()` — mutation que faz INSERT, com `onSuccess` invalida `["pending-pulse"]`
- queryKey `["pending-pulse", userId, companyId]`

## Technical Notes
- **Mitigação anonimato (AC5):** para garantir "1 resposta por usuário em pulse anônimo" SEM gravar `user_id`, criar tabela auxiliar `pulse_response_acks (pulse_survey_id, user_id, period_start UNIQUE)` que registra apenas o ack (sem score). O INSERT em `pulse_responses` continua com `user_id=NULL`. Antes do submit, app verifica se já existe row em `pulse_response_acks` para esse usuário/pulse/período. **Adicionar nota na story 3.5/3.1 sobre criar essa tabela auxiliar em migration aditiva (`0004a_pulse_anon_acks.sql` — NOVA, aditiva).**
  - Alternativa mais simples (recomendada): fazer o check apenas client-side via `localStorage` chave `pulse:${pulseId}:${periodStart}` — aceita perda em troca de simplicidade. **Decisão: usar localStorage no MVP; documentar como risco no README do sprint.**
- **Cálculo `period_start`:**
  - weekly: `date_trunc('week', now())::date` (segunda-feira)
  - biweekly: segunda-feira da semana atual ajustada para semana ímpar/par desde `created_at`
  - monthly: `date_trunc('month', now())::date`
  - implementar em util `src/lib/pulse/periodStart.ts`
- **Files novos:**
  - `src/components/dashboard/PulseWidget.tsx`
  - `src/components/pulse/PulseQuestion.tsx` (compartilhado entre widget e /pulse/:id)
  - `src/components/pulse/PulseScale1to5.tsx`
  - `src/components/pulse/PulseEnps.tsx`
  - `src/components/pulse/PulseMoodEmoji.tsx`
  - `src/pages/Pulse.tsx` (rota `/pulse/:id`)
  - `src/hooks/usePendingPulse.ts`
  - `src/hooks/useSubmitPulseResponse.ts`
  - `src/lib/pulse/periodStart.ts`
- **Files modificados:**
  - `src/pages/Index.tsx` ou `src/pages/Dashboard.tsx` — montar `<PulseWidget />` no topo
  - `src/App.tsx` — adicionar rota `/pulse/:id`
- **RLS:** policy `Users submit own pulse responses` já cobre os 2 casos (anônimo e não)
- **PostHog event:** `pulse_response_submitted { pulse_survey_id, score, question_type, anonymous, has_comment }`

## Test Plan
- **Unit:** `periodStart` para cada frequência (cobrir virada de mês, semana 53)
- **Integration:** criar pulse weekly → user A responde → widget some para A; widget continua para user B
- **RLS:** user A não consegue ler `user_id` de respostas anônimas de outro user (`SELECT user_id FROM pulse_responses WHERE pulse_survey_id = X` retorna NULLs)
- **Manual:** responder 1 pulse de cada `question_type` (3 pulses)

## Dependencies
- **Depends on:** Story 3.1 (admin cria pulses)
- **Blocks:** Story 3.3 (gráfico precisa de respostas), Story 3.4 (export precisa de respostas)

## Definition of Done
- [ ] AC1-AC8 done
- [ ] Tests passing
- [ ] Lint clean
- [ ] Evento `pulse_response_submitted` disparando com payload correto
- [ ] Smoke test: responder pulse anônimo + verificar via SQL que `user_id IS NULL`
- [ ] Risco do localStorage (anonimato) documentado no README sprint-3
