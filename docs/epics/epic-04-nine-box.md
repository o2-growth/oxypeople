# Epic 4 — Nine Box

**Sprint:** 2
**Status:** 🟡 Ready
**Priority:** P0
**Estimate:** 1 sprint
**Migrations:** `0005_nine_box.sql`
**ADRs:** ADR-007 (auto + override de performance)
**Dependência:** `react-pdf` (export)

## Goal
Habilitar reunião de calibração de talentos com matriz visual 3×3 (performance × potencial).

## Personas impactadas
Renata (cria, finaliza, exporta) · Bruno (calibra seu time) · Camila (não vê)

## Stories

| # | Title | Estimate | File |
|---|---|---|---|
| 4.1 | Criar snapshot do ciclo (auto-popula performance) | M | story-4.1 (lazy) |
| 4.2 | Drag-drop entre células | M | story-4.2 |
| 4.3 | Justificativa obrigatória ao mudar quadrante | S | story-4.3 |
| 4.4 | Status draft → finalized → archived | S | story-4.4 |
| 4.5 | Export PDF da matriz | M | story-4.5 |
| 4.6 | Filtro "meu time" via get_org_subtree | S | story-4.6 |

## Sequencing
1. 4.1 (snapshot + auto-populate)
2. 4.2 (drag-drop básico)
3. 4.3 (justificativa)
4. 4.4 (lifecycle de status)
5. 4.5, 4.6 em paralelo

## Definition of Done
- [ ] 1 ciclo de calibração interno completo
- [ ] PDF aprovado por usuário interno (legível, com logo)
- [ ] Auto-populate funciona para >80% dos colaboradores avaliados
- [ ] Drag-drop não dispara erro com 50+ pessoas no quadro
- [ ] Filtro "meu time" reduz visão para subtree do manager
- [ ] RLS: member regular não acessa `/nine-box`

## Dependências
- Epic 2 Story 2.1 (`manager_id`) — Story 4.6 só funciona com hierarquia preenchida

## Riscos
- 🟡 Drag-drop performance com 100+ pessoas — virtualizar quadrante se necessário
- 🟡 PDF com 100+ avatares vira pesado — paginar ou sumarizar

## Métricas pós-deploy
- # de snapshots criados/mês
- Tempo médio para finalizar um snapshot
- # de exports PDF gerados
