# Story 1.7 — Align objective_type enum (TS ↔ DB)

**Epic:** epic-01-okrs-hardening
**Sprint:** 1
**Status:** Approved
**Estimate:** XS
**Priority:** P0 (BLOQUEIA outras stories do Epic 1)
**Owner:** unassigned (Dex)

## Context
DB tem enum com 6 tipos (`strategic`, `tactical`, `operational`, `personal`, `team`, `individual`), mas `useObjectives.ts:10` declara só 3 (`strategic | tactical | operational`). Risco: bug silencioso quando alguém criar via SQL com tipo "personal" — frontend quebra.

**Decisão PO (resolve INC-1 do validation report):** UI continua expondo apenas os 3 tipos canônicos no MVP; enum TS aceita os 6 para tipo-segurança; tipos extras são `display-only` (mostrados no card como label, não no Create).

## Acceptance Criteria

### AC1 — Enum TS expandido
**Given** arquivo `src/hooks/useObjectives.ts:10`
**When** refatorado
**Then** type ObjectiveType é union dos 6 valores: `'strategic' | 'tactical' | 'operational' | 'personal' | 'team' | 'individual'`

### AC2 — UI Create continua oferecendo só 3 tipos
**Given** `CreateObjectiveDialog.tsx:59`
**When** usuário abre o form
**Then** select de "Tipo" mostra apenas: Estratégico (strategic), Tático (tactical), Operacional (operational)

### AC3 — Card renderiza qualquer um dos 6 tipos
**Given** objetivo com `type='personal'` retornado pelo backend
**When** renderizado em `ObjectiveCard.tsx`
**Then** badge mostra "Pessoal" (label PT-BR) sem quebrar UI

### AC4 — Função helper `getObjectiveTypeLabel(type)` centralizada
**Given** novo arquivo `src/lib/objective-types.ts`
**When** importado por componentes
**Then** retorna labels PT-BR para os 6 tipos
**And** retorna emoji/cor sugerido por tipo

### AC5 — Tipos não-canônicos não quebram filtros
**Given** filtro de tipo em `useObjectivesFilters`
**When** usuário filtra por "Tático"
**Then** retorna apenas tactical (não inclui personal mesmo que parecido)

### AC6 — Teste de tipo
**Given** TypeScript compilando
**When** dev tenta atribuir `type: "invalid"` a um Objective
**Then** TS error em build time

## Technical Notes
- Files: `src/hooks/useObjectives.ts`, `src/components/objectives/CreateObjectiveDialog.tsx`, `src/components/objectives/ObjectiveCard.tsx` (e qualquer outro que renderiza badge de tipo), **novo:** `src/lib/objective-types.ts`
- Não há migration — refactor puramente de código
- `src/integrations/supabase/types.ts` (gerado) já tem os 6 tipos — verificar e regenerar se necessário (`supabase gen types typescript`)

## Test Plan
- Compilação TypeScript sem erro
- Inserir manualmente row com `type='team'` no DB → reload UI → card renderiza ok

## Dependencies
Nenhuma — primeira story do Sprint 1, deve rodar antes das outras 6.

## Definition of Done
- [ ] AC1-AC6 done
- [ ] `bun run lint` + `bun run build` passam
- [ ] Smoke test: criar 1 objetivo de cada tipo canônico via UI, ver listados
- [ ] PR mergeado
