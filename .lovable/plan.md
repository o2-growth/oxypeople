

## Mural Corporativo - Repensado

O Mural atual ficou com problemas apos a remocao dos posts: a coluna principal fica quase vazia (so avisos fixados), o widget "Em Alta" depende de posts que nao existem mais, e o layout 2/3 + 1/3 nao faz sentido sem um feed.

A proposta e reorganizar como um **painel informativo** em blocos visuais equilibrados.

---

### Problemas atuais

- "Em Alta" (trending topics) busca hashtags de posts que foram deletados - sempre vazio
- Coluna principal so tem avisos fixados (0-3 itens) - pagina vazia
- Layout desproporcional sem conteudo na coluna esquerda

---

### Novo layout proposto

```text
+----------------------------------------------------------+
|  Mural da Empresa                        [+ Novo Evento]  |
|  Eventos, comunicados e o que esta acontecendo             |
+----------------------------------------------------------+
|                                                            |
|  PROXIMOS EVENTOS (carrossel horizontal - mantido)         |
|  | Monthly 15/02 | Happy Hour 20/02 | Town Hall 28/02 |   |
|                                                            |
+----------------------------------------------------------+
|                                                            |
|  [Avisos Fixados]     |  [Mini Calendario]                 |
|  card 1               |  Fev 2026                          |
|  card 2               |  (dias com eventos destacados)     |
|  card 3               |  lista de eventos do dia clicado   |
|                       |                                    |
+----------------------------------------------------------+
|                                                            |
|  [Aniversariantes]  |  [Destaque do Mes]                   |
|  do Mes              |  Top 3 reconhecidos                  |
|  avatar + nome       |  avatar + reconhecimentos            |
|                      |                                      |
+----------------------------------------------------------+
```

O layout passa a ser **blocos em grid responsivo** ao inves de coluna principal + sidebar. Cada secao tem seu espaco visual.

---

### O que muda

**Removido:**
- Widget "Em Alta" (trending topics) do `MonthHighlights.tsx` - dependia de posts que nao existem mais. Sera removido do componente.
- Referencia ao hook `useTrendingTopics` dentro de `MonthHighlights.tsx`

**Modificado:**

1. **`src/pages/Feed.tsx`** - Novo layout em grid:
   - Remove o grid `lg:grid-cols-[1fr_320px]` com sidebar
   - Secao 1: Carrossel de eventos (largura total, mantido)
   - Secao 2: Grid 2 colunas - Avisos Fixados (esquerda) + Mini Calendario (direita)
   - Secao 3: Grid 2 colunas - Aniversariantes (esquerda) + Destaque do Mes (direita)
   - Responsivo: 1 coluna no mobile, 2 no desktop

2. **`src/components/mural/MonthHighlights.tsx`** - Simplificar:
   - Remover completamente a secao "Em Alta" (trending topics)
   - Manter apenas "Destaque do Mes" (top reconhecidos)
   - Remover import de `useTrendingTopics`

**Nenhum arquivo novo. Nenhuma alteracao no banco.**

---

### Detalhes tecnicos

**Feed.tsx** - Estrutura JSX:
- Header (mantido como esta)
- `UpcomingEventsCarousel` em largura total
- `div.grid.grid-cols-1.md:grid-cols-2.gap-6` contendo `PinnedAnnouncements` e `MiniCalendar`
- `div.grid.grid-cols-1.md:grid-cols-2.gap-6` contendo `BirthdaysList` e `MonthHighlights`

**MonthHighlights.tsx** - Remover:
- Import de `useTrendingTopics`, `Badge`, `TrendingUp`
- Todo o bloco do card "Em Alta" (linhas 73-102)
- O componente retorna apenas o card de "Destaque do Mes"

