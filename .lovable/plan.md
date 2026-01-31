
# Implementacao de Notificacoes Dual-Channel (Slack + Feed)

## Visao Geral

Quando uma automacao for disparada (aniversario, tempo de empresa, novo colaborador), o sistema enviara notificacoes em dois canais simultaneamente:
1. **Slack** - Mensagem para o canal configurado da empresa
2. **Feed da Plataforma** - Aviso criado automaticamente na tabela `announcements`

---

## Arquitetura da Solucao

```text
+------------------+     +------------------------+     +----------------+
| Trigger Event    | --> | Edge Function          | --> | Slack API      |
| (birthday, etc)  |     | process-automations    |     | (send message) |
+------------------+     +------------------------+     +----------------+
                                   |
                                   v
                         +------------------------+
                         | Supabase Tables        |
                         | - announcements (feed) |
                         | - automation_logs      |
                         +------------------------+
```

---

## Passo 1: Conectar Integracao Slack

Antes de implementar as Edge Functions, sera necessario conectar a integracao Slack ao projeto. Isso disponibilizara a variavel SLACK_API_KEY automaticamente.

---

## Passo 2: Edge Function - send-slack-message

Esta funcao envia mensagens para canais do Slack usando o conector Lovable.

### Arquivo: supabase/functions/send-slack-message/index.ts

```text
Responsabilidades:
- Receber channel_id, message e blocks (opcional)
- Enviar via gateway: https://gateway.lovable.dev/slack/api/chat.postMessage
- Retornar resposta do Slack
```

### Parametros de Entrada:
```text
{
  channel_id: string,    // ID do canal Slack (ex: "C1234567890")
  message: string,       // Texto da mensagem
  blocks?: SlackBlock[]  // Formatacao rica (opcional)
}
```

---

## Passo 3: Edge Function - process-automations

Funcao principal que processa automacoes e dispara notificacoes em ambos os canais.

### Arquivo: supabase/functions/process-automations/index.ts

```text
Fluxo de Execucao:
1. Buscar automacoes ativas do tipo especificado
2. Verificar eventos do dia (aniversarios, etc)
3. Para cada evento:
   a. Montar mensagem personalizada
   b. Enviar para Slack (se configurado)
   c. Criar aviso na tabela announcements (feed)
   d. Registrar log na tabela automation_logs
```

### Logica de Dual-Channel:
```text
Para cada usuario com evento:
  1. IF slack_channel_id configurado:
       -> Chamar send-slack-message
  2. IF post_to_feed = true:
       -> INSERT na tabela announcements
  3. INSERT log em automation_logs
```

---

## Passo 4: Edge Function - list-slack-channels

Busca canais disponiveis do workspace Slack conectado.

### Arquivo: supabase/functions/list-slack-channels/index.ts

```text
- GET request sem parametros
- Usa gateway para chamar conversations.list
- Retorna lista de canais publicos
```

---

## Passo 5: Componente SlackChannelSelector

Dropdown para selecionar canal Slack nas configuracoes de automacao.

### Arquivo: src/components/automation/SlackChannelSelector.tsx

```text
- Chama edge function list-slack-channels
- Exibe dropdown com canais disponiveis
- Atualiza config da automacao com channel_id selecionado
```

---

## Passo 6: Modal de Configuracao de Automacao

Expandir o botao "Configurar" do AutomationCard para abrir modal com:

### Campos de Configuracao:
```text
- Mensagem personalizada (template com variaveis {name}, {date})
- Seletor de canal Slack (SlackChannelSelector)
- Toggle "Publicar no Feed"
- Preview da mensagem
```

---

## Passo 7: Atualizar CreateAnnouncement

Adicionar opcao de enviar aviso para Slack alem do feed.

### Novos Campos:
```text
- Seletor de canal Slack (opcional)
- Preview da mensagem formatada
```

---

## Estrutura de Arquivos

### Novos Arquivos:
```text
supabase/functions/send-slack-message/index.ts
supabase/functions/list-slack-channels/index.ts
supabase/functions/process-automations/index.ts
src/components/automation/SlackChannelSelector.tsx
src/components/automation/AutomationConfigModal.tsx
```

### Arquivos a Editar:
```text
src/components/automation/AutomationCard.tsx
  - Adicionar modal de configuracao
  - Salvar config com slack_channel_id e post_to_feed

src/components/automation/CreateAnnouncement.tsx
  - Adicionar seletor de canal Slack
  - Chamar edge function ao enviar para Slack
```

---

## Secao Tecnica

### Formato de Config da Automacao (JSONB):
```text
{
  "message_template": "Parabens {name}! Desejamos um feliz aniversario!",
  "slack_channel_id": "C1234567890",
  "post_to_feed": true,
  "include_emoji": true
}
```

### Headers para Gateway Slack:
```text
Authorization: Bearer <SLACK_API_KEY>
X-Connection-Api-Key: <LOVABLE_API_KEY>
Content-Type: application/json
```

### URL do Gateway:
```text
https://gateway.lovable.dev/slack/api/<method>
```

### Mensagem de Aniversario no Feed:
```text
INSERT INTO announcements:
- title: "Feliz Aniversario!"
- content: "Hoje e o aniversario de {name}. Parabens!"
- type: "celebration"
- author_id: system_user ou admin
- is_pinned: false
- post_to_feed: true
```

---

## Ordem de Implementacao

1. Conectar integracao Slack ao projeto
2. Criar Edge Function send-slack-message
3. Criar Edge Function list-slack-channels
4. Criar componente SlackChannelSelector
5. Criar Edge Function process-automations
6. Adicionar modal de configuracao nas automacoes
7. Atualizar CreateAnnouncement com opcao Slack
8. Testar fluxo completo

---

## Consideracoes de Seguranca

- Edge Functions usam SUPABASE_SERVICE_ROLE_KEY para inserir logs
- Validacao de company_id em todas as operacoes
- Canal Slack deve pertencer ao workspace conectado
- RLS policies ja configuradas para announcements e automation_logs
