# Epic 7 — PDI (Plano de Desenvolvimento Individual)

**Sprint:** 4 (semanas 6–7)
**Status:** 🟡 Ready
**Priority:** P0
**Estimate:** 1 sprint
**Migrations:** `0008_pdi.sql` (inclui storage bucket `pdi-attachments`)
**ADRs:** ADR-012 (FK opcional `evaluation_id`)

## Goal
Habilitar plano de desenvolvimento individual rastreável, com competências, ações kanban, evidências e aprovação do gestor.

## Personas impactadas
Camila (cria próprio, executa) · Bruno (cria para liderado, aprova) · Renata (dashboard)

## Stories

| # | Title | Estimate | File |
|---|---|---|---|
| 7.1 | Criar próprio PDI | M | story-7.1 (lazy) |
| 7.2 | Manager cria PDI para liderado | S | story-7.2 |
| 7.3 | Ações em kanban (To do/Doing/Done/Blocked) | M | story-7.3 |
| 7.4 | Anexar evidências (upload) | S | story-7.4 |
| 7.5 | Aprovação do gestor | S | story-7.5 |
| 7.6 | Gráfico radar de competências | S | story-7.6 |
| 7.7 | Vincular ação a feedback | S | story-7.7 |
| 7.8 | Dashboard admin (% concluídos por dept) | M | story-7.8 |

## Sequencing
1. 7.1 (estrutura base — plan + competency + action)
2. 7.3 (kanban — reusa padrão de `actions`)
3. 7.5 (aprovação)
4. 7.2 (manager cria — usa is_user_manager)
5. 7.4 + 7.6 em paralelo
6. 7.7 (depende de Epic 5 já estar pronto)
7. 7.8 (dashboard admin)

## Definition of Done
- [ ] 3 PDIs reais ativos internamente
- [ ] 1 PDI finalizado com evidências anexadas
- [ ] Trigger `recalc_pdi_progress` valida com 5+ ações
- [ ] Storage `pdi-attachments` testado para upload e signed URL
- [ ] RLS: liderado não vê PDI de outro liderado do mesmo gestor

## Dependências
- Epic 2 Story 2.1 (`manager_id`) — `is_user_manager` depende disso
- Epic 5 (Feedback) — Story 7.7 depende

## Riscos
- 🟡 Constraint `target_level >= current_level` pode irritar usuário se levou trauma e quer abaixar — documentar
- 🟡 Upload de evidência pode estourar 10MB — limite no front + back
- 🟡 Radar chart com >8 competências fica ruim — limite UX em 8

## Métricas pós-deploy
- # de PDIs ativos
- % concluídos no prazo
- Distribuição de competências mais trabalhadas (insight pra L&D)
