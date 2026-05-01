# Story 3.5 — Edge function pulse-dispatch + cron horário

**Epic:** epic-03-pulse-survey
**Sprint:** 3
**Status:** Approved (Plano A se Supabase Pro+; Plano B fallback)
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Sem dispatch automático, o usuário não fica sabendo do Pulse. Story entrega edge function `pulse-dispatch` que, a cada hora, identifica `pulse_surveys` que devem ser enviados (de acordo com `frequency`, `day_of_week`/`day_of_month`, `send_hour_utc` e `last_dispatched_at`) e gera notificações in-app para os usuários alvo. O cron `pulse-dispatch-hourly` (já em `0009_pg_cron_jobs.sql`) chama a função.

**Plano A (Supabase Pro+):** `pg_cron` via migration 0009.
**Plano B (Free):** GitHub Actions schedule.

## Acceptance Criteria

### AC1 — Edge function existe
**Given** `supabase/functions/pulse-dispatch/index.ts` criada
**When** chamada via POST com `Authorization: Bearer <service_role_key>`
**Then** retorna JSON `{ success: boolean, dispatched: number, skipped: number, errors: [{ pulseId, message }], durationMs }`
**And** resposta HTTP 200 mesmo se houver erros parciais (per-pulse isolation, ver `okr-escalation` como referência)

### AC2 — Critério de "due"
Pulse é "due" para envio se TODAS as condições verdadeiras:
- `active = true`
- `now() at time zone 'utc'` está dentro da hora `send_hour_utc` (ex.: 12:00-12:59 se `send_hour_utc=12`)
- Para `frequency=weekly`: `EXTRACT(DOW FROM now()) = day_of_week`
- Para `frequency=biweekly`: `day_of_week` casa E (semana ISO atual - semana ISO de `created_at`) é par
- Para `frequency=monthly`: `EXTRACT(DAY FROM now()) = day_of_month`
- `last_dispatched_at IS NULL OR last_dispatched_at < now() - interval '23 hours'` (idempotência: não enviar 2x na mesma janela)

### AC3 — Resolução do alvo
**Given** pulse com `target_all=true`
**Then** alvo = todos `users` ativos da `company_id`

**Given** `target_all=false`
**Then** alvo = `users` ativos onde `department_id IN target_departments` UNION `team_id IN target_teams` (DISTINCT por user_id)

### AC4 — Geração de notificações
**Given** alvo identificado (N usuários)
**Then** edge function faz bulk INSERT em `notifications` em batches de 100 (evitar timeout):
- `type = 'pulse_request'`
- `title = 'Pulse: ' || pulse.name`
- `message = pulse.question`
- `reference_id = pulse.id`
- `reference_type = 'pulse_survey'`
- `link = '/pulse/' || pulse.id`
- `user_id = <cada usuário alvo>`
- `company_id = pulse.company_id`
**And** UPDATE `pulse_surveys.last_dispatched_at = now()`

### AC5 — Idempotência
**Given** dispatch é executado 2x na mesma hora (cron retry)
**Then** segundo run vê `last_dispatched_at < 23h` e marca como `skipped`
**And** não duplica notificações

### AC6 — Cron schedule
**Plano A:** `cron.job` `pulse-dispatch-hourly` rodando `0 * * * *` (já em migration 0009)
**Plano B:** `.github/workflows/pulse-dispatch-cron.yml` rodando `0 * * * *` chamando `curl POST .../functions/v1/pulse-dispatch -H "Authorization: Bearer ${SERVICE_ROLE_KEY}"`

### AC7 — Tela de status admin
**Given** admin em `/admin/pulse-surveys`
**Then** cabeçalho mostra: "Próximo dispatch: HH:MM UTC" (calculado client-side)
**And** linha de cada pulse mostra "Último envio: dd/MM HH:MM" (de `last_dispatched_at`)
**And** se `last_dispatched_at` é > 25h atrás e pulse `active=true` e devia ter sido enviado → badge ⚠️ "Dispatch atrasado"

### AC8 — Logs e observabilidade
**Given** edge function loga via `console.log` estruturado: `{ event: 'pulse_dispatch_run', pulseId, targetCount, duration, status }`
**Then** logs ficam em Supabase Functions Logs
**And** se `errors.length > 0`, reportar para Sentry via `Sentry.captureMessage` (Sentry já wired — ver commit 4a16328)

## Technical Notes
- **Migration:** `0009_pg_cron_jobs.sql` aplicada (Plano A) — pré-requisitos manuais (vault.create_secret, ALTER DATABASE app.supabase_url) listados no migration
- **Files novos:**
  - `supabase/functions/pulse-dispatch/index.ts` (Deno)
  - `supabase/functions/pulse-dispatch/_lib/dueCheck.ts` (lógica AC2 isolada)
  - `supabase/functions/pulse-dispatch/_lib/dispatchPulse.ts` (lógica AC3+AC4)
  - `supabase/functions/_shared/sentry.ts` (se ainda não existe; reuso de `okr-escalation`)
  - Plano B: `.github/workflows/pulse-dispatch-cron.yml`
- **Files modificados:**
  - `src/pages/admin/PulseSurveys.tsx` — exibir status de dispatch (AC7)
  - `src/hooks/usePulseSurveysAdmin.ts` — incluir `last_dispatched_at`
- **Padrões a seguir:** estrutura idêntica a `supabase/functions/okr-escalation/index.ts` (per-company isolation, structured response)
- **Service role key:** edge function usa `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` — chave bypassa RLS para INSERT em `notifications`

## Test Plan
- **Unit:** `dueCheck` — mock now() em diferentes horas/dias → retorna boolean correto para cada frequency
- **Integration (manual):** disparar via `supabase functions invoke pulse-dispatch` localmente com pulse criado para "agora" → 1 dispatch
- **Integration:** disparar 2x — segundo retorna `skipped`
- **Production smoke:** após deploy, esperar 1h e verificar 1 pulse weekly enviou notificação para os usuários esperados

## Dependencies
- **Depends on:** Story 3.1 (edge function lê de `pulse_surveys`)
- **Migration 0009 e Plano A/B definido** (mesma decisão de Story 1.5)
- **Blocks:** parcialmente Story 3.3 (sem dispatch, dados longitudinais demoram)

## Definition of Done
- [ ] AC1-AC8 done
- [ ] Edge function deployada (`supabase functions deploy pulse-dispatch`)
- [ ] Cron rodando 7 dias seguidos sem falha
- [ ] Sentry recebendo erros se houver
- [ ] PostHog event `pulse_dispatched { pulse_id, target_count }` (tracking server-side via PostHog Node SDK na edge — ou pular se complexo)
- [ ] Smoke test: 1 pulse weekly com sucesso de envio
