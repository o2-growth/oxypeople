# Story 6.2 — Tópicos colaborativos com drag-and-drop

**Epic:** epic-06-one-on-ones
**Sprint:** 4
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Antes da reunião, líder e liderado preparam pauta. Story habilita CRUD de tópicos vinculados a uma 1:1, com reordenação por drag-and-drop e checkbox "concluído". Cada tópico é visível para AMBAS as partes — não há tópico privado (notas privadas é Story 6.3).

ADR-008 (consequência): Pauta é colaborativa por design — visibilidade única (compartilhada). Nada de "tópicos privados" para evitar confusão com notas.

**Pre-condition:** Story 6.1 entregue (1:1 existe). Migration `0007_one_on_ones.sql` aplicada.

## Acceptance Criteria

### AC1 — Painel de tópicos no detalhe da 1:1
**Given** usuário é parte de uma 1:1 e acessa `/one-on-ones/:id`
**Then** vê painel "Pauta" com tópicos ordenados por `order_index`
**And** input "Adicionar tópico..." sempre visível

### AC2 — Criar tópico
**Given** usuário (parte) digita texto e pressiona Enter
**When** texto entre 1 e 1000 chars (constraint do DB)
**Then** insere em `one_on_one_topics` com `created_by = auth.uid()`, `done = false`, `order_index = max(order_index) + 1`
**And** lista atualiza otimisticamente
**And** evento PostHog `one_on_one_topic_added`

### AC3 — Marcar/desmarcar concluído
**Given** qualquer parte clica checkbox de um tópico
**Then** `done` toggla (mesmo se não foi a autora — policy permite ambas as partes UPDATE)
**And** UI mostra strikethrough quando `done=true`

### AC4 — Editar conteúdo (apenas autora)
**Given** tópico criado por user A
**When** user A clica "Editar"
**Then** pode mudar `content`
**Given** user B (outra parte) clica "Editar"
**Then** botão Editar não aparece (apenas autora)
**And** se forçar via console, UPDATE falha pois RLS permite mas UI valida `created_by === auth.uid()` para campo `content`. Para `done`, ambos podem.

### AC5 — Deletar (apenas autora)
**Given** tópico criado por A
**When** A clica "Deletar"
**Then** linha removida (RLS `Author delete topic` permite)
**Given** B tenta deletar tópico de A
**Then** policy bloqueia, UI mostra toast "Apenas quem criou o tópico pode deletá-lo"

### AC6 — Reordenar com drag-and-drop
**Given** lista com 3+ tópicos
**When** usuário arrasta tópico de pos 3 para pos 1
**Then** UPDATE em batch dos `order_index` afetados
**And** ordem persiste após refresh
**And** evento PostHog `one_on_one_topics_reordered`

### AC7 — Realtime opcional (nice-to-have, não blocker)
**Given** ambas as partes com a página aberta
**When** uma adiciona tópico
**Then** outra vê em < 5s (via Supabase Realtime channel) — se não for trivial, polling de 10s já é suficiente

### AC8 — Acesso restrito
**Given** user X (não-parte, não-admin) força URL `/one-on-ones/:id`
**Then** RLS na 1:1 retorna 0 → página mostra "1:1 não encontrada ou sem acesso"
**And** RLS em `one_on_one_topics` impede listagem

## Technical Notes
- **Migration:** `0007_one_on_ones.sql` — tabela `public.one_on_one_topics`. Colunas: `id, one_on_one_id, created_by, content, done, order_index, created_at, updated_at`
- **Files novos:**
  - `src/pages/OneOnOneDetail.tsx` (página de detalhe — host de tópicos + notas em Story 6.3)
  - `src/components/one-on-ones/TopicsPanel.tsx`
  - `src/components/one-on-ones/TopicItem.tsx`
  - `src/hooks/useOneOnOneTopics.ts`
- **Files modificados:**
  - `src/App.tsx` (rota `/one-on-ones/:id`)
- **Drag-and-drop:** usar `@dnd-kit/core` se já presente; senão usar abordagem simples com setas ↑↓ (não bloquear release por DnD lib)
- **Padrões a seguir:** React Query optimistic updates, react-hook-form para edit inline, sonner toast PT-BR

### RLS Privacy Notes
- `one_on_one_topics` SELECT/INSERT/UPDATE: parties only (verifica via JOIN com `one_on_ones`)
- DELETE: apenas `created_by = auth.uid()`
- Admin NÃO vê tópicos (a policy de `one_on_ones` admite admin, mas a de `one_on_one_topics` NÃO inclui admin) — isto é intencional: pauta é privada do par
- Atenção: ao mover/reordenar, validar todas as linhas atualizadas pertencem à mesma 1:1 (sanity client-side)

## Test Plan
- **Manual:** adicionar 3 tópicos, marcar 1 done, reordenar, deletar
- **RLS:** user fora da 1:1 não consegue listar tópicos
- **RLS:** user B tenta deletar tópico criado por A → erro

## Dependencies
- Story 6.1 (precisa de 1:1 para hospedar tópicos)
- Bloqueia: nenhuma (paralela com 6.3)

## Definition of Done
- [ ] AC1-AC8 done
- [ ] PR reviewed
- [ ] RLS smoke test
- [ ] Evento `one_on_one_topic_added` PostHog
- [ ] Drag-and-drop OU reorder por setas funcionando
