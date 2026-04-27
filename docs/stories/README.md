# Stories — oxypeople MVP

Stories shardadas a partir de `docs/epics/`. Lazy: criadas pelo `/agents:sm` quando o sprint correspondente começa.

## Status atual

| Sprint | Stories detalhadas | Stories pendentes (lazy) |
|---|---|---|
| **Sprint 0** | ✅ 4/4 | — |
| **Sprint 1** (Epic 1) | ✅ 7/7 | — |
| **Sprint 2** (Epics 2,3,4) | ⚪ 0/17 | criar quando Sprint 2 começar |
| **Sprint 3** (Epics 5,6) | ⚪ 0/14 | criar quando Sprint 3 começar |
| **Sprint 4** (Epic 7) | ⚪ 0/8 | criar quando Sprint 4 começar |
| **Sprint 5** (hardening) | ⚪ — | escopo flexível |

## Story Lifecycle

```
Draft (SM cria) → Review → Approved (PO valida) → In Progress (Dev) → In Review (QA) → Done → Accepted (PO)
```

## Story file format

Cada story segue o template:

```markdown
# Story X.Y — Title

**Epic:** epic-NN
**Sprint:** N
**Status:** Approved | In Progress | Done
**Estimate:** XS | S | M | L
**Priority:** P0 | P1 | P2
**Owner:** unassigned | <agent>

## Context
[Why this story matters]

## Acceptance Criteria
### AC1 — [What]
**Given** ...
**When** ...
**Then** ...

### AC2 — ...

## Technical Notes
- Files to create/modify
- Migration ID (if applicable)
- Hooks/components to reuse

## Test Plan
- Unit tests
- Integration tests
- RLS tests (if applicable)

## Dependencies
- Story Z.W (must be done first)
- Migration MIG_ID applied

## Definition of Done
- [ ] AC met
- [ ] Tests passing
- [ ] Lint + typecheck OK
- [ ] PR reviewed and merged
- [ ] Deployed to staging
```
