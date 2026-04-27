# Epic 2 — Organograma 2.0

**Sprint:** 2 (semanas 2–3, parte do trio com Pulse e Nine Box)
**Status:** 🟡 Ready
**Priority:** P0
**Estimate:** 1.5 sprint
**Depends on:** Epic 1 (parcial — não-bloqueante)
**Migrations:** `0002_add_manager_id.sql`
**ADRs:** ADR-001 (manager_id em company_memberships), ADR-002 (reactflow), ADR-010 (recursive CTE)
**Nova dependência:** `reactflow` (npm)

## Goal
Transformar organograma de read-only em ferramenta operacional com hierarquia matricial real (`manager_id`), edição drag-drop, navegação rica.

## Personas impactadas
Renata (admin) · Bruno (líder) · Camila (colab)

## Stories

| # | Title | Estimate | File |
|---|---|---|---|
| 2.1 | manager_id migration + bulk admin UI | M | story-2.1 (lazy) |
| 2.2 | Reactflow: zoom/pan + minimapa | M | story-2.2 |
| 2.3 | Click no nó → drawer com perfil | S | story-2.3 |
| 2.4 | Filtros por dept/time/nome + "meu time" | S | story-2.4 |
| 2.5 | Export PNG/PDF | M | story-2.5 |
| 2.6 | Drag-and-drop para mudar gestor | M | story-2.6 |

> Stories detalhadas serão criadas pelo `/agents:sm` no início do Sprint 2.

## Sequencing
1. **2.1 PRIMEIRO** (migration + admin UI mínima)
2. 2.2 (substituir tree custom por reactflow)
3. 2.3, 2.4 em paralelo
4. 2.5 (export — depende de reactflow)
5. 2.6 (drag-drop — usa @dnd-kit + reactflow)

## Definition of Done
- [ ] manager_id preenchido para 100% dos colaboradores em ambiente de dogfood
- [ ] Organograma carrega 500 pessoas em <2s
- [ ] Drag-drop funciona com confirm + undo
- [ ] Export PNG e PDF geram arquivos válidos
- [ ] Nenhum ciclo possível (validado em test)
- [ ] Fallback para `dept.leader_id` ainda funciona (compat por 2 sprints)

## Riscos
- 🟡 reactflow bundle (~150KB) — lazy load no /people
- 🟡 Performance >500 pessoas — virtualização vai para P1 se necessário
- 🟡 manager_id NULL em massa exige UI de "preencher gestores" (admin onboarding)

## Métricas pós-deploy
- % de colaboradores com manager_id preenchido
- Tempo médio de load do org chart
- Frequência de uso (page views/dia)
