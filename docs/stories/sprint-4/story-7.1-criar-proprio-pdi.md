# Story 7.1 — Criar próprio PDI

**Epic:** epic-07-pdi
**Sprint:** 4
**Status:** Approved
**Estimate:** M
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Camila (membro) precisa criar seu próprio Plano de Desenvolvimento Individual: definir título, descrição, data alvo opcional, vincular a ciclo de avaliação opcional, e adicionar competências (com nível atual e alvo). Esta é a estrutura base — ações e evidências vêm em stories seguintes.

ADR-012 (consequência): `evaluation_id` é FK OPCIONAL (nullable, ON DELETE SET NULL). PDI pode existir sem avaliação anexada. NÃO obrigar vínculo.

**Pre-condition:** migration `0008_pdi.sql` aplicada. Tabelas `pdi_plans`, `pdi_competencies` criadas. Verificar funções `is_company_member`, `is_user_manager`, `is_company_admin`.

## Acceptance Criteria

### AC1 — Acessar `/pdi`
**Given** usuário autenticado
**When** acessa `/pdi` (link em `AppSidebar`)
**Then** vê lista dos próprios PDIs (status badges: rascunho/ativo/concluído/cancelado)
**And** botão "Novo PDI" sempre visível

### AC2 — Form de criação base
**Given** usuário clica "Novo PDI"
**When** dialog abre
**Then** vê campos:
  - Título (obrigatório, 1-200 chars)
  - Descrição (opcional, textarea)
  - Data alvo (`target_date`, date picker, opcional)
  - Ciclo (combobox de `performance_cycles` da company, opcional)
  - Avaliação vinculada (combobox de `performance_evaluations` do user, opcional — só aparece se ciclo selecionado) — ADR-012
  - Manager (combobox de gestores; default = `manager_id` do user em `users`)

### AC3 — Submissão cria PDI em rascunho
**Given** form válido
**When** submete
**Then** INSERT em `pdi_plans` com `user_id = auth.uid()`, `company_id` corrente, `status='draft'`
**And** `manager_id` salvo (pode ser NULL se nenhum gestor)
**And** redireciona para `/pdi/:id` (página de edição)
**And** evento PostHog `pdi_created` com `{has_cycle, has_evaluation, has_manager}`

### AC4 — Adicionar competências
**Given** usuário em `/pdi/:id` em modo rascunho
**When** clica "Adicionar competência"
**Then** form: nome (obrig), descrição (opc), categoria (obrig: technical/leadership/behavioral/other), nível atual (1-5), nível alvo (1-5)
**And** validação Zod: `target_level >= current_level` (constraint do DB)
**And** se `target_level < current_level`, UI mostra "Nível alvo precisa ser maior ou igual ao atual" — copy: nota informativa permitindo ao user entender (Risco do Epic 7 §1)

### AC5 — Limite de 8 competências (UX)
**Given** PDI com 8 competências
**When** tenta adicionar 9ª
**Then** botão "Adicionar competência" disabled
**And** tooltip "Limite de 8 competências para manter foco. Conclua ou remova uma para adicionar outra"
**And** Justificativa: gráfico radar (Story 7.6) fica ilegível com >8

### AC6 — Editar e remover competência (rascunho ou ativo)
**Given** competência criada
**When** clica "Editar"
**Then** mesma validação de criação
**Given** clica "Remover"
**Then** confirmação modal "Remover competência? Ações vinculadas perderão o vínculo (mas serão preservadas)"
**And** DELETE em `pdi_competencies` — `pdi_actions.competency_id` vira NULL via `ON DELETE SET NULL`

### AC7 — Ativar PDI
**Given** PDI rascunho com ≥ 1 competência
**When** clica "Ativar PDI"
**Then** UPDATE `status='active'`
**And** se `manager_id` definido, dispara fluxo de aprovação (Story 7.5)
**And** evento PostHog `pdi_activated`

### AC8 — Validação de acesso
**Given** user X tenta acessar `/pdi/:id` de PDI de outro user
**Then** RLS retorna vazio → página mostra "PDI não encontrado ou sem acesso"

## Technical Notes
- **Migration:** `0008_pdi.sql` — tabelas `public.pdi_plans` (`id, company_id, user_id, manager_id, cycle_id, evaluation_id, title, description, status, target_date, progress, approved_at, completed_at`) e `public.pdi_competencies` (`id, pdi_plan_id, name, description, current_level, target_level, category, order_index`)
- **Files novos:**
  - `src/pages/PDI.tsx` (lista)
  - `src/pages/PDIDetail.tsx` (detalhe/edição)
  - `src/components/pdi/PDIForm.tsx`
  - `src/components/pdi/CompetencyForm.tsx`
  - `src/components/pdi/CompetenciesList.tsx`
  - `src/hooks/usePDI.ts`
  - `src/hooks/usePDICompetencies.ts`
- **Files modificados:**
  - `src/App.tsx` (rotas `/pdi` e `/pdi/:id`)
  - `src/components/layout/AppSidebar.tsx` (link "PDI")
- **Padrões:** AppLayout, react-hook-form + Zod, sonner PT-BR, React Query keys `["pdi", userId]` e `["pdi", id]`, useUserPermissions onde aplicável

### RLS Notes
- `pdi_plans` SELECT: `user_id = auth.uid() OR manager_id = auth.uid() OR is_user_manager(...) OR is_company_admin(...)` — owner sempre vê
- `pdi_plans` INSERT: owner cria pra si OU gestor cria pro liderado (Story 7.2 usa esse caminho)
- `pdi_competencies`: SELECT/INSERT/UPDATE/DELETE via JOIN com plan
- DELETE de plano: apenas se `status='draft'` OU admin

## Test Plan
- **Manual:** criar PDI, adicionar 3 competências, ativar
- **Validation:** target_level < current_level → bloqueado por Zod e por DB constraint
- **RLS:** user X tenta SELECT PDI de Camila → vazio
- **Limit:** tentar adicionar 9ª competência → bloqueado

## Dependencies
- Migration `0008` aplicada
- Bloqueia: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8

## Definition of Done
- [ ] AC1-AC8 done
- [ ] PR reviewed
- [ ] Constraint `target_level >= current_level` testado (pelo menos uma rejeição esperada)
- [ ] Eventos `pdi_created`, `pdi_activated` no PostHog
- [ ] Toast PT-BR
