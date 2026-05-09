## Objetivo
Implementar o fluxo completo de "Esqueci minha senha" que hoje está quebrado.

## Problema atual
- Link em `Auth.tsx` aponta para `/auth/reset` — rota inexistente (404).
- `AuthContext.resetPassword` existe mas não é usado em lugar nenhum.
- Falta a página `/reset-password` que trata o link de recuperação enviado por e-mail.

## O que vou criar

### 1. Página `src/pages/ForgotPassword.tsx` (rota `/auth/reset`)
- Formulário com um único campo (e-mail) usando RHF + Zod.
- Ao enviar: `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${window.location.origin}/reset-password })`.
- Mostra toast de sucesso ("Se este e-mail existir, enviamos um link…") **independente do retorno**, para não permitir enumeração de usuários.
- Layout reaproveitando o split-screen com o branding "Oxy People" usado em `Auth.tsx` (mesmo Card/estilos).
- Link "Voltar ao login".

### 2. Página `src/pages/ResetPassword.tsx` (rota `/reset-password`, pública)
- Detecta o tipo de fluxo (Supabase entrega via hash `#access_token=…&type=recovery` — o SDK já abre a sessão de recovery automaticamente via `onAuthStateChange` com event `PASSWORD_RECOVERY`).
- Usa `useEffect` + `supabase.auth.onAuthStateChange` para reagir a `PASSWORD_RECOVERY` e habilitar o form.
- Form com nova senha + confirmação (Zod, mínimo 8, igual confirmação).
- Submit: `supabase.auth.updateUser({ password })` → toast → `signOut` → redireciona para `/auth`.
- Trata caso de link expirado/ inválido (mostra mensagem e botão "Pedir novo link").

### 3. Roteamento em `src/App.tsx`
- Adicionar rotas **públicas** (fora do `ProtectedRoute`):
  - `/auth/reset` → `ForgotPassword`
  - `/reset-password` → `ResetPassword`

### 4. Garantia no `AuthContext`
- Verificar se o `onAuthStateChange` global não força redirect para `/` quando o evento é `PASSWORD_RECOVERY` (senão atrapalha o fluxo). Ajustar para ignorar esse evento na hora de navegar.

## Observações
- E-mail de recuperação: o projeto já usa o template padrão do Lovable Cloud, então o link sai automaticamente. Não precisa configurar template custom para isso funcionar.
- Não vou mexer em backend/RLS/migrations — é só frontend + um ajuste no contexto.
- Sem mudança de design system; mantém a identidade visual atual.

## Fora de escopo
- Customizar o template do e-mail (pode ser feito depois em "Cloud → Emails" se quiser).
- Forçar política de senha forte além do mínimo (8 caracteres + confirmação).