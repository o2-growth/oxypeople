
# Plano: Reorganizar Página Empresa e Corrigir Sincronização Pipefy

## Problemas Identificados

### 1. Página Empresa com Dados Mockados
A página `/company` (Empresa) ainda usa `mockMembers` com dados fictícios ao invés de consumir dados reais do banco de dados.

### 2. Sincronização Pipefy Falhando
Os logs mostram 40 registros sincronizados, mas 0 criados e 0 atualizados porque:

**Erro 1 - Formato de Data Brasileiro:**
```
date/time field value out of range: "17/11/1997"
```
O Pipefy envia datas no formato `DD/MM/YYYY` mas o PostgreSQL espera `YYYY-MM-DD`.

**Erro 2 - Constraint de Foreign Key:**
```
Key (id)=(uuid) is not present in table "users"
insert or update on table "users" violates foreign key constraint "users_id_fkey"
```
A tabela `public.users` tem uma FK para `auth.users`. Não podemos inserir usuários diretamente sem criar no auth primeiro.

---

## Solução Proposta

### Parte 1: Corrigir a Página Empresa

Atualizar `/company` para usar dados reais:

- Remover `mockMembers` e importar hook `usePeopleList`
- Atualizar a aba "Membros" para mostrar dados reais do banco
- Atualizar a aba "Convites" para filtrar por status `invited`
- Adicionar estatísticas dinâmicas baseadas nos dados reais
- Integrar com `usePeopleStats` para contagens em tempo real

### Parte 2: Corrigir Edge Function pipefy-sync

**2.1 - Converter Datas do Formato Brasileiro:**
```typescript
function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  // Handle DD/MM/YYYY format
  const brFormat = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brFormat) {
    const [, day, month, year] = brFormat;
    return `${year}-${month}-${day}`;
  }
  
  // Return as-is if already in ISO format
  return dateStr;
}
```

**2.2 - Criar Usuários como "Pendentes" sem Auth:**
Modificar a abordagem de criação de usuários. Ao invés de inserir diretamente na tabela `users` (que requer auth), vamos:

1. Criar apenas o `company_membership` com status `pending`
2. Armazenar email e dados no campo `metadata` ou em colunas dedicadas
3. O usuário real será criado quando aceitar o convite via sistema de convites existente

Alternativamente, podemos criar um sistema de "usuários provisórios" ou usar a tabela `invites` para armazenar os dados do Pipefy até o usuário aceitar.

**Nova Abordagem Recomendada:**
- Para cada registro do Pipefy, criar um `invite` na tabela `invites`
- Armazenar dados extras (cargo, departamento) em um campo metadata
- Quando o usuário aceitar o convite, os dados são migrados para `users` e `company_memberships`

---

## Arquivos a Modificar

### Página Empresa
```
src/pages/Company.tsx
```
- Remover mockMembers
- Importar e usar usePeopleList, usePeopleStats
- Adaptar componente para dados reais

### Edge Function de Sincronização
```
supabase/functions/pipefy-sync/index.ts
```
- Adicionar função parseDate para converter DD/MM/YYYY -> YYYY-MM-DD
- Modificar lógica para criar invites ao invés de usuários diretos
- Atualizar apenas memberships de usuários que já existem no sistema

---

## Fluxo de Sincronização Corrigido

```
1. Buscar registros do Pipefy
   │
2. Para cada registro com email:
   │
   ├─ Usuário já existe no sistema?
   │   ├─ SIM: Atualizar company_membership (cargo, departamento, etc)
   │   │
   │   └─ NÃO: Criar invite na tabela 'invites'
   │           + Armazenar dados extras para uso posterior
   │
3. Criar/atualizar departamentos automaticamente
   │
4. Registrar log de sincronização
```

---

## Detalhes Técnicos

### Conversão de Datas
```typescript
function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  // DD/MM/YYYY -> YYYY-MM-DD
  const brMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  
  return dateStr;
}
```

### Membros na Página Empresa
```typescript
// Antes (mockado)
const mockMembers: Member[] = [...]

// Depois (dados reais)
const { data: people, isLoading } = usePeopleList();

const members = people?.map(p => ({
  id: p.id,
  name: p.user?.full_name || "",
  email: p.user?.email || "",
  avatar: p.user?.avatar_url || "",
  initials: getInitials(p.user?.full_name),
  role: p.role || "member",
  status: p.status,
  department: p.department_info?.name || "Sem departamento",
  joinedAt: formatJoinDate(p.created_at),
}));
```

---

## Benefícios

1. **Dados Reais**: Página Empresa mostra colaboradores reais do banco
2. **Sincronização Funcional**: Dados do Pipefy são importados corretamente
3. **Sem Duplicação**: Usa o mesmo hook da página Pessoas
4. **Consistência**: Ambas as páginas mostram os mesmos dados
5. **Convites Funcionam**: Novos colaboradores recebem convites para ativar conta

---

## Ordem de Implementação

1. Corrigir função `parseDate` no edge function `pipefy-sync`
2. Modificar lógica de criação para usar sistema de invites
3. Reimplantar edge function
4. Atualizar página Company para usar dados reais
5. Testar sincronização novamente
6. Verificar se colaboradores aparecem em ambas as páginas
