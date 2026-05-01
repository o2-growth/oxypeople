# Story 6.4 — Histórico de 1:1s anteriores

**Epic:** epic-06-one-on-ones
**Sprint:** 4
**Status:** Approved
**Estimate:** S
**Priority:** P1
**Owner:** unassigned (Dex)

## Context
Para dar continuidade entre reuniões, cada parte precisa ver rapidamente reuniões anteriores com a mesma contraparte: data, status, # de tópicos, # de notas compartilhadas (não privadas, para preservar privacidade).

**Pre-condition:** Stories 6.1, 6.2, 6.3 entregues. Migration `0007` aplicada.

## Acceptance Criteria

### AC1 — Aba "Histórico" em `/one-on-ones`
**Given** lista principal de 1:1s
**Then** existem 3 abas: "Próximas", "Em andamento (hoje)", "Histórico"
**And** "Histórico" lista 1:1s com `status IN ('completed','canceled','no_show')` ordenadas por `scheduled_at DESC`

### AC2 — Painel "Anteriores com [Nome]" no detalhe
**Given** usuário em `/one-on-ones/:id` (1:1 ativa entre L e M)
**Then** sidebar mostra "Anteriores com [nome da contraparte]" — últimas 5 reuniões finalizadas
**And** cada item mostra: data, status (badge), # tópicos, # notas compartilhadas

### AC3 — Contagem de notas respeita visibilidade
**Given** card de histórico
**When** calcula # de notas
**Then** **APENAS** notas `shared` são contadas. Notas privadas da contraparte JAMAIS aparecem na contagem
**And** se for o autor da nota privada, sua própria contagem privada aparece em "Minhas notas privadas: N" separadamente

### AC4 — Click em item leva ao detalhe
**Given** card de 1:1 anterior
**When** clica
**Then** navega para `/one-on-ones/:id` daquela
**And** RLS continua aplicando (notas privadas da contraparte invisíveis)

### AC5 — Filtros simples
**Given** lista de histórico
**Then** existe filtro por contraparte (combobox) e por status (multi-select)
**And** input de busca por texto que filtra por nome da contraparte

### AC6 — Performance
**Given** usuário com 50+ 1:1s no histórico
**When** acessa lista
**Then** paginação ou virtualização (React Query infinite OU limit 25 com "Carregar mais")
**And** índice `idx_one_on_ones_leader` e `idx_one_on_ones_member` já cobrem o filtro

### AC7 — Empty state
**Given** usuário sem 1:1s no histórico
**Then** mostra ilustração + texto "Sem reuniões anteriores ainda. Suas 1:1s aparecerão aqui após concluídas."

## Technical Notes
- **Migration:** `0007_one_on_ones.sql` — sem mudanças. Reusa `one_on_ones`, `one_on_one_topics`, `one_on_one_notes`
- **Files novos:**
  - `src/components/one-on-ones/HistoryTab.tsx`
  - `src/components/one-on-ones/PreviousMeetings.tsx` (sidebar do detalhe)
  - `src/hooks/useOneOnOneHistory.ts`
- **Files modificados:**
  - `src/pages/OneOnOnes.tsx` (3 tabs)
  - `src/pages/OneOnOneDetail.tsx` (sidebar)
- **Query de # de notas compartilhadas:**
  ```sql
  SELECT one_on_one_id, COUNT(*) FILTER (WHERE visibility = 'shared') AS shared_count
  FROM one_on_one_notes WHERE one_on_one_id = ANY(...) GROUP BY one_on_one_id;
  ```
  RLS já filtra notas privadas — se feito como user logado, o `COUNT(*)` exclui linhas que ele não vê. PERFEITO. Não tentar contornar.

### RLS Privacy Notes
- Crítico: o COUNT na sidebar usa policies do user logado. Se contraparte criou nota privada, ela é invisível e NÃO entra no COUNT — isso é o comportamento desejado
- NUNCA usar service role aqui. NUNCA agregar count com bypass de RLS
- Se precisar de count "tudo" para admin (futuro), criar view materializada COM RLS, não query bruta

## Test Plan
- **Manual:** completar 3 1:1s com mesma contraparte → ver histórico
- **RLS:** L vê count de notas shared apenas; suas privadas separadas; M's privadas invisíveis
- **Manual:** filtrar por contraparte e por status

## Dependencies
- Stories 6.1, 6.2, 6.3
- Bloqueia: nenhuma

## Definition of Done
- [ ] AC1-AC7 done
- [ ] PR reviewed
- [ ] Counts respeitam RLS (notas privadas da contraparte invisíveis)
- [ ] Performance OK com 50+ registros
- [ ] Empty state em PT-BR
