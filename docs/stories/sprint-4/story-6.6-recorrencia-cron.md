# Story 6.6 — Geração da próxima ocorrência (cron)

**Epic:** epic-06-one-on-ones
**Sprint:** 4
**Status:** Approved
**Estimate:** S
**Priority:** P1
**Owner:** unassigned (Dex)

## Context
1:1s recorrentes precisam gerar a próxima instância automaticamente. Em vez de criar todas as ocorrências futuras de antemão (custoso e barulhento), geramos a próxima ocorrência APÓS uma ser concluída ou cancelada (status final).

ADR-005 (consequência): Sem OAuth Google → sem dependência externa para recorrência. Tudo via cron interno (`pg_cron` ou edge function scheduled).

**Pre-condition:** Story 6.1 entregue. Migrations `0007` e `0009_pg_cron_jobs.sql` aplicadas. Verificar extensão `pg_cron` habilitada.

## Acceptance Criteria

### AC1 — Trigger ao completar gera próxima
**Given** 1:1 com `recurrence='weekly'` e `status` muda para `'completed'`
**When** trigger AFTER UPDATE dispara
**Then** insere nova 1:1 com:
  - `leader_id`, `member_id`, `company_id`, `duration_minutes`, `location`, `recurrence` copiados da raiz
  - `scheduled_at = old.scheduled_at + interval '7 days'`
  - `recurrence_parent_id = COALESCE(old.recurrence_parent_id, old.id)` (sempre aponta pra raiz)
  - `status = 'scheduled'`

### AC2 — Mesma lógica para canceled e no_show
**Given** 1:1 recorrente vira `canceled` ou `no_show`
**Then** próxima ocorrência ainda é gerada (perdida não significa pular ritmo)
**And** evento PostHog `one_on_one_recurrence_generated` com `{trigger: 'completed'|'canceled'|'no_show'}`

### AC3 — Intervalos corretos
- `weekly` → +7 dias
- `biweekly` → +14 dias
- `monthly` → +1 month (usar `interval '1 month'` PostgreSQL — preserva dia do mês)

### AC4 — Cron de garantia (safety net)
**Given** edge function `one-on-one-recurrence-sweep` agendada (cron diário 03:00)
**When** roda
**Then** busca 1:1s recorrentes com `scheduled_at < now()` AND `status='scheduled'` há > 7 dias (esquecidas)
**And** marca como `'no_show'` automaticamente
**And** trigger AC1 dispara e gera próxima
**And** log estruturado conforme padrão `okr-escalation` (ver `supabase/functions/okr-escalation/index.ts`)

### AC5 — Sem duplicação concorrente
**Given** trigger e cron rodando simultaneamente
**Then** NÃO cria 2 próximas ocorrências para a mesma raiz
**And** estratégia: usar `INSERT ... WHERE NOT EXISTS (SELECT 1 FROM one_on_ones WHERE recurrence_parent_id = root_id AND scheduled_at = computed_next)` ou índice único parcial

### AC6 — Recorrência pode ser quebrada
**Given** usuário marca uma instância como `'completed'` mas quer parar a série
**When** clica "Não gerar próxima"
**Then** UPDATE `recurrence='none'` ANTES de mudar status; trigger pula geração se `recurrence='none'`

### AC7 — Audit log
**Given** geração automática
**Then** registro em `audit_log` (se tabela existe) ou pelo menos `console.log` estruturado da edge function

## Technical Notes
- **Migrations:** `0007_one_on_ones.sql` (tabela), `0009_pg_cron_jobs.sql` (jobs cron)
- **DB function nova (em migration adicional, NÃO em 0007):**
  ```sql
  CREATE OR REPLACE FUNCTION public.one_on_one_generate_next() RETURNS trigger ...
  ```
  Trigger: `AFTER UPDATE OF status ON one_on_ones WHEN (NEW.status IN ('completed','canceled','no_show') AND NEW.recurrence <> 'none')`
- **Files novos:**
  - `supabase/functions/one-on-one-recurrence-sweep/index.ts` (edge function safety-net)
  - `docs/migrations-draft/0010_one_on_one_recurrence.sql` (trigger + função)
- **Files modificados:**
  - `src/components/one-on-ones/OneOnOneList.tsx` (ação "Não gerar próxima")
- **Padrões:** seguir estrutura de `supabase/functions/okr-escalation/index.ts` — structured logging, per-company isolation, response com counts

### RLS Privacy Notes
- Trigger roda como `SECURITY DEFINER` (necessário para INSERT sem auth.uid()) — ⚠️ **garantir** que função só insere clones com mesmas FKs (leader, member, company); JAMAIS aceita parâmetros externos
- Edge function usa service role apenas para sweep — operações restritas a UPDATE de status e leitura — NUNCA expor service role ao client
- Próxima ocorrência herda RLS — só visível às mesmas partes

## Test Plan
- **Integration:** completar 1:1 weekly → verificar próxima criada com +7 dias
- **Integration:** cancelar 1:1 monthly → verificar próxima +1 month
- **Integration:** completar 1:1 com `recurrence='none'` → NADA acontece
- **Integration:** chamar edge function manualmente → varre 1:1s vencidas
- **Concorrência:** simular 2 triggers simultâneos → única próxima criada
- **Manual:** "Não gerar próxima" interrompe série

## Dependencies
- Story 6.1
- Migration `0007` aplicada
- Extensão `pg_cron` habilitada (verificar com @devops)
- Bloqueia: 6.7 (dashboard precisa de série de eventos para % completion)

## Definition of Done
- [ ] AC1-AC7 done
- [ ] Migration `0010` revisada por @architect
- [ ] Edge function deployada e cron agendado
- [ ] Logs estruturados visíveis no Supabase logs
- [ ] PR reviewed
- [ ] Documentado no RUNBOOK
