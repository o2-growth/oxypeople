# Decisão — Story 0.2: Remover Lovable Auth

**Status:** Aguardando decisão (BLOQUEADA até user escolher A, B ou C)
**Data:** 2026-04-30
**Autor:** Dex (Frente A — Sprint 0 close)
**Story original:** [`docs/stories/sprint-0/story-0.2-remove-lovable-auth.md`](../stories/sprint-0/story-0.2-remove-lovable-auth.md)
**Referência:** ADR-006, commit `e7e1b90` ("Enable Google login backend", 2026-04-09)

---

## 1. Diagnóstico (estado atual)

Evidências coletadas via `grep` e leitura direta dos arquivos:

- **Lovable Auth está VIVO em produção, não é dead code.** A story 0.2 foi escrita assumindo que o pacote era apenas um resíduo, mas a auditoria mostrou o contrário:
  - `src/pages/Auth.tsx:11` importa `import { lovable } from "@/integrations/lovable/index";`
  - `src/pages/Auth.tsx:265` chama `await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` no botão "Continuar com Google"
  - `src/integrations/lovable/index.ts` usa `createLovableAuth()` do pacote `@lovable.dev/cloud-auth-js` (versão `^1.1.1` em `package.json:21`) e, depois do retorno do OAuth, chama `await supabase.auth.setSession(result.tokens)` — ou seja, Lovable atua como **broker OAuth** que entrega tokens para o Supabase consumir.
- **O que `e7e1b90` mudou:** É um merge commit ("Enable Google login backend") gerado pelo Lovable Cloud Editor em 09/04/2026. A mensagem afirma: *"Configured Google social auth provider and ensured frontend triggers signInWithOAuth('google'); prepared for Google OAuth client ID/secret via Lovable Cloud Auth Settings."*. **Não houve mudança de código fonte no diff** — a configuração foi feita do lado do Lovable Cloud (Client ID/Secret do Google armazenados lá). O commit apenas confirma que o fluxo Google passou a estar funcional em produção.
- **Provedor OAuth atualmente em produção:** Google está rodando do **lado Lovable Cloud** (Lovable hospeda Client ID/Secret e troca o code por tokens). Os tokens recebidos são então injetados na sessão Supabase via `setSession`. **Não há provider Google configurado nativamente no Supabase Auth Dashboard** (precisa confirmação manual no painel, mas o código pressupõe que não — caso contrário a indireção via Lovable seria desnecessária).
- **Email/senha e reset de senha** rodam 100% via Supabase nativo (`AuthContext.tsx:79-96`: `supabase.auth.signInWithPassword`, `supabase.auth.signUp`, `supabase.auth.resetPasswordForEmail`). Lovable só é usado para o botão Google.
- **Impacto em sessões existentes:** sessões são armazenadas em `localStorage` pelo cliente Supabase (`src/integrations/supabase/client.ts`: `auth: { storage: localStorage, persistSession: true, autoRefreshToken: true }`). Como o token final é sempre Supabase JWT (mesmo no fluxo Lovable→`setSession`), **nenhuma das três opções invalida sessões já ativas** — o refresh token continua válido até expirar. Apenas **novos logins via Google** mudam de fluxo. Usuários atualmente logados não percebem nada.

**Outras referências a "lovable" no código** (não relacionadas a auth, podem ser ignoradas pela decisão):
- `src/components/layout/AppSidebar.tsx:76` — apenas uma URL externa `https://oxyve.lovable.app` (link para outra app).

---

## 2. Três opções com diff concreto

### Opção A — Manter Lovable Auth indefinidamente

- **Resumo:** Cancelar a story 0.2; aceitar que Lovable é dependência permanente para Google OAuth.
- **Esforço:** XS — **0,5h** (apenas reabrir story como "won't do" e atualizar ADR-006).
- **Risco:** **MÉDIO**.
  - Cenário pior caso: Lovable Cloud sofre outage, deprecation do `@lovable.dev/cloud-auth-js` (pacote tem 3 anos de roadmap incerto e está em `^1.1.1`), ou mudança de pricing no Lovable. Como Google login é o único caminho social em produção, qualquer falha no Lovable = botão "Continuar com Google" quebrado para todos os tenants. Email/senha continua funcionando, mas perdemos um vetor crítico de aquisição B2B (RH/People Ops são heavy-users de Google Workspace).
- **Diff proposto:** Nenhum diff de código. Apenas atualizar ADR-006:

```diff filename=docs/architecture/adr-006-auth-strategy.md
- Status: Pendente migração (Story 0.2 — Sprint 0)
+ Status: Aceito — Lovable Auth permanece como broker OAuth para Google
+
+ Decisão (2026-04-30): Após auditoria do commit e7e1b90, confirmado que
+ Lovable Auth NÃO é dead code. Mantemos a dependência. Risco aceito:
+ vendor lock-in no Lovable Cloud para social login.
```

- **Plano de migração de sessões:** N/A (zero mudança de código).
- **Ação pós-decisão:**
  - Marcar story 0.2 como `Status: Won't Do`.
  - Atualizar `docs/architecture/adr-006-auth-strategy.md` (se existir; caso contrário criar).
  - Adicionar monitoring no Sentry para erros de `lovable.auth.signInWithOAuth` (filtro `error.message.includes("lovable")`).
  - Nenhum hook React Query, env var ou config Supabase precisa mudar.

---

### Opção B — Migrar Google OAuth para Supabase nativo; remover Lovable

- **Resumo:** Configurar provider Google no Supabase Auth Dashboard, trocar a chamada para `supabase.auth.signInWithOAuth("google", ...)`, deletar pasta `integrations/lovable/` e remover dependência.
- **Esforço:** **M — 4 a 6h** (1h config Supabase + Google Cloud Console; 1h refactor frontend; 1h teste manual em staging; 1-2h validação de redirect URLs em produção; buffer 1h).
- **Risco:** **MÉDIO**.
  - Cenário pior caso: redirect URI mismatch no Google Cloud Console quebra produção. Usuários clicam "Continuar com Google", são redirecionados ao Google, e voltam com erro 400 `redirect_uri_mismatch`. Mitigação: configurar TANTO `https://app.oxypeople.com/*` QUANTO `http://localhost:5173/*` na lista do Google Cloud Console **antes** do deploy; testar em staging primeiro. Outro risco: se algum usuário criou conta originalmente via Lovable broker e o `provider_id` no Supabase ficou diferente do que o fluxo nativo gera, pode haver duplicação de conta — **muito improvável**, pois Supabase identifica usuário por email (não por `provider_id`).
- **Diff proposto:**

```diff filename=src/pages/Auth.tsx
@@ -8,7 +8,6 @@ import { Sparkles, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
-import { lovable } from "@/integrations/lovable/index";
+import { supabase } from "@/integrations/supabase/client";

 const Auth = () => {
@@ -262,8 +261,11 @@ const Auth = () => {
                     onClick={async () => {
                       setIsLoading(true);
                       try {
-                        const { error } = await lovable.auth.signInWithOAuth("google", {
-                          redirect_uri: window.location.origin,
+                        const { error } = await supabase.auth.signInWithOAuth({
+                          provider: "google",
+                          options: {
+                            redirectTo: window.location.origin,
+                          },
                         });
                         if (error) {
                           toast({
```

```diff filename=package.json
@@ -18,7 +18,6 @@
     "@dnd-kit/sortable": "^9.0.0",
     "@dnd-kit/utilities": "^3.2.2",
     "@hookform/resolvers": "^3.10.0",
-    "@lovable.dev/cloud-auth-js": "^1.1.1",
     "@radix-ui/react-accordion": "^1.2.11",
```

```diff filename=src/integrations/lovable/index.ts
- // delete file inteiro (e a pasta src/integrations/lovable/ se ficar vazia)
- import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
- import { supabase } from "../supabase/client";
- const lovableAuth = createLovableAuth();
- ...
- export const lovable = { auth: { signInWithOAuth: ... } };
```

- **Plano de migração de sessões:**
  - Sessões ativas (Supabase JWT em localStorage) **continuam válidas** — refresh token roda como sempre.
  - Usuários que estiverem no meio de um redirect OAuth no momento exato do deploy podem ter um login frustrado (raro, ~segundos de janela). Solução: deploy em horário de baixo tráfego (madrugada BR).
  - Email do usuário Google deve casar com `auth.users.email` existente; se já tinha conta Google via Lovable, o Supabase reconhece e linka automaticamente (mesma `email` → mesmo `user_id`).
- **Ação pós-decisão:**
  - **Supabase Dashboard → Authentication → Providers → Google:** habilitar; colar `Client ID` e `Client Secret` (criar nas Google Cloud Console > APIs & Services > Credentials).
  - **Google Cloud Console:** adicionar `https://<PROJECT>.supabase.co/auth/v1/callback` como Authorized redirect URI (esta é a URL que o Supabase usa, não a do app).
  - Rodar `npm uninstall @lovable.dev/cloud-auth-js` (ou `bun remove`).
  - Rodar `rm -rf src/integrations/lovable/`.
  - **Não há hooks React Query a invalidar** (auth state é gerenciado pelo `onAuthStateChange` em `AuthContext.tsx:26`, que continua igual).
  - Nenhuma env var nova no `.env` do app — credenciais Google ficam só no Supabase Dashboard.
  - Validar que `npm run lint && npm run typecheck && npm test && npm run build` passam antes de mergear.

---

### Opção C — Remover Google login (apenas email/senha); revisitar depois

- **Resumo:** Esconder o botão Google na UI, deletar `integrations/lovable/` e remover dependência. Email/senha continua funcionando 100%.
- **Esforço:** **S — 1 a 2h** (15min refactor frontend; 30min teste manual; 30min update do ADR/story; buffer).
- **Risco:** **BAIXO–MÉDIO**.
  - Cenário pior caso: usuários que criaram conta originalmente via Google ficam **sem caminho de login** se nunca tiveram senha definida. Mitigação: rodar query no Supabase para identificar `auth.users WHERE raw_app_meta_data->>'provider' = 'google'` e enviar email de "defina sua senha" via `supabase.auth.resetPasswordForEmail` em massa. Se a base ainda for pequena (Sprint 0 = MVP, provavelmente < 50 usuários Google), risco real é baixo. Em produção mais matura, esse risco escala.
- **Diff proposto:**

```diff filename=src/pages/Auth.tsx
@@ -8,7 +8,6 @@ import { Sparkles, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
-import { lovable } from "@/integrations/lovable/index";

 const Auth = () => {
@@ -243,49 +242,7 @@ const Auth = () => {
                 </Button>
               </form>

-              <div className="mt-6">
-                <div className="relative">
-                  <div className="absolute inset-0 flex items-center">
-                    <Separator />
-                  </div>
-                  <div className="relative flex justify-center text-xs uppercase">
-                    <span className="bg-card px-2 text-muted-foreground">
-                      Ou continue com
-                    </span>
-                  </div>
-                </div>
-
-                <div className="mt-6">
-                  <Button
-                    variant="outline"
-                    className="w-full gap-2"
-                    disabled={isLoading}
-                    onClick={async () => {
-                      setIsLoading(true);
-                      try {
-                        const { error } = await lovable.auth.signInWithOAuth("google", {
-                          redirect_uri: window.location.origin,
-                        });
-                        if (error) {
-                          toast({
-                            title: "Erro ao entrar com Google",
-                            description: String(error),
-                            variant: "destructive",
-                          });
-                        }
-                      } finally {
-                        setIsLoading(false);
-                      }
-                    }}
-                  >
-                    <svg className="h-4 w-4" viewBox="0 0 24 24">
-                      ...
-                    </svg>
-                    Continuar com Google
-                  </Button>
-                </div>
-              </div>
-
               <p className="mt-6 text-center text-sm text-muted-foreground">
```

```diff filename=package.json
@@ -18,7 +18,6 @@
     "@dnd-kit/sortable": "^9.0.0",
     "@dnd-kit/utilities": "^3.2.2",
     "@hookform/resolvers": "^3.10.0",
-    "@lovable.dev/cloud-auth-js": "^1.1.1",
```

```diff filename=src/integrations/lovable/index.ts
- // delete file inteiro (deletar pasta src/integrations/lovable/)
```

Também remover import não usado (`Separator` pode continuar sendo usado em outro lugar — checar antes).

- **Plano de migração de sessões:**
  - Sessões Supabase ativas continuam funcionando.
  - **Usuários Google-only (sem senha) ficam órfãos** se nada for feito → **OBRIGATÓRIO** rodar SQL antes do deploy:
    ```sql
    -- Identificar (read-only, NÃO modifica nada)
    SELECT id, email, raw_app_meta_data->>'provider' as provider, last_sign_in_at
    FROM auth.users
    WHERE raw_app_meta_data->>'provider' = 'google';
    ```
  - Para cada usuário retornado, enviar email "defina sua senha" via UI admin ou loop com `supabase.auth.resetPasswordForEmail(email)`.
- **Ação pós-decisão:**
  - Rodar SQL identificador acima e exportar lista.
  - Disparar reset de senha em massa para esses usuários **antes** do deploy do código.
  - `npm uninstall @lovable.dev/cloud-auth-js` + `rm -rf src/integrations/lovable/`.
  - Atualizar ADR-006 com decisão "Google login removido temporariamente; reavaliar no Sprint 3 com Opção B".
  - Comunicar via banner/email aos usuários afetados.
  - Nenhuma config Supabase Dashboard precisa mudar.

---

## 3. Matriz comparativa

| Critério | Opção A — Manter Lovable | Opção B — Migrar p/ Supabase nativo | Opção C — Remover Google login |
|---|---|---|---|
| **Esforço** | XS (0,5h) | M (4–6h) | S (1–2h) |
| **Risco técnico** | MÉDIO (vendor outage) | MÉDIO (redirect URI) | BAIXO–MÉDIO (usuários órfãos) |
| **Reversibilidade** | Alta (não muda nada) | Alta (rollback = restaurar 1 import) | Média (Google login some até implementar B) |
| **UX impacto** | Zero | Zero (botão Google continua funcionando) | Negativo (botão some; usuários Google precisam reset) |
| **Stakeholders afetados** | Eng (manutenção) | Eng (dev + DevOps p/ Google Cloud Console) | Eng + Marketing/CS (comunicação aos usuários) + Suporte (reset em massa) |
| **Vendor lock-in** | Alto (Lovable Cloud) | Nenhum | Nenhum |
| **Dívida técnica gerada** | Mantém divergência ADR ↔ código | Quita ADR-006 | Cria nova dívida (re-implementar Google depois) |
| **Custo recorrente** | Lovable Cloud pricing | Zero (Google OAuth grátis até cota) | Zero |

---

## 4. Recomendação fundamentada — **Opção B**

Recomendo **migrar para Supabase nativo (Opção B)**, não A nem C. Três razões:

1. **Risco de vendor lock-in vs. esforço é assimétrico a favor de B.** A Opção A nos amarra a um pacote (`@lovable.dev/cloud-auth-js`) cuja governança é opaca e cujo único papel é fazer o que o próprio Supabase já faz nativamente. Trocar 6 linhas de código (`lovable.auth.signInWithOAuth` → `supabase.auth.signInWithOAuth`) em troca de eliminar uma dependência externa permanente é um trade-off que se paga em 1 sprint. A Opção A continua "barata" hoje, mas o custo aparece em 6–18 meses se o Lovable mudar termos ou descontinuar o pacote — e nesse momento o esforço de migração será o mesmo, só que sob pressão.
2. **A Opção C destrói valor de produto sem precisar.** Google login é vetor de aquisição relevante para uma SaaS de People Ops B2B no Brasil (RHs em PMEs vivem no Google Workspace). Remover o botão para "limpar dependência" é matar uma funcionalidade que já está rodando — e ainda gera trabalho operacional (reset de senha em massa) e atrito com usuários atuais. C só faz sentido se a Opção B fosse impraticável, e ela não é.
3. **B fecha a dívida do ADR-006 com baixa fricção.** O `AuthContext` já é 100% Supabase-nativo. O fluxo OAuth Supabase usa o mesmo `onAuthStateChange` listener que já está funcionando. Não há refactor de session lifecycle, não há mudança de storage, não há invalidação de cache do React Query. O único trabalho real é configuração no Google Cloud Console + Supabase Dashboard — e esse trabalho é 1x, não recorrente. Após B, a story 0.2 fecha "como pretendia" no ADR-006, e o Sprint 0 close fica limpo.

**Quando NÃO recomendaria B:** se descobrirmos no Supabase Dashboard que Google provider já está configurado e Lovable está só "de enfeite" (pouco provável, mas vale checar antes de implementar) — nesse caso a Opção B vira ainda mais fácil (puro refactor de 1 linha) e o argumento se reforça.

---

## 5. Próximos passos pós-decisão (checklist executável para o próximo Dex)

### Se decisão = Opção A (manter Lovable):
- [ ] Marcar `docs/stories/sprint-0/story-0.2-remove-lovable-auth.md` → `Status: Won't Do` com justificativa "Lovable Auth é load-bearing para Google OAuth (commit e7e1b90)"
- [ ] Atualizar/criar `docs/architecture/adr-006-auth-strategy.md` com seção "Decisão 2026-04-30: Lovable Auth aceito como broker permanente"
- [ ] Adicionar Sentry filter para erros do pacote `@lovable.dev/cloud-auth-js` (alerta no Slack se taxa > 1%/dia)
- [ ] Fechar Sprint 0 sem story 0.2

### Se decisão = Opção B (migrar para Supabase nativo) — **RECOMENDADO**:
- [ ] **Pré-deploy:** No Google Cloud Console > APIs & Services > Credentials, criar OAuth 2.0 Client ID; adicionar `https://<SUPABASE_PROJECT>.supabase.co/auth/v1/callback` em Authorized redirect URIs
- [ ] **Pré-deploy:** No Supabase Dashboard > Authentication > Providers > Google, habilitar e colar Client ID + Secret
- [ ] **Code:** Aplicar diff da Opção B em `src/pages/Auth.tsx`, remover linha de `package.json`, deletar `src/integrations/lovable/`
- [ ] **Verify:** Rodar `npm run lint && npm run typecheck && npm test && npm run build` — todos exit 0
- [ ] **Test:** Em staging, validar fluxo completo: clicar "Continuar com Google" → autorizar no Google → retornar logado em `/` com `session.user.email` correto
- [ ] **Deploy:** Madrugada BR; monitorar Sentry por 1h após deploy

### Se decisão = Opção C (remover Google login):
- [ ] **Pré-deploy:** Rodar SQL `SELECT id, email FROM auth.users WHERE raw_app_meta_data->>'provider' = 'google'` (read-only) e exportar lista
- [ ] **Pré-deploy:** Para cada email da lista, disparar `supabase.auth.resetPasswordForEmail(email)` (script Node.js de 20 linhas)
- [ ] **Pré-deploy:** Enviar email transacional comunicando "Login com Google temporariamente desativado — defina sua senha"
- [ ] **Code:** Aplicar diff da Opção C, deletar `src/integrations/lovable/`, remover linha de `package.json`
- [ ] **Verify:** Rodar `npm run lint && npm run typecheck && npm test && npm run build`
- [ ] **Backlog:** Criar story para Sprint 3 "Re-implementar Google login via Supabase nativo (Opção B)"

---

## Anexo — Arquivos consultados como evidência

- `src/pages/Auth.tsx` (linhas 11, 262–278)
- `src/contexts/AuthContext.tsx` (linhas 26–96)
- `src/integrations/lovable/index.ts` (arquivo inteiro — auto-gerado pelo Lovable)
- `src/integrations/supabase/client.ts` (config de storage/sessão)
- `package.json` (linha 21)
- `src/components/layout/AppSidebar.tsx` (linha 76 — referência não relacionada a auth, ignorar)
- `git show e7e1b90` (merge commit "Enable Google login backend")
- `docs/stories/sprint-0/story-0.2-remove-lovable-auth.md` (story original, agora desatualizada)
