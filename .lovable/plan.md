

## Plano: Adicionar Seleção de Colaboradores Específicos na Pesquisa NPS

### Visão Geral
Adicionar uma nova opção de segmentação que permite ao admin selecionar colaboradores individuais para receber a pesquisa NPS, além das opções já existentes (toda empresa, departamentos e equipes).

### Mudanças no Banco de Dados

**Nova coluna na tabela `nps_surveys`:**

```sql
ALTER TABLE nps_surveys 
ADD COLUMN target_users UUID[] DEFAULT '{}';
```

Esta coluna armazenará um array de UUIDs dos colaboradores específicos selecionados para participar da pesquisa.

### Mudanças no Frontend

#### 1. Atualizar `CreateNPSSurveyCard.tsx`

Adicionar uma terceira seção de seleção na área de público-alvo:

**Novo estado:**
```typescript
const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
```

**Nova seção no formulário (quando `targetAll = false`):**
- Adicionar uma terceira coluna/seção para "Colaboradores"
- Reutilizar o componente `MultiPersonSelector` que já existe no projeto
- Exibir com ícone `UserRound` para diferenciar visualmente

**Layout atualizado:**
```text
Quando "Enviar para toda a empresa" está DESMARCADO:

+------------------------------------------------------------+
|  Departamentos     |  Equipes      |  Colaboradores        |
|  [Multi-select]    |  [Multi-select]|  [MultiPersonSelector]|
+------------------------------------------------------------+
```

#### 2. Atualizar `useNPSSurveys.ts`

**Atualizar interfaces:**
```typescript
export interface NPSSurvey {
  // ... campos existentes
  target_users: string[];  // Novo campo
}

export interface CreateNPSSurveyInput {
  // ... campos existentes
  target_users: string[];  // Novo campo
}
```

**Atualizar lógica de `useActiveNPSSurveys`:**

A query de pesquisas ativas precisa considerar também se o usuário está na lista `target_users`:

```typescript
// Filtrar pesquisas onde:
// 1. target_all = true (toda empresa), OU
// 2. usuário pertence a um departamento em target_departments, OU
// 3. usuário pertence a uma equipe em target_teams, OU
// 4. usuário está em target_users (NOVO)
```

Como a lógica de verificar departamento/equipe é complexa e já está funcionando no frontend, a implementação mais simples é:
- Retornar pesquisas ativas onde `target_all = true` OU `target_users` contém o user_id
- A filtragem por departamento/equipe continua como está

#### 3. Atualizar `handleSubmit` no `CreateNPSSurveyCard`

```typescript
await createSurvey.mutateAsync({
  // ... campos existentes
  target_users: targetAll ? [] : selectedUsers,  // Novo campo
});
```

### Fluxo de Uso

1. Admin desmarca "Enviar para toda a empresa"
2. Agora pode selecionar:
   - Departamentos específicos
   - Equipes específicas
   - **Colaboradores individuais** (novo)
3. Colaboradores selecionados aparecem como badges com opção de remover
4. Ao criar a pesquisa, os IDs são salvos em `target_users`
5. A pesquisa aparece para esses usuários específicos

### Seção Técnica

**Arquivos a modificar:**

1. **Migração SQL** - Adicionar coluna `target_users` na tabela `nps_surveys`

2. **`src/hooks/useNPSSurveys.ts`**:
   - Adicionar `target_users` às interfaces `NPSSurvey` e `CreateNPSSurveyInput`
   - Atualizar `useActiveNPSSurveys` para incluir pesquisas onde o usuário está em `target_users`

3. **`src/components/surveys/CreateNPSSurveyCard.tsx`**:
   - Importar `MultiPersonSelector` do objectives
   - Adicionar estado `selectedUsers`
   - Adicionar seção de seleção de colaboradores no formulário
   - Incluir `target_users` no submit

**Lógica de visibilidade da pesquisa:**

O colaborador verá a pesquisa se qualquer uma dessas condições for verdadeira:
- `target_all = true`
- Seu `department_id` está em `target_departments`
- Ele pertence a uma equipe cujo ID está em `target_teams`
- Seu `user_id` está em `target_users` (nova condição)

### Componente Visual Final

```text
+----------------------------------------------------------+
| E-NPS | Employee Net Promoter Score                       |
+----------------------------------------------------------+
|                                                          |
| [x] Enviar para toda a empresa                           |
|                                                          |
| OU (quando desmarcado):                                  |
|                                                          |
| Departamentos      | Equipes          | Colaboradores    |
| [Eng] [RH] [MKT]  | [Dev] [QA]       | [Seletor Multi]  |
|                   |                   | João ✕          |
|                   |                   | Maria ✕         |
|                                                          |
| Data de Encerramento: [Date Picker]                      |
|                                                          |
|                                      [Criar Pesquisa]    |
+----------------------------------------------------------+
```

