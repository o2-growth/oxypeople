# Story 4.1 — Criar snapshot Nine Box (auto-popula performance)

**Epic:** epic-04-nine-box
**Sprint:** 3
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Reunião de calibração depende de uma matriz "freezada" de um ciclo de avaliação. Esta story entrega a UI admin para criar `nine_box_snapshots` e popular automaticamente o eixo de **performance** a partir dos `overall_score` das avaliações já existentes do ciclo escolhido. Potencial inicia em "indefinido" e o admin/manager arrasta na 4.2.

**ADR-007 (auto + override):** o eixo de performance vem da média avaliada (auto) mas pode ser sobrescrito (`performance_source = 'auto_overridden'`) se o calibrador discordar — preserva a auditoria do valor original em `raw_evaluation_score`.

**Pre-condition:** migration `0005_nine_box.sql` aplicada; existem `performance_cycles` e avaliações finalizadas com `overall_score` no banco.

## Acceptance Criteria

### AC1 — Tela admin
**Given** admin acessa `/admin/nine-box`
**Then** vê lista de snapshots existentes com colunas: nome, ciclo (link), status (Rascunho/Finalizado/Arquivado), criado por, data, # placements
**And** botão "Novo snapshot"

**Given** member regular tenta acessar
**Then** redireciona para `/` com toast — **role manager TEM acesso** (RLS permite SELECT) mas só vê em modo leitura

### AC2 — Form criar snapshot
**Given** admin clica "Novo snapshot"
**When** preenche:
- nome (obrigatório, ex. "Calibração Q1 2026")
- ciclo (`cycle_id` — select de `performance_cycles` da empresa; opcional/nullable)
- escopo: toggle "Toda empresa" OU multi-select departamentos/times (apenas usado para auto-populate; placements podem ser adicionados manualmente depois)
**Then** ao submeter, cria row em `nine_box_snapshots` com `status='draft'`, `created_by=auth.uid()`
**And** se cycle escolhido + escopo definido → executa AC3 (auto-popula)
**And** redireciona para `/admin/nine-box/:snapshotId` (tela editor — Story 4.2)
**And** PostHog `nine_box_snapshot_created { cycle_id, scope_type }`

### AC3 — Auto-populate de performance
**Given** ciclo escolhido tem N usuários com `evaluations.overall_score` (ou tabela equivalente — verificar nome real no schema)
**Then** para cada usuário no escopo:
- calcula `performance_axis` por bucketização de `overall_score`:
  - score < 6.0 → 1 (baixo)
  - 6.0 ≤ score < 8.0 → 2 (médio)
  - score ≥ 8.0 → 3 (alto)
- INSERT em `nine_box_placements`:
  - `performance_axis = N`
  - `potential_axis = 2` (médio = padrão neutro)
  - `performance_source = 'auto'`
  - `raw_evaluation_score = score`
  - `placed_by = auth.uid()`
**And** ao final, mostra toast "X colaboradores calibrados automaticamente"
**And** PostHog `nine_box_auto_populated { count }`

**Edge case:** usuário no escopo SEM avaliação no ciclo → não cria placement (admin adiciona manualmente). Lista esses usuários em modal "Sem avaliação no ciclo: [lista]".

### AC4 — Snapshot vazio (sem ciclo)
**Given** admin não escolhe ciclo
**Then** snapshot é criado vazio
**And** editor (Story 4.2) começa zerado, admin adiciona placements manualmente

### AC5 — Validação Zod
- nome 1-120 chars
- se escopo manual, pelo menos 1 dept ou 1 team
- `cycle_id` deve pertencer à mesma `company_id` (validar no client + RLS no server)

### AC6 — Hook
**Given** novo hook `useNineBoxSnapshots(companyId)`
**Then** expõe `snapshots, createSnapshot, autoPopulate, isLoading`
**And** queryKey `["nine-box-snapshots", companyId]`

### AC7 — Bucketização configurável (futuro P1)
**Given** os thresholds (6.0, 8.0) são hard-coded no MVP
**Then** documentar TODO em `src/lib/nineBox/performanceBucket.ts` para parametrizar via `nine_box_settings` em P2 (não implementar agora).

## Technical Notes
- **Migration:** `0005_nine_box.sql` (tabelas), `0002_add_manager_id.sql` (necessário se filtro de manager — Story 4.6)
- **Verificar nomes reais:** o sprint-1 menciona avaliações; conferir tabela exata (`evaluations`, `performance_evaluations`, etc.) via `src/integrations/supabase/types.ts` antes de codar.
- **Files novos:**
  - `src/pages/admin/NineBox.tsx` (lista)
  - `src/pages/admin/NineBoxEditor.tsx` (editor — entregue na Story 4.2; aqui só esqueleto)
  - `src/components/admin/nineBox/NineBoxSnapshotList.tsx`
  - `src/components/admin/nineBox/CreateSnapshotDialog.tsx`
  - `src/hooks/useNineBoxSnapshots.ts`
  - `src/lib/nineBox/performanceBucket.ts` (util puro com TODO documentado)
  - `src/lib/validation/nineBoxSchema.ts`
- **Files modificados:**
  - `src/App.tsx` — rotas `/admin/nine-box` e `/admin/nine-box/:id`
  - `src/components/layout/AppSidebar.tsx` — link admin
- **RLS:** policies de `0005` cobrem (admin INSERT/UPDATE; manager SELECT)
- **Padrões:** Zod, react-hook-form, sonner, AppLayout

## Test Plan
- **Unit:** `performanceBucket(5.9) === 1`, `performanceBucket(6.0) === 2`, `performanceBucket(8.0) === 3`
- **Integration:** criar snapshot com ciclo X → verificar # de placements = # de avaliações finalizadas no ciclo + escopo
- **Manual:** admin cria 1 snapshot e vê redirect para editor

## Dependencies
- **Depends on:** migration 0005, existência de `performance_cycles` + avaliações no banco
- **Blocks:** Stories 4.2-4.6

## Definition of Done
- [ ] AC1-AC7 done
- [ ] Tests passing
- [ ] Lint clean
- [ ] Eventos PostHog
- [ ] Smoke: criar snapshot com ciclo real do banco
