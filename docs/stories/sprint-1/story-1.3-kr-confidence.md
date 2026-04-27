# Story 1.3 — KR confidence (0–100)

**Epic:** epic-01-okrs-hardening
**Sprint:** 1
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Confidence é padrão moderno de OKRs (Google, Atlassian) — owner sinaliza % de confiança em atingir o KR antes mesmo do check-in. Coluna já criada em `0003`.

## Acceptance Criteria

### AC1 — Slider no card do KR
**Given** card de KR no `ObjectiveDetail`
**Then** mostra slider "Confiança: X%" (0–100, step 5)
**And** valor atual via `key_results.confidence` (NULL = mostra "Não definido")

### AC2 — Owner do KR pode atualizar
**Given** usuário owner do KR (ou editor do objetivo)
**When** ajusta slider
**Then** debounce 500ms → PATCH no DB
**And** badge colorido atualiza (>70 verde, 30–70 amarelo, <30 vermelho, NULL cinza)

**Given** usuário não-owner/editor
**Then** slider está disabled (read-only)

### AC3 — Badge no Executive Summary
**Given** card no `ExecutiveSummary.tsx`
**Then** novo card "KRs em baixa confiança" (count de KRs com `confidence < 30`)
**And** clique navega filtrando ObjectivesFilters por confidence_below=30

### AC4 — Filtro nos ObjectivesFilters
**Given** painel de filtros de objetivos
**Then** novo controle "Confiança < X" (slider)
**And** filtra objetivos cujo MENOR KR confidence < threshold

### AC5 — Evento PostHog
**Given** mudança de confidence
**Then** evento `kr_confidence_updated` com `{ kr_id, old, new }`

### AC6 — Tooltip explicativo
**Given** primeiro uso (cookie ou flag de onboarding)
**Then** tooltip explica "Sua confiança em atingir esse KR no fim do período. Atualize sempre que mudar de cenário."

## Technical Notes
- **Migration:** `0003_okr_hardening.sql` já adiciona `key_results.confidence smallint CHECK (0..100)`
- **Files novos:** —
- **Files modificados:**
  - `src/components/objectives/KeyResultCard.tsx` (slider)
  - `src/components/objectives/ExecutiveSummary.tsx` (card novo)
  - `src/components/objectives/ObjectivesFilters.tsx` (filtro)
  - `src/hooks/useObjectivesFilters.ts` (lógica filtro)
  - `src/hooks/useObjectives.ts` (mutation update KR)

## Test Plan
- **Manual:** alterar confidence, ver badge mudar de cor
- **Manual:** filtrar por confiança baixa, ver lista correta
- **Unit:** função `getConfidenceColor(value)` retorna cor correta para edge cases (0, 29, 30, 70, 71, 100, NULL)

## Dependencies
- Migration 0003 aplicada
- Story 1.7 (não bloqueia diretamente, mas convive)

## Definition of Done
- [ ] AC1-AC6 done
- [ ] PR mergeado
- [ ] Tested em staging com 5+ KRs
- [ ] Documentação curta no README de OKRs
