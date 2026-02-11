

# Melhorias de UX/Design na Pagina de Objetivos

## Problemas Identificados

1. **Excesso de camadas visuais ("caixa dentro de caixa")** -- A barra de contexto tem borda/fundo, o painel de conteudo tem borda/fundo, e cada tree node dentro tambem tem borda/fundo. Isso cria um efeito visual poluido e redundante.

2. **Muito espaco vertical antes do conteudo real** -- O usuario precisa rolar bastante para chegar aos objetivos: hero + 4 cards de resumo + card de desvios + 3 cards de tipo + barra de filtros. Sao quase 2 telas antes de ver os objetivos.

3. **Cards de resumo executivo ocupam espaco demais** -- A linha de 3 cards (Estrategicos/Taticos/Operacionais) repete informacao que ja esta implicita na arvore. Pode ser condensada.

4. **Contraste visual entre secoes** -- A barra de filtros e o painel de conteudo parecem dois blocos brancos iguais empilhados, sem hierarquia visual clara.

---

## Solucao Proposta

### 1. Condensar o Resumo Executivo
- Mover os contadores de tipo (Estrategicos/Taticos/Operacionais) para dentro da linha principal dos 4 cards, substituindo o grid separado de 3 cards por badges inline no card de "Progresso Medio".
- Remover a linha extra de 3 cards, economizando ~80px de altura.

### 2. Remover bordas redundantes dos Tree Nodes
- Os tree nodes ja estao dentro de um painel `bg-card` com borda. Remover a borda individual de cada node e usar apenas um `hover:bg-muted/50` sutil para indicar interatividade.
- Manter a borda apenas nos nodes de nivel 0 (estrategicos) para separar grupos.

### 3. Simplificar a barra de contexto
- Remover a borda e shadow da barra de contexto. Usar apenas `bg-card/80 backdrop-blur-sm rounded-xl p-4` para um visual mais leve que se integra ao fundo sem parecer um "bloco" pesado.

### 4. Melhorar espacamento
- Reduzir o `space-y-8` entre secoes para `space-y-5` na pagina principal.
- Reduzir o padding interno do painel de conteudo.

---

## Detalhes Tecnicos

### Arquivo: `src/components/objectives/ExecutiveSummary.tsx`
- Remover o grid de 3 cards (`grid-cols-3` com Estrategicos/Taticos/Operacionais) nas linhas 155-173.
- Adicionar os contadores como badges compactas dentro do card de "Progresso Medio" ou como uma mini-linha abaixo dos 4 cards principais.

### Arquivo: `src/components/objectives/ObjectiveTreeNode.tsx`
- Linha 129-134: Trocar `border rounded-lg bg-card shadow-sm` por classes mais sutis:
  - Nivel 0: manter `border rounded-lg bg-card shadow-sm`
  - Niveis 1+: usar `rounded-lg hover:bg-muted/30 transition-colors` sem borda nem shadow (ja estao dentro do painel bg-card)

### Arquivo: `src/components/objectives/ObjectivesContextBar.tsx`
- Linha 117: Trocar `bg-card rounded-xl p-4 border border-border/40 shadow-sm` por `bg-muted/30 rounded-xl p-4` para visual mais leve, diferenciando da area de conteudo.

### Arquivo: `src/pages/Objectives.tsx`
- Linha ~144: Reduzir `space-y-8` para `space-y-5`
- Painel de conteudo: manter como esta (bg-card com borda sutil)

