# Story 6.3 — Notas com 3 visibilidades (CRÍTICA — RLS)

**Epic:** epic-06-one-on-ones
**Sprint:** 4
**Status:** Approved (RLS GATED)
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Story mais sensível do produto inteiro. Cada parte de uma 1:1 pode escrever notas com 1 de 3 visibilidades:

- `shared` — ambos veem
- `private_leader` — APENAS a líder vê (autora obrigatoriamente é a líder)
- `private_member` — APENAS o liderado vê (autora obrigatoriamente é o liderado)

**Vazamento de nota privada = quebra de confiança total da ferramenta inteira.** Não há segunda chance.

ADR-008 (consequência): Visibilidade fica em coluna `visibility` da própria nota, controlada por uma única policy SELECT que combina `visibility` com `auth.uid()`. NÃO usar tabelas separadas (mais fácil errar) e NÃO confiar em filtro client-side.

**Pre-condition:** Story 6.1 entregue. Migration `0007_one_on_ones.sql` aplicada COM as policies de `one_on_one_notes` (verificar `Notes visibility by role` existe).

## Acceptance Criteria

### AC1 — Painel de notas no detalhe da 1:1
**Given** usuário (parte) acessa `/one-on-ones/:id`
**Then** vê painel "Notas" com 3 abas: "Compartilhadas", "Minhas notas privadas"
**And** se for líder, aba "Minhas notas privadas" mostra `visibility='private_leader'` SEU
**And** se for membro, aba "Minhas notas privadas" mostra `visibility='private_member'` SEU

### AC2 — Criar nota compartilhada
**Given** usuário (parte) escreve em "Adicionar nota" com toggle "Compartilhada"
**When** submete (1-10000 chars)
**Then** INSERT com `visibility='shared'`, `author_id = auth.uid()`
**And** ambas as partes veem após refresh
**And** evento PostHog `one_on_one_note_created` com `{visibility: 'shared'}`

### AC3 — Criar nota privada — líder
**Given** usuário é `leader_id` da 1:1 e seleciona "Privada (só eu vejo)"
**When** submete
**Then** INSERT com `visibility='private_leader'`, `author_id = leader_id`
**And** WITH CHECK aceita (líder + visibility correta)
**And** evento PostHog `one_on_one_note_created` com `{visibility: 'private_leader'}`

### AC4 — Criar nota privada — membro
**Given** usuário é `member_id` e seleciona "Privada (só eu vejo)"
**When** submete
**Then** INSERT com `visibility='private_member'`, `author_id = member_id`
**And** WITH CHECK aceita

### AC5 — UI nunca permite estado inválido
**Given** UI em modo "criar nota privada"
**Then** o `visibility` enviado SEMPRE corresponde ao papel do user na 1:1 (frontend infere). Nunca enviar visibility cruzada (ex: líder enviando `private_member`)
**And** se backend rejeitar (defesa em profundidade), toast "Não foi possível salvar nota — tente novamente"

### AC6 — Editar nota (autora apenas)
**Given** usuário criou uma nota
**When** clica "Editar"
**Then** pode alterar `content`. NÃO pode alterar `visibility` (locked) — para mudar, deletar e recriar
**And** policy `Author updates own note` permite

### AC7 — Deletar nota (autora apenas)
**Given** autora da nota
**When** clica "Deletar"
**Then** confirmação modal "Excluir esta nota? Não pode ser desfeito"
**And** DELETE (policy `Author deletes own note`)

### AC8 — Indicador visual de privacidade
**Given** lista de notas
**Then** notas privadas têm badge "🔒 Privada" e cor diferente
**And** notas compartilhadas têm ícone "👥 Compartilhada"
**And** copy clara: "Só você vê esta nota" no hover

### AC9 — Admin NÃO vê notas privadas
**Given** usuário admin da company que NÃO é parte da 1:1
**When** acessa por força bruta `/one-on-ones/:id`
**Then** vê a 1:1 (RLS de `one_on_ones` admite admin) MAS aba "Notas" mostra apenas `shared` (e mesmo assim apenas se houver — admin NÃO está coberto pela policy `Notes visibility by role` para nenhuma visibility, então retorna 0)
**And** ⚠️ NOTA: a policy SELECT atual NÃO admite admin para nenhuma visibility — isto é intencional. Admin pode ver que houve uma 1:1 mas NÃO o conteúdo das notas. Documentar este comportamento na UI ("Conteúdo das notas é privado entre as partes")

## Technical Notes
- **Migration:** `0007_one_on_ones.sql` — tabela `public.one_on_one_notes`. Colunas: `id, one_on_one_id, author_id, content, visibility ('shared'|'private_leader'|'private_member'), created_at, updated_at`
- **Files novos:**
  - `src/components/one-on-ones/NotesPanel.tsx`
  - `src/components/one-on-ones/NoteItem.tsx`
  - `src/components/one-on-ones/NoteForm.tsx`
  - `src/hooks/useOneOnOneNotes.ts`
- **Files modificados:**
  - `src/pages/OneOnOneDetail.tsx` (host das notas)
- **Padrões a seguir:** React Query keys `["one-on-one-notes", oneOnOneId]`, react-hook-form + Zod (validar `content` 1-10000 chars), sonner PT-BR

### RLS Privacy Notes (CRÍTICA — GATE DE MERGE)
- Policy SELECT `Notes visibility by role` é a peça mais sensível do app:
  - `shared` → visível a `leader_id` E `member_id`
  - `private_leader` → visível a `leader_id` SE `author_id = leader_id`
  - `private_member` → visível a `member_id` SE `author_id = member_id`
- Policy INSERT `Parties create notes with role-matched visibility`:
  - `author_id = auth.uid()` obrigatório
  - Visibility deve casar com papel do user na 1:1
- Admin NÃO está na policy SELECT. Documentar.
- ⚠️ NÃO depender de filtro client-side. RLS é a fonte da verdade.
- Antes do merge, **executar os 5 testes obrigatórios** descritos no Epic 6 (T1-T5)

## Test Plan — OBRIGATÓRIO (gate de merge)
Setup: 1:1 entre L (leader) e M (member). Admin = A. User externo = X.

| # | Ação | L | M | A | X |
|---|---|---|---|---|---|
| T1 | L cria `private_leader` | ✅ vê | ❌ não vê | ❌ não vê | ❌ |
| T2 | M cria `private_member` | ❌ não vê | ✅ vê | ❌ não vê | ❌ |
| T3 | L cria `shared` | ✅ | ✅ | ❌ (policy não cobre) | ❌ |
| T4 | L tenta INSERT `private_member` | ❌ WITH CHECK rejeita | — | — | — |
| T5 | X tenta SELECT qualquer nota | — | — | — | ❌ retorna VAZIO |

**Esses 5 testes são GATE para mergear a story.** Documentar resultado no PR.

## Dependencies
- Story 6.1 (1:1 existe)
- Bloqueia: 6.4 (histórico mostra count de notas — precisa do tipo)

## Definition of Done
- [ ] AC1-AC9 done
- [ ] PR reviewed
- [ ] **5 testes RLS T1-T5 executados e documentados no PR**
- [ ] Eventos PostHog disparando com `visibility` correto
- [ ] Copy clara em PT-BR sobre privacidade
- [ ] Aprovado por @architect (Aria) antes de merge — devido sensibilidade
