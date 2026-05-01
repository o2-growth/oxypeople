# Story 4.3 — Justificativa obrigatória ao mudar quadrante

**Epic:** epic-04-nine-box
**Sprint:** 3
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Calibração sem rastro vira "achismo institucional". Esta story impõe que toda mudança de quadrante (`performance_axis` ou `potential_axis` diferente do anterior) abra modal pedindo justificativa textual, persistida em `nine_box_placements.justification`. Suporta também histórico simples (apenas última justificativa por placement no MVP).

**Pre-condition:** Story 4.2 entregue.

## Acceptance Criteria

### AC1 — Modal de justificativa no drop
**Given** admin arrasta avatar de célula (X1,Y1) para (X2,Y2) onde X1≠X2 OU Y1≠Y2
**Then** o drop NÃO confirma imediatamente — abre modal "Por que essa mudança?"
**And** modal mostra:
- de onde / para onde (texto: "Mantenedor (2,2) → Estrela (3,3)")
- textarea obrigatória (50-2000 chars), placeholder "Ex.: superou metas Q1 + liderança em projeto X"
- botão "Confirmar mudança" desabilitado até atingir 50 chars
- botão "Cancelar" → reverte UI

**Given** drag dentro da MESMA célula
**Then** não abre modal (não há mudança de quadrante)

### AC2 — Persistência
**Given** admin confirma com justificativa
**Then** UPDATE em `nine_box_placements`:
- `performance_axis = X2`
- `potential_axis = Y2`
- `justification = <texto>`
- `updated_at = now()` (trigger)
**And** se mudança em performance e era `auto` → marca `auto_overridden`

### AC3 — Justificativa no INSERT (do pool)
**Given** drag do pool para célula (X,Y)
**Then** modal de justificativa também abre (placement novo deve ter contexto)
**And** INSERT inclui `justification`

### AC4 — Visualização da justificativa
**Given** placement existente com `justification`
**When** clica no avatar
**Then** popover mostra:
- nome
- quadrante atual
- `raw_evaluation_score` (se disponível)
- `performance_source` (badge "Auto" ou "Manual" ou "Override")
- justificativa completa
- "Calibrado por X em dd/MM/yyyy HH:MM"

### AC5 — Justificativa não obrigatória ao deletar
**Given** drag para "Remover"
**Then** modal só pede confirmação simples, sem justificativa (decisão de exclusão é menos sensível que recolocação)

### AC6 — Histórico (P1 — não MVP)
Documentar em comment no código que histórico completo (tabela `nine_box_placement_history`) fica para Sprint 4. MVP: apenas última justificativa armazenada na própria row.

### AC7 — Auto-populate inicial não exige justificativa
**Given** Story 4.1 cria placements via `auto_populate`
**Then** `justification` é NULL inicialmente — OK
**And** primeira mudança manual exige justificativa normal

## Technical Notes
- **Migration:** nenhuma nova (campo `justification` já existe em `0005`)
- **Files novos:**
  - `src/components/admin/nineBox/JustificationDialog.tsx`
  - `src/components/admin/nineBox/PlacementPopover.tsx` (AC4)
- **Files modificados:**
  - `src/pages/admin/NineBoxEditor.tsx` — interceptar onDragEnd antes do mutation
  - `src/hooks/usePlacementMutations.ts` — receber `justification` opcional
  - `src/components/admin/nineBox/PlacementCard.tsx` — wrapping com popover
- **Padrões:** Zod (justification min 50 max 2000); shadcn Dialog; sonner

## Test Plan
- **Unit:** Zod schema da justificativa (limites)
- **Integration:** drag (1,1)→(3,3), modal aparece, confirma com texto → DB atualizado com justification
- **Integration:** drag (2,2)→(2,2) (mesma célula) → sem modal
- **Manual:** abrir popover de placement existente e ver histórico

## Dependencies
- **Depends on:** Story 4.2
- **Blocks:** —

## Definition of Done
- [ ] AC1-AC7 done
- [ ] Tests passing
- [ ] Lint clean
- [ ] PostHog `nine_box_justified { from_box, to_box, char_count }`
- [ ] Smoke: admin não consegue mover sem justificar
