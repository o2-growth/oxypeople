

# Sistema de Automacoes e Avisos

## Visao Geral

Criar uma nova pagina "Automacao" dentro da secao Principal do sidebar, abaixo de "Pessoas". Esta pagina centralizara avisos corporativos, automacoes de aniversarios e integracoes com Slack para notificacoes automaticas.

---

## Arquitetura da Solucao

```text
+-------------------+     +--------------------+     +------------------+
|  Frontend React   | --> | Edge Function API  | --> | Slack API        |
|  (Automacao page) |     | (send-slack-msg)   |     | (Bot messages)   |
+-------------------+     +--------------------+     +------------------+
         |                        |
         v                        v
+-------------------+     +--------------------+
|  Supabase Tables  |     | Cron Job (PG)      |
|  announcements    |     | birthday_check     |
|  automations      |     +--------------------+
+-------------------+
```

---

## Funcionalidades Principais

### 1. Sistema de Avisos (Announcements)
- Criar avisos para toda empresa ou departamentos especificos
- Tipos: Evento, Informativo, Urgente, Celebracao
- Agendamento de avisos para data futura
- Opcao de fixar aviso importante no topo
- Publicar no Feed e/ou enviar para Slack

### 2. Automacoes de Aniversarios
- Detectar aniversarios do dia/semana automaticamente
- Configurar mensagem padrao personalizavel
- Enviar automaticamente para canal Slack configurado
- Opcao de criar post no Feed com parabens

### 3. Automacoes Personalizadas
- Notificacao de novos colaboradores
- Lembretes de datas importantes (tempo de empresa)
- Alertas de pesquisas pendentes
- Avisos de prazos de objetivos

### 4. Integracao Slack
- Conectar workspace do Slack via conector
- Selecionar canal de destino por tipo de aviso
- Preview da mensagem antes de enviar
- Historico de mensagens enviadas

---

## Estrutura do Banco de Dados

### Tabela: announcements
```text
+---------------------+-------------------+
| Coluna              | Tipo              |
+---------------------+-------------------+
| id                  | UUID PK           |
| company_id          | UUID FK           |
| author_id           | UUID FK           |
| title               | TEXT              |
| content             | TEXT              |
| type                | ENUM              |
|   (event, info,     |                   |
|    urgent, celebration)                 |
| target_audience     | TEXT[]            |
| scheduled_at        | TIMESTAMPTZ       |
| published_at        | TIMESTAMPTZ       |
| is_pinned           | BOOLEAN           |
| slack_channel_id    | TEXT              |
| slack_sent_at       | TIMESTAMPTZ       |
| post_to_feed        | BOOLEAN           |
| feed_post_id        | UUID FK           |
| created_at          | TIMESTAMPTZ       |
| updated_at          | TIMESTAMPTZ       |
+---------------------+-------------------+
```

### Tabela: automations
```text
+---------------------+-------------------+
| Coluna              | Tipo              |
+---------------------+-------------------+
| id                  | UUID PK           |
| company_id          | UUID FK           |
| name                | TEXT              |
| type                | ENUM              |
|   (birthday, anniversary,               |
|    new_hire, reminder)                  |
| enabled             | BOOLEAN           |
| config              | JSONB             |
|   - message_template                    |
|   - slack_channel_id                    |
|   - post_to_feed                        |
|   - days_before (for reminders)         |
| last_run_at         | TIMESTAMPTZ       |
| created_at          | TIMESTAMPTZ       |
| updated_at          | TIMESTAMPTZ       |
+---------------------+-------------------+
```

### Tabela: automation_logs
```text
+---------------------+-------------------+
| Coluna              | Tipo              |
+---------------------+-------------------+
| id                  | UUID PK           |
| automation_id       | UUID FK           |
| company_id          | UUID FK           |
| event_type          | TEXT              |
| target_user_id      | UUID FK           |
| message_sent        | TEXT              |
| slack_response      | JSONB             |
| status              | ENUM (success,    |
|                     |  failed, pending) |
| created_at          | TIMESTAMPTZ       |
+---------------------+-------------------+
```

### Adicionar a tabela users
```text
+ birth_date           | DATE              |
```

---

## Componentes Frontend

### Nova Pagina: src/pages/Automation.tsx
- Tabs: Avisos | Automacoes | Historico | Configuracoes
- Lista de avisos com filtros por tipo/status
- Cards de automacoes com toggle de ativacao
- Timeline de logs de execucao

### Componentes:
```text
src/components/automation/
+-- AnnouncementCard.tsx      # Card de aviso individual
+-- CreateAnnouncement.tsx    # Modal/Form para criar aviso
+-- AutomationCard.tsx        # Card de automacao configuravel
+-- BirthdayAutomation.tsx    # Config especifica de aniversarios
+-- SlackChannelSelector.tsx  # Dropdown de canais Slack
+-- AutomationLogs.tsx        # Timeline de execucoes
+-- AnnouncementsList.tsx     # Lista filtrada de avisos
```

---

## Edge Functions

### 1. send-slack-message
Envia mensagens para canais do Slack via conector.

```text
POST /send-slack-message
Body: {
  channel_id: string,
  message: string,
  blocks?: SlackBlock[]  // Rich formatting
}
```

### 2. process-automations
Cron job para verificar e executar automacoes.

```text
- Verifica aniversarios do dia
- Verifica aniversarios de empresa
- Executa automacoes configuradas
- Registra logs de execucao
```

### 3. list-slack-channels
Busca canais disponiveis do Slack conectado.

```text
GET /list-slack-channels
Response: { channels: [{ id, name }] }
```

---

## Atualizacao do Sidebar

Adicionar item "Automacao" na secao Principal:

```text
Principal
  - Dashboard
  - Feed
  - Pessoas
  - Automacao  <-- NOVO
```

---

## Fluxo de Integracao Slack

1. Usuario conecta Slack via conector (SLACK_API_KEY)
2. Edge function lista canais disponiveis
3. Usuario seleciona canal para cada tipo de automacao
4. Sistema envia mensagens automaticamente via gateway

---

## Politicas RLS

### announcements
- SELECT: membros da empresa podem visualizar
- INSERT: admins/managers podem criar
- UPDATE: autor ou admins podem editar
- DELETE: autor ou admins podem remover

### automations
- SELECT: admins da empresa
- INSERT/UPDATE/DELETE: apenas admins

### automation_logs
- SELECT: admins da empresa
- INSERT: apenas service_role (edge functions)

---

## Ordem de Implementacao

1. **Database Migration**
   - Criar tabelas announcements, automations, automation_logs
   - Adicionar campo birth_date em users
   - Configurar RLS policies

2. **Frontend Base**
   - Criar pagina Automation.tsx
   - Adicionar rota no App.tsx
   - Atualizar sidebar com novo item

3. **Componentes de Avisos**
   - AnnouncementCard com tipos visuais
   - CreateAnnouncement com form completo
   - AnnouncementsList com filtros

4. **Componentes de Automacoes**
   - AutomationCard com toggle
   - BirthdayAutomation com config
   - AutomationLogs timeline

5. **Integracao Slack**
   - Conectar via conector Slack
   - Edge function send-slack-message
   - Edge function list-slack-channels
   - SlackChannelSelector component

6. **Automacao de Aniversarios**
   - Edge function process-automations
   - Cron job scheduling (pg_cron ou externo)
   - Logs de execucao

---

## Detalhes Tecnicos

### Configuracao do Slack Connector
O projeto usara o conector Slack da Lovable que fornece:
- SLACK_API_KEY como variavel de ambiente
- Gateway URL: `https://gateway.lovable.dev/slack/api`
- Headers: Authorization + X-Connection-Api-Key

### Formato de Mensagem Slack
```text
{
  "channel": "C1234567890",
  "text": "Feliz aniversario Ana!",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Hoje eh dia de comemoracao!*\nParabens Ana Silva pelo seu aniversario!"
      }
    }
  ]
}
```

### Template de Aniversario (JSONB config)
```text
{
  "message_template": "Parabens {name}! Desejamos um feliz aniversario!",
  "slack_channel_id": "C1234567890",
  "post_to_feed": true,
  "include_cake_emoji": true
}
```

---

## Arquivos a Criar

### Paginas
- `src/pages/Automation.tsx`

### Componentes
- `src/components/automation/AnnouncementCard.tsx`
- `src/components/automation/CreateAnnouncement.tsx`
- `src/components/automation/AutomationCard.tsx`
- `src/components/automation/BirthdayAutomation.tsx`
- `src/components/automation/SlackChannelSelector.tsx`
- `src/components/automation/AutomationLogs.tsx`
- `src/components/automation/AnnouncementsList.tsx`

### Edge Functions
- `supabase/functions/send-slack-message/index.ts`
- `supabase/functions/list-slack-channels/index.ts`
- `supabase/functions/process-automations/index.ts`

### Hooks
- `src/hooks/useAnnouncements.ts`
- `src/hooks/useAutomations.ts`
- `src/hooks/useSlackChannels.ts`

### Arquivos a Editar
- `src/components/layout/AppSidebar.tsx` - adicionar item Automacao
- `src/App.tsx` - adicionar rota /automation

