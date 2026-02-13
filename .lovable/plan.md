
# Integrar Turnover Completo na Visao Geral do RH

## O que muda

### 1. Visao Geral (tab "overview") - Nova estrutura

A aba Visao Geral passara a ter tudo do antigo Turnover integrado, com o layout reorganizado:

1. **HRStats** (mantido no topo como esta)
2. **Cards de Turnover** (4 cards: Taxa Turnover, Tempo Medio, Admissoes, Desligamentos - ja existem)
3. **Graficos de Turnover** (2 graficos lado a lado):
   - Grafico de linhas "Evolucao Mensal" (admissoes vs desligamentos nos ultimos 6 meses)
   - Grafico de barras horizontal "Por Departamento" (ativos vs inativos por departamento)
4. **Sincronizacao Pipefy** (os 2 cards de PipefySyncCard + SyncHistoryList lado a lado, abaixo dos graficos)

### 2. Componente TurnoverOverviewCards

Sera expandido para incluir tambem os 2 graficos (LineChart de evolucao mensal e BarChart por departamento) que existiam no HRTurnoverTab, alem dos 4 cards de metricas.

## Detalhes Tecnicos

### Arquivo modificado: `src/pages/HR.tsx`

- Expandir o componente `TurnoverOverviewCards` para renderizar:
  - Os 4 cards de metricas (ja existem)
  - Os 2 graficos do recharts (LineChart + BarChart) que estavam no `HRTurnoverTab`
- A ordem na tab "overview" fica:
  1. `<HRStats />`
  2. `<TurnoverOverviewCards />` (cards + graficos)
  3. Grid com `<PipefySyncCard />` + `<SyncHistoryList />`

### Sem mudancas em:
- Hooks, dados, backend
- Outras abas (Colaboradores, Organograma, etc.)
- `HRTurnoverTab.tsx` (pode ficar como referencia, nao e mais usado)
