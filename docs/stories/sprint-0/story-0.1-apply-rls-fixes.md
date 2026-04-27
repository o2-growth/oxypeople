# Story 0.1 — Apply RLS fixes (migration 0001)

**Epic:** Sprint 0 (preparação)
**Sprint:** 0
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
A auditoria identificou 3 fragilidades de RLS no DB atual:
- `reactions` com `SELECT USING (true)` (qualquer autenticado vê tudo)
- 3 tabelas sem DELETE policies (`survey_questions`, `performance_questions`, `performance_answers`)
- FKs órfãs sem índice (impacto de performance)

A migration `0001_fix_fragilities.sql` já está rascunhada em `docs/migrations-draft/` com tudo aditivo (zero destruição).

## Acceptance Criteria

### AC1 — Migration aplicada em staging primeiro
**Given** a migration `0001_fix_fragilities.sql`
**When** rodada em ambiente staging do Supabase
**Then** todas operações executam sem erro e a migration é registrada em `supabase_migrations.schema_migrations`

### AC2 — RLS de `reactions` restringe por company member
**Given** usuário X autenticado, NÃO membro da company A
**When** tenta `SELECT * FROM reactions` filtrando por post da company A
**Then** retorna **vazio** (0 rows)

**Given** usuário Y, membro da company A
**When** mesma query
**Then** retorna as reações dos posts da company A

### AC3 — DELETE policy permite admin remover survey question de draft
**Given** admin A da company X com `surveys.id=S1` em status `draft`
**When** `DELETE FROM survey_questions WHERE survey_id = S1 AND id = ...`
**Then** delete é executado com sucesso

**Given** mesma admin tenta deletar de survey em status `active`
**Then** delete é bloqueado pela policy

### AC4 — Helper `is_user_manager` retorna correto
**Given** company_membership com user_id=B, manager_id=A, status='active'
**When** `SELECT is_user_manager(A, B, company_id)`
**Then** retorna `true`

**When** `SELECT is_user_manager(B, A, company_id)`
**Then** retorna `false`

### AC5 — Índices criados
**Given** migration aplicada
**When** `\d company_memberships` (ou `pg_indexes`)
**Then** existem `idx_onboarding_feedbacks_manager`, `idx_perf_evaluations_evaluator`, `idx_perf_evaluations_evaluated`, `idx_reactions_post`, `idx_reactions_comment`

## Technical Notes
- Arquivo: `docs/migrations-draft/0001_fix_fragilities.sql` → renomear com timestamp e mover para `supabase/migrations/`
- Aplicar via Supabase CLI ou SQL editor (após backup confirmado)
- **NUNCA aplicar em prod sem antes em staging + smoke tests**

## Test Plan
- **Manual** (smoke tests acima — AC2, AC3, AC4)
- **Automatizado** (incluído na suíte de RLS do Sprint 4): teste com supabase-js + 2 usuários distintos

## Dependencies
- Aprovação explícita do usuário para aplicar a migration (regra global)
- Backup do banco staging antes

## Definition of Done
- [ ] Migration aplicada em staging
- [ ] AC1-AC5 validados manualmente
- [ ] Migration aplicada em prod (após go do usuário)
- [ ] Sem regressão em fluxos existentes (smoke test em criar reação, criar survey, criar avaliação)
- [ ] Documentar `is_user_manager` no README de hooks (para Sprint 2 usar)
