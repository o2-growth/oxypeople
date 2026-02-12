
# Redesign Visual OKRs -- Estilo Monday.com Board

## Problema
A interface atual de OKRs esta visualmente pobre comparada com o design system Monday.com que voce quer. Falta a densidade visual, as colunas com cores solidas, os headers de grupo coloridos e a estrutura de "board" profissional.

## Referencia Visual (Monday.com)
- Header com titulo bold + descricao + toolbar (Search, Filter, Sort, Person)
- Grupos collapsiveis com borda lateral colorida e header com nome do grupo
- Cada linha e uma row de tabela com colunas de largura fixa
- Cells como Status, Priority, Timeline tem fundo colorido solido (verde, amarelo, laranja, etc)
- Avatares circulares nas colunas de Person
- Linha "+ Add" ao final de cada grupo
- Footer do grupo com agregacao (totais, ranges de data)

## Plano de Implementacao

### 1. Redesign do ObjectiveTreeNode (componente principal das linhas)

Mudancas visuais:
- Aumentar a altura das linhas para `h-10` com melhor espacamento
- **Cells com fundo colorido solido** para Status (verde/amarelo/vermelho/roxo preenchido, texto branco) em vez de badges outline
- **Cells com fundo colorido** para o Tipo (violeta/azul/verde solido)
- **Timeline cell** com fundo colorido mostrando range de datas
- Progress bar mais grossa (`h-2`) com cores vivas
- Remover badges outline e usar pills preenchidas como Monday
- Menu de 3 pontos sempre visivel (nao so no hover)
- Borda esquerda colorida por tipo (4px solida) em vez do icone

### 2. Redesign do StatusBadge

Mudar de badges outline para **pills com fundo solido** e texto branco:
- On Track: fundo verde `#00c875`
- Atencao: fundo amarelo/dourado `#fdab3d`
- Em Risco: fundo vermelho `#e2445c`
- Sem dados: fundo cinza `#c4c4c4`
- Concluido: fundo azul `#00c875`

### 3. Redesign da pagina Objectives.tsx

- **Remover** o hero-header com gradiente verde (nao e Monday-style)
- Substituir por um **header limpo** com:
  - Titulo "Gestao de Objetivos" em fonte bold escura
  - Subtitulo/descricao em cinza
  - Toolbar: botao "New Item" (verde/primary), Search, Person, Filter, Sort
- **Remover** o Executive Summary cards (muito visual, nao e board-style)
- Mover filtros para a toolbar compacta (inline)
- O container das linhas deve ser uma **tabela sem bordas externas**, fundo escuro (dark mode) ou branco (light)

### 4. Redesign dos Grupos (Departamentos)

- Cada grupo (Q1, Marketing, etc.) tem:
  - **Header com barra lateral colorida** (6px) e cor unica por grupo
  - Icone de collapse (chevron)
  - Nome do grupo em bold
  - **Header de colunas** abaixo do nome do grupo com labels cinza (Subitens, Person, Status, Timeline, Progresso, etc.)
  - Linhas dos objetivos
  - **Footer com "+ Add"** e agregacao (progresso medio, total de itens)

### 5. Novo componente: BoardHeader

Header estilo Monday com:
- Titulo + estrela de favorito
- "Last seen" + "Invite" + "Activity"
- Tabs: Main Table, Timeline, etc. (usar as views existentes: Lista, Mapa, Acoes)
- Toolbar: New Item (primary button), Search, Person, Filter, Sort

### 6. Novo componente: BoardColumnHeaders

Uma linha de headers de colunas mostrando:
- Item (titulo)
- Subitens
- Person
- Status
- Timeline
- Progresso
- Tipo

### 7. Novo componente: GroupFooter

Linha de footer por grupo com:
- Botao "+ Adicionar" alinhado a esquerda
- Agregacoes nas colunas relevantes (progresso medio, count de items)

## Detalhes Tecnicos

### Arquivos a Modificar:
1. **`src/pages/Objectives.tsx`** -- Redesign completo do layout: remover hero, executive summary; adicionar BoardHeader + grupos com column headers
2. **`src/components/objectives/ObjectiveTreeNode.tsx`** -- Redesign das linhas: cells coloridas, borda lateral, novo layout de colunas
3. **`src/components/objectives/StatusBadge.tsx`** -- Mudar para pills com fundo solido e texto branco
4. **`src/components/objectives/ObjectivesContextBar.tsx`** -- Simplificar para toolbar inline estilo Monday

### Novos Arquivos:
5. **`src/components/objectives/BoardHeader.tsx`** -- Header do board com titulo, tabs e toolbar
6. **`src/components/objectives/BoardColumnHeaders.tsx`** -- Headers das colunas da tabela
7. **`src/components/objectives/GroupFooter.tsx`** -- Footer com "+ Add" e agregacoes

### Paleta de Cores (Monday.com cells):
```text
Status:
  on_track  -> bg: #00c875, text: white
  attention -> bg: #fdab3d, text: white
  risk      -> bg: #e2445c, text: white
  no_data   -> bg: #c4c4c4, text: white
  completed -> bg: #00c875, text: white

Tipo:
  strategic   -> bg: #a25ddc (roxo)
  tactical    -> bg: #579bfc (azul)
  operational -> bg: #00c875 (verde)

Priority (se aplicavel):
  Urgent -> bg: #333333, text: white
  High   -> bg: #401694, text: white
  Medium -> bg: #5559df, text: white
  Low    -> bg: #579bfc, text: white

Grupos:
  Q1/CEO        -> #579bfc (azul)
  Marketing     -> #00c875 (verde)
  Comercial     -> #fdab3d (amarelo)
  Growth        -> #a25ddc (roxo)
  Produto       -> #e2445c (vermelho)
```

### Estrutura Visual Final:
```text
+----------------------------------------------------------+
| Gestao de Objetivos                    [New Item] [Search]|
| OKRs hierarquicos                      [Filter] [Sort]   |
+----------------------------------------------------------+
| Main Table | Timeline | Mapa | Acoes                     |
+----------------------------------------------------------+
| v Q1 - CEO (3)                                           |
|   Item    | Person | Status     | Timeline   | Progresso |
|   --------|--------|------------|------------|-----------|
|   Obj A   |  (AV)  | Working on | Jan-Mar    | ===== 65% |
|   Obj B   |  (AV)  | Stuck      | Feb-May    | ==    30% |
|   + Adicionar                                            |
+----------------------------------------------------------+
| v Q1 - Marketing (2)                                     |
|   ...                                                    |
+----------------------------------------------------------+
```

### Sem Mudancas em:
- Logica de dados, hooks, filtros
- Pagina de detalhes do objetivo (`ObjectiveDetail.tsx`)
- Componentes de dialogo (Create, Checkin, etc.)
- Database ou backend
