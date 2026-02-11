

## Expansao Completa do Modulo de RH

A pagina de RH atualmente tem apenas estatisticas basicas e sincronizacao Pipefy. Vamos transforma-la em um hub completo de gestao de recursos humanos com abas dedicadas.

---

### Estrutura de Abas

A pagina `/hr` passara a ter as seguintes abas:

1. **Visao Geral** (atual) - Stats + Pipefy Sync
2. **Colaboradores** - Quadro completo com tabela, filtros e cards
3. **Turnover** - Dashboard com graficos de rotatividade
4. **Calendario** - Eventos de RH (aniversarios, experiencia, contratos)
5. **Relatorios** - Exportacao CSV de dados de RH

---

### 1. Aba Colaboradores (Quadro de Colaboradores)

Reutilizando a logica ja existente na pagina Pessoas (`src/pages/People.tsx`), criaremos um componente dedicado:

**Novo arquivo: `src/components/hr/HRCollaboratorsTab.tsx`**
- Tabela pesquisavel com filtros por departamento, status e tipo de contratacao (CLT, PJ, Estagio, etc.)
- Visualizacao alternativa em cards (como na pagina Pessoas)
- Colunas: Nome, Cargo, Departamento, Tipo Contratacao, Data Admissao, Status
- Acoes de admin: ativar/desativar colaborador
- Reutiliza hooks `usePeopleList`, `usePeopleStats`, `useDepartmentOptions`

**Novo arquivo: `src/components/hr/HRCollaboratorsFilters.tsx`**
- Filtros especificos de RH: departamento, status, tipo de contratacao, busca textual

---

### 2. Aba Turnover (Dashboard de Rotatividade)

**Novo arquivo: `src/components/hr/HRTurnoverTab.tsx`**
- Cards de metricas: taxa de turnover mensal, tempo medio de permanencia, admissoes vs desligamentos
- Grafico de linha (Recharts) mostrando evolucao mensal de admissoes e desligamentos
- Grafico de barras por departamento
- Dados calculados a partir de `company_memberships` (campos `hire_date`, `status`, `joined_at`)

**Novo hook: `src/hooks/useHRTurnover.ts`**
- Consulta `company_memberships` agrupando por mes: contagem de `hire_date` (admissoes) e membros com `status = 'inactive'` (desligamentos)
- Calculo de taxa de turnover: `(desligamentos / total ativos) * 100`
- Tempo medio de permanencia baseado na diferenca entre `hire_date` e data atual (ou data de inativacao)

---

### 3. Aba Calendario de Eventos

**Novo arquivo: `src/components/hr/HRCalendarTab.tsx`**
- Lista cronologica dos proximos eventos de RH
- Tipos de evento com icones coloridos:
  - Aniversarios (dados de `users.birth_date`)
  - Fim de periodo de experiencia (90 dias apos `hire_date`)
  - Vencimento de contratos temporarios (baseado em `employment_type = 'Temporario'`)
- Filtro por tipo de evento e periodo (proxima semana, proximo mes)
- Visual em timeline/lista agrupada por data

**Novo hook: `src/hooks/useHRCalendar.ts`**
- Combina dados de `users.birth_date` e `company_memberships.hire_date`
- Calcula datas de fim de experiencia (hire_date + 90 dias)
- Ordena todos os eventos cronologicamente

---

### 4. Aba Relatorios e Exportacao

**Novo arquivo: `src/components/hr/HRReportsTab.tsx`**
- Cards de relatorios disponiveis:
  - **Headcount por Departamento**: tabela + exportacao CSV
  - **Admissoes e Desligamentos**: por periodo selecionavel
  - **Dados Demograficos**: distribuicao por tipo de contratacao
- Botao de exportacao CSV para cada relatorio
- Funcao utilitaria para gerar CSV no client-side

**Novo arquivo: `src/lib/csvExport.ts`**
- Funcao generica para converter array de objetos em CSV e disparar download

---

### 5. Alteracao na Pagina Principal

**Arquivo: `src/pages/HR.tsx`**
- Adicionar sistema de abas (`Tabs` do shadcn)
- Aba "Visao Geral": conteudo atual (HRStats + PipefySyncCard + SyncHistoryList)
- Aba "Colaboradores": `HRCollaboratorsTab`
- Aba "Turnover": `HRTurnoverTab`
- Aba "Calendario": `HRCalendarTab`
- Aba "Relatorios": `HRReportsTab`

---

### Detalhes Tecnicos

**Banco de dados**: Nenhuma alteracao necessaria. Todos os dados ja existem nas tabelas `company_memberships`, `users` e `departments`.

**Hooks reutilizados**:
- `usePeopleList` / `usePeopleStats` - lista e estatisticas de colaboradores
- `useDepartmentOptions` - lista de departamentos
- `useUserBirthdays` - datas de aniversario

**Novos hooks**:
- `useHRTurnover` - metricas de rotatividade
- `useHRCalendar` - eventos proximos de RH

**Bibliotecas ja instaladas utilizadas**:
- `recharts` para graficos de turnover
- `date-fns` para calculos de datas
- shadcn/ui (`Tabs`, `Table`, `Card`, `Badge`, `Button`, `Select`)

**Arquivos criados** (8 novos):
1. `src/components/hr/HRCollaboratorsTab.tsx`
2. `src/components/hr/HRCollaboratorsFilters.tsx`
3. `src/components/hr/HRTurnoverTab.tsx`
4. `src/components/hr/HRCalendarTab.tsx`
5. `src/components/hr/HRReportsTab.tsx`
6. `src/hooks/useHRTurnover.ts`
7. `src/hooks/useHRCalendar.ts`
8. `src/lib/csvExport.ts`

**Arquivos modificados** (1):
1. `src/pages/HR.tsx` - reestruturacao com abas

