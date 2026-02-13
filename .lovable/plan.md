
# Adicionar Graficos LinkedIn-style na Visao Geral do RH

## Novos Graficos

Baseado nas imagens do LinkedIn, vou adicionar 2 novas visualizacoes na Visao Geral, usando dados reais do banco de dados:

### 1. Evolucao do Headcount (Total de Colaboradores ao Longo do Tempo)
- AreaChart com linha suave mostrando a contagem de colaboradores nos ultimos 24 meses
- Indicadores de crescimento: 6 meses, 1 ano e 2 anos (com setas verde/vermelha)
- Mediana do tempo de casa exibida abaixo do grafico
- Tooltip ao passar o mouse mostrando quantidade e variacao percentual vs mes anterior

### 2. Distribuicao por Departamento e Crescimento do Headcount
- Donut chart mostrando a distribuicao atual por departamento (com total no centro)
- Tabela lateral com nome do departamento, crescimento em 6m e 1 ano
- Filtro de departamentos (dropdown multi-select) para selecionar quais exibir

## Layout da Visao Geral (ordem final)

1. HRStats (cards existentes)
2. Cards de Turnover (4 cards existentes)
3. **NOVO** - Evolucao do Headcount (card full-width com AreaChart)
4. **NOVO** - Distribuicao por Departamento (card com donut + tabela de crescimento)
5. Graficos existentes (Evolucao Mensal + Por Departamento - admissoes/desligamentos)
6. Sincronizacao Pipefy

## Detalhes Tecnicos

### Novo hook: `src/hooks/useHeadcountAnalytics.ts`
- Query `company_memberships` com `hire_date` e `status`
- Calcula headcount mensal retroativo (ultimos 24 meses) contando membros ativos em cada ponto no tempo
- Calcula crescimento percentual em 6m, 1a, 2a
- Calcula mediana do tempo de casa
- Agrupa por departamento para o donut chart com crescimento por periodo

### Modificacao: `src/pages/HR.tsx`
- Adicionar 2 novos componentes internos:
  - `HeadcountEvolutionChart` - AreaChart com badges de crescimento
  - `DepartmentDistributionChart` - PieChart (donut) + tabela de crescimento
- Inserir entre os cards de turnover e os graficos de evolucao mensal existentes
- Importar `AreaChart, Area, PieChart, Pie, Cell` do recharts

### Dados utilizados (todos reais do banco)
- `company_memberships.hire_date` para calcular quando cada pessoa entrou
- `company_memberships.status` + `updated_at` para saber quem saiu e quando
- `departments.name` e `departments.color` para o donut chart
- Calculo retroativo: para cada mes, contar quantos membros estavam ativos naquele ponto
