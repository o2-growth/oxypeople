# Story 5.7 — Cron de expiração de feedback requests

**Epic:** epic-05-feedback-continuo
**Sprint:** 3
**Status:** Approved (Plano A se Supabase Pro+; Plano B fallback)
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Pedidos com `due_date` vencido devem mudar para `status='expired'` automaticamente para limpar caixas de entrada e habilitar métrica "% no prazo" (Story 5.6). A migration `0009` já contém o cron `feedback-expire-daily` rodando às 23:00 UTC com SQL inline (sem edge function — basta UPDATE).

## Acceptance Criteria

### AC1 — Cron rodando
**Plano A (Supabase Pro+):**
**Given** migration `0009_pg_cron_jobs.sql` aplicada
**Then** existe job `feedback-expire-daily` em `cron.job` rodando `0 23 * * *`
**And** o body do job é exatamente:
```sql
UPDATE public.feedback_requests
SET status = 'expired', updated_at = now()
WHERE status = 'requested'
  AND due_date IS NOT NULL
  AND due_date < CURRENT_DATE;
```

**Plano B (Free):**
**Given** workflow `.github/workflows/feedback-expire-cron.yml`
**Then** chama um endpoint Supabase (RPC `expire_feedback_requests` ou edge function `feedback-expire`) diariamente 23:00 UTC

### AC2 — RPC alternativa (se Plano B)
**Given** migration aditiva `0009b_feedback_expire_rpc.sql` (caso Plano B)
**Then** define `CREATE FUNCTION public.expire_feedback_requests() RETURNS int SECURITY DEFINER` que executa o UPDATE e retorna # afetadas

### AC3 — Notificação opcional ao expirar (P1)
Marcar como TODO P1: notificar requester e respondent quando expira. MVP: silencioso.

### AC4 — Tela admin status do cron
**Given** admin em `/admin/feedback/analytics`
**Then** card "Manutenção" mostra:
- Última execução do `feedback-expire-daily` (lê `cron.job_run_details` via view `cron_jobs_status` da migration 0009)
- Próxima execução (calculada)
- # de requests expirados na última run

### AC5 — Botão "Executar agora" (admin)
**Given** admin
**When** clica "Forçar expiração agora"
**Then** chama RPC `expire_feedback_requests()` (criar se não existir)
**And** toast com # afetadas
**And** PostHog `feedback_expire_manual_run { count }`

### AC6 — Idempotência
**Given** cron roda 2x no mesmo dia
**Then** segunda execução afeta 0 rows (todos já estão `expired`)
**And** sem efeito colateral

### AC7 — Audit
Documentar TODO em comment: futuro audit log para registrar que admin forçou execução manual.

## Technical Notes
- **Migration:** `0009_pg_cron_jobs.sql` (se Plano A); `0009b` aditiva (RPC) se Plano B ou se botão manual ativo
- **Files novos:**
  - `src/components/admin/feedback/CronStatusCard.tsx`
  - `src/hooks/useFeedbackCronStatus.ts`
- **Files modificados:**
  - `src/pages/admin/FeedbackAnalytics.tsx` — incluir `<CronStatusCard />`
- **Padrões:** view `cron_jobs_status` já criada em 0009

## Test Plan
- **Integration SQL:** seedar 5 requests com `due_date < today`, executar UPDATE → todos viram `expired`
- **Idempotency:** rodar 2x → segunda afeta 0
- **Manual:** clicar "Executar agora" → toast com count

## Dependencies
- **Depends on:** Story 5.1 (dados existirem); migration 0009 aplicada
- **Decisão Plano A vs B** (mesma da Story 1.5 e 3.5)
- **Blocks:** —

## Definition of Done
- [ ] AC1-AC7 done
- [ ] Cron rodando 7 dias seguidos sem falha (Plano A) OU GitHub Actions executando (Plano B)
- [ ] Tests passing
- [ ] Lint clean
- [ ] Smoke: 1 request com `due_date` ontem fica expirado após cron
