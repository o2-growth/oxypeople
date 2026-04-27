# Story 1.6 — Editar colaboradores no detalhe

**Epic:** epic-01-okrs-hardening
**Sprint:** 1
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Hoje, `objective_collaborators` é populado apenas na criação do objetivo. Não há UI para adicionar/remover/mudar role depois. Story preenche essa lacuna.

## Acceptance Criteria

### AC1 — Aba "Colaboradores" no `ObjectiveDetail`
**Given** usuário com acesso ao objetivo
**Then** vê aba "Colaboradores" com lista atual

### AC2 — Lista mostra avatar, nome, role
**Given** colaboradores existentes
**Then** lista renderiza:
- Avatar
- Nome + cargo
- Badge da role (`contributor` ou `editor`)
- Botão "Remover" (se permitido)

### AC3 — Adicionar colaborador
**Given** owner do objetivo OU admin
**When** clica "Adicionar"
**Then** abre seletor (`MultiPersonSelector` ou novo) com membros da empresa filtrados (não inclui já adicionados)
**And** ao selecionar e confirmar, INSERT em `objective_collaborators` com role default `contributor`
**And** lista atualiza
**And** evento PostHog `objective_collaborator_added`

### AC4 — Mudar role
**Given** colaborador na lista
**When** owner/admin clica no badge da role
**Then** dropdown mostra { contributor, editor }
**And** UPDATE no DB
**And** badge atualiza

### AC5 — Remover colaborador
**Given** owner/admin clica "Remover"
**Then** modal de confirmação
**And** se confirma, DELETE da row
**And** lista atualiza
**And** RLS impede non-owner non-admin de deletar

### AC6 — Notificação ao adicionado
**Given** novo colaborador adicionado
**Then** trigger SQL OU hook cria notification: "Você foi adicionado ao objetivo X como contributor"

### AC7 — Validação: owner não aparece como collaborator
**Given** owner do objetivo
**Then** UI não permite adicioná-lo como collaborator (já é owner)
**And** se já está, mostra rótulo "Owner" sem botão de remoção

### AC8 — Diferença real entre contributor vs editor
**Given** RLS atual de `objectives` permite owner + admin para UPDATE
**Then** **adicionar diferenciação:** editor pode UPDATE também (contributor não)
**Implementação:** ajuste em RLS policy de `objectives` UPDATE: `OR EXISTS (SELECT 1 FROM objective_collaborators WHERE objective_id=... AND user_id=auth.uid() AND role='editor')`

## Technical Notes
- **Migration aditiva opcional** (decidir com Aria): atualizar RLS de `objectives` para considerar `objective_collaborators.role='editor'` no UPDATE. Pode virar migration `0010` se aceito; senão fica como follow-up.
- **Files novos:**
  - `src/components/objectives/CollaboratorsTab.tsx`
  - `src/hooks/useObjectiveCollaborators.ts`
- **Files modificados:**
  - `src/pages/ObjectiveDetail.tsx` (adicionar aba)
- **Reusar:** `MultiPersonSelector` existente

## Test Plan
- **Manual:** owner adiciona, muda role, remove
- **RLS:** colaborador `contributor` tenta UPDATE em objetivo → bloqueado
- **RLS:** colaborador `editor` tenta UPDATE → permitido
- **RLS:** non-collaborator tenta DELETE row → bloqueado

## Dependencies
- Story 1.7 (enum)
- Migration 0003 (não obrigatória aqui — schema antigo já tem `objective_collaborators`)
- Decisão sobre migration adicional para diferenciação editor/contributor (alinhar com Aria)

## Definition of Done
- [ ] AC1-AC8 done
- [ ] Notification chega ao adicionado
- [ ] PR mergeado
- [ ] Documentado no README de OKRs
