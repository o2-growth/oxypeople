# Story 5.6 — Dashboard de métricas de Feedback (admin)

**Epic:** epic-05-feedback-continuo
**Sprint:** 3
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Renata (RH) precisa medir adoção e qualidade da prática. Story entrega `/admin/feedback/analytics` com KPIs e gráficos: # feedbacks/mês, tempo médio de resposta, % respondidos no prazo, taxa de decline, top competências.

**Pre-condition:** Stories 5.1, 5.2 entregues e dados existem.

## Acceptance Criteria

### AC1 — Tela admin
**Given** admin acessa `/admin/feedback/analytics`
**Then** vê dashboard com cards (mês corrente):
- Total de pedidos
- Total de respostas
- Tempo médio de resposta (h)
- % respondidos no prazo
- Taxa de decline (%)
- Pedidos por usuário (média)

**Given** member não-admin
**Then** redireciona para `/`

### AC2 — Gráfico de evolução
**Given** dashboard
**Then** linha temporal (últimos 6 meses) com:
- # de pedidos criados/mês
- # de respostas/mês
**And** barras por status (Respondido/Pendente/Recusado/Expirado) por mês

### AC3 — Top competências
**Given** dashboard
**Then** ranking das top 10 `competency_tags` mais usadas (parse jsonb, group by, count)
**And** clicável para drill-down (filtra lista de feedbacks por essa competência)

### AC4 — Filtros
**Given** topo da tela
**Then** filtros: intervalo de datas, departamento, time

### AC5 — Adoption rate
**Given** card "Adoção"
**Then** mostra: # de usuários distintos que enviaram pelo menos 1 pedido no período / total de membros ativos
**And** target visual em 80% (cor: < 30% vermelho, 30-70% amarelo, > 70% verde)

### AC6 — Drilldown lista
**Given** clica em qualquer KPI
**Then** abre drawer com lista de feedbacks que compõem aquela métrica (ex.: clicar "Recusados" → lista filtrada)
**And** admin pode ver pergunta + decline_reason

### AC7 — Privacidade
**Given** admin é admin global da empresa (RLS já permite ver tudo via `is_company_admin`)
**Then** dashboard mostra dados agregados E (no drilldown) detalhes
**And** opção "Modo agregado apenas" oculta nomes (apenas counts) — útil para apresentação

### AC8 — RPC sugerida
**Given** queries agregadas podem ser pesadas
**Then** criar RPC `get_feedback_metrics(company_id, date_from, date_to)` retornando JSON com todos os números
**And** definir em migration aditiva `0006c_feedback_metrics_rpc.sql` (CREATE FUNCTION SECURITY INVOKER)

## Technical Notes
- **Files novos:**
  - `src/pages/admin/FeedbackAnalytics.tsx`
  - `src/components/admin/feedback/FeedbackKpiCards.tsx`
  - `src/components/admin/feedback/FeedbackTimelineChart.tsx`
  - `src/components/admin/feedback/CompetencyRankingChart.tsx`
  - `src/components/admin/feedback/AdoptionGauge.tsx`
  - `src/hooks/useFeedbackMetrics.ts`
- **Files modificados:**
  - `src/App.tsx` — rota `/admin/feedback/analytics`
  - `src/components/layout/AppSidebar.tsx`
- **Padrões:** recharts, AppLayout admin
- **Migration aditiva:** `0006c_feedback_metrics_rpc.sql` (segura — apenas SELECT agregado)

## Test Plan
- **Unit:** cálculos (tempo médio, % no prazo) com fixtures
- **Integration:** seedar 30 feedbacks em 3 meses → métricas batem
- **Manual:** admin vê dashboard com dados reais

## Dependencies
- **Depends on:** Stories 5.1, 5.2 (precisa de dados)
- **Pode rodar em paralelo com:** Stories 5.3, 5.4

## Definition of Done
- [ ] AC1-AC8 done
- [ ] Migration `0006c` aplicada (se RPC adotada)
- [ ] Tests passing
- [ ] Lint clean
- [ ] PostHog `feedback_analytics_viewed`
- [ ] Smoke: admin valida métricas batem com SQL ad-hoc
