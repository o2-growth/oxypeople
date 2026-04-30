# Epic 3 — Pulse Survey

**Sprint:** 2
**Status:** 🟡 Ready
**Priority:** P0
**Estimate:** 1 sprint
**Migrations:** `0004_pulse_survey.sql`, `0009_pg_cron_jobs.sql` (pulse-dispatch)
**ADRs:** ADR-004 (Pulse dedicado vs reuso de surveys)

## Goal
Substituir surveys pontuais por medição contínua de clima (semanal/quinzenal/mensal) com gráfico longitudinal.

## Personas impactadas
Renata (configura, lê) · Bruno (lê do time) · Camila (responde)

## Stories

| # | Title | Estimate | File |
|---|---|---|---|
| 3.1 | Criar Pulse recorrente (admin) | M | story-3.1 (lazy) |
| 3.2 | Widget no Dashboard (1-clique resposta) | S | story-3.2 |
| 3.3 | Gráfico de evolução com segmentação | M | story-3.3 |
| 3.4 | Export CSV/Excel | S | story-3.4 |
| 3.5 | Edge function pulse-dispatch + cron | S | story-3.5 |

## Sequencing
1. 3.1 (admin UI primeiro — sem dispatch ainda)
2. 3.2 (widget — funciona com Pulse manual antes do cron)
3. 3.5 (dispatch automatiza)
4. 3.3, 3.4 em paralelo

## Definition of Done
- [ ] 1 Pulse semanal rodando no rollout interno do o2-growth com 100% de entrega via cron
- [ ] Widget no dashboard com response rate > 70% no o2-growth
- [ ] Gráfico mostra evolução de >4 semanas
- [ ] Export CSV preserva anonimato em pesquisas anônimas
- [ ] RLS testado: anônimo não revela `user_id`

## Riscos
- 🟡 Widget pode ter "fadiga" — limitar a 1 ativo por usuário/semana
- 🟡 Notification em massa — bulk insert em batches de 100 em `pulse-dispatch`
- 🟡 Anônimo: garantir que `user_id IS NULL` é honrado no SELECT

## Métricas pós-deploy
- Response rate semanal (alvo ≥ 50%)
- Drop-off rate (% de pulses ignorados 3 semanas seguidas)
- eNPS médio da empresa
