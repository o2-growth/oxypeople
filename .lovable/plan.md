## Diagnóstico

Testando o fluxo via logs do Auth, encontrei **dois problemas reais** (e um limite operacional):

1. **`ForgotPassword.tsx` mascara erros.** Hoje ele mostra o toast de sucesso "Enviamos um link..." **independente do retorno**. Os logs confirmam que a última solicitação retornou `429 over_email_send_rate_limit` — mas o usuário viu mensagem de sucesso e ficou esperando um e-mail que nunca chegou. Isso por si só explica boa parte do "não funciona".

2. **`ResetPassword.tsx` não trata o caso "link já consumido".** O Supabase, quando o token de recovery foi usado/expirou, devolve o usuário em `/reset-password?error=access_denied&error_code=otp_expired&error_description=...`. Hoje a página entra no `init()`, não encontra `code` nem hash de recovery, cai no fallback `getSession()` → como não há sessão, mostra "Link inválido". Funciona por acidente, mas a mensagem é genérica e o botão "Pedir novo link" só aparece se `errorDesc` estiver presente em `searchParams` antes de tudo. O parser atual lê `error_description`, mas o Supabase envia o erro no **hash** (`#error=...&error_code=otp_expired`) no fluxo implícito — não em querystring. Então hoje a detecção falha silenciosamente.

3. **Limite operacional (não-código):** o Supabase tem rate limit de poucos e-mails de recovery por hora por projeto. Isso não tem fix em código além de avisar o usuário corretamente (item 1).

Confirmei também que:
- A rota `/reset-password` é pública (não passa por `ProtectedRoute`). OK.
- O `redirectTo` em `ForgotPassword.tsx` aponta corretamente para `${origin}/reset-password`. OK.
- O `AuthContext.onAuthStateChange` não redireciona para fora de `/reset-password` quando o `SIGNED_IN` dispara. OK.
- A primeira solicitação do log (02:57:04) realmente enviou o e-mail e o `/verify` (02:57:16) funcionou — ou seja, **o fluxo feliz funciona**. O que você viu de "não funciona" é a combinação de (a) toast falso de sucesso quando o envio falha por rate limit e (b) mensagem ruim quando o link é consumido por scanner de e-mail.

## Mudanças

### 1. `src/pages/ForgotPassword.tsx` — refletir o resultado real
- Capturar `{ error }` do `resetPasswordForEmail`.
- Se `error` existir:
  - `over_email_send_rate_limit` ou status 429 → toast de erro: "Muitas tentativas. Aguarde alguns minutos antes de pedir um novo link."
  - Outros erros → toast genérico de erro com a mensagem.
- Se `error` for `null` → manter toast de sucesso atual ("Enviamos um link...").
- Manter o comportamento de **não revelar** se o e-mail existe (sucesso continua sendo mostrado em ambos os casos de "ok" e "user not found", que o Supabase já trata como sucesso).

### 2. `src/pages/ResetPassword.tsx` — tratar todos os formatos de retorno
Reescrever apenas o `init()` para detectar, nesta ordem:

1. **Erro do Supabase no hash ou querystring** (`error=...` com `error_code` como `otp_expired`, `access_denied`, etc.) → `setLinkInvalid(true)` e mostrar mensagem específica:
   - `otp_expired` → "Este link expirou ou já foi usado."
   - outros → "Link inválido."
2. **PKCE (`?code=...`)** → `exchangeCodeForSession(code)` (já implementado, manter).
3. **Implícito (`#access_token=...&type=recovery`)** → aguardar `PASSWORD_RECOVERY`/`SIGNED_IN` via `onAuthStateChange`; manter o `setTimeout(1500)` de fallback que faz `getSession()`.
4. **Sessão pré-existente** (usuário já autenticado abriu a página) → `setReady(true)`, mas mostrar um aviso sutil "Você está autenticado — definir nova senha encerrará suas sessões."
5. **Nada disso** → `setLinkInvalid(true)` com texto "Abra o link mais recente do seu e-mail."

Em `linkInvalid`, ajustar a mensagem de descrição do `Card` para refletir o motivo (expirado vs inválido) e manter o botão "Pedir novo link" apontando para `/auth/reset`.

### 3. Observação operacional para o usuário (não-código)
Após o deploy, esperar ~15 min para o rate limit zerar antes de testar de novo, e idealmente testar com um e-mail diferente do `rafael.fleck@o2inc.com.br` (que está no rate limit).

## Fora do escopo
- Não vou mexer em `AuthContext`, rotas ou backend — não há bug ali.
- Não vou alterar templates de e-mail nem configuração de domínio.
