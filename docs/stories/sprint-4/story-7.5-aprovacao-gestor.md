# Story 7.5 — Aprovação do gestor

**Epic:** epic-07-pdi
**Sprint:** 4
**Status:** Approved
**Estimate:** S
**Priority:** P1
**Owner:** unassigned (Dex)

## Context
Quando um liderado ativa o PDI (ou após edições significativas), o gestor recebe pedido de aprovação. Ao aprovar, `pdi_plans.approved_at` recebe timestamp. Aprovação é "carimbo de comprometimento mútuo" — não bloqueia execução, mas sinaliza alinhamento.

**Pre-condition:** Stories 7.1 e 7.3 entregues. Migration `0008` aplicada (`approved_at` e `manager_id` em `pdi_plans`).

## Acceptance Criteria

### AC1 — Liderado pede aprovação
**Given** PDI ativo com `manager_id` definido e `approved_at IS NULL`
**Then** botão "Solicitar aprovação do gestor" visível para o owner
**When** clica
**Then** registra evento (notification ou tabela própria de "pending approvals" — se sem tabela, basta evento + email/in-app banner)
**And** evento PostHog `pdi_approval_requested`

### AC2 — Gestor vê pedidos
**Given** Bruno tem pedidos pendentes de seus liderados
**When** acessa `/pdi/team` (Story 7.2)
**Then** badge "X aprovações pendentes" no topo
**And** filtro "Aguardando minha aprovação"

### AC3 — Aprovar PDI
**Given** Bruno em PDI do Camila com `approved_at IS NULL`
**Then** botão "Aprovar PDI" visível (apenas se `auth.uid() = manager_id`)
**When** clica e confirma
**Then** UPDATE `approved_at = now()`
**And** badge "✅ Aprovado em [data] por [Bruno]" no header do PDI
**And** evento PostHog `pdi_approved`

### AC4 — Reprovar com comentário (devolver pra ajustes)
**Given** Bruno
**Then** botão "Solicitar ajustes" com textarea obrigatório (1-1000 chars)
**When** envia
**Then** `approved_at` continua NULL
**And** comentário registrado (em campo novo OU usar tabela `pdi_review_comments` — se complexidade alta, usar campo `description` adicional ou tabela auxiliar como melhoria; MVP: registrar como notificação para o liderado)
**And** evento PostHog `pdi_changes_requested`

### AC5 — Re-aprovação após edições significativas
**Given** PDI já aprovado e owner faz edição grande (adicionar competência, mudar título, mudar target_date)
**When** salva
**Then** UI pergunta "Mudanças significativas. Deseja revogar aprovação e pedir novamente?"
**And** se sim, UPDATE `approved_at = NULL`
**And** evento `pdi_approval_revoked` com `{reason: 'major_edit'}`
**And** Edições menores (descrição, status de ações) NÃO revogam aprovação

### AC6 — Não-gestor não pode aprovar
**Given** user X tenta forçar UPDATE `approved_at` via API
**Then** policy `Owner or manager updates PDI` permite UPDATE em geral, mas o UI/business logic só permite mudar `approved_at` se `auth.uid() = manager_id`
**And** ⚠️ Defensa em profundidade: criar trigger `BEFORE UPDATE` que rejeita mudança em `approved_at` se `auth.uid() <> NEW.manager_id` (adicionar em migration adicional `0011_pdi_approval_guard.sql`)

### AC7 — Concluir PDI
**Given** PDI com `progress = 100` (todas ações done)
**Then** botão "Marcar como concluído" disponível para owner
**When** clica
**Then** UPDATE `status='completed'`, `completed_at = now()`
**And** evento PostHog `pdi_completed`

## Technical Notes
- **Migration:** `0008_pdi.sql` (já tem `approved_at`). Adicional: `docs/migrations-draft/0011_pdi_approval_guard.sql` para trigger
- **Files novos:**
  - `src/components/pdi/ApprovalActions.tsx`
  - `src/components/pdi/ApprovalBadge.tsx`
  - `src/hooks/usePDIApproval.ts`
- **Files modificados:**
  - `src/pages/PDIDetail.tsx`
  - `src/pages/PDITeam.tsx` (badge de pending)
- **Padrões:** AppLayout, sonner PT-BR, React Query

### RLS Notes
- UPDATE policy permite owner OR manager — porém a coluna `approved_at` deve mudar APENAS via trigger guard
- Trigger `BEFORE UPDATE OF approved_at`:
  ```sql
  IF NEW.approved_at IS DISTINCT FROM OLD.approved_at AND auth.uid() <> COALESCE(NEW.manager_id, OLD.manager_id) THEN
    RAISE EXCEPTION 'Apenas o gestor designado pode aprovar/revogar';
  END IF;
  ```
- Policy de admin override: admin pode mudar `approved_at`? Decisão: NÃO no MVP — manter integridade. Documentar.

## Test Plan
- **Manual:** Camila ativa PDI, pede aprovação; Bruno aprova; badge aparece
- **Manual:** Bruno reprova com comentário
- **RLS:** user X tenta UPDATE `approved_at` → trigger bloqueia
- **Edge:** PDI sem `manager_id` → botão "Solicitar aprovação" oculto
- **Edge:** edição menor (descrição) NÃO revoga; edição maior (nova competência) pergunta

## Dependencies
- Story 7.1, 7.3
- Migration `0011_pdi_approval_guard.sql` (a ser criada nesta story)
- Bloqueia: nenhuma

## Definition of Done
- [ ] AC1-AC7 done
- [ ] Migration `0011` revisada por @architect
- [ ] Trigger guard testado (rejeita não-manager)
- [ ] Eventos PostHog completos
- [ ] PR reviewed
