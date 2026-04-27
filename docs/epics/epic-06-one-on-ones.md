# Epic 6 — 1:1s estruturadas

**Sprint:** 3
**Status:** 🔴 **CRÍTICO (RLS sensível)**
**Priority:** P0
**Estimate:** 1 sprint
**Migrations:** `0007_one_on_ones.sql`, `0009_pg_cron_jobs.sql` (recurrence)
**ADRs:** ADR-005 (ICS download, sem OAuth Google), ADR-008 (notas privadas em coluna única + visibility)

## Goal
Transformar 1:1s em ritual com pauta colaborativa, notas com visibilidade controlada, recorrência automática.

## Personas impactadas
Bruno (líder) · Camila (membro) · Renata (acompanha frequência)

## Stories

| # | Title | Estimate | File |
|---|---|---|---|
| 6.1 | Agendar 1:1 com recorrência | M | story-6.1 (lazy) |
| 6.2 | Tópicos colaborativos (drag/drop) | S | story-6.2 |
| 6.3 | **Notas com 3 visibilidades** | M | story-6.3 ⚠️ |
| 6.4 | Histórico das anteriores | S | story-6.4 |
| 6.5 | Download .ics | S | story-6.5 |
| 6.6 | Geração próxima recorrência (cron) | S | story-6.6 |
| 6.7 | Dashboard frequência por gestor | S | story-6.7 |

## Sequencing
1. 6.1 (agendar — fluxo mínimo)
2. 6.2 (tópicos — antes da reunião)
3. 6.3 (notas — durante a reunião)
4. 6.4 (histórico)
5. 6.5, 6.6, 6.7 em paralelo

## Definition of Done
- [ ] 5 1:1s reais conduzidas internamente
- [ ] **0 vazamentos** de notas privadas em test RLS (5 casos abaixo)
- [ ] .ics importa corretamente em Google Calendar e Outlook
- [ ] Recorrência cria próxima ocorrência ao completar
- [ ] Dashboard mostra % completadas vs agendadas

## Test plan obrigatório RLS — Story 6.3 🔴

```text
Setup: 1:1 entre L (leader) e M (member). Admin = A.

T1. L cria nota visibility='private_leader'
    → SELECT como L: deve retornar
    → SELECT como M: deve retornar VAZIO
    → SELECT como A: deve retornar VAZIO

T2. M cria nota visibility='private_member'
    → SELECT como M: deve retornar
    → SELECT como L: deve retornar VAZIO
    → SELECT como A: deve retornar VAZIO

T3. L cria nota visibility='shared'
    → SELECT como L: ✅
    → SELECT como M: ✅
    → SELECT como A: ✅ (admin vê via outras policies)

T4. L tenta INSERT visibility='private_member' (mismatch)
    → Deve falhar (WITH CHECK rejeita)

T5. Pessoa fora do 1:1 (X) tenta SELECT qualquer nota
    → Deve retornar VAZIO em todos os casos
```

**Os 5 testes acima são GATE para mergear a story.**

## Riscos crítico
- 🔴 **Vazamento de nota privada** = quebra de confiança total. Sem segunda chance.
- 🟡 Recorrência pode criar ocorrências duplicadas se cron rodar concorrente — usar `recurrence_parent_id` UNIQUE constraint adicional? (avaliar)
- 🟡 .ics timezone — usar TZID, não UTC offset

## Métricas pós-deploy
- 1:1s realizadas/agendadas (alvo ≥ 70%)
- # de notas privadas vs compartilhadas (saúde da prática)
- # de gestores ativos com 1:1s recorrentes
