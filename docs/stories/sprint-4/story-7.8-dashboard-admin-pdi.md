# Story 7.8 — Dashboard admin (% concluídos por departamento)

**Epic:** epic-07-pdi
**Sprint:** 4
**Status:** Approved
**Estimate:** M
**Priority:** P1
**Owner:** unassigned (Dex)

## Context
Renata (RH/admin) precisa de visão agregada da prática de PDI: quantos PDIs ativos, % de progresso médio por departamento, competências mais trabalhadas (insight pra L&D), gestores com PDIs sem aprovação há > 14 dias.

**Pre-condition:** Stories 7.1, 7.3, 7.5 entregues. Migration `0008` aplicada. Tabela `users` deve ter `department_id` ou similar (verificar no schema atual).

## Acceptance Criteria

### AC1 — Página `/admin/pdi-dashboard`
**Given** usuário admin
**When** acessa `/admin/pdi-dashboard`
**Then** vê 4 KPIs no topo:
  - Total de PDIs ativos
  - % concluídos no prazo (target_date passada e status='completed' before target)
  - Progresso médio (avg `pdi_plans.progress` onde status='active')
  - PDIs aguardando aprovação > 14 dias

**Given** non-admin
**Then** redireciona com toast "Sem permissão"

### AC2 — Tabela "PDIs por departamento"
**Given** dashboard
**Then** tabela com colunas:
  - Departamento (nome)
  - # de pessoas
  - # PDIs ativos
  - # PDIs concluídos
  - Progresso médio
  - % cobertura (PDIs ativos / pessoas)
**And** ordenado por % cobertura DESC

### AC3 — Top competências trabalhadas
**Given** dashboard
**Then** card "Competências mais frequentes" com top 10 (count de `pdi_competencies.name` agrupado, case-insensitive)
**And** gráfico de barras (recharts)

### AC4 — Tendência mensal
**Given** dashboard
**Then** gráfico linhas: PDIs criados, ativos e concluídos por mês (últimos 12 meses)

### AC5 — Filtros
**Given** filtros: período (last 30/90/365 days), departamento (multi-select), status
**When** alterados
**Then** todas métricas recalculadas
**And** evento PostHog `pdi_dashboard_filtered`

### AC6 — Drill-down: clicar em departamento
**Given** linha de departamento
**When** clica
**Then** painel lateral lista pessoas + status do PDI de cada
**And** ⚠️ NÃO mostra conteúdo das ações ou evidências do PDI — apenas título e progresso

### AC7 — Export CSV
**Given** botão "Exportar"
**When** clica
**Then** baixa CSV com tabela completa
**And** evento PostHog `pdi_dashboard_exported`

### AC8 — PDIs em risco
**Given** card "PDIs em risco"
**Then** lista PDIs com:
  - `target_date < now() + interval '30 days'` AND `progress < 50` AND `status = 'active'`
**And** badge vermelho

## Technical Notes
- **Migration:** sem mudanças — confiar nas existentes. Verificar se há `users.department_id`. Se não houver, usar campo `users.team` ou similar; coordenar com @architect — pode requerer migration aditiva (`ADD COLUMN department text` em migration nova `0012_users_department.sql`, NUNCA alterando schema existente)
- **Files novos:**
  - `src/pages/admin/PDIDashboard.tsx`
  - `src/components/admin/pdi/DepartmentTable.tsx`
  - `src/components/admin/pdi/TopCompetencies.tsx`
  - `src/components/admin/pdi/AtRiskList.tsx`
  - `src/hooks/usePDIDashboard.ts`
- **Files modificados:**
  - `src/App.tsx` (rota admin)
  - `src/pages/admin/index.tsx` (link)
- **Queries de exemplo:**
  ```sql
  -- Top competências
  SELECT lower(name) AS name, COUNT(*) AS freq
  FROM pdi_competencies c
  JOIN pdi_plans p ON p.id = c.pdi_plan_id
  WHERE p.company_id = $1 AND p.status IN ('active','completed')
  GROUP BY lower(name) ORDER BY freq DESC LIMIT 10;

  -- Por departamento
  SELECT u.department, COUNT(p.id) FILTER (WHERE p.status='active') AS active,
         AVG(p.progress) FILTER (WHERE p.status='active') AS avg_progress
  FROM users u LEFT JOIN pdi_plans p ON p.user_id = u.id
  WHERE u.company_id = $1 GROUP BY u.department;
  ```
- **Padrões:** AppLayout, recharts, shadcn Table, useUserPermissions gate

### RLS Notes
- Admin VÊ todos os PDIs (`is_company_admin` na policy SELECT de `pdi_plans`)
- Dashboard NÃO deve consultar conteúdo de evidências (storage). Apenas metadata (existência de `evidence_url`)
- Drill-down AC6: lista títulos + progresso. NÃO listar ações com descrição completa nem evidências (por privacidade — admin não precisa ver detalhe operacional)

## Test Plan
- **Manual:** admin acessa, vê KPIs, filtra por dept
- **Manual:** drill-down em depto mostra pessoas
- **RLS:** non-admin tenta acessar → bloqueado
- **Performance:** com 200+ usuários e 100+ PDIs — < 2s
- **Export:** CSV testado em Excel + Sheets

## Dependencies
- Stories 7.1, 7.3, 7.5
- Possível migration `0012_users_department.sql` se schema atual não tiver campo
- Bloqueia: nenhuma (última do epic)

## Definition of Done
- [ ] AC1-AC8 done
- [ ] PR reviewed
- [ ] Performance OK (< 2s com volume real)
- [ ] Export CSV testado
- [ ] Eventos PostHog
- [ ] Dashboard NÃO consulta storage de evidências
