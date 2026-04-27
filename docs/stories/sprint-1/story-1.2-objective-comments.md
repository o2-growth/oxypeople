# Story 1.2 — Comentários em objetivos e KRs

**Epic:** epic-01-okrs-hardening
**Sprint:** 1
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
ADR-003: nova tabela `objective_comments` para colaboração contextual em objetivos e KRs (não reutiliza `comments` do feed para evitar acoplamento polimórfico).

## Acceptance Criteria

### AC1 — Aba "Discussão" no detalhe do objetivo
**Given** usuário membro da empresa abre `ObjectiveDetail`
**Then** vê aba "Discussão" com contador de comentários

### AC2 — Postar comentário
**Given** input de texto na aba
**When** usuário escreve >0 e <5000 chars + enter (ou botão)
**Then** comentário é criado no DB
**And** aparece imediatamente no thread (optimistic update OU realtime)
**And** evento PostHog `objective_comment_posted`

**Given** input vazio
**Then** botão disabled

### AC3 — Comentar em KR específico
**Given** usuário clica em "Comentar" dentro do card de um KR
**Then** input mostra "Sobre KR: [titulo]"
**And** comentário criado tem `key_result_id` preenchido
**And** thread separa comentários por escopo (objetivo vs KR)

### AC4 — Threads aninhadas (1 nível)
**Given** comentário existente
**When** usuário clica "Responder"
**Then** input aparece abaixo
**And** comentário criado tem `parent_comment_id` apontando ao pai
**And** UI renderiza identado (1 nível só, sem aninhamento profundo)

### AC5 — Editar comentário próprio
**Given** comentário do próprio usuário
**When** clica "Editar"
**Then** input editável aparece in-place
**And** ao salvar, atualiza no DB
**And** badge "(editado)" aparece com timestamp em hover

### AC6 — Deletar comentário (autor ou admin)
**Given** autor ou admin
**When** clica "Excluir"
**Then** modal de confirmação
**And** soft delete (CASCADE remove respostas)
**And** RLS impede delete por outros

### AC7 — Realtime updates
**Given** 2 usuários abertos no mesmo objetivo
**When** A posta um comentário
**Then** B vê em <2s sem recarregar (Supabase realtime)

### AC8 — @Menções (versão simples)
**Given** usuário digita `@`
**When** começa autocomplete
**Then** lista usuários da empresa (reusar `useMentionSuggestions`)
**And** ao mencionar, cria notification para o mencionado

## Technical Notes
- **Migration:** `0003_okr_hardening.sql` (tabela `objective_comments` + RLS + realtime publication)
- **Files novos:**
  - `src/components/objectives/ObjectiveCommentsTab.tsx`
  - `src/components/objectives/CommentItem.tsx`
  - `src/hooks/useObjectiveComments.ts`
- **Files modificados:**
  - `src/pages/ObjectiveDetail.tsx` (adicionar tab)
- **Padrão Realtime:** subscription com `filter: objective_id=eq.${id}` (ver `useRealtimeObjective`)
- **Reusar:** `MentionSuggestions` (já existe)

## Test Plan
- **RLS:** member de outra empresa NÃO consegue SELECT comentários
- **Realtime:** abrir 2 abas → comentar em 1 → ver em outra <2s
- **CASCADE:** deletar parent → respostas somem
- **Edição:** content updated_at e edited_at refletem

## Dependencies
- Migration 0003 aplicada
- Story 1.7 (enum alinhado, evita rebase)

## Definition of Done
- [ ] AC1-AC8 done
- [ ] Realtime testado com 2 abas
- [ ] Notification de menção chega
- [ ] PostHog rastreia `objective_comment_posted`
- [ ] PR mergeado
