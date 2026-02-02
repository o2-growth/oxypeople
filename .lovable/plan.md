
# Reformulacao do Modal "Novo Objetivo"

## Visao Geral

Atualizar o componente `CreateObjectiveDialog` para incluir todos os campos avancados mostrados na referencia visual, com logicas funcionais e validacoes apropriadas.

---

## Novos Campos a Implementar

### 1. Descricao do Objetivo (Titulo Principal)
- **Campo atual**: `title` - ja existe
- **Mudanca**: Renomear label para "Descricao do Objetivo" com placeholder "Ex.: aumentar receita recorrente"

### 2. Atividade (Ativo/Inativo)
- **Novo campo**: `isActive` - boolean
- **UI**: Radio group inline com opcoes "Ativo" e "Inativo"
- **Logica**: Define se o objetivo esta ativo ou pausado
- **Default**: Ativo

### 3. Responsavel
- **Campo atual**: Usado apenas para "individual"
- **Mudanca**: Sempre visivel, seleciona o dono principal do objetivo
- **UI**: Dropdown com avatar + nome (reutilizar PersonSelector)
- **Default**: Usuario logado

### 4. Contribuintes (Novo)
- **Novo campo**: `contributors` - array de user_ids
- **UI**: Multi-select com badges removiveis
- **Logica**: Pessoas que colaboram no objetivo mas nao sao o responsavel principal
- **Novo componente**: `MultiPersonSelector`

### 5. Area do Objetivo (Novo)
- **Novo campo**: Usa `team.department` ou novo campo
- **UI**: Select com departamentos da empresa
- **Logica**: Categoriza o objetivo por area (Growth, Tecnologia, Comercial, etc.)
- **Reutilizar**: `useDepartments` hook

### 6. Hierarquia (Novo - ja existe no banco)
- **Campo existente**: `parent_id` - ja existe na tabela
- **UI**: Select com objetivos existentes para vincular como pai
- **Logica**: Cria hierarquia de objetivos (OKR cascading)
- **Novo hook**: Buscar objetivos disponiveis para serem pais

### 7. Periodo (Novo)
- **Novo campo**: Periodo predefinido (Q1-Q4 ou custom)
- **UI**: Select com opcoes Q1 2026, Q2 2026, etc.
- **Logica**: Define automaticamente `due_date` baseado no periodo selecionado
- **Opcoes**: Q1, Q2, Q3, Q4 do ano atual e proximo

### 8. Colaboradores que podem Editar (Novo)
- **Novo campo**: `editors` - array de user_ids
- **UI**: Multi-select com badges
- **Logica**: Pessoas com permissao de editar o objetivo alem do responsavel
- **Reutilizar**: `MultiPersonSelector`

### 9. Etiquetas (Novo)
- **Novo campo**: `tags` - array de strings
- **UI**: Input com badges (Aspiracional, Comercial, etc.)
- **Logica**: Categorias personalizaveis
- **Valores predefinidos**: Aspiracional, Compromissada, Estrategico, Tatico, Operacional

---

## Estrutura de Arquivos

### Novos Arquivos:
```text
src/components/objectives/MultiPersonSelector.tsx    # Seletor multi-pessoa com badges
src/components/objectives/ParentObjectiveSelector.tsx # Seletor de objetivo pai
src/components/objectives/PeriodSelector.tsx          # Seletor de periodo Q1-Q4
src/components/objectives/TagsInput.tsx               # Input de etiquetas com badges
src/components/objectives/DepartmentSelector.tsx      # Seletor de departamento/area
```

### Arquivos a Editar:
```text
src/components/objectives/CreateObjectiveDialog.tsx   # Reformular com novos campos
src/hooks/useObjectives.ts                             # Atualizar CreateObjectiveInput
```

---

## Migracao do Banco de Dados

### Novos campos na tabela objectives:

```text
- is_active: boolean (default true) - Objetivo ativo/inativo
- period: text (nullable) - "Q1-2026", "Q2-2026", etc.
- department: text (nullable) - Area do objetivo
- tags: text[] (nullable) - Array de etiquetas
```

### Nova tabela objective_collaborators:

```text
- id: uuid
- objective_id: uuid (FK objectives)
- user_id: uuid (FK users)
- role: text ("contributor" | "editor")
- created_at: timestamp
```

Essa tabela permitira:
- Contribuintes: role = "contributor"
- Editores: role = "editor"

### RLS para objective_collaborators:
- SELECT: Membros da empresa podem ver
- INSERT/DELETE: Owner, admins, ou editores do objetivo

---

## Secao Tecnica

### Schema Atualizado do Formulario:

```text
const formSchema = z.object({
  title: z.string().min(1, "Descricao obrigatoria"),
  isActive: z.boolean().default(true),
  responsibleId: z.string().min(1, "Responsavel obrigatorio"),
  contributors: z.array(z.string()).default([]),
  department: z.string().optional(),
  parentId: z.string().optional(),
  period: z.string().optional(),
  editors: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  visibility: z.enum(["public", "company", "private"]),
  keyResults: z.array(keyResultSchema),
});
```

### MultiPersonSelector Props:

```text
interface MultiPersonSelectorProps {
  value: string[];                      // IDs selecionados
  onValueChange: (ids: string[]) => void;
  placeholder?: string;
  excludeIds?: string[];                // Excluir usuarios (ex: responsavel)
}
```

### ParentObjectiveSelector:
- Buscar objetivos da empresa (excluindo o atual se editando)
- Filtrar por visibilidade
- Exibir titulo + responsavel + progresso

### PeriodSelector:
- Gerar periodos dinamicamente baseado na data atual
- Calcular due_date automaticamente:
  - Q1: Jan 1 - Mar 31
  - Q2: Apr 1 - Jun 30
  - Q3: Jul 1 - Sep 30
  - Q4: Oct 1 - Dec 31

### TagsInput:
- Tags predefinidas como sugestoes
- Permitir criar tags customizadas
- Remover ao clicar no X

---

## Fluxo de Implementacao

1. Migracao do banco: adicionar novos campos e tabela
2. Atualizar types do Supabase
3. Criar componente MultiPersonSelector
4. Criar componente ParentObjectiveSelector
5. Criar componente PeriodSelector
6. Criar componente DepartmentSelector
7. Criar componente TagsInput
8. Atualizar CreateObjectiveDialog com nova UI
9. Atualizar useObjectives para salvar novos campos
10. Testar fluxo completo

---

## UI/UX do Modal

### Layout em Tabs (similar a referencia):
- **Tab "Gerais"**: Campos principais (atual)
- **Tab "Key Results"**: Adicionar KRs (separado para clareza)

### Campos em Grid:
```text
Row 1: [Descricao do Objetivo (flex-1)] [Atividade (w-auto)]
Row 2: [Responsavel (1/3)] [Contribuintes (1/3)] [Area (1/3)]
Row 3: [Hierarquia (1/2)] [Periodo (1/2)]
Row 4: [Colaboradores que podem editar (full)]
Row 5: [Etiquetas (full)]
```

### Estilo dos Badges:
- Contribuintes/Editores: Badge azul com X para remover
- Etiquetas: Badge outline com X para remover

### Footer do Dialog:
- Link "Saiba mais sobre Gestao de Objetivos" (opcional)
- Botao "Salvar" primario

---

## Dependencias

- Nenhuma nova dependencia necessaria
- Reutilizar: cmdk (Command), Badge, Avatar, Popover
- date-fns para manipulacao de datas do periodo

---

## Consideracoes

### Migracao de dados existentes:
- Objetivos existentes terao `is_active = true` por default
- `period` sera calculado baseado no `due_date` se existir

### Permissoes para Editores:
- Atualizar RLS de `objectives` para permitir UPDATE por editores
- Verificar na tabela `objective_collaborators` se user tem role "editor"

### Performance:
- MultiPersonSelector limita resultados a 20 usuarios
- Busca com debounce de 300ms
- Cache de queries com React Query
