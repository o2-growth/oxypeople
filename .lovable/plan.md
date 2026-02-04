
## Plano: Adicionar Organograma da Empresa na Página Pessoas

### Visao Geral
Implementar uma visualizacao de organograma interativo na pagina Pessoas que mostra a hierarquia completa da empresa. O organograma sera expandivel em cascata, permitindo clicar em cada lider de departamento ou equipe para ver seus membros.

### Estrutura Hierarquica

```text
Empresa (Owner/CEO)
    |
    +-- Departamento 1 (Lider do Departamento)
    |       |
    |       +-- Equipe 1.1 (Lider da Equipe)
    |       |       +-- Membro A
    |       |       +-- Membro B
    |       |
    |       +-- Equipe 1.2 (Lider da Equipe)
    |               +-- Membro C
    |
    +-- Departamento 2 (Lider do Departamento)
            |
            +-- Equipe 2.1 (Lider da Equipe)
                    +-- Membro D
```

### Mudancas no Frontend

#### 1. Novo Componente: `OrgChartNode.tsx`

Componente recursivo que renderiza cada no do organograma:

```typescript
interface OrgChartNodeProps {
  name: string;
  role: string;
  avatarUrl?: string;
  color?: string;
  children?: React.ReactNode;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  level: number;
}
```

**Caracteristicas:**
- Avatar do colaborador/lider
- Nome e cargo/funcao
- Icone de expandir/colapsar (ChevronDown/ChevronRight)
- Linhas conectoras visuais (CSS)
- Animacao suave ao expandir/colapsar
- Cores diferenciadas por nivel hierarquico

#### 2. Novo Componente: `OrganizationChart.tsx`

Componente principal que gerencia todo o organograma:

**Estados:**
- `expandedNodes: Set<string>` - IDs dos nos expandidos
- `viewMode: 'vertical' | 'horizontal'` - Layout do organograma

**Funcoes:**
- `toggleNode(nodeId: string)` - Expande/colapsa um no
- `expandAll()` - Expande todos os nos
- `collapseAll()` - Colapsa todos os nos
- `buildHierarchy()` - Constroi a arvore de dados

**Layout:**
- Botoes para expandir/colapsar tudo
- Botao para alternar entre layout vertical/horizontal
- Area scrollavel para organogramas grandes

#### 3. Novo Hook: `useOrganizationHierarchy.ts`

Hook que busca e organiza os dados para o organograma:

```typescript
interface HierarchyNode {
  id: string;
  type: 'company' | 'department' | 'team' | 'member';
  name: string;
  role: string;
  avatarUrl?: string;
  color?: string;
  children: HierarchyNode[];
}

function useOrganizationHierarchy() {
  // Retorna a arvore hierarquica completa
}
```

**Logica de construcao:**
1. Buscar owner/admin da empresa (topo da hierarquia)
2. Buscar departamentos com seus lideres
3. Para cada departamento, buscar equipes vinculadas
4. Para cada equipe, buscar membros com suas funcoes (leader/member)
5. Agrupar membros sem departamento/equipe

#### 4. Atualizar `People.tsx`

Adicionar nova tab "Organograma":

```typescript
<TabsList>
  <TabsTrigger value="collaborators">Colaboradores</TabsTrigger>
  <TabsTrigger value="orgchart">Organograma</TabsTrigger>  {/* NOVO */}
  {isAdmin && (
    <>
      <TabsTrigger value="feedback">Feedback 30 Dias</TabsTrigger>
      <TabsTrigger value="nps">NPS</TabsTrigger>
    </>
  )}
</TabsList>

<TabsContent value="orgchart">
  <OrganizationChart />
</TabsContent>
```

### Design Visual do Organograma

```text
+------------------------------------------------------------------+
|  [Expandir Tudo] [Colapsar Tudo]  [Vertical | Horizontal]        |
+------------------------------------------------------------------+
|                                                                   |
|                    +------------------+                           |
|                    | [Avatar]         |                           |
|                    | Andrey Lopes     |                           |
|                    | Owner            |                           |
|                    +--------+---------+                           |
|                             |                                     |
|              +--------------+---------------+                     |
|              |                              |                     |
|     +--------+--------+            +--------+--------+            |
|     | [Avatar]        |            | [Avatar]        |            |
|     | Engenharia [v]  |            | Marketing  [v]  |            |
|     | Joao Silva      |            | Maria Santos    |            |
|     +--------+--------+            +--------+--------+            |
|              |                              |                     |
|       +------+------+                +------+------+              |
|       |             |                |             |              |
|   +---+---+     +---+---+        +---+---+     +---+---+          |
|   |Backend|     |Frontend|       | Social|     |Content|          |
|   +---+---+     +---+---+        +---+---+     +---+---+          |
|       |             |                |             |              |
|   [Members]     [Members]        [Members]     [Members]          |
|                                                                   |
+------------------------------------------------------------------+
```

### CSS/Tailwind para Linhas Conectoras

O componente usara pseudo-elementos CSS para criar as linhas:

```css
/* Linha vertical conectando ao pai */
.org-node::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 50%;
  height: 20px;
  border-left: 2px solid var(--border);
}

/* Linha horizontal conectando irmaos */
.org-children::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  border-top: 2px solid var(--border);
}
```

### Estados de Interacao

1. **Hover**: Destaque no card do no
2. **Clique no icone de expandir**: Mostra/esconde filhos com animacao
3. **Clique no card**: Abre modal com detalhes do colaborador (futuro)

### Secao Tecnica

**Arquivos a criar:**

1. `src/hooks/useOrganizationHierarchy.ts` - Hook para buscar e estruturar dados
2. `src/components/people/OrgChartNode.tsx` - Componente de no individual
3. `src/components/people/OrganizationChart.tsx` - Componente principal do organograma

**Arquivos a modificar:**

1. `src/pages/People.tsx` - Adicionar tab Organograma

**Dependencias:**
- Usa componentes existentes: Avatar, Card, Button, Collapsible
- Nao requer bibliotecas externas
- CSS puro para linhas conectoras

**Queries necessarias:**

```sql
-- Buscar hierarquia completa
-- 1. Owner da empresa
SELECT u.*, ur.role FROM users u 
JOIN user_roles ur ON ur.user_id = u.id 
WHERE ur.company_id = ? AND ur.role = 'owner';

-- 2. Departamentos com lideres
SELECT d.*, u.full_name, u.avatar_url 
FROM departments d 
LEFT JOIN users u ON u.id = d.leader_id
WHERE d.company_id = ?;

-- 3. Equipes por departamento com lideres
SELECT t.*, tm.user_id as leader_id, u.full_name, u.avatar_url
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.role = 'leader'
LEFT JOIN users u ON u.id = tm.user_id
WHERE t.company_id = ?;

-- 4. Membros por equipe
SELECT tm.*, u.full_name, u.avatar_url, u.email
FROM team_members tm
JOIN users u ON u.id = tm.user_id
WHERE tm.team_id = ?;

-- 5. Membros sem equipe (por departamento)
SELECT cm.*, u.full_name, u.avatar_url
FROM company_memberships cm
JOIN users u ON u.id = cm.user_id
WHERE cm.company_id = ? AND cm.department_id = ?
AND cm.user_id NOT IN (SELECT user_id FROM team_members);
```

**Performance:**
- Lazy loading: Filhos sao carregados apenas quando o no e expandido
- Cache com React Query
- Virtualizacao para empresas muito grandes (futuro)

### Fluxo de Uso

1. Usuario acessa a pagina Pessoas
2. Clica na tab "Organograma"
3. Ve o owner/CEO no topo
4. Clica em um departamento para expandir e ver as equipes
5. Clica em uma equipe para ver os membros
6. Pode usar "Expandir Tudo" para ver a estrutura completa
7. Pode usar "Colapsar Tudo" para resetar a visualizacao

