
# Gestao de Departamentos na Pagina Empresa

## Visao Geral

Implementar um sistema completo de gestao de departamentos na pagina Empresa (`/company`), permitindo criar, editar e excluir departamentos, alem de visualizar e gerenciar a alocacao de membros e equipes por departamento.

---

## Situacao Atual

- A aba "Departamentos" exibe dados estaticos/mockados
- Departamentos sao derivados do campo `teams.department` (texto livre)
- Membros possuem campo `department` na tabela `company_memberships`
- Nao existe uma tabela dedicada para departamentos

---

## Arquitetura Proposta

### Nova Tabela: `departments`

```text
departments
- id: uuid (PK)
- company_id: uuid (FK companies)
- name: text (nome do departamento)
- description: text (opcional)
- color: text (cor para identificacao visual, ex: #3B82F6)
- leader_id: uuid (FK users, lider do departamento - opcional)
- created_at: timestamp
- updated_at: timestamp
```

### Relacionamentos Atualizados

- `teams.department_id`: FK para `departments.id` (substituindo o campo texto)
- `company_memberships.department_id`: FK para `departments.id` (opcional, alem do texto atual)

---

## Funcionalidades a Implementar

### 1. Botao "Novo Departamento" no Header
- Adicionar ao lado do botao "Convidar Membros"
- Abre modal de criacao de departamento

### 2. Modal Criar/Editar Departamento
Campos:
- Nome do departamento (obrigatorio)
- Descricao (opcional)
- Cor de identificacao (seletor de cor predefinido)
- Lider do departamento (select de membros da empresa)

### 3. Aba "Departamentos" Redesenhada
- Cards de departamento com dados reais do banco
- Cada card exibe:
  - Nome e cor do departamento
  - Lider (avatar + nome)
  - Numero de membros
  - Numero de equipes vinculadas
  - Menu de acoes (Editar, Gerenciar Membros, Excluir)

### 4. Dialog "Gerenciar Departamento"
- Visualizacao detalhada do departamento
- Duas abas: "Membros" e "Equipes"
- **Aba Membros**:
  - Lista de membros alocados no departamento
  - Botao "Adicionar Membro" (select de membros da empresa)
  - Remover membro do departamento
- **Aba Equipes**:
  - Lista de equipes vinculadas ao departamento
  - Indicador de quantos membros cada equipe tem
  - Link para gerenciar equipe em /teams

### 5. Visualizacao Hierarquica (Opcional)
- Toggle para alternar entre Grid e Hierarquia
- Visao em arvore: Empresa > Departamentos > Equipes > Membros

---

## Estrutura de Arquivos

### Novos Arquivos:

```text
src/hooks/useDepartmentsManager.ts        # CRUD de departamentos (expandir useDepartments)
src/components/company/CreateDepartmentDialog.tsx   # Modal criar/editar
src/components/company/DepartmentCard.tsx           # Card de departamento
src/components/company/ManageDepartmentDialog.tsx   # Dialog gerenciar membros/equipes
src/components/company/DepartmentMembersList.tsx    # Lista de membros do departamento
src/components/company/DepartmentTeamsList.tsx      # Lista de equipes do departamento
```

### Arquivos a Editar:

```text
src/pages/Company.tsx                     # Integrar novos componentes
src/hooks/useDepartments.ts               # Adicionar queries para nova tabela
```

---

## Secao Tecnica

### Migracao do Banco de Dados

```text
-- Criar tabela departments
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  leader_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index para buscas por empresa
CREATE INDEX idx_departments_company ON departments(company_id);

-- Constraint de unicidade nome por empresa
ALTER TABLE departments ADD CONSTRAINT departments_name_company_unique 
  UNIQUE (company_id, name);

-- RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Members can view departments"
  ON departments FOR SELECT
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  USING (is_company_admin(auth.uid(), company_id));

-- Adicionar FK em teams (opcional, pode manter texto)
ALTER TABLE teams ADD COLUMN department_id uuid REFERENCES departments(id);

-- Adicionar FK em company_memberships
ALTER TABLE company_memberships ADD COLUMN department_id uuid REFERENCES departments(id);

-- Trigger para updated_at
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Hook useDepartmentsManager

```text
interface Department {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  color: string;
  leader_id: string | null;
  leader?: { id: string; full_name: string; avatar_url: string };
  member_count: number;
  team_count: number;
}

- useDepartmentsWithDetails(): Query departamentos com contagem de membros/equipes
- useCreateDepartment(): Mutation para criar
- useUpdateDepartment(): Mutation para atualizar
- useDeleteDepartment(): Mutation para excluir
- useAssignMemberToDepartment(): Mutation para alocar membro
- useRemoveMemberFromDepartment(): Mutation para remover membro
```

### DepartmentCard Props

```text
interface DepartmentCardProps {
  department: Department;
  onEdit: (department: Department) => void;
  onManage: (department: Department) => void;
  onDelete: (departmentId: string) => void;
}
```

### ManageDepartmentDialog

```text
- Fetch membros do departamento via company_memberships.department_id
- Fetch equipes via teams.department_id
- Permitir adicionar/remover membros
- Exibir equipes vinculadas (somente leitura, editar em /teams)
```

---

## Fluxo de Implementacao

1. Criar migracao do banco: tabela departments + FK
2. Criar hook `useDepartmentsManager` com CRUD completo
3. Criar componente `CreateDepartmentDialog` 
4. Criar componente `DepartmentCard` com design similar a TeamCard
5. Criar componente `ManageDepartmentDialog` com tabs Membros/Equipes
6. Atualizar `Company.tsx`:
   - Adicionar botao "Novo Departamento" no header
   - Substituir dados mockados por dados reais na aba Departamentos
   - Integrar dialogs de criacao e gerenciamento
7. Atualizar modal de criacao de equipe para usar select de departamentos

---

## UI/UX

### Cards de Departamento

```text
+------------------------------------------+
| [Cor] [Nome do Departamento]      [...] |
|                                          |
| Lider: [Avatar] Nome do Lider           |
|                                          |
| [12 membros]  [3 equipes]               |
+------------------------------------------+
```

### Cores Predefinidas

```text
const departmentColors = [
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Amarelo', value: '#EAB308' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Cinza', value: '#6B7280' },
];
```

### Layout Responsivo

- Desktop: Grid 3 colunas para cards
- Tablet: Grid 2 colunas
- Mobile: 1 coluna

---

## Consideracoes de Seguranca

- RLS garante isolamento por empresa
- Apenas admins podem criar/editar/excluir departamentos
- Membros podem visualizar departamentos da empresa
- Nao expor leader_id sem validacao de membership

---

## Migracao de Dados Existentes

Para preservar departamentos ja definidos nas equipes:

```text
-- Criar departamentos a partir dos textos existentes
INSERT INTO departments (company_id, name)
SELECT DISTINCT company_id, department
FROM teams
WHERE department IS NOT NULL AND department != ''
ON CONFLICT (company_id, name) DO NOTHING;

-- Atualizar FK nas teams
UPDATE teams t
SET department_id = d.id
FROM departments d
WHERE t.company_id = d.company_id AND t.department = d.name;
```

---

## Dependencias

- Nenhuma nova dependencia necessaria
- Reutilizar componentes: Dialog, Tabs, Avatar, Badge, Card
- Reutilizar hooks: useCompanyMembers, useTeams
