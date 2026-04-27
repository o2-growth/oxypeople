# Epic 1 — OKRs Hardening

**Sprint:** 1 (semana 1)
**Status:** 🟡 Ready
**Priority:** P0
**Estimate:** 1 sprint (1 dev)
**Depends on:** Sprint 0 completo
**Migrations:** `0003_okr_hardening.sql`, `0009_pg_cron_jobs.sql`
**ADRs:** ADR-003 (objective_comments)

## Goal
Elevar OKRs de "funcional" para "best-in-class" — paridade com Feedz + diferenciais (cascata, auditoria, comments).

## Personas impactadas
Renata (admin) · Bruno (líder) · Camila (colab)

## Stories

| # | Title | Estimate | File |
|---|---|---|---|
| 1.1 | Períodos admin UI | M | [story-1.1](../stories/sprint-1/story-1.1-periods-admin-ui.md) |
| 1.2 | Comentários em objetivos e KRs | M | [story-1.2](../stories/sprint-1/story-1.2-objective-comments.md) |
| 1.3 | KR confidence (0–100) | S | [story-1.3](../stories/sprint-1/story-1.3-kr-confidence.md) |
| 1.4 | Commitment type (committed/aspirational) | S | [story-1.4](../stories/sprint-1/story-1.4-commitment-type.md) |
| 1.5 | OKR escalation cron | S | [story-1.5](../stories/sprint-1/story-1.5-okr-cron-escalation.md) |
| 1.6 | Edit collaborators no detail | S | [story-1.6](../stories/sprint-1/story-1.6-edit-collaborators.md) |
| 1.7 | Align objective_type enum TS↔DB | XS | [story-1.7](../stories/sprint-1/story-1.7-align-objective-enum.md) |

## Sequencing
1. **1.7 PRIMEIRO** (refactor enum desbloqueia outras)
2. Migration `0003` aplicada (depois de aprovação do usuário)
3. 1.1, 1.2, 1.3, 1.4, 1.6 em paralelo
4. 1.5 por último (depende de cron infra)

## Definition of Done
- [x] Todas 7 stories com AC marcadas como done
- [ ] Cron `okr-escalation-daily` rodando em prod por 7 dias sem falha
- [ ] Comments com realtime testado (2 usuários veem update ao vivo)
- [ ] Confidence aparece no card e no executive summary
- [ ] Aspirational excluído da média geral (verificado em query)
- [ ] Periods CRUD admin operacional sem error
- [ ] Sem regressão em fluxos existentes (smoke test em check-in, tree, map view)

## Riscos
- ⚠️ `validate_period_no_overlap` precisa pre-check de overlaps existentes
- ⚠️ Realtime `objective_comments` aumenta carga no Supabase — monitorar

## Métricas pós-deploy
- % de OKRs com pelo menos 1 comentário no primeiro mês
- Distribuição de `confidence` por dept
- Alertas de escalation enviados por semana
