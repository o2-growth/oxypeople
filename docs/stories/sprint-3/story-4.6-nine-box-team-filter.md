# Story 4.6 — Filtro "meu time" (subtree do manager) no Nine Box

**Epic:** epic-04-nine-box
**Sprint:** 3
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Manager precisa enxergar APENAS os calibrados que estão na sua árvore hierárquica (subtree). Sem isso, viraria "todo mundo vê todo mundo" — quebra a regra organizacional. Story usa a função `get_org_subtree(manager_id)` (deve existir após Epic 2 / migration `0002_add_manager_id.sql`) para filtrar.

**Pre-condition:** Epic 2 Story 2.1 entregue (`users.manager_id` populado e `get_org_subtree` disponível). Sem isso, esta story não é viável.

## Acceptance Criteria

### AC1 — Toggle "Apenas meu time"
**Given** usuário com role=manager (não admin) em `/admin/nine-box/:id`
**Then** vê toggle "Apenas meu time" ativado por padrão (default = true para manager)

**Given** admin
**Then** vê toggle "Apenas meu time" desativado por padrão (default = false)
**And** pode alternar livremente

### AC2 — Filtro client-side com subtree
**Given** toggle ativo
**When** carrega placements
**Then** chama RPC `get_org_subtree(auth.uid())` — retorna `uuid[]` de descendentes diretos+indiretos
**And** filtra `placements` para `user_id IN (subtree)` no client (RLS já não bloqueia, é só refinamento UX)

**Performance:** subtree é cacheado em React Query com queryKey `["org-subtree", userId]` (TTL 5min)

### AC3 — Pool também filtrado
**Given** toggle ativo
**Then** o pool lateral (Story 4.2) só lista usuários do subtree do manager logado
**And** dragging usuários "fora do meu time" para a matriz não é possível (não estão visíveis)

### AC4 — Indicador visual
**Given** toggle ativo
**Then** badge no header "Filtrando: meu time (N pessoas)"
**And** counter por célula mostra "X (de Y total)" se filtrado

### AC5 — Manager sem time
**Given** manager sem subordinados (subtree vazio)
**Then** mostra empty state "Você ainda não tem time. Defina manager_id dos colaboradores."
**And** link "Ir para organograma" → `/organograma`

### AC6 — Admin override no PDF
**Given** admin exporta PDF (4.5) com filtro "meu time" ativo
**Then** modal "Exportar com filtro ativo? (X de Y placements)" + opção "Exportar tudo"

### AC7 — Função RPC existe
**Given** `get_org_subtree(p_manager_id uuid) RETURNS uuid[]` — deve existir após Epic 2 (migration `0002_add_manager_id.sql`)
**Then** se ainda não existir, abrir migration aditiva `0005b_org_subtree_rpc.sql` com a função (recursivo CTE em `users.manager_id`)
**And** marcar SECURITY INVOKER (honra RLS)

## Technical Notes
- **Função RPC esperada (se não vier da Epic 2):**
  ```sql
  CREATE OR REPLACE FUNCTION public.get_org_subtree(p_manager_id uuid)
  RETURNS uuid[]
  LANGUAGE sql STABLE
  AS $$
    WITH RECURSIVE tree AS (
      SELECT id FROM public.users WHERE manager_id = p_manager_id
      UNION ALL
      SELECT u.id FROM public.users u
      INNER JOIN tree t ON u.manager_id = t.id
    )
    SELECT array_agg(id) FROM tree;
  $$;
  ```
- **Files novos:**
  - `src/hooks/useOrgSubtree.ts`
  - `src/components/admin/nineBox/MyTeamToggle.tsx`
- **Files modificados:**
  - `src/pages/admin/NineBoxEditor.tsx` — montar toggle e aplicar filtro
  - `src/components/admin/nineBox/NineBoxPool.tsx` — receber lista filtrada
- **Padrões:** React Query, `useUserPermissions` para detectar role

## Test Plan
- **Unit:** `useOrgSubtree` retorna array vazio quando usuário não é manager
- **Integration:** com seed de hierarquia (1 manager → 3 ICs), toggle limita placements para 3
- **Manual:** logar como manager real, verificar contagem no header

## Dependencies
- **Depends on:** Stories 4.1-4.2 (matriz funcional)
- **Depends on:** Epic 2 Story 2.1 (manager_id + get_org_subtree)
- **Pode rodar em paralelo com:** Story 4.5

## Definition of Done
- [ ] AC1-AC7 done
- [ ] RPC `get_org_subtree` confirmado existente OU migration `0005b` aplicada
- [ ] Tests passing
- [ ] Lint clean
- [ ] PostHog `nine_box_filter_toggled { my_team: bool, count }`
- [ ] Smoke: manager logado vê apenas seu time
