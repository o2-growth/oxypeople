

## Plano: Atualizar senha de todos os usuários para "Alterar@01"

### Contexto
Todos os 98 usuários já possuem contas auth criadas (com senha padrão "123456" da sincronização Pipefy). O objetivo é atualizar a senha de todos para "Alterar@01".

### Implementação

**1. Criar Edge Function temporária `bulk-update-passwords`**
- Usa `supabase.auth.admin.updateUserById()` para cada usuário
- Itera sobre todos os registros da tabela `users`
- Define a senha como "Alterar@01" para cada um
- Inclui CORS headers e validação

**2. Executar a função uma vez via `curl_edge_functions`**
- Chamar a função após deploy para aplicar as senhas

**3. Remover a Edge Function após uso**
- Como é uma operação one-shot, a função será deletada depois

### Resultado
Todos os colaboradores poderão fazer login com seu email O2 + senha "Alterar@01".

