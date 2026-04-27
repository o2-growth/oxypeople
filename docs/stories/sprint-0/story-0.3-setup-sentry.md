# Story 0.3 — Setup Sentry para error tracking

**Epic:** Sprint 0
**Sprint:** 0
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
ADR-009 escolheu Sentry como error tracking. Sem ele, bugs em prod são invisíveis. Free tier serve para o tamanho atual (5k events/mês).

## Acceptance Criteria

### AC1 — Conta Sentry criada e DSN obtido
**Given** projeto criado em sentry.io (free tier, organização da empresa)
**When** SDK adicionado
**Then** existe variável `VITE_SENTRY_DSN` em `.env.example` e configurada em staging/prod

### AC2 — SDK inicializado
**Given** `@sentry/react` instalado
**When** `src/main.tsx` é carregado
**Then** Sentry.init() é chamado com:
- `dsn: import.meta.env.VITE_SENTRY_DSN`
- `environment: import.meta.env.MODE` (development/production)
- `tracesSampleRate: 0.1` em prod, `1.0` em dev
- `replaysSessionSampleRate: 0.0` (desliga session replay no MVP)
- `replaysOnErrorSampleRate: 1.0` (replay apenas em erro)

### AC3 — Erro de teste captura
**Given** Sentry configurado em staging
**When** usuário dispara erro de teste (`Sentry.captureException(new Error("test"))`)
**Then** evento aparece no dashboard Sentry em <30s

### AC4 — Contexto de usuário enriquece evento
**Given** usuário autenticado
**When** erro ocorre
**Then** evento Sentry tem `user.id`, `user.email`, `user.company_id` (via `Sentry.setUser()` no `AuthContext`)

### AC5 — Source maps subidos
**Given** build de produção
**When** Vite build com `@sentry/vite-plugin`
**Then** source maps são enviados ao Sentry, stack traces aparecem com nome real (não minificado)

### AC6 — PII não vaza
**Given** Sentry config
**When** evento é enviado
**Then** `beforeSend` filtra:
- senhas (qualquer string com chave `password`, `token`, `secret`)
- emails de outros (apenas o do usuário ativo)

## Technical Notes
- Lib: `@sentry/react` + `@sentry/vite-plugin`
- Files: `package.json`, `src/main.tsx`, `vite.config.ts`, `.env.example`, `src/contexts/AuthContext.tsx` (setUser/clearUser)
- Auth token Sentry CLI (para upload de source maps) → guardar em GitHub Actions secrets ou Lovable env vars

## Test Plan
- Manual: forçar erro em staging e ver no dashboard
- Verificar payload via DevTools network: nenhum `password=`/`token=` em request body

## Dependencies
Nenhuma. Pode rodar em paralelo com 0.1, 0.2, 0.4.

## Definition of Done
- [ ] DSN configurado em todos os ambientes (.env, staging, prod)
- [ ] AC1-AC6 validados
- [ ] README de dev atualizado com link para Sentry dashboard
- [ ] Alerta configurado: notify on >5 errors/min
