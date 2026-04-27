# Story 0.4 — Setup PostHog para product analytics

**Epic:** Sprint 0
**Sprint:** 0
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
ADR-009 escolheu PostHog para product analytics (eventos, funis, feature flags futuros). Free tier dá 1M events/mês — sobra muito para o MVP.

## Acceptance Criteria

### AC1 — Conta + projeto criados
**Given** projeto criado em posthog.com (cloud, free tier, região US ou EU conforme LGPD)
**When** SDK adicionado
**Then** `VITE_POSTHOG_KEY` e `VITE_POSTHOG_HOST` configurados

### AC2 — SDK inicializado e identifica usuário
**Given** `posthog-js` instalado
**When** `src/main.tsx` carregado e usuário autentica
**Then** `posthog.init()` configurado + `posthog.identify(user.id, { email, company_id })` no login

### AC3 — Eventos críticos rastreados
**Given** usuário interage com fluxos âncora
**When** ações abaixo acontecem
**Then** PostHog recebe os eventos com properties:

| Evento | Quando | Properties |
|---|---|---|
| `okr_created` | criar objetivo | `type`, `commitment_type`, `kr_count` |
| `okr_checkin_submitted` | check-in salvo | `risk`, `has_blocker` |
| `recognition_sent` | reconhecimento | `to_user_role`, `points` |
| `feedback_requested` | pedido feedback | `visibility` |
| `pulse_responded` | resposta pulse | `score`, `survey_type` |
| `one_on_one_scheduled` | agendar 1:1 | `recurrence` |
| `pdi_created` | criar PDI | `competency_count` |
| `nine_box_finalized` | finalizar matriz | `placement_count` |

### AC4 — Page views automáticos
**Given** usuário navega entre rotas
**Then** PostHog captura `$pageview` automático com `pathname`

### AC5 — Opt-out via configuração de privacidade
**Given** usuário desabilita analytics em `/settings/privacy`
**When** preferência salva
**Then** `posthog.opt_out_capturing()` chamado e nenhum evento adicional é enviado

### AC6 — Reset no logout
**Given** usuário faz logout
**Then** `posthog.reset()` chamado para anonimizar próximas sessões

## Technical Notes
- Lib: `posthog-js`
- Files: `package.json`, `src/main.tsx`, `src/contexts/AuthContext.tsx`, `src/lib/analytics.ts` (helper centralizado)
- **NÃO usar autocapture massivo** — só `$pageview` automático + eventos custom listados
- LGPD: política de privacidade deve mencionar PostHog (Sprint 5)

## Test Plan
- Manual: disparar 1 evento de cada tipo em staging + ver chegando no PostHog
- Verificar opt-out funciona (DevTools network: nada vai para `/e/`)

## Dependencies
Nenhuma. Pode rodar em paralelo com 0.1, 0.2, 0.3.

## Definition of Done
- [ ] Eventos AC3 chegando em PostHog staging
- [ ] Identify + reset funcionam corretamente
- [ ] Opt-out funcional
- [ ] Helper `src/lib/analytics.ts` documentado para que demais stories chamem
- [ ] Dashboard mínimo criado em PostHog: WAU, eventos por tipo, funil signUp→primeiroOKR
