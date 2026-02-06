
# Correção da Lógica de Novos Colaboradores

## Problema Identificado

O sistema está contando **40 colaboradores como novos** quando na verdade apenas **4 possuem menos de 30 dias** desde a data de contratação. Isso ocorre porque a lógica atual usa critérios incorretos:

- `usePeopleStats`: usa `created_at` (data do registro no sistema)
- `useDashboardStats`: usa `joined_at` (data de entrada no sistema)
- `pipefy-sync`: não define `is_new_hire` automaticamente baseado em `hire_date`

## Solucao

Unificar a lógica para que "novos colaboradores" sejam identificados exclusivamente pelo campo `is_new_hire = true`, que por sua vez deve ser calculado com base na `hire_date` (menos de 30 dias).

---

## Alteracoes Necessarias

### 1. Hook usePeopleStats

**Arquivo:** `src/hooks/usePeopleList.ts`

Alterar a contagem de "novos este mes" para contar colaboradores onde `is_new_hire = true`:

```typescript
// Substituir linhas 108-114
// De: conta por created_at >= monthStart
// Para: conta por is_new_hire = true

const { count: newThisMonth } = await supabase
  .from("company_memberships")
  .select("*", { count: "exact", head: true })
  .eq("company_id", companyId)
  .eq("status", "active")
  .eq("is_new_hire", true);
```

### 2. Hook useDashboardStats

**Arquivo:** `src/hooks/useDashboardStats.ts`

Alterar a contagem de "novos este mes" para usar `is_new_hire` ao inves de `joined_at`:

```typescript
// Substituir linhas 56-63
// De: conta por joined_at no mes atual
// Para: conta por is_new_hire = true

const { count: newThisMonth } = await supabase
  .from("company_memberships")
  .select("*", { count: "exact", head: true })
  .eq("company_id", companyId)
  .eq("status", "active")
  .eq("is_new_hire", true);
```

### 3. Edge Function pipefy-sync

**Arquivo:** `supabase/functions/pipefy-sync/index.ts`

Adicionar logica para calcular e definir `is_new_hire` baseado na data de contratacao:

```typescript
// Nova funcao helper
function isNewHire(hireDate: string | null): boolean {
  if (!hireDate) return false;
  const hire = new Date(hireDate);
  const today = new Date();
  const diffDays = Math.floor(
    (today.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 30;
}

// Aplicar ao criar/atualizar memberships
const isNewHireFlag = isNewHire(hireDate);
membershipInsert.is_new_hire = isNewHireFlag;
```

---

## Diagrama de Fluxo

```text
+-------------------+     +------------------+     +------------------+
|   Pipefy Sync     | --> |  hire_date       | --> |  is_new_hire     |
|   (importacao)    |     |  (DD/MM/YYYY)    |     |  (true/false)    |
+-------------------+     +------------------+     +------------------+
                                  |
                                  v
                          +------------------+
                          |  <= 30 dias?     |
                          +------------------+
                                  |
                   +--------------+--------------+
                   |                             |
                   v                             v
            is_new_hire=true             is_new_hire=false
            (4 colaboradores)            (33 colaboradores)
```

---

## Resultado Esperado

- Pagina Pessoas: card "Novos este mes" mostrara **4** (nao 40)
- Dashboard: estatistica de novos colaboradores mostrara **4**
- Automacao de boas-vindas: continuara funcionando corretamente pois ja usa `is_new_hire = true`
- Proximas sincronizacoes Pipefy: definirao automaticamente `is_new_hire` baseado na data de contratacao

---

## Arquivos a Modificar

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| `src/hooks/usePeopleList.ts` | Alterar query de stats |
| `src/hooks/useDashboardStats.ts` | Alterar query de novos |
| `supabase/functions/pipefy-sync/index.ts` | Adicionar calculo is_new_hire |

