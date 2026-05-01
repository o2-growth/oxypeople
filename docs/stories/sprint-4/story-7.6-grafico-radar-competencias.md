# Story 7.6 — Gráfico radar de competências

**Epic:** epic-07-pdi
**Sprint:** 4
**Status:** Approved
**Estimate:** S
**Priority:** P1
**Owner:** unassigned (Dex)

## Context
Visual gráfico que ajuda owner e gestor a ver quais competências têm maior gap entre `current_level` e `target_level`. Usa radar chart do recharts (já disponível). Limite UX 8 competências (consistente com Story 7.1 AC5).

**Pre-condition:** Story 7.1 entregue. `pdi_competencies` populadas.

## Acceptance Criteria

### AC1 — Gráfico no detalhe do PDI
**Given** PDI com ≥ 3 competências
**Then** seção "Mapa de Competências" no detalhe mostra radar chart
**And** 2 séries: "Nível atual" (azul) e "Nível alvo" (verde)
**And** eixos = nomes das competências (rotulados)

### AC2 — Empty state
**Given** PDI com < 3 competências
**Then** mostra mensagem "Adicione pelo menos 3 competências para ver o radar"
**And** não renderiza gráfico (radar com 1-2 pontos é ilegível)

### AC3 — Limite 8 competências
**Given** PDI com 8 competências (limite)
**Then** todas aparecem no radar, fontes ainda legíveis
**And** ⚠️ Limite imposto na Story 7.1 AC5 — esta story confia no limite

### AC4 — Tooltip ao hover
**Given** usuário passa mouse sobre vértice
**Then** tooltip mostra "[Nome competência]: atual {n}/5, alvo {n}/5, gap {n}"

### AC5 — Atualização reativa
**Given** owner edita nível de uma competência
**When** salva
**Then** gráfico atualiza imediatamente (React Query invalidate)

### AC6 — Modo comparação (futuro/opcional)
**Given** PDI ligado a `evaluation_id` (ADR-012)
**Then** opção "Comparar com avaliação anterior" — sobrepõe terceira série com níveis da avaliação
**And** se `evaluation_id IS NULL`, opção oculta. Marcar como "futuro Sprint 5" se complexo demais

### AC7 — Exportar gráfico
**Given** botão "Baixar PNG"
**When** clica
**Then** baixa PNG do gráfico (usar lib `html2canvas` ou função nativa do recharts via SVG → blob)
**And** evento PostHog `pdi_radar_exported`

### AC8 — Acessibilidade
**Given** screen reader
**Then** tabela alternativa (sr-only) com mesmos dados (competência, atual, alvo) ao lado do gráfico

## Technical Notes
- **Migration:** nenhuma
- **Files novos:**
  - `src/components/pdi/CompetencyRadar.tsx`
  - `src/components/pdi/CompetencyTable.tsx` (acessibilidade)
- **Files modificados:**
  - `src/pages/PDIDetail.tsx`
- **Lib:** `recharts` `RadarChart` (já listada como disponível no contexto do projeto)
- **Padrões:** card shadcn-ui, cores consistentes com tokens Tailwind

### RLS Notes
- Apenas usa `pdi_competencies` (já com policies via plano)
- Sem novos endpoints

## Test Plan
- **Manual:** PDI com 3, 5, 8 competências — visual ok
- **Manual:** PDI com 2 competências — vê empty state
- **Acessibilidade:** screen reader lê tabela alternativa
- **Manual:** baixar PNG funciona em Chrome e Safari

## Dependencies
- Story 7.1
- Bloqueia: nenhuma — paralela com 7.4, 7.5

## Definition of Done
- [ ] AC1-AC8 done
- [ ] PR reviewed
- [ ] Visual aprovado por @ux (Uma) — opcional mas recomendado
- [ ] Evento `pdi_radar_exported` PostHog
- [ ] Tabela alternativa para a11y
