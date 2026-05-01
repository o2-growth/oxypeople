# Story 4.5 — Export PDF da matriz Nine Box

**Epic:** epic-04-nine-box
**Sprint:** 3
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Resultado da calibração precisa virar artefato compartilhável (board, comitê, RH). Story usa `react-pdf` para gerar PDF da matriz com logo, metadata e lista de placements por quadrante. Disponível para snapshots `finalized` ou `archived` (não draft, para evitar versões "rascunho" circulando).

**Pre-condition:** Story 4.4 entregue (snapshots podem ser finalized).

## Acceptance Criteria

### AC1 — Botão "Exportar PDF"
**Given** snapshot `finalized` ou `archived`
**Then** header mostra botão "Exportar PDF"

**Given** snapshot `draft`
**Then** botão DESABILITADO com tooltip "Finalize o snapshot antes de exportar"

### AC2 — Conteúdo do PDF (página 1)
**Given** clica "Exportar PDF"
**Then** gera PDF A4 paisagem com:
- Cabeçalho: logo do o2-growth (asset), nome do snapshot, ciclo (se houver), data de finalização
- Matriz 3×3 visual em ~2/3 da página, com cores e números, mesma convenção da UI
- Cada célula mostra avatares (até 6 visíveis) + "+N" se mais
- Rodapé: "Calibrado por X • Gerado em DD/MM/YYYY HH:MM"

### AC3 — Páginas seguintes (lista detalhada)
**Given** PDF
**Then** após página 1, gera 1 página por quadrante (até 9 páginas):
- Título da célula (ex.: "Estrela (Performance Alta × Potencial Alto)")
- Tabela: nome | departamento | time | score original | source (Auto/Manual/Override) | justificativa (truncada 200 chars)

### AC4 — Paginação inteligente
**Given** quadrante com > 20 placements
**Then** quebra a tabela em múltiplas páginas com header repetido
**And** paginação no rodapé "Página X de Y"

### AC5 — Download
**Given** PDF gerado client-side
**Then** download direto via `<PDFDownloadLink>` do react-pdf
**And** filename `nine-box-{slug-do-nome}-{YYYY-MM-DD}.pdf`
**And** PostHog `nine_box_pdf_exported { snapshot_id, placement_count, page_count }`

### AC6 — Fallback de avatar
**Given** usuário sem `avatar_url`
**Then** PDF renderiza círculo com iniciais (ex.: "JV" para João Vitor)

### AC7 — Performance
**Given** snapshot com 100 placements
**Then** PDF gera em < 5s no client (testar com snapshot real seedado)
**And** se > 100 placements, mostra modal "Esse PDF tem 9 páginas adicionais; vai gerar em ~10s"

### AC8 — Acessível para manager
**Given** manager (não admin) consegue ver snapshot finalized
**Then** também pode exportar PDF
**And** PDF não muda — mesma visão (RLS já garantiu acesso)

## Technical Notes
- **Dependência:** `npm i @react-pdf/renderer` — já listado em ADR
- **Files novos:**
  - `src/lib/nineBox/pdf/NineBoxPdf.tsx` (componente react-pdf)
  - `src/lib/nineBox/pdf/MatrixPage.tsx` (página 1)
  - `src/lib/nineBox/pdf/CellPage.tsx` (páginas 2-10)
  - `src/lib/nineBox/pdf/AvatarFallback.tsx` (iniciais)
  - `src/components/admin/nineBox/ExportPdfButton.tsx`
- **Files modificados:**
  - `src/pages/admin/NineBoxEditor.tsx` — header com `<ExportPdfButton />`
- **Logo:** colocar em `src/assets/logo-pdf.png` (alta resolução, 600px)
- **Padrões:** react-pdf não suporta tailwind — usar `StyleSheet.create` interno

## Test Plan
- **Unit:** util de bucket de avatares por célula → cada célula recebe os placements certos
- **Integration:** snapshot mock 30 placements → PDF gera, validar # de páginas
- **Manual:** abrir PDF gerado em macOS Preview, Adobe, Chrome — todos renderizam matriz com cores
- **Performance:** snapshot 100 placements → cronometrar tempo de geração

## Dependencies
- **Depends on:** Story 4.4 (precisa de status finalized)
- **Pode rodar em paralelo com:** Story 4.6

## Definition of Done
- [ ] AC1-AC8 done
- [ ] Tests passing
- [ ] Lint clean
- [ ] Logo aprovada por usuário interno
- [ ] PostHog event
- [ ] Smoke: 1 PDF aberto e validado por admin
