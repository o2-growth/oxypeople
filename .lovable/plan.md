## Problema
A página `/reset-password` mostra "Link inválido ou expirado" mesmo com link válido vindo do e-mail.

## Causa
O link de recuperação do Supabase chega como `?code=XXX` (fluxo PKCE), e não como `#access_token=...&type=recovery` (fluxo implícito antigo). Hoje o `ResetPassword.tsx`:
- Só espera o evento `PASSWORD_RECOVERY` ou uma sessão já existente.
- **Não chama `exchangeCodeForSession(code)`**, então a sessão de recovery nunca é criada → cai no "link inválido".

Adicionalmente, com PKCE o evento emitido após troca é `SIGNED_IN` (com `type=recovery` na URL), não `PASSWORD_RECOVERY`.

## Correção
Reescrever a lógica de inicialização de `src/pages/ResetPassword.tsx`:

1. Ao montar:
   - Ler `code` de `searchParams` (fluxo PKCE) **e** `type` do hash (fluxo antigo).
   - Se houver `code`: `await supabase.auth.exchangeCodeForSession(code)`. Se sucesso → `setReady(true)` e limpar a query string. Se erro → `setLinkInvalid(true)`.
   - Se houver hash `#type=recovery&access_token=...`: deixar o SDK processar (já é automático) e aguardar evento `PASSWORD_RECOVERY`/sessão.
   - Se já houver sessão ativa: `setReady(true)`.
   - Se nenhum dos casos: `setLinkInvalid(true)`.

2. Manter o `onAuthStateChange` reagindo a `PASSWORD_RECOVERY` **e** `SIGNED_IN` para liberar o form.

3. Após `updateUser({ password })` com sucesso → `signOut` + redirect para `/auth` (já existe).

## Observações
- Garantir que `https://oxypeople.lovable.app/reset-password` e `https://oxy-people.o2inc.com.br/reset-password` estejam nas Redirect URLs do Supabase (Auth → URL Configuration). Se não estiverem, o usuário cai num link de erro genérico antes mesmo de chegar à página — menciono no fim do plano para o usuário verificar.
- Sem mudanças em backend/migrations — só frontend.

## Fora de escopo
- Customizar template do e-mail.
- Endurecer política de senha.