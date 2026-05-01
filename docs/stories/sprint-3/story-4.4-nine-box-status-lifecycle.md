# Story 4.4 — Lifecycle de status (draft → finalized → archived)

**Epic:** epic-04-nine-box
**Sprint:** 3
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Snapshot precisa de estados claros: `draft` (em calibração, mutável) → `finalized` (calibração concluída, read-only) → `archived` (sumido da lista padrão, ainda consultável). RLS de `0005` já bloqueia UPDATE em status non-draft; story garante UI condizente e ação explícita do admin.

**Pre-condition:** Stories 4.1-4.3 entregues.

## Acceptance Criteria

### AC1 — Botão "Finalizar"
**Given** snapshot em `status='draft'` com pelo menos 1 placement
**When** admin (`is_company_admin`) clica "Finalizar calibração"
**Then** modal "Após finalizar, mudanças exigirão criar novo snapshot. Confirma?"
**And** se confirma, UPDATE `status='finalized', finalized_at=now()`
**And** UI atualiza, badge muda, drag-drop é desabilitado
**And** PostHog `nine_box_finalized { snapshot_id, placement_count }`

**Given** snapshot draft sem placements
**Then** botão "Finalizar" disabled com tooltip "Adicione pelo menos 1 colaborador"

### AC2 — Botão "Arquivar"
**Given** snapshot `status='finalized'`
**When** admin clica "Arquivar"
**Then** modal "Snapshots arquivados não aparecem na lista padrão. Continuar?"
**And** UPDATE `status='archived'`
**And** lista padrão filtra (toggle "Mostrar arquivados" reexibe)
**And** PostHog `nine_box_archived`

### AC3 — RLS dura
**Given** snapshot `archived`
**When** admin tenta UPDATE direto via SQL ou client
**Then** policy `Admins update nine box snapshots` (que requer `status <> 'archived'`) bloqueia
**And** UI nem mostra ação (defense in depth)

### AC4 — Reabrir (admin only, com warning)
**Given** snapshot `finalized` (não archived)
**When** admin clica "Reabrir para edição"
**Then** modal de aviso forte "Reabrir vai liberar mudanças. Histórico anterior permanece."
**And** se confirma, UPDATE `status='draft', finalized_at=NULL`
**And** PostHog `nine_box_reopened` (alerta no Sentry — eventos sensíveis)

**Restrição:** snapshot `archived` NÃO pode ser reaberto direto. Tem que des-arquivar (status=finalized) e depois reabrir.

### AC5 — Des-arquivar
**Given** snapshot `archived`
**When** admin (em "Mostrar arquivados") clica "Des-arquivar"
**Then** UPDATE `status='finalized'`

**Implementação:** RLS atual bloqueia UPDATE em `archived`. Solução: criar função `SECURITY DEFINER` `unarchive_nine_box(snapshot_id)` em migration aditiva nova `0005a_nine_box_unarchive.sql` que verifica admin e faz o UPDATE bypass RLS. Documentar e adicionar.

### AC6 — Filtros na lista
**Given** lista `/admin/nine-box`
**Then** filtros: status (chips: Rascunho/Finalizado/Arquivado, multi), criador
**And** padrão: Rascunho + Finalizado (Arquivado oculto)

### AC7 — Permissão de leitura permanece
**Given** snapshot finalized
**Then** managers continuam vendo (RLS) em modo leitura
**And** podem exportar PDF (Story 4.5)

## Technical Notes
- **Migration NOVA aditiva:** `0005a_nine_box_unarchive.sql` (apenas CREATE FUNCTION, segura)
  ```sql
  CREATE OR REPLACE FUNCTION public.unarchive_nine_box(p_snapshot_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  DECLARE v_company uuid;
  BEGIN
    SELECT company_id INTO v_company FROM public.nine_box_snapshots WHERE id = p_snapshot_id;
    IF NOT public.is_company_admin(auth.uid(), v_company) THEN
      RAISE EXCEPTION 'forbidden';
    END IF;
    UPDATE public.nine_box_snapshots SET status='finalized', updated_at=now() WHERE id = p_snapshot_id AND status='archived';
  END $$;
  ```
- **Files novos:** —
- **Files modificados:**
  - `src/pages/admin/NineBoxEditor.tsx` — botões Finalizar/Reabrir/Arquivar no header
  - `src/components/admin/nineBox/NineBoxSnapshotList.tsx` — filtros + des-arquivar
  - `src/hooks/useNineBoxSnapshots.ts` — mutations `finalize`, `archive`, `unarchive`, `reopen`
- **Padrões:** sonner, modal de confirmação shadcn

## Test Plan
- **Unit:** mutation `finalize` chamada em snapshot sem placements → erro claro
- **Integration:** draft → finalized → tentar editar → bloqueado; reopen → editar OK; archive → unarchive via RPC
- **Manual:** admin testa todos os 4 botões

## Dependencies
- **Depends on:** Stories 4.1-4.3
- **Blocks:** Story 4.5 (PDF só de finalized)

## Definition of Done
- [ ] AC1-AC7 done
- [ ] Migration `0005a` aplicada
- [ ] Tests passing
- [ ] Lint clean
- [ ] Eventos PostHog
- [ ] Smoke: ciclo completo draft→finalized→archived→unarchive
