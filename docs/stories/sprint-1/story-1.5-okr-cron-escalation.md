# Story 1.5 — OKR escalation cron

**Epic:** epic-01-okrs-hardening
**Sprint:** 1
**Status:** Approved (com flag — depende de plano Supabase)
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Edge function `okr-escalation` já existe mas nunca é chamada automaticamente — `pg_cron` está instalado mas sem job. Story configura o cron + tela admin para visualizar status.

**Plano A:** Supabase Pro+ → `pg_cron` (preferido — migration `0009`).
**Plano B:** Supabase Free → GitHub Actions schedule chamando edge function via webhook.

## Acceptance Criteria

### AC1 — Job de cron criado
**Plano A (Supabase Pro+):**
**Given** migration `0009_pg_cron_jobs.sql` aplicada (após confirmar plano)
**Then** existe job `okr-escalation-daily` em `cron.job` rodando às 09:00 UTC

**Plano B (Free):**
**Given** workflow `.github/workflows/cron-okr-escalation.yml` criado
**Then** dispara `curl POST https://<project>.supabase.co/functions/v1/okr-escalation` diariamente 09:00 UTC com Bearer service_role

### AC2 — Tela admin de status
**Given** admin acessa `/settings/okrs`
**Then** seção "Escalation automática" mostra:
- Status: **Ativo** / Inativo
- Última execução: HH:MM (timestamp local)
- Próxima execução: HH:MM
- Resultado da última: ✅ ok / ❌ erro com mensagem

### AC3 — Histórico das últimas 7 execuções
**Given** mesma tela
**Then** tabela com 7 últimas execuções:
- Timestamp
- Duração
- # de notificações criadas
- Status

**Plano A:** lê de `cron.job_run_details`
**Plano B:** lê de tabela nova `cron_run_logs` que a edge function popula a cada execução

### AC4 — Botão "Executar agora" (manual trigger)
**Given** admin
**When** clica botão
**Then** chama edge function imediatamente
**And** mostra resultado em <30s (loading state)

### AC5 — Configurações expostas
**Given** seção `OkrSettingsPanel.tsx`
**Then** mostra (read-only no MVP) os parâmetros:
- `risk_days_before_escalation`
- `overdue_days`
- `checkin_frequency`
**And** para edição, redirecionar para uma futura tela em P1

### AC6 — Edge function instrumentada
**Given** edge function `okr-escalation` 
**When** roda
**Then** retorna JSON com `{ success, notificationsCreated, durationMs, errors[] }`
**And** loga via `console.log` (vai para Supabase Logs / function logs)

## Technical Notes

### Plano A
- **Migration:** `0009_pg_cron_jobs.sql` 
- **Pré-requisitos:** rodar manualmente:
  ```sql
  SELECT vault.create_secret('SERVICE_ROLE_KEY', 'service_role_key');
  ALTER DATABASE postgres SET app.supabase_url = 'https://xyz.supabase.co';
  ```
- **Files novos:** —
- **Files modificados:**
  - `src/components/objectives/OkrSettingsPanel.tsx` (nova seção)
  - `src/hooks/useOkrCronStatus.ts` (lê view `cron_jobs_status`)

### Plano B
- **Files novos:**
  - `.github/workflows/cron-okr-escalation.yml`
  - tabela `cron_run_logs` (nova migration aditiva)
  - hook `useCronRunLogs`
- Service role key como GitHub secret

## Test Plan
- **Manual:** disparar execução manual → ver notification chegando ao owner de KR em risco
- **Monitorar 7 dias:** verificar execução diária sem falha (alerta Sentry se 2 dias sem execução)

## Dependencies
- ⚠️ **D1: Confirmar plano Supabase** (Pro+ libera Plano A)
- Migration 0003 aplicada (objectives podem ter `commitment_type` — escalation deve respeitar)

## Definition of Done
- [ ] Plano definido (A ou B)
- [ ] Job rodando 7 dias seguidos sem falha
- [ ] Tela admin operacional
- [ ] AC1-AC6 done
- [ ] PR mergeado
- [ ] Alerta Sentry configurado: notify se cron falhar 2x seguidas
