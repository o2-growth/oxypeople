# Sprint 3 — Pulse Survey, Nine Box e Feedback Contínuo

**Sprint:** 3
**Status:** Planejado
**Epics cobertos:** 03 (Pulse), 04 (Nine Box), 05 (Feedback Contínuo)
**Total stories:** 18 (5 + 6 + 7)

## Stories (ordem sugerida de implementação)

### Epic 3 — Pulse Survey (5 stories)
1. [Story 3.1 — Criar Pulse recorrente (admin UI)](./story-3.1-pulse-survey-admin.md) — **M / P0**
2. [Story 3.2 — Widget Pulse no Dashboard (resposta 1-clique)](./story-3.2-pulse-widget-dashboard.md) — **S / P0**
3. [Story 3.5 — Edge function pulse-dispatch + cron horário](./story-3.5-pulse-dispatch-cron.md) — **S / P0**
4. [Story 3.3 — Gráfico de evolução do Pulse com segmentação](./story-3.3-pulse-evolution-chart.md) — **M / P0**
5. [Story 3.4 — Export CSV/Excel das respostas Pulse](./story-3.4-pulse-export.md) — **S / P0**

### Epic 4 — Nine Box (6 stories)
6. [Story 4.1 — Criar snapshot Nine Box (auto-popula performance)](./story-4.1-nine-box-snapshot-create.md) — **M / P0**
7. [Story 4.2 — Editor Nine Box com drag-drop entre células](./story-4.2-nine-box-drag-drop.md) — **M / P0**
8. [Story 4.3 — Justificativa obrigatória ao mudar quadrante](./story-4.3-nine-box-justification.md) — **S / P0**
9. [Story 4.4 — Lifecycle de status (draft → finalized → archived)](./story-4.4-nine-box-status-lifecycle.md) — **S / P0**
10. [Story 4.5 — Export PDF da matriz Nine Box](./story-4.5-nine-box-pdf-export.md) — **M / P0**
11. [Story 4.6 — Filtro "meu time" (subtree do manager)](./story-4.6-nine-box-team-filter.md) — **S / P0**

### Epic 5 — Feedback Contínuo (7 stories)
12. [Story 5.1 — Pedir feedback sobre alguém](./story-5.1-feedback-request-create.md) — **M / P0**
13. [Story 5.2 — Responder feedbacks pendentes](./story-5.2-feedback-respond.md) — **M / P0**
14. [Story 5.3 — Ver feedbacks que pedi (status)](./story-5.3-feedback-sent-list.md) — **S / P0**
15. [Story 5.4 — Ver feedbacks sobre mim (com visibility)](./story-5.4-feedback-about-me.md) — **S / P0**
16. [Story 5.5 — Notificações in-app de feedback](./story-5.5-feedback-notifications.md) — **S / P0**
17. [Story 5.6 — Dashboard de métricas de Feedback (admin)](./story-5.6-feedback-admin-dashboard.md) — **M / P0**
18. [Story 5.7 — Cron de expiração de feedback requests](./story-5.7-feedback-expire-cron.md) — **S / P0**

## Migration apply order

Aplicar nesta sequência **antes** de iniciar qualquer story:

1. `0004_pulse_survey.sql` — pulse_surveys, pulse_responses (Epic 3)
2. `0005_nine_box.sql` — nine_box_snapshots, nine_box_placements (Epic 4)
3. `0006_feedback_continuo.sql` — feedback_requests, trigger notify_feedback_event (Epic 5)
4. `0009_pg_cron_jobs.sql` — cron schedules (Stories 3.5, 5.7) — **apenas se Supabase Pro+**

Migrations aditivas opcionais (criadas no curso do sprint, mencionadas nas stories):
- `0004b_pulse_analytics_rpc.sql` — RPC para 3.3 (performance)
- `0005a_nine_box_unarchive.sql` — função SECURITY DEFINER para 4.4
- `0005b_org_subtree_rpc.sql` — apenas se Epic 2 não entregou get_org_subtree (4.6)
- `0006a_feedback_decline_notify.sql` — opcional para 5.2 (notificação de decline)
- `0006b_notifications_dedupe.sql` — UNIQUE INDEX defensivo para 5.5
- `0006c_feedback_metrics_rpc.sql` — RPC para 5.6
- `0009b_feedback_expire_rpc.sql` — apenas se Plano B em 5.7

Todas aditivas — apenas CREATE FUNCTION/INDEX, sem DELETE/UPDATE de dados existentes (regra absoluta de produção).

## Cross-epic dependencies

- **Epic 4 Story 4.6 depende da Epic 2** (Sprint 2) ter entregado `users.manager_id` e a função `get_org_subtree`. Verificar antes de iniciar 4.6 — se faltar, criar `0005b_org_subtree_rpc.sql`.
- **Stories 3.5 e 5.7 dependem da decisão Plano A vs Plano B do Supabase** (mesma decisão tomada em Story 1.5). Se ainda não decidida, BLOQUEIO antes de codar essas duas.
- **Story 5.5 depende do sistema de notifications existente** (verificar se `NotificationDropdown.tsx` ou equivalente já está implementado — provavelmente sim desde Sprint 0).

## Bundles paralelos sugeridos

Times pequenos (1 dev): seguir ordem linear acima.

Time com 2-3 devs em paralelo:

**Bundle A (admin foundation):** 3.1 + 4.1 + 5.1 — todas de pequena/média complexidade, sem deps cruzadas, criam base UI/forms.

**Bundle B (after Bundle A merged):**
- Dev 1: 3.2 → 3.5 (pulse end-to-end)
- Dev 2: 4.2 → 4.3 → 4.4 (nine box editor)
- Dev 3: 5.2 → 5.3 + 5.4 (feedback flow)

**Bundle C (analytics + secondary):** 3.3, 3.4, 4.5, 4.6, 5.5, 5.6, 5.7 — todas paralelizáveis (poucos arquivos compartilhados; cada dev pega 2-3).

## Riscos e mitigações

| # | Risco | Mitigação |
|---|---|---|
| R1 | Anonimato Pulse — UNIQUE NULLS NOT DISTINCT bloqueia múltiplos respondentes anônimos no mesmo período | Documentado em Story 3.2: usar localStorage no MVP; tabela auxiliar `pulse_response_acks` em P1 |
| R2 | RLS de visibility de feedback vazando dados privados | Story 5.4 AC7 testes obrigatórios dos 4 cenários (DoD da Epic 5) |
| R3 | Plano Supabase não decidido | Bloquear stories 3.5 e 5.7 até decisão; demais não dependem |
| R4 | get_org_subtree pode não existir após Epic 2 | Story 4.6 inclui fallback de migration aditiva 0005b |
| R5 | Drag-drop perf com 100+ placements | Story 4.2 AC6 prevê virtualização; testar com fixture seedada |
| R6 | PDF (Story 4.5) — react-pdf é pesado e renderiza no client | Validar perf com 100 placements; fallback futuro = renderizar via edge function |
| R7 | Trigger SQL de notification falha em prod silenciosamente | Story 5.5 AC1 testes integration SQL para validar |

## Definition of Done do Sprint

- [ ] Todas as 18 stories com ACs marcados como done
- [ ] Migrações 0004, 0005, 0006 aplicadas em staging E prod
- [ ] (Se Pro+) Migração 0009 aplicada e crons rodando 7d
- [ ] PostHog dashboards configurados para os novos eventos
- [ ] RLS dos 4 cenários de visibility (5.4 AC7) — passing
- [ ] Smoke test admin para cada Epic
- [ ] Privacidade Pulse anônimo validada (export sem PII, agregação respeitando mínimo de 5)
- [ ] Sentry recebendo erros sem warnings
