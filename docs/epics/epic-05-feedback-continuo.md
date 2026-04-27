# Epic 5 — Feedback Contínuo

**Sprint:** 3 (semanas 4–5, junto com Epic 6)
**Status:** 🟡 Ready
**Priority:** P0
**Estimate:** 1 sprint
**Migrations:** `0006_feedback_continuo.sql`, `0009_pg_cron_jobs.sql` (expiração)

## Goal
Descolar feedback do ciclo anual e tornar prática diária. Pedir, receber, acompanhar — com privacidade granular.

## Personas impactadas
Bruno (pede e dá) · Camila (responde, vê sobre si) · Renata (acompanha métrica)

## Stories

| # | Title | Estimate | File |
|---|---|---|---|
| 5.1 | Pedir feedback sobre alguém | M | story-5.1 (lazy) |
| 5.2 | Responder feedbacks pendentes | M | story-5.2 |
| 5.3 | Ver feedbacks que pedi (status) | S | story-5.3 |
| 5.4 | Ver feedbacks sobre mim (visibility) | S | story-5.4 |
| 5.5 | Notificações nos eventos certos | S | story-5.5 (via trigger) |
| 5.6 | Dashboard de métricas (admin) | M | story-5.6 |
| 5.7 | Cron de expiração | XS | story-5.7 (já em 0009) |

## Sequencing
1. 5.1 + 5.2 (criar + responder — fluxo mínimo)
2. 5.3 + 5.4 (visualização)
3. 5.5 (já vem via trigger SQL)
4. 5.6 (dashboard admin)
5. 5.7 (cron — quase free)

## Definition of Done
- [ ] 30+ feedbacks circulando em dogfood
- [ ] **0 feedbacks privados vazando** (test RLS de visibility pass)
- [ ] Tempo médio de resposta < 3 dias em dogfood
- [ ] Notificação chega em <1min após evento
- [ ] Cron expira corretamente requests vencidos

## Riscos crítico
- 🔴 **Visibility RLS** — testar 4 cenários:
  1. `private_requester` — só requester vê
  2. `shared_with_subject` — requester + respondent + subject veem
  3. `shared_with_manager` — acima + manager direto do subject vê
  4. Admin vê tudo
- 🟡 Notification flood se muitos feedbacks ao mesmo tempo — rate limit no app

## Métricas pós-deploy
- Feedbacks/usuário/mês (alvo ≥ 1)
- Tempo médio resposta
- % respondidos no prazo
- Taxa de declined com motivo
