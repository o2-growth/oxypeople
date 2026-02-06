
# Plano: Módulo RH com Integração Pipefy

## Visão Geral

Criar um módulo completo de RH e Recrutamento com integração ao Pipefy, permitindo sincronizar colaboradores, cargos, departamentos e equipes diretamente do banco de dados do Pipefy para a plataforma People Hub.

## Arquitetura da Integração

```text
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   People Hub    │────▶│   Edge Function      │────▶│    Pipefy API   │
│   Frontend      │     │   pipefy-sync        │     │   (GraphQL)     │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                  │
                                  ▼
                        ┌──────────────────────┐
                        │   Supabase Tables    │
                        │   (users, teams,     │
                        │    departments,      │
                        │    memberships)      │
                        └──────────────────────┘
```

## Localização na Navegação

Nova página `/hr` adicionada ao grupo **"Gestão"** da sidebar, junto com Empresa, Equipes e Configurações.

**Menu:**
- Empresa
- **RH** (novo)
- Equipes
- Configurações

## Funcionalidades do Módulo RH

### 1. Painel Principal
- Estatísticas de RH (total colaboradores, ativos, inativos, por departamento)
- Status da última sincronização com Pipefy
- Botão para sincronização manual

### 2. Sincronização Pipefy
- Conexão OAuth2 usando Service Account (client_credentials)
- Busca de dados de Database Tables do Pipefy
- Mapeamento de campos para tabelas existentes
- Histórico de sincronizações

### 3. Gestão de Colaboradores
- Lista completa com dados vindos do Pipefy
- Filtros por departamento, equipe, cargo, status
- Criação automática de usuários e convites
- Vinculação com departamentos e equipes existentes

### 4. Configuração de Mapeamento
- Interface para mapear campos do Pipefy para campos do People Hub
- Seleção de qual Database Table usar como fonte
- Configuração de campos obrigatórios

## Estrutura do Banco de Dados

### Nova Tabela: `pipefy_sync_config`
```sql
CREATE TABLE pipefy_sync_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  table_id text NOT NULL, -- ID da Database Table no Pipefy
  field_mapping jsonb NOT NULL DEFAULT '{}',
  -- Ex: {"email": "campo_email", "full_name": "nome_completo", "department": "departamento"}
  last_sync_at timestamptz,
  sync_status text DEFAULT 'never',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id)
);
```

### Nova Tabela: `pipefy_sync_logs`
```sql
CREATE TABLE pipefy_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running', -- running, success, error
  records_synced integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_skipped integer DEFAULT 0,
  error_message text,
  details jsonb DEFAULT '{}'
);
```

## Armazenamento Seguro das Credenciais

As credenciais do Pipefy serão armazenadas como secrets do Supabase:

| Secret | Valor |
|--------|-------|
| PIPEFY_CLIENT_ID | nSPWKHFmE7QQYhfXiOChhhe1FywzfocF0cOSuO66c8I |
| PIPEFY_CLIENT_SECRET | lDthDA2rgXUR_JcE3roBFVSAObLoqVoSRwIHB5CNClE |
| PIPEFY_TOKEN_URL | https://app.pipefy.com/oauth/token |

## Edge Functions

### 1. `pipefy-auth` - Autenticação OAuth2
```typescript
// Obtém token usando client_credentials grant
// POST para https://app.pipefy.com/oauth/token
// Body: grant_type=client_credentials, client_id, client_secret
```

### 2. `pipefy-sync` - Sincronização Principal
```typescript
// 1. Obtém token OAuth2
// 2. Consulta Database Tables via GraphQL
// 3. Para cada registro:
//    - Verifica se usuário existe (por email)
//    - Cria ou atualiza em public.users
//    - Cria/atualiza company_membership
//    - Vincula a departamento/equipe
// 4. Registra log de sincronização
```

### 3. `pipefy-tables` - Lista Tables Disponíveis
```typescript
// Consulta organization e retorna lista de Database Tables
// Usado na configuração de mapeamento
```

## Fluxo de Sincronização

1. **Autenticação**: Edge function obtém token OAuth2 do Pipefy
2. **Consulta GraphQL**: Busca todos os registros da Database Table configurada
3. **Processamento**:
   - Para cada registro, extrai campos mapeados
   - Verifica se usuário já existe (pelo email)
   - Se não existe: cria em `public.users` e `company_memberships`
   - Se existe: atualiza informações (cargo, departamento, equipe)
4. **Pós-processamento**:
   - Cria convite automático para novos usuários
   - Vincula a departamentos existentes (ou cria novos)
   - Atualiza contadores e estatísticas
5. **Log**: Registra resultado da sincronização

## Queries GraphQL do Pipefy

### Listar Database Tables
```graphql
{
  organization(id: $orgId) {
    tables {
      edges {
        node {
          id
          name
          table_fields {
            id
            label
            type
          }
        }
      }
    }
  }
}
```

### Buscar Registros de uma Table
```graphql
{
  table_records(table_id: $tableId, first: 100) {
    edges {
      node {
        id
        title
        record_fields {
          name
          value
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

## Componentes da UI

### Página Principal: `/hr`
- **HRDashboard**: Painel com estatísticas e ações
- **PipefySyncStatus**: Status da conexão e última sincronização
- **PipefyConfigPanel**: Configuração de mapeamento de campos
- **SyncHistoryTable**: Histórico de sincronizações

### Componentes
```text
src/pages/HR.tsx
src/components/hr/
  ├── HRStats.tsx           # Estatísticas de RH
  ├── PipefySyncCard.tsx    # Card de status da sincronização
  ├── PipefyConfigDialog.tsx # Modal de configuração
  ├── FieldMappingTable.tsx  # Mapeamento de campos
  ├── SyncHistoryList.tsx    # Lista de sincronizações
  └── ImportPreview.tsx      # Preview antes de importar
```

### Hooks
```text
src/hooks/usePipefySync.ts     # Gerencia sincronização
src/hooks/usePipefyTables.ts   # Lista tables disponíveis
src/hooks/useSyncHistory.ts    # Histórico de syncs
```

## Fluxo de Primeira Configuração

1. Usuário acessa `/hr` pela primeira vez
2. Sistema detecta que não há configuração
3. Exibe wizard de configuração:
   - Passo 1: Verificar conexão com Pipefy (testar credenciais)
   - Passo 2: Selecionar Database Table fonte
   - Passo 3: Mapear campos (email, nome, cargo, departamento, equipe)
   - Passo 4: Executar primeira sincronização
4. Após sincronização, colaboradores aparecem na página Pessoas

## Mapeamento de Campos Sugerido

| Campo People Hub | Campo Pipefy (exemplo) | Tipo |
|------------------|------------------------|------|
| email | E-mail | Obrigatório |
| full_name | Nome Completo | Obrigatório |
| position | Cargo | Opcional |
| department | Departamento | Opcional |
| team | Equipe | Opcional |
| hire_date | Data de Admissão | Opcional |
| employment_type | Tipo de Contrato | Opcional |
| birth_date | Data de Nascimento | Opcional |

## Integração com Página Pessoas

Após a sincronização:
- Novos colaboradores aparecem automaticamente em `/people`
- Status inicial: `invited` (até aceitarem convite)
- Departamentos/equipes são criados automaticamente se não existirem
- Dados são atualizados a cada sincronização

## Arquivos a Criar

```text
# Páginas
src/pages/HR.tsx

# Componentes
src/components/hr/HRStats.tsx
src/components/hr/PipefySyncCard.tsx
src/components/hr/PipefyConfigDialog.tsx
src/components/hr/FieldMappingTable.tsx
src/components/hr/SyncHistoryList.tsx
src/components/hr/ImportPreview.tsx

# Hooks
src/hooks/usePipefySync.ts
src/hooks/usePipefyTables.ts
src/hooks/useSyncHistory.ts

# Edge Functions
supabase/functions/pipefy-sync/index.ts
supabase/functions/pipefy-tables/index.ts
```

## Arquivos a Modificar

```text
src/App.tsx                          # Adicionar rota /hr
src/components/layout/AppSidebar.tsx # Adicionar item RH no menu Gestão
```

## Segurança

- Credenciais armazenadas como Supabase Secrets (nunca no código)
- Edge Functions executam no servidor (credenciais não expostas ao cliente)
- Token OAuth2 tem expiração automática
- RLS policies protegem dados de sincronização por empresa
- Apenas admins podem configurar e executar sincronizações

## Ordem de Implementação

1. Adicionar secrets do Pipefy ao Supabase
2. Criar tabelas de configuração e logs no banco
3. Criar Edge Functions de autenticação e sincronização
4. Criar hooks para gerenciar sincronização
5. Criar componentes de UI
6. Criar página HR.tsx
7. Adicionar rota e item no menu
8. Testar fluxo completo de sincronização

## Próximos Passos (Fase 2 - Recrutamento)

Após o módulo de RH estar funcional, a fase de Recrutamento incluirá:
- Pipeline de candidatos
- Integração com pipes de recrutamento do Pipefy
- Quadro Kanban de processos seletivos
- Agendamento de entrevistas
- Templates de feedback de candidatos
