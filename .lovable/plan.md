
# Correção: Busca de Colaboradores nos Seletores

## O Problema
Os seletores de pessoas (`PersonSelector` e `MultiPersonSelector`) não estão exibindo colaboradores como "Andrey Lopes" devido a um erro de ambiguidade no banco de dados.

A tabela `company_memberships` tem **duas** chaves estrangeiras que referenciam `users`:
- `user_id` -> usuário membro
- `invited_by` -> usuário que convidou

Quando a query usa `users!inner`, o Supabase não sabe qual relacionamento utilizar e retorna erro `PGRST201`.

## Arquivos Afetados

### 1. PersonSelector.tsx
Duas queries precisam correção:
- Linha 63: `users!inner` → `users!company_memberships_user_id_fkey`
- Linha 86: `users!inner` → `users!team_members_user_id_fkey` (para team_members)

### 2. MultiPersonSelector.tsx
Verificar se a correção anterior foi aplicada corretamente

## Correções Técnicas

```typescript
// PersonSelector.tsx - Query para Admin (linha 58-66)
const { data, error } = await supabase
  .from("company_memberships")
  .select(`
    user_id,
    department,
    users:user_id(id, full_name, email, avatar_url)
  `)
  .eq("company_id", companyId)
  .eq("status", "active");

// PersonSelector.tsx - Query para Team Leader (linha 82-88)
const { data, error } = await supabase
  .from("team_members")
  .select(`
    user_id,
    users:user_id(id, full_name, email, avatar_url)
  `)
  .in("team_id", ledTeamIds);
```

## Impacto
Após a correção:
- Todos os colaboradores ativos da empresa aparecerão nas buscas
- Andrey Lopes e outros membros serão listados corretamente
- Os seletores funcionarão tanto para Admin quanto para líderes de equipe
