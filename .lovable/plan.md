
# Plano: Criar Usuários Completos via Sincronização Pipefy

## Problema Atual

A sincronização do Pipefy está criando **39 convites** na tabela `invites`, mas os colaboradores não estão aparecendo como usuários ativos no sistema. Você quer que cada pessoa do Pipefy seja criada como um usuário real com acesso imediato.

## Solução

Modificar a Edge Function `pipefy-sync` para usar a **Admin API do Supabase** (`auth.admin.createUser`) que permite criar usuários diretamente com email e senha definidos.

---

## Fluxo de Sincronização Atualizado

```text
1. Buscar registros do Pipefy
   |
2. Para cada registro com email:
   |
   +-- Usuário já existe no sistema?
   |   +-- SIM: Atualizar dados (cargo, departamento, etc.)
   |   |
   |   +-- NAO: Criar usuário via Admin API
   |           |
   |           +-- Criar em auth.users (com senha padrao)
   |           +-- Criar em public.users (perfil)
   |           +-- Criar company_membership (vinculo)
   |           +-- Criar user_role (permissao)
   |
3. Criar/atualizar departamentos e equipes
   |
4. Registrar log de sincronizacao
```

---

## Mudancas na Edge Function

### 1. Usar Admin API para Criar Usuarios

```typescript
// Criar usuario no auth.users com senha padrao
const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
  email: normalizedEmail,
  password: '123456',
  email_confirm: true, // Confirma email automaticamente
  user_metadata: {
    full_name: fullName,
  }
});

if (authError) {
  console.error('Error creating auth user:', authError);
  recordsSkipped++;
  continue;
}

const userId = authUser.user.id;
```

### 2. Criar Perfil em public.users

```typescript
// Criar registro na tabela public.users
await supabase.from('users').insert({
  id: userId,
  email: normalizedEmail,
  full_name: fullName,
  birth_date: birthDate,
  primary_company_id: companyId,
});
```

### 3. Criar Vinculo com Empresa

```typescript
// Criar company_membership
await supabase.from('company_memberships').insert({
  user_id: userId,
  company_id: companyId,
  status: 'active',
  position: position,
  department_id: departmentId,
  department: departmentName,
  hire_date: hireDate,
  employment_type: employmentType,
  joined_at: new Date().toISOString(),
});

// Criar user_role
await supabase.from('user_roles').insert({
  user_id: userId,
  company_id: companyId,
  role: 'member',
});
```

---

## Preferencia de Email

O sistema tentara usar o email corporativo @o2inc.com.br quando disponivel:

1. Se o campo "Email corporativo" estiver mapeado e preenchido, usar esse email
2. Caso contrario, usar o email pessoal como fallback

Para isso, sera adicionado um novo campo de mapeamento opcional na configuracao.

---

## Tratamento de Erros

- Se o usuario ja existe no auth.users (email duplicado), o sistema atualizara os dados
- Se a criacao falhar por qualquer motivo, incrementar `recordsSkipped`
- Logs detalhados serao registrados para debugging

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/pipefy-sync/index.ts` | Usar Admin API para criar usuarios completos |
| `src/components/hr/PipefyConfigDialog.tsx` | Adicionar campo opcional "Email corporativo" |

---

## Resultado Esperado

Apos a sincronizacao:
- **40 usuarios** aparecerao na pagina Pessoas
- Cada usuario tera acesso com email e senha `123456`
- Todos estarao com status "Ativo"
- Dados de cargo, departamento e data de contratacao estarao preenchidos

---

## Consideracoes de Seguranca

1. **Senha Padrao**: Todos os usuarios serao criados com senha `123456`. Recomenda-se orientar os colaboradores a alterarem a senha no primeiro acesso.

2. **Email Confirmado**: O `email_confirm: true` confirma automaticamente o email, permitindo login imediato.

3. **Service Role Key**: A Edge Function ja utiliza a `SUPABASE_SERVICE_ROLE_KEY`, que tem permissoes administrativas necessarias.
