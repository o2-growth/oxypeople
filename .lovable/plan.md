
# Sistema de Objetivos Hierarquicos com Permissoes

## Visao Geral

Implementar um sistema completo de OKRs (Objectives and Key Results) que permita:
- **Gestores gerais** (admin/owner) criar objetivos para equipes e individuais para qualquer pessoa
- **Gestores de equipe** (leader) criar objetivos para si mesmos e para membros de sua equipe
- **Membros** visualizar seus proprios objetivos e objetivos da equipe/empresa

---

## Estrutura de Permissoes

```text
+------------------+     +------------------+     +------------------+
| Owner/Admin      | --> | Team Leader      | --> | Member           |
| (Gestor Geral)   |     | (Gestor Equipe)  |     | (Colaborador)    |
+------------------+     +------------------+     +------------------+
        |                         |                        |
        v                         v                        v
- Criar para qualquer   - Criar para si       - Criar para si
  pessoa/equipe         - Criar para sua        (pessoais)
- Editar todos            equipe              - Visualizar da
- Visualizar todos      - Visualizar da         equipe/empresa
                          equipe/empresa
```

---

## Passo 1: Migracao do Banco de Dados

### Adicionar campos na tabela objectives:

- `team_id` (uuid, nullable) - Objetivo de equipe (quando definido)
- `assignee_id` (uuid, nullable) - Objetivo atribuido a uma pessoa especifica
- `created_by` (uuid, not null) - Quem criou o objetivo

### Criar enum para tipo de objetivo:

```text
CREATE TYPE objective_type AS ENUM ('personal', 'team', 'individual');
```

- `personal`: Objetivo criado para si mesmo
- `team`: Objetivo da equipe (todos os membros visualizam)
- `individual`: Objetivo atribuido a uma pessoa por um gestor

### Adicionar campo type:

- `type` (objective_type) - Tipo do objetivo

### Atualizar RLS Policies:

A nova policy de SELECT permitira visualizar:
1. Objetivos onde voce e o owner (criador)
2. Objetivos onde voce e o assignee (atribuido)
3. Objetivos de equipe onde voce e membro
4. Objetivos com visibility = 'company' da sua empresa

A nova policy de INSERT permitira criar:
1. Objetivos pessoais (owner_id = auth.uid())
2. Se admin/owner: qualquer objetivo
3. Se leader de equipe: objetivos para membros da sua equipe

---

## Passo 2: Hook useObjectives

### Arquivo: src/hooks/useObjectives.ts

```text
Funcoes:
- useObjectives() - Lista objetivos baseado em filtros
- useCreateObjective() - Criar novo objetivo
- useUpdateObjective() - Atualizar objetivo
- useDeleteObjective() - Remover objetivo
- useKeyResults() - Gerenciar Key Results
- useUserPermissions() - Verificar permissoes do usuario
```

### Logica de Permissoes no Hook:

```text
canCreateForTeam(teamId):
  - Retorna true se usuario e admin/owner da empresa
  - Retorna true se usuario e leader da equipe

canCreateForUser(userId):
  - Retorna true se userId == usuario atual
  - Retorna true se usuario e admin/owner
  - Retorna true se usuario e leader da equipe do userId

canEdit(objective):
  - Retorna true se e o criador
  - Retorna true se e admin/owner
  - Retorna true se e leader da equipe do objetivo
```

---

## Passo 3: Modal de Criacao de Objetivo

### Arquivo: src/components/objectives/CreateObjectiveDialog.tsx

### Campos do Formulario:

1. **Tipo de Objetivo** (Radio Group):
   - Pessoal (para mim)
   - Para Equipe
   - Individual (para uma pessoa)

2. **Campos Condicionais**:
   - Se "Para Equipe": Seletor de equipe
   - Se "Individual": Seletor de pessoa

3. **Dados do Objetivo**:
   - Titulo *
   - Descricao
   - Data limite
   - Visibilidade (pessoal/equipe/empresa)

4. **Key Results** (dinamico):
   - Adicionar/remover KRs
   - Titulo, Valor atual, Meta, Unidade

### Logica de Exibicao:

- Mostrar opcao "Para Equipe" apenas se usuario lidera alguma equipe ou e admin
- Mostrar opcao "Individual" apenas se usuario lidera alguma equipe ou e admin
- Filtrar lista de pessoas baseado em permissoes

---

## Passo 4: Seletor de Pessoa

### Arquivo: src/components/objectives/PersonSelector.tsx

```text
- Busca na API
- Filtra por equipes que o usuario lidera (se nao for admin)
- Avatar + Nome + Email + Departamento
```

---

## Passo 5: Seletor de Equipe

### Arquivo: src/components/objectives/TeamSelector.tsx

```text
- Lista equipes que o usuario pode gerenciar
- Admin: todas as equipes
- Leader: apenas equipes que lidera
```

---

## Passo 6: Atualizar Pagina de Objetivos

### Arquivo: src/pages/Objectives.tsx

### Mudancas:

1. Substituir dados mock por dados reais do Supabase
2. Adicionar estado para dialog de criacao
3. Conectar botao "Novo Objetivo" ao dialog
4. Atualizar tabs para filtrar por:
   - Todos (baseado em permissoes)
   - Meus (pessoais + atribuidos a mim)
   - Equipe (objetivos de equipes que participo)
   - Empresa (visibility = company)

### Stats Dinamicas:

- Calcular total de objetivos reais
- Agrupar por status (on-track, at-risk, off-track)

---

## Passo 7: Atualizar ObjectiveCard

### Arquivo: src/components/objectives/ObjectiveCard.tsx

### Mudancas:

1. Receber dados do banco (nao mais interface mock)
2. Exibir badge de tipo (Pessoal/Equipe/Individual)
3. Mostrar a quem foi atribuido (se individual)
4. Mostrar equipe (se objetivo de equipe)
5. Adicionar acoes (editar/excluir baseado em permissoes)
6. Exibir KeyResults reais do banco

---

## Passo 8: Edicao de Objetivo e Key Results

### Arquivo: src/components/objectives/EditObjectiveDialog.tsx

```text
- Reutilizar formulario de criacao
- Pre-preencher campos
- Atualizar objetivo e KRs
```

### Inline Edit para Key Results:

- Permitir atualizar `current_value` diretamente no card
- Recalcular progresso do objetivo automaticamente

---

## Estrutura de Arquivos

### Novos Arquivos:

```text
src/hooks/useObjectives.ts
src/hooks/useUserPermissions.ts
src/components/objectives/CreateObjectiveDialog.tsx
src/components/objectives/EditObjectiveDialog.tsx
src/components/objectives/PersonSelector.tsx
src/components/objectives/TeamSelector.tsx
```

### Arquivos a Editar:

```text
src/pages/Objectives.tsx
src/components/objectives/ObjectiveCard.tsx
src/components/objectives/KeyResultItem.tsx
```

---

## Secao Tecnica

### Schema do Objetivo (apos migracao):

```text
objectives:
  - id: uuid
  - company_id: uuid (FK companies)
  - owner_id: uuid (FK users) - criador
  - assignee_id: uuid (FK users) - atribuido (opcional)
  - team_id: uuid (FK teams) - equipe (opcional)
  - type: objective_type (personal/team/individual)
  - parent_id: uuid (FK objectives) - hierarquia
  - title: text
  - description: text
  - due_date: date
  - status: objective_status
  - progress: integer
  - visibility: post_visibility
  - created_at, updated_at: timestamp
```

### RLS Policy para SELECT:

```text
CREATE POLICY "View objectives"
ON objectives FOR SELECT
USING (
  is_company_member(auth.uid(), company_id)
  AND (
    owner_id = auth.uid()
    OR assignee_id = auth.uid()
    OR visibility = 'company'
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = objectives.team_id
        AND user_id = auth.uid()
      )
    )
  )
);
```

### RLS Policy para INSERT:

```text
CREATE POLICY "Create objectives"
ON objectives FOR INSERT
WITH CHECK (
  is_company_member(auth.uid(), company_id)
  AND owner_id = auth.uid()
  AND (
    -- Pessoal: apenas para si
    (type = 'personal' AND (assignee_id IS NULL OR assignee_id = auth.uid()))
    -- Admin pode criar qualquer
    OR is_company_admin(auth.uid(), company_id)
    -- Leader pode criar para sua equipe
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = objectives.team_id
        AND user_id = auth.uid()
        AND role = 'leader'
      )
    )
    OR (
      assignee_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_members tm1
        JOIN team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = auth.uid()
        AND tm1.role = 'leader'
        AND tm2.user_id = objectives.assignee_id
      )
    )
  )
);
```

### Funcao para verificar se e lider:

```text
CREATE FUNCTION is_team_leader(p_user_id uuid, p_team_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = p_user_id
    AND team_id = p_team_id
    AND role = 'leader'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Funcao para recalcular progresso:

```text
CREATE FUNCTION update_objective_progress()
RETURNS trigger AS $$
BEGIN
  UPDATE objectives
  SET progress = (
    SELECT COALESCE(
      AVG(
        LEAST(100, (current_value / NULLIF(target_value, 0)) * 100)
      )::integer,
      0
    )
    FROM key_results
    WHERE objective_id = COALESCE(NEW.objective_id, OLD.objective_id)
  )
  WHERE id = COALESCE(NEW.objective_id, OLD.objective_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Ordem de Implementacao

1. Migracao do banco de dados (novos campos + enum + funcoes)
2. Atualizar RLS policies
3. Criar hook useObjectives
4. Criar hook useUserPermissions
5. Criar componentes seletores (PersonSelector, TeamSelector)
6. Criar CreateObjectiveDialog
7. Atualizar pagina Objectives.tsx
8. Atualizar ObjectiveCard com dados reais
9. Atualizar KeyResultItem para edicao inline
10. Testar fluxo completo

---

## Fluxo de Usuario

### Gestor Geral:

1. Acessa /objectives
2. Clica "Novo Objetivo"
3. Escolhe tipo: "Para Equipe" ou "Individual"
4. Seleciona equipe ou pessoa
5. Preenche dados e KRs
6. Salva

### Gestor de Equipe:

1. Acessa /objectives
2. Clica "Novo Objetivo"
3. Ve opcoes: Pessoal, Para Equipe (sua), Individual (membros)
4. Seleciona tipo
5. Preenche dados
6. Salva

### Membro:

1. Acessa /objectives
2. Clica "Novo Objetivo"
3. Ve apenas opcao: Pessoal
4. Preenche dados
5. Salva

