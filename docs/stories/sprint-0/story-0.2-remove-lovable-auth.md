# Story 0.2 — Remove Lovable Auth dead code

**Epic:** Sprint 0
**Sprint:** 0
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
ADR-006: Lovable Auth (`@lovable.dev/cloud-auth-js`) coexiste com Supabase Auth, mas é dead code (apenas Supabase Auth é usado de fato). Manter aumenta superfície de bugs e confunde dev novo.

## Acceptance Criteria

### AC1 — Pacote removido do package.json
**Given** repo com dependência `@lovable.dev/cloud-auth-js`
**When** roda `bun remove @lovable.dev/cloud-auth-js` (ou npm/yarn equivalente)
**Then** dependência some do `package.json` e do lock

### AC2 — Imports removidos
**Given** arquivos `src/integrations/lovable/index.ts` e qualquer import de Lovable Auth no `src/pages/Auth.tsx`
**When** após refactor
**Then** nenhum `import` referenciando `@lovable.dev/cloud-auth-js` permanece (verificar com `grep -r "lovable"`)

### AC3 — Pasta integrations/lovable/ deletada
**Given** pasta `src/integrations/lovable/`
**When** Lovable removido
**Then** pasta inteira é removida (não deixar arquivos órfãos)

### AC4 — Auth.tsx funciona apenas com Supabase
**Given** página `/auth` carregada
**When** usuário faz signIn com email/senha válidos
**Then** redireciona para `/` com sessão ativa

**When** usuário faz signUp
**Then** cria account no Supabase Auth + envia confirmação

### AC5 — Sem regressão
**Given** testes manuais de fluxos críticos (login, logout, password reset)
**Then** todos funcionam igual ao antes

## Technical Notes
- Files: `package.json`, `src/pages/Auth.tsx`, `src/integrations/lovable/` (delete inteiro)
- Procurar referências: `grep -r "lovable" src/ --include="*.ts" --include="*.tsx"`
- AuthContext (`src/contexts/AuthContext.tsx`) já é o ponto único — não tocar
- Se houver `OAuth` button na página Auth via Lovable → remover (não havia OAuth real funcionando)

## Test Plan
- Manual: ciclo signUp → confirm email → signIn → signOut → resetPassword
- Automatizado: adicionar 1 teste E2E mínimo do flow auth (futuro Sprint 4 testes)

## Dependencies
Nenhuma. Pode rodar em paralelo com 0.1, 0.3, 0.4.

## Definition of Done
- [ ] Pacote removido do `package.json` e lockfile atualizado
- [ ] `grep -r "lovable" src/` retorna vazio
- [ ] Pasta `src/integrations/lovable/` deletada
- [ ] Login/signup/reset funcionam em staging
- [ ] PR reviewed
