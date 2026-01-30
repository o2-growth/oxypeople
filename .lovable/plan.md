

# People Hub - Implementacao Completa

## Situacao Atual

O projeto tem apenas 4 paginas implementadas:
- **Dashboard** (`/`) - Funcionando
- **Feed** (`/feed`) - Funcionando 
- **Pessoas** (`/people`) - Funcionando
- **Auth** (`/auth`) - UI pronta (sem backend)

O sidebar referencia 5 rotas que retornam 404:
- `/recognition` - Reconhecimentos
- `/objectives` - Objetivos
- `/surveys` - Pesquisas
- `/company` - Empresa/Workspace
- `/settings` - Configuracoes

---

## Plano de Implementacao

### Fase 1: Criar Paginas Faltantes (Frontend)

#### 1.1 Pagina de Reconhecimentos (`/recognition`)
Sistema para enviar e receber reconhecimentos entre colaboradores.
- Cards de reconhecimentos recebidos/enviados
- Formulario para criar novo reconhecimento
- Leaderboard de mais reconhecidos
- Sistema de badges/conquistas
- Filtros por periodo e departamento

#### 1.2 Pagina de Objetivos (`/objectives`)  
Gestao de OKRs e metas individuais/equipe.
- Lista de objetivos com progresso visual
- Key Results vinculados a cada objetivo
- Filtros: Meus/Equipe/Empresa
- Timeline de updates
- Indicadores de saude (on-track/at-risk/off-track)

#### 1.3 Pagina de Pesquisas (`/surveys`)
Pesquisas de engajamento e clima organizacional.
- Lista de pesquisas ativas/concluidas
- Criar nova pesquisa (para admins)
- Responder pesquisas pendentes
- Dashboard de resultados com graficos
- Historico de participacao

#### 1.4 Pagina Empresa/Workspace (`/company`)
Gestao do workspace e membros.
- Informacoes da empresa (nome, dominio, logo)
- Lista de membros com roles (owner/admin/manager/member)
- Convites pendentes
- Import CSV de emails
- Departamentos e estrutura organizacional

#### 1.5 Pagina de Configuracoes (`/settings`)
Configuracoes do usuario e preferencias.
- Perfil do usuario (avatar, nome, bio)
- Notificacoes (email, push)
- Privacidade
- Tema (claro/escuro)
- Integrações

---

### Fase 2: Backend - Schemas do Banco de Dados

#### 2.1 Tabelas de Autenticacao e Usuarios
```text
public.users
+--------------------+-------------+
| id (UUID, PK)      | = auth.uid  |
| email              | TEXT        |
| full_name          | TEXT        |
| avatar_url         | TEXT        |
| locale             | TEXT        |
| last_active_at     | TIMESTAMPTZ |
| primary_company_id | UUID (FK)   |
| metadata           | JSONB       |
| created_at         | TIMESTAMPTZ |
| updated_at         | TIMESTAMPTZ |
+--------------------+-------------+
```

#### 2.2 Tabelas de Workspace e Roles
```text
companies
+--------------------+-------------+
| id (UUID, PK)      |             |
| name               | TEXT        |
| domain             | TEXT UNIQUE |
| owner_id           | UUID (FK)   |
| plan               | TEXT        |
| created_at/updated |             |
+--------------------+-------------+

company_memberships
+--------------------+-------------+
| id (UUID, PK)      |             |
| company_id         | UUID (FK)   |
| user_id            | UUID (FK)   |
| role               | TEXT (enum) |
| status             | TEXT (enum) |
| joined_at          | TIMESTAMPTZ |
| invited_by         | UUID (FK)   |
+--------------------+-------------+

invites
+--------------------+-------------+
| id (UUID, PK)      |             |
| company_id         | UUID (FK)   |
| email              | TEXT        |
| token              | TEXT        |
| expires_at         | TIMESTAMPTZ |
+--------------------+-------------+
```

#### 2.3 Tabelas do Feed Social
```text
posts
+--------------------+-------------+
| id (UUID, PK)      |             |
| company_id         | UUID (FK)   |
| author_id          | UUID (FK)   |
| content            | TEXT        |
| visibility         | TEXT (enum) |
| metadata           | JSONB       |
| created_at/updated |             |
+--------------------+-------------+

comments
+--------------------+-------------+
| id (UUID, PK)      |             |
| post_id            | UUID (FK)   |
| author_id          | UUID (FK)   |
| parent_comment_id  | UUID        |
| content            | TEXT        |
| created_at/updated |             |
+--------------------+-------------+

reactions
+--------------------+-------------+
| id (UUID, PK)      |             |
| post_id/comment_id | UUID        |
| user_id            | UUID (FK)   |
| type               | TEXT        |
| created_at         |             |
+--------------------+-------------+
```

#### 2.4 Tabelas de Reconhecimentos
```text
recognitions
+--------------------+-------------+
| id (UUID, PK)      |             |
| company_id         | UUID (FK)   |
| from_user_id       | UUID (FK)   |
| to_user_id         | UUID (FK)   |
| message            | TEXT        |
| badge_id           | UUID (FK)   |
| points             | INTEGER     |
| created_at         |             |
+--------------------+-------------+

badges
+--------------------+-------------+
| id (UUID, PK)      |             |
| company_id         | UUID (FK)   |
| name               | TEXT        |
| description        | TEXT        |
| icon_url           | TEXT        |
| points             | INTEGER     |
| active             | BOOLEAN     |
+--------------------+-------------+
```

#### 2.5 Tabelas de Objetivos (OKRs)
```text
objectives
+--------------------+-------------+
| id (UUID, PK)      |             |
| company_id         | UUID (FK)   |
| owner_id           | UUID (FK)   |
| title              | TEXT        |
| description        | TEXT        |
| due_date           | DATE        |
| status             | TEXT (enum) |
| progress           | INTEGER     |
| parent_id          | UUID (FK)   |
| visibility         | TEXT (enum) |
| created_at/updated |             |
+--------------------+-------------+

key_results
+--------------------+-------------+
| id (UUID, PK)      |             |
| objective_id       | UUID (FK)   |
| title              | TEXT        |
| target_value       | NUMERIC     |
| current_value      | NUMERIC     |
| unit               | TEXT        |
| created_at/updated |             |
+--------------------+-------------+
```

#### 2.6 Tabelas de Pesquisas
```text
surveys
+--------------------+-------------+
| id (UUID, PK)      |             |
| company_id         | UUID (FK)   |
| title              | TEXT        |
| description        | TEXT        |
| status             | TEXT (enum) |
| start_date         | DATE        |
| end_date           | DATE        |
| anonymous          | BOOLEAN     |
| created_by         | UUID (FK)   |
| created_at/updated |             |
+--------------------+-------------+

survey_questions
+--------------------+-------------+
| id (UUID, PK)      |             |
| survey_id          | UUID (FK)   |
| question_text      | TEXT        |
| question_type      | TEXT (enum) |
| options            | JSONB       |
| order_index        | INTEGER     |
| required           | BOOLEAN     |
+--------------------+-------------+

survey_responses
+--------------------+-------------+
| id (UUID, PK)      |             |
| survey_id          | UUID (FK)   |
| question_id        | UUID (FK)   |
| user_id            | UUID (FK)   |
| answer             | JSONB       |
| created_at         |             |
+--------------------+-------------+
```

---

### Fase 3: Politicas RLS (Row Level Security)

Para cada tabela, serao criadas politicas que garantem:
- Usuarios so veem dados da sua empresa
- Admins podem gerenciar usuarios e configuracoes
- Membros podem criar posts/reconhecimentos
- Respostas anonimas sao protegidas
- Convites so sao visiveis para admins e convidados

---

### Fase 4: Autenticacao Funcional

#### 4.1 Hook useAuth
- Signup com email/senha
- Login com email/senha
- Reset de senha
- Logout
- Estado de loading

#### 4.2 Sincronizacao de Usuario
- Trigger para criar registro em `public.users` apos signup
- Funcao de sync para atualizar perfil

#### 4.3 Protecao de Rotas
- Componente ProtectedRoute
- Redirect para /auth se nao autenticado
- Loading state durante verificacao

---

### Fase 5: Hooks e Queries

Criar hooks React Query para cada entidade:
- `useAuth()` - autenticacao
- `useUser()` - perfil do usuario logado
- `useCompany()` - empresa atual
- `useMembers()` - membros da empresa
- `usePosts()` - feed de posts
- `useRecognitions()` - reconhecimentos
- `useObjectives()` - objetivos/OKRs
- `useSurveys()` - pesquisas

---

## Ordem de Implementacao

1. **Paginas Frontend** - Criar as 5 paginas faltantes com dados mockados
2. **Database Schema** - Criar todas as tabelas via migrations
3. **RLS Policies** - Configurar seguranca por linha
4. **Autenticacao** - Implementar signup/login funcionais
5. **Hooks de Dados** - Conectar frontend ao backend
6. **Funcionalidades** - Integrar CRUD completo em cada pagina

---

## Arquivos a Serem Criados

### Novas Paginas
- `src/pages/Recognition.tsx`
- `src/pages/Objectives.tsx`
- `src/pages/Surveys.tsx`
- `src/pages/Company.tsx`
- `src/pages/Settings.tsx`

### Componentes de Reconhecimentos
- `src/components/recognition/RecognitionCard.tsx`
- `src/components/recognition/SendRecognition.tsx`
- `src/components/recognition/BadgeCard.tsx`
- `src/components/recognition/Leaderboard.tsx`

### Componentes de Objetivos
- `src/components/objectives/ObjectiveCard.tsx`
- `src/components/objectives/KeyResultItem.tsx`
- `src/components/objectives/ObjectiveProgress.tsx`
- `src/components/objectives/CreateObjective.tsx`

### Componentes de Pesquisas
- `src/components/surveys/SurveyCard.tsx`
- `src/components/surveys/QuestionRenderer.tsx`
- `src/components/surveys/SurveyResults.tsx`

### Componentes de Empresa
- `src/components/company/MembersList.tsx`
- `src/components/company/InviteModal.tsx`
- `src/components/company/RoleSelector.tsx`
- `src/components/company/CompanyInfo.tsx`

### Componentes de Configuracoes
- `src/components/settings/ProfileForm.tsx`
- `src/components/settings/NotificationSettings.tsx`
- `src/components/settings/ThemeToggle.tsx`

### Hooks e Providers
- `src/hooks/useAuth.ts`
- `src/hooks/useUser.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`

### Rotas Atualizadas
- `src/App.tsx` - adicionar todas as rotas

