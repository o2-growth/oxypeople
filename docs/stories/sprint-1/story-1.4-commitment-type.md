# Story 1.4 — Commitment type (committed / aspirational)

**Epic:** epic-01-okrs-hardening
**Sprint:** 1
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Padrão Google OKR distingue **committed** (entrega esperada, 100% é o alvo) de **aspirational** (moonshot, 70% é vitória). Aspirational não pode derrubar a média geral da empresa. Coluna já criada em `0003`.

## Acceptance Criteria

### AC1 — Toggle no Create
**Given** form `CreateObjectiveDialog`
**Then** novo campo "Tipo de comprometimento" com 2 opções:
- **Committed** (default): selo verde "Entrega esperada"
- **Aspirational**: selo roxo "Moonshot — 70% já é vitória"
**And** valor salva em `objectives.commitment_type`

### AC2 — Badge no card e detalhe
**Given** objetivo com `commitment_type='aspirational'`
**Then** badge roxo "Moonshot" no card e header do detalhe
**And** ícone explicativo (rocket?) com tooltip

### AC3 — Edição
**Given** objetivo já criado
**When** owner ou admin edita
**Then** pode alternar committed↔aspirational (com confirm: "Isso afeta cálculo de média geral. Continuar?")

### AC4 — Filtro nos ObjectivesFilters
**Given** painel de filtros
**Then** novo controle "Tipo de comprometimento" (select: Todos / Committed / Aspirational)

### AC5 — Aspirational excluído da média da empresa
**Given** dashboard `Index.tsx` mostra média de progresso
**When** calculado
**Then** considera apenas `commitment_type='committed'`
**And** card separado "Moonshots" mostra média e count dos aspirational

### AC6 — Hook `useDashboardFullStats` reflete
**Given** lógica de cálculo no hook
**When** retorna stats
**Then** novos campos: `avgProgressCommitted`, `avgProgressAspirational`, `committedCount`, `aspirationalCount`

### AC7 — Cron `okr-escalation` ignora aspirational?
**Given** edge function `okr-escalation`
**Then** **continua escalando aspirational** (líder ainda quer saber se moonshot está em risco)
**But** não usa o desvio para "marcar como `auto_status=risk`" — aspirational pode estar 30% e ainda OK
**Note:** decisão pode mudar — alinhar com PM antes (default: escalar mas com label "moonshot")

### AC8 — Evento PostHog
**Given** criar/editar
**Then** evento `objective_created` ou `objective_updated` com property `commitment_type`

## Technical Notes
- **Migration:** `0003_okr_hardening.sql` já adiciona coluna com default `'committed'` e CHECK
- **Files modificados:**
  - `src/components/objectives/CreateObjectiveDialog.tsx`
  - `src/components/objectives/ObjectiveCard.tsx`
  - `src/pages/ObjectiveDetail.tsx` (header + edit)
  - `src/components/objectives/ObjectivesFilters.tsx`
  - `src/hooks/useObjectivesFilters.ts`
  - `src/hooks/useDashboardFullStats.ts`
  - `src/components/dashboard/StatCard.tsx` (novo card moonshot)
- **Edge function:** revisar `supabase/functions/okr-escalation/index.ts` para confirmar behavior

## Test Plan
- Criar 3 objetivos: 2 committed (50% e 80%), 1 aspirational (30%)
- Verificar dashboard mostra média de **65%** (apenas committed) + card moonshot mostrando 30%
- Filtrar por aspirational → vê só 1
- Tentar update sem permissão → bloqueado por RLS

## Dependencies
- Migration 0003 aplicada
- Story 1.7 (enum alinhado)

## Definition of Done
- [ ] AC1-AC8 done
- [ ] Lógica de cálculo de média validada com query manual
- [ ] PR mergeado
- [ ] Documentação atualizada (README OKRs explica diferença)
