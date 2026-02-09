

# Empilhamento de Filtros na Pagina de Objetivos

## Problema Atual
Os filtros de **Tipo** (Estrategico/Tatico/Operacional) e **Status** (Ativo/Planejado/Em Risco/etc.) permitem selecionar apenas um valor por vez. Departamento e Dono ja suportam multi-selecao.

## Solucao
Converter Tipo e Status para multi-selecao com checkboxes (mesmo padrao visual de Departamento e Dono), permitindo combinar filtros livremente.

## Alteracoes

### 1. Hook `useObjectivesFilters.ts`
- Mudar `status: "all" | ObjectiveStatus` para `statuses: ObjectiveStatus[]` (array vazio = todos)
- Mudar `objectiveType: "all" | ObjectiveType` para `objectiveTypes: ObjectiveType[]` (array vazio = todos)
- Atualizar a logica de filtragem para verificar `includes()` quando o array nao esta vazio
- Atualizar `hasActiveFilters` e `clearFilters` para os novos campos
- Atualizar `defaultFilters`

### 2. Componente `ObjectivesContextBar.tsx`
- Substituir os `<Select>` de Tipo e Status por `<Popover>` com checkboxes (mesmo padrao de Area/Dono)
- Cada opcao com checkbox para marcar/desmarcar individualmente
- Badge no botao mostrando quantos estao selecionados
- Badges individuais removiveis na area de filtros ativos

### 3. Componente `ObjectivesFilters.tsx`
- Mesma conversao de `<Select>` para `<Popover>` com checkboxes para Tipo e Status

### 4. Pagina `Objectives.tsx`
- Atualizar referencias de `filters.status` e `filters.objectiveType` para os novos nomes de campo (`statuses`, `objectiveTypes`)

---

### Detalhes Tecnicos

**Estado do filtro (antes/depois):**
```text
ANTES                              DEPOIS
status: "all" | "active"...   -->  statuses: [] | ["active", "risk"]
objectiveType: "all" | ...    -->  objectiveTypes: [] | ["strategic", "tactical"]
```

**Logica de filtragem atualizada:**
```text
// Array vazio = sem filtro (mostra todos)
if (filters.statuses.length > 0 && !filters.statuses.includes(obj.status)) return false;
if (filters.objectiveTypes.length > 0 && !filters.objectiveTypes.includes(obj.type)) return false;
```

**Arquivos modificados:**
- `src/hooks/useObjectivesFilters.ts`
- `src/components/objectives/ObjectivesContextBar.tsx`
- `src/components/objectives/ObjectivesFilters.tsx`
- `src/pages/Objectives.tsx` (se houver referencias diretas)

