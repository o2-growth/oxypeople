# Story 1.1 — Períodos admin UI (CRUD)

**Epic:** epic-01-okrs-hardening
**Sprint:** 1
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Hoje, `periods` (trimestres/ciclos) é gerenciado via SQL — admin não tem UI. Story cria tela admin completa para CRUD de períodos, com validação de não-overlap (já no trigger via migration 0003).

**Pre-condition:** antes de aplicar migration 0003, verificar não há overlap atual (database-audit.md §7 R6).

## Acceptance Criteria

### AC1 — Tela admin acessível
**Given** usuário admin da empresa
**When** acessa `/admin/periods` (link em `/settings/okrs`)
**Then** vê lista de períodos da empresa (nome, start_date, end_date, # de objetivos)

**Given** usuário não-admin tenta acessar `/admin/periods`
**Then** redireciona para `/` com toast "Sem permissão"

### AC2 — Criar período
**Given** admin clica "Novo período"
**When** preenche form (nome obrigatório, start_date, end_date) e submete
**Then** período é criado no DB
**And** lista atualiza (React Query invalidate)
**And** toast "Período criado"

**Given** admin tenta criar com `end_date < start_date`
**Then** validação Zod bloqueia (mensagem em form)

**Given** admin tenta criar período que sobrepõe outro existente
**Then** trigger SQL retorna erro
**And** UI mostra toast "Período sobrepõe outro período existente"

### AC3 — Editar período
**Given** admin clica "Editar" em período existente
**When** ajusta datas
**Then** mesma validação de overlap
**And** mudança salva
**And** **objetivos vinculados continuam funcionando** (FK preservada)

### AC4 — Arquivar (soft delete)
**Given** admin clica "Arquivar"
**When** período não tem objetivos ativos vinculados
**Then** período some da lista padrão
**And** toggle "Mostrar arquivados" reexibe

**Given** período tem objetivos ativos
**When** clica "Arquivar"
**Then** modal de aviso "X objetivos ativos neste período. Continuar?"
**And** se confirma, arquiva mesmo assim (objetivos não quebram)

### AC5 — Não pode deletar período com objetivos
**Given** período com objetivos vinculados
**When** admin tenta DELETE
**Then** `ON DELETE` da FK protege (RESTRICT)
**And** UI mostra erro amigável

### AC6 — Hook React Query novo
**Given** novo hook `usePeriodsAdmin()`
**Then** expõe `periods, createPeriod, updatePeriod, archivePeriod, isLoading`
**And** segue padrão de outros hooks admin (queryKey, invalidate)

### AC7 — Integração com `PeriodSelector`
**Given** seletor de períodos em `Objectives.tsx` e Create dialog
**When** novo período criado em /admin/periods
**Then** seletor mostra automaticamente (mesma queryKey)

## Technical Notes
- **Migration:** `0003_okr_hardening.sql` deve estar aplicada (trigger `validate_period_no_overlap`)
- **Files novos:**
  - `src/pages/admin/Periods.tsx`
  - `src/components/admin/periods/PeriodForm.tsx`
  - `src/components/admin/periods/PeriodList.tsx`
  - `src/hooks/usePeriodsAdmin.ts`
- **Files modificados:**
  - `src/App.tsx` (rota `/admin/periods`)
  - `src/components/layout/AppSidebar.tsx` (link admin condicional)
- **Padrões a seguir:** AppLayout wrapper, 3-state rendering, Zod schema, React Query keys `["periods-admin", companyId]`

## Test Plan
- **Unit (futuro Sprint 4):** Zod schema com edge cases (start > end, overlap)
- **Integration:** criar 2 períodos não-overlapping (Q1 e Q2 2026) — sucesso
- **Integration:** tentar criar Q1 2026 segunda vez — erro do trigger
- **Manual:** admin cria, edita, arquiva, dês-arquiva

## Dependencies
- **Story 1.7** deve estar concluída (refactor enum)
- Migration `0003` aplicada em staging com pre-check de overlap

## Definition of Done
- [ ] AC1-AC7 done
- [ ] PR reviewed
- [ ] Merge em staging
- [ ] Admin de teste consegue gerenciar períodos sem ajuda
- [ ] Evento PostHog `period_created` disparado
