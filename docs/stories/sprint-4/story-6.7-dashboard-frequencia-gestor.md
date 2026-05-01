# Story 6.7 — Dashboard de frequência por gestor

**Epic:** epic-06-one-on-ones
**Sprint:** 4
**Status:** Approved
**Estimate:** S
**Priority:** P1
**Owner:** unassigned (Dex)

## Context
Renata (RH) precisa de visibilidade da prática de 1:1s — sem ver o conteúdo. Métricas: # de 1:1s agendadas por gestor, % completadas, % canceladas/no_show, gestores sem 1:1 nos últimos 30 dias.

**Pre-condition:** Stories 6.1 e 6.6 entregues. Migration `0002_add_manager_id.sql` aplicada (precisamos de `manager_id` em `users`).

## Acceptance Criteria

### AC1 — Página `/admin/one-on-ones-dashboard`
**Given** usuário admin
**When** acessa `/admin/one-on-ones-dashboard` (link em `/admin`)
**Then** vê dashboard com 4 cards no topo:
  - Total de 1:1s no período (default 90 dias)
  - % completadas (`completed` / total não-canceladas)
  - % canceladas + no_show
  - Gestores ativos (com ≥ 1 1:1 no período)

**Given** usuário não-admin
**Then** redireciona com toast "Sem permissão"

### AC2 — Tabela "Frequência por gestor"
**Given** dashboard
**Then** tabela com colunas:
  - Gestor (nome)
  - # de liderados (count `manager_id = gestor.id`)
  - 1:1s agendadas no período
  - 1:1s completadas
  - % completion
  - Última 1:1 (data)
**And** ordenado por % completion ASC (piores primeiro)

### AC3 — Filtro de período
**Given** seletor de período (últimos 30/60/90 dias, custom range)
**Then** todas as métricas recalculadas
**And** evento PostHog `one_on_one_dashboard_filtered` com `{period_days}`

### AC4 — Highlight: gestores sem 1:1 recente
**Given** gestor com liderados mas SEM 1:1s nos últimos 30 dias
**Then** linha destacada em amarelo
**And** badge "⚠️ Sem 1:1 recente"

### AC5 — Drill-down: clicar em gestor mostra detalhe
**Given** clica em linha de gestor
**Then** abre painel lateral com lista de liderados e # de 1:1s com cada
**And** ⚠️ NÃO mostrar conteúdo de tópicos ou notas — apenas datas e status

### AC6 — Gráfico: tendência semanal
**Given** dashboard
**Then** gráfico de linhas (recharts) mostrando 1:1s agendadas vs completadas por semana, últimas 12 semanas

### AC7 — Export CSV
**Given** botão "Exportar CSV"
**When** clica
**Then** baixa CSV com tabela completa (sem conteúdo, apenas métricas)
**And** evento PostHog `one_on_one_dashboard_exported`

## Technical Notes
- **Migration:** sem mudanças. Reusa `one_on_ones`, `users.manager_id`
- **Files novos:**
  - `src/pages/admin/OneOnOnesDashboard.tsx`
  - `src/components/admin/one-on-ones/FrequencyTable.tsx`
  - `src/components/admin/one-on-ones/TrendChart.tsx`
  - `src/hooks/useOneOnOnesDashboard.ts`
- **Files modificados:**
  - `src/App.tsx` (rota admin)
  - `src/pages/admin/index.tsx` (link)
- **Query exemplo (RLS-aware via admin):**
  ```sql
  SELECT u.id, u.full_name,
    (SELECT COUNT(*) FROM users WHERE manager_id = u.id) AS direct_reports,
    COUNT(o.id) FILTER (WHERE o.scheduled_at >= now() - interval '90 days') AS scheduled_total,
    COUNT(o.id) FILTER (WHERE o.status='completed' AND o.scheduled_at >= now() - interval '90 days') AS completed,
    MAX(o.scheduled_at) AS last_1on1
  FROM users u
  LEFT JOIN one_on_ones o ON o.leader_id = u.id
  WHERE u.company_id = $1
  GROUP BY u.id;
  ```
- **Padrões:** AppLayout, recharts, shadcn-ui Table, useUserPermissions gate

### RLS Privacy Notes
- Admin VÊ a existência das 1:1s (RLS de `one_on_ones` já admite `is_company_admin`)
- Admin NÃO vê notas (RLS `Notes visibility by role` exclui admin) — confirmado no Story 6.3
- Dashboard NUNCA deve consultar `one_on_one_notes` ou `one_on_one_topics`. Apenas `one_on_ones`
- Drill-down AC5: mostra LISTA de 1:1s com data + status — JAMAIS link direto que dê acesso a notas (admin já tem acesso de visualização da 1:1, mas as notas privadas são bloqueadas no detalhe)

## Test Plan
- **Manual:** admin acessa dashboard, vê métricas, filtra por período, exporta CSV
- **RLS:** non-admin tenta `/admin/one-on-ones-dashboard` → bloqueado
- **Performance:** query com 200+ usuários e 1000+ 1:1s — < 2s

## Dependencies
- Stories 6.1, 6.6
- Migration `0002_add_manager_id.sql`
- Bloqueia: nenhuma

## Definition of Done
- [ ] AC1-AC7 done
- [ ] PR reviewed
- [ ] Dashboard NÃO consulta tabelas de tópicos/notas (verificar)
- [ ] Export CSV testado em Excel + Google Sheets
- [ ] Eventos PostHog
