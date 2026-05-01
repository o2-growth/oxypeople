# Story 4.2 — Editor Nine Box com drag-drop entre células

**Epic:** epic-04-nine-box
**Sprint:** 3
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Coração da Epic. Editor visual 3×3 onde admin/manager arrasta avatares entre quadrantes para calibrar performance × potencial. Persiste em `nine_box_placements`. A justificativa obrigatória ao trocar quadrante vem na Story 4.3 (esta story foca no fluxo de drag-drop e persistência).

**Pre-condition:** Story 4.1 entregue (snapshot e placements existem).

## Acceptance Criteria

### AC1 — Editor renderizado
**Given** admin abre `/admin/nine-box/:snapshotId`
**Then** vê grid 3×3 com células rotuladas:
- (3,1) "Enigma" / (3,2) "Crescimento" / (3,3) "Estrela"
- (2,1) "Inconsistente" / (2,2) "Mantenedor" / (2,3) "Alto Potencial"
- (1,1) "Risco" / (1,2) "Eficaz" / (1,3) "Especialista"
**And** eixo X = Performance (1=baixa, 2=média, 3=alta) — esquerda→direita
**And** eixo Y = Potencial (1=baixo embaixo, 3=alto em cima)
**And** cada célula mostra avatar + nome dos placements naquela posição
**And** "Pool" lateral lista usuários elegíveis ao snapshot ainda sem placement (drag para incluir)

### AC2 — Drag entre células
**Given** snapshot `status='draft'`
**When** admin arrasta avatar de (2,2) para (3,3)
**Then** UPDATE em `nine_box_placements` com `performance_axis=3, potential_axis=3`
**And** se mudança em `performance_axis` E placement era `performance_source='auto'` → marca como `performance_source='auto_overridden'` (preserva `raw_evaluation_score`)
**And** UI atualiza otimisticamente (React Query optimistic update)
**And** se UPDATE falhar (RLS / validação), reverte e toast erro
**And** PostHog `nine_box_placed { from_box, to_box, source_change }`

### AC3 — Drag do pool para célula
**Given** usuário no pool (sem placement)
**When** arrasta para célula (X,Y)
**Then** INSERT em `nine_box_placements` com `performance_axis=X, potential_axis=Y, performance_source='manual', placed_by=auth.uid()`
**And** sai do pool, aparece na célula
**And** PostHog `nine_box_placed { from_box: 'pool', to_box }`

### AC4 — Drag para fora (remover)
**Given** placement em célula
**When** arrasta para área "Remover do snapshot" (zona de drop)
**Then** modal "Remover [nome] do snapshot?"
**And** se confirma, DELETE no placement
**And** usuário volta ao pool
**And** PostHog `nine_box_removed`

### AC5 — Snapshot finalizado é read-only
**Given** snapshot `status='finalized' OR status='archived'`
**Then** drag-drop está desabilitado (visual + bloqueio funcional)
**And** banner "Snapshot finalizado — somente leitura" no topo
**And** policy de UPDATE da `0005` bloqueia o servidor de qualquer forma

### AC6 — Performance / virtualização
**Given** snapshot com 100+ placements
**Then** cada célula virtualiza a lista interna (limite 8 visíveis + "+N mais" expansível)
**And** drag continua responsivo (sem jank)

### AC7 — Hooks
- `useNineBoxSnapshot(snapshotId)` — retorna snapshot + placements + pool
- `useUpdatePlacement()` — mutation com optimistic update
- `useCreatePlacement()` 
- `useDeletePlacement()`
- queryKey `["nine-box", snapshotId]`

### AC8 — Color coding
**Given** matriz visual
**Then** células coloridas por convenção: verde-escuro = (3,3), verde-claro = (3,2)/(2,3), amarelo = diagonal central, vermelho = (1,1)
**And** badge de quantidade no canto da célula

## Technical Notes
- **Library drag-drop:** usar `@dnd-kit/core` + `@dnd-kit/sortable` (mais leve que react-beautiful-dnd, melhor TS). Adicionar dep se não existir.
- **Migration:** nenhuma nova
- **Files novos:**
  - `src/pages/admin/NineBoxEditor.tsx` (substitui esqueleto da 4.1)
  - `src/components/admin/nineBox/NineBoxGrid.tsx` (3×3 layout)
  - `src/components/admin/nineBox/NineBoxCell.tsx` (drop target + lista de avatares)
  - `src/components/admin/nineBox/NineBoxPool.tsx` (sidebar com não-placed)
  - `src/components/admin/nineBox/PlacementCard.tsx` (avatar draggable)
  - `src/hooks/useNineBoxSnapshot.ts`
  - `src/hooks/usePlacementMutations.ts`
- **Padrões:** optimistic update via `queryClient.setQueryData` antes do mutation; rollback em `onError`
- **A11y:** dnd-kit suporta keyboard (Tab + Space + arrows) — manter ativo

## Test Plan
- **Unit:** lógica de "auto → auto_overridden" quando performance_axis muda
- **Integration:** mover placement de (1,1) para (3,3); reload; permanece em (3,3)
- **Performance manual:** carregar snapshot com 100 placements seedados; drag deve ficar < 16ms/frame
- **Manual:** drag-drop com mouse; drag-drop com teclado (a11y)

## Dependencies
- **Depends on:** Story 4.1
- **Blocks:** Story 4.3 (justificativa wraps esse fluxo), 4.4 (status muda permissões)

## Definition of Done
- [ ] AC1-AC8 done
- [ ] Tests passing
- [ ] Lint clean
- [ ] PostHog events
- [ ] Smoke: 1 snapshot calibrado por admin com 10+ avatares
