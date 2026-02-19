
# Dashboard Completo - Dados de Toda a Plataforma

## Objetivo
Transformar o Dashboard em um painel executivo completo, puxando dados relevantes de todos os modulos da plataforma: RH, OKRs, Performance, Pesquisas (NPS/GPTW), Gamificacao, Acoes e Reconhecimentos.

## Novo Layout do Dashboard

### Estrutura final (de cima para baixo):

1. **Hero Welcome + Quick Actions** (ja existem, mantidos)
2. **4 Stat Cards clicaveis** (ja existem, mantidos)
3. **Shortcut Cards** (ja existem, mantidos)
4. **NOVO - Resumo de OKRs por Status** (card com mini barras de progresso por status: on_track, attention, risk, overdue + total de objetivos)
5. **NOVO - Performance e Pesquisas (grid 2 colunas)**:
   - Card NPS Score (gauge visual com score atual, promotores/detratores/passivos)
   - Card Performance (ciclos ativos, avaliacoes pendentes, taxa de conclusao)
6. **Engajamento Mensal** (grafico existente, mantido)
7. **NOVO - Acoes da Semana** (card com resumo do kanban: quantas todo/doing/done/blocked desta semana)
8. **NOVO - Headcount Resumido** (mini sparkline com evolucao dos ultimos 12 meses + indicador de crescimento)
9. **Atividade Recente** (existente, mantido)
10. **Painel lateral Insights** (existente, mantido com adicionais)
    - Adicionar: Gamificacao do usuario (nivel atual + pontos + progresso para proximo nivel)
    - Adicionar: Turnover Rate resumido (mini card)

## Detalhes Tecnicos

### 1. Novo hook: `src/hooks/useDashboardFullStats.ts`
Hook consolidado que busca dados de todos os modulos em paralelo:
- **OKRs**: Query `objectives` agrupando por `auto_status` (on_track, attention, risk, overdue, completed)
- **NPS**: Query a pesquisa NPS mais recente ativa/completada + suas respostas para calcular o NPS score
- **Performance**: Query `performance_cycles` ativos + `performance_evaluations` pendentes e completadas
- **Acoes**: Query `actions` da semana atual agrupando por status (todo, doing, done, blocked)
- **Turnover**: Reutiliza logica do `useHRTurnover` para pegar apenas o turnoverRate
- **Headcount**: Query simplificada de `company_memberships` para sparkline dos ultimos 12 meses
- **Gamificacao**: Query pontos do usuario atual para exibir no painel lateral

Todas as queries serao feitas em paralelo com `Promise.all` para performance.

### 2. Novos componentes internos em `src/pages/Index.tsx`

**`OKRStatusSummary`**
- Card com 5 indicadores visuais (bolinhas coloridas + contagem): On Track (verde), Atencao (amarelo), Risco (vermelho), Atrasado (cinza), Concluido (azul)
- Barra de progresso geral mostrando a media de progresso de todos os objetivos ativos
- Link "Ver OKRs" que navega para /objectives

**`NPSPerformanceRow`** (grid 2 colunas)
- Coluna 1 - NPS: Score grande no centro, barra horizontal com cores (verde/amarelo/vermelho) para promotores/passivos/detratores, nome da pesquisa e data
- Coluna 2 - Performance: Cards mini (ciclos ativos, avaliacoes pendentes, taxa conclusao, media geral)

**`WeeklyActionsCard`**
- Card com 4 mini indicadores inline: A fazer (X), Fazendo (X), Feito (X), Bloqueado (X)
- Barra de progresso mostrando % concluido da semana
- Link "Ver Kanban" que navega para /objectives (aba acoes)

**`HeadcountSparkline`**
- Card compacto com um AreaChart pequeno (sparkline) dos ultimos 12 meses
- Badge com % crescimento em 6 meses
- Total atual de colaboradores

**`UserGamificationMini`** (no painel lateral)
- Emoji do nivel + nome do nivel + total de pontos
- Barra de progresso para o proximo nivel
- Link para /gamification

**`TurnoverMini`** (no painel lateral)
- Taxa de turnover com cor (verde se < 10%, amarelo se < 20%, vermelho se >= 20%)
- Tempo medio de casa

### 3. Modificacao: `src/pages/Index.tsx`
- Importar o novo hook `useDashboardFullStats`
- Adicionar os novos componentes na area principal (entre ShortcutCards e EngagementChart)
- Adicionar os widgets mini no painel lateral de Insights
- Manter toda a estrutura existente intacta

### Dependencias de dados (todas ja existem no banco)
- `objectives` (status, auto_status, progress)
- `nps_surveys` + `nps_responses` (score)
- `performance_cycles` + `performance_evaluations` (status, overall_score)
- `actions` (status, week_bucket)
- `company_memberships` (hire_date, status)
- `gamification_points` (points, user_id)

### Nenhuma alteracao em:
- Banco de dados (todas as tabelas ja existem)
- RLS policies
- Hooks existentes (novos hooks separados)
- Componentes existentes do dashboard
