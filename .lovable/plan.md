

## Correcao: Indicadores do Dashboard Zerados

### Causa Raiz

O problema e que o usuario logado (`joao.victor@o2inc.co.br`) tem `primary_company_id = null` na tabela `users` e nao possui nenhum registro na tabela `company_memberships`. Como **todos os hooks do dashboard** (e de praticamente todas as 44+ paginas do sistema) dependem de `primary_company_id` para buscar dados, tudo retorna zero.

A empresa "Minha Empresa" existe no banco e tem 40 membros, mas este usuario nao esta vinculado a ela.

### Solucao

A correcao envolve duas frentes:

---

### 1. Correcao Imediata (Dados)

Inserir o usuario na `company_memberships` e atualizar seu `primary_company_id` via migracao SQL:

- Inserir registro em `company_memberships` com `status = 'active'` e `role = 'owner'` (ja que e o criador/admin da plataforma)
- Atualizar `users.primary_company_id` para apontar para a empresa existente

---

### 2. Prevencao Futura (Codigo)

Adicionar logica automatica no `AuthContext.tsx` para que, apos o login bem-sucedido, o sistema:

1. Busque o perfil do usuario na tabela `users`
2. Se `primary_company_id` for `null`, busque se o usuario tem alguma `company_membership` ativa
3. Se encontrar, atualize o `primary_company_id` automaticamente
4. Se nao encontrar membership, busque a empresa pelo dominio do email (ex: `@o2inc.co.br` -> empresa com esse dominio) e crie a membership automaticamente

Alternativamente, de forma mais simples e segura:

- No hook `useUser`, apos carregar o perfil, se `primary_company_id` for null, verificar se existe membership e associar automaticamente
- Criar um hook `useEnsureCompanyMembership` que roda uma unica vez apos login

---

### Arquivos Modificados

1. **Migracao SQL** - Inserir membership e atualizar `primary_company_id` para o usuario atual
2. **`src/hooks/useUser.ts`** - Adicionar logica de auto-deteccao de empresa quando `primary_company_id` for null: buscar na `company_memberships` e, se encontrar, atualizar o campo automaticamente

---

### Detalhes Tecnicos

**Migracao SQL:**
```sql
-- Associar usuario existente a empresa
INSERT INTO company_memberships (user_id, company_id, status, role)
VALUES ('5f03dc08-...', 'a1b2c3d4-...', 'active', 'owner')
ON CONFLICT DO NOTHING;

-- Definir primary_company_id
UPDATE users 
SET primary_company_id = 'a1b2c3d4-...'
WHERE id = '5f03dc08-...' AND primary_company_id IS NULL;
```

**useUser.ts - Auto-fix logic:**
Apos carregar o perfil, se `primary_company_id` for null, executar uma query para encontrar membership ativa e atualizar o campo. Isso previne que futuros usuarios fiquem na mesma situacao (caso sejam convidados via `company_memberships` mas o campo `primary_company_id` nao tenha sido preenchido).

