# Story 3.3 — Gráfico de evolução do Pulse com segmentação

**Epic:** epic-03-pulse-survey
**Sprint:** 3
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Admin precisa enxergar a tendência (longitudinal) do clima/eNPS para tomar decisão. Story entrega tela `/admin/pulse-surveys/:id/analytics` com gráfico de linha (média por período) usando `recharts`, filtros por departamento/time, e cálculo correto de eNPS quando aplicável. Sem isso, a Pulse vira "dados parados".

## Acceptance Criteria

### AC1 — Tela de analytics por pulse
**Given** admin clica em "Ver resultados" na lista de Pulse Surveys
**When** abre `/admin/pulse-surveys/:id/analytics`
**Then** vê:
- Header com nome/pergunta/frequência
- Card "Resposta atual" — N respostas no período corrente / X esperadas (=membros do alvo) → response rate %
- Gráfico de linha — eixo X = `period_start` (formatado), eixo Y = média (1-5 / 0-10 / 1-5 emoji)
- Tabela com últimas 12 semanas/quinzenas/meses (period_start, # respostas, média, % comentários)

### AC2 — Filtros
**Given** tela de analytics
**Then** filtros disponíveis (multi-select):
- Departamento
- Time
- Período (intervalo de datas: últimos 4, 12, 26, 52 períodos)
**And** ao mudar filtro, gráfico e tabela atualizam (React Query refetch com novo queryKey)

**Restrição privacidade:** se o filtro resulta em < 5 respondentes únicos, mostrar mensagem "Amostra muito pequena para preservar anonimato (mínimo 5 respondentes)" e ocultar o gráfico — **mandatório se `pulse_surveys.anonymous = true`**.

### AC3 — Cálculo de eNPS
**Given** `question_type = enps_0_10`
**Then** Y do gráfico mostra **eNPS** (não a média): `eNPS = (% promotores 9-10) - (% detratores 0-6)` — varia entre -100 e +100
**And** card "Resposta atual" mostra eNPS calculado, com cor: vermelho < 0, amarelo 0-30, verde > 30
**And** tabela tem colunas extras: `% Promotores`, `% Passivos`, `% Detratores`

### AC4 — Cálculo mood_emoji
**Given** `question_type = mood_emoji`
**Then** gráfico mostra média (1-5) E gráfico de barras empilhado da distribuição de emojis por período

### AC5 — Comentários (drilldown)
**Given** admin clica em ponto do gráfico (período X)
**Then** abre drawer lateral com lista de comentários daquele período (`comment IS NOT NULL`)
**And** se `pulse_surveys.anonymous = true` → mostra apenas `comment`, sem nome
**And** se não anônimo → mostra nome do usuário e avatar

### AC6 — Hook agregação
**Given** novo hook `usePulseAnalytics(pulseId, filters)` 
**Then** faz query agregada (Supabase RPC ou SELECT com aggregate)
**And** queryKey `["pulse-analytics", pulseId, filters]`
**And** retorna `{ periods: [{ periodStart, count, avg, breakdown? }], comments: [], responseRate, totalEligible }`

### AC7 — RLS
**Given** policy `Users see own pulse responses`
**Then** admin consegue ler todas as respostas via subquery em `pulse_surveys.company_id` + `is_company_admin`
**And** member regular tentando GET retorna apenas suas próprias respostas (não usa esta tela)

### AC8 — Empty state
**Given** pulse sem nenhuma resposta ainda
**Then** tela mostra "Nenhuma resposta ainda. Aguarde o primeiro envio." + CTA "Voltar para lista"

## Technical Notes
- **Migration:** nenhuma nova; usa `pulse_responses` e join com `users`/`departments`/`teams`
- **RPC sugerida (mais performante):** criar `get_pulse_aggregates(pulse_id uuid, dept_ids uuid[], team_ids uuid[], period_from date)` retornando série temporal — adicionar em migration aditiva nova `0004b_pulse_analytics_rpc.sql` (apenas CREATE FUNCTION, aditivo, seguro). Marca SECURITY INVOKER para honrar RLS.
- Alternativa MVP: query direta com `group_by date_trunc(period_start)` no Supabase JS — aceitar custo
- **Files novos:**
  - `src/pages/admin/PulseAnalytics.tsx`
  - `src/components/admin/pulse/PulseLineChart.tsx` (recharts `<LineChart>`)
  - `src/components/admin/pulse/PulseDistributionChart.tsx` (recharts `<BarChart>` empilhado)
  - `src/components/admin/pulse/PulseFilters.tsx`
  - `src/components/admin/pulse/PulseCommentsDrawer.tsx`
  - `src/hooks/usePulseAnalytics.ts`
  - `src/lib/pulse/enpsCalc.ts` (util puro: array de scores → `{ promoters, passives, detractors, enps }`)
- **Files modificados:**
  - `src/App.tsx` — rota `/admin/pulse-surveys/:id/analytics`
  - `src/components/admin/pulse/PulseSurveyList.tsx` — botão "Ver resultados"
- **Padrões:** `recharts`, AppLayout admin, React Query, sonner

## Test Plan
- **Unit:** `enpsCalc` — array `[0,5,7,9,10]` → eNPS = (2/5*100) - (2/5*100) = 0
- **Unit:** filtro com < 5 respondentes retorna `{ blocked: true }` quando anonymous
- **Integration:** criar pulse + 10 respostas em 3 períodos → tela mostra 3 pontos no gráfico
- **Manual:** alternar filtro de departamento e ver gráfico atualizar; clicar ponto e ver drawer com comentários

## Dependencies
- **Depends on:** Story 3.2 (precisa de respostas reais para validar)
- **Pode rodar em paralelo com:** Story 3.4

## Definition of Done
- [ ] AC1-AC8 done
- [ ] Tests passing
- [ ] Lint clean
- [ ] Smoke test admin com 4+ semanas de dados
- [ ] PostHog `pulse_analytics_viewed { pulse_survey_id }`
- [ ] Privacidade: filtro com < 5 respondentes em pulse anônimo é bloqueado (verificado em manual)
