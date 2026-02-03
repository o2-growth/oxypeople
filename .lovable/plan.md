

## Plano: Adicionar Opção de Envio para Slack nos Posts do Feed

### Contexto
Você quer adicionar uma opção ao lado do emoji picker para que, ao publicar um post no feed, ele também seja enviado para um canal do Slack. Isso complementa a funcionalidade já existente nos Avisos (Announcements) e alinha com a regra de negócio de notificações em canal duplo.

### Visão Geral da Solução
Adicionar um botão toggle/configurador ao lado do emoji que permite selecionar um canal do Slack para enviar a mensagem simultaneamente. Quando ativado, o post será publicado no feed E enviado para o canal escolhido.

### Etapas de Implementação

#### 1. Configurar Conexão Slack
- Primeiro, será necessário conectar o Slack ao projeto usando o conector Lovable
- Isso disponibilizará a `SLACK_API_KEY` como variável de ambiente
- Sem esta conexão, a funcionalidade não poderá funcionar

#### 2. Criar Edge Function para Enviar Mensagens ao Slack
- Criar `supabase/functions/send-slack-message/index.ts`
- Usar o gateway Lovable (`https://gateway.lovable.dev/slack/api/`) para enviar mensagens
- Suportar envio de texto e imagens (quando houver anexos no post)
- Buscar lista de canais disponíveis para seleção

#### 3. Criar Hook para Buscar Canais do Slack
- Novo hook `src/hooks/useSlackChannels.ts`
- Chamar a edge function para listar canais públicos disponíveis
- Cachear resultado para não fazer muitas chamadas

#### 4. Criar Componente Seletor de Canal Slack
- Novo componente `src/components/feed/SlackChannelSelector.tsx`
- Popover com ícone do Slack ao lado do emoji picker
- Toggle para ativar/desativar envio para Slack
- Dropdown para selecionar o canal de destino
- Mostrar estado visual quando Slack está ativado

#### 5. Atualizar CreatePost
- Adicionar estado para `slackEnabled` e `slackChannelId`
- Integrar o `SlackChannelSelector` na barra de ações
- Modificar `handleSubmit` para chamar edge function quando Slack estiver ativado

#### 6. Atualizar usePosts Hook
- Adicionar parâmetros opcionais `slackChannelId` no `useCreatePost`
- Após criar o post, chamar a edge function de envio se Slack estiver configurado

### Layout Visual Proposto

```text
+------------------------------------------------------------------+
|  [Avatar]  O que você gostaria de compartilhar?                  |
|            +--------------------------------------------------+  |
|            |                                                  |  |
|            +--------------------------------------------------+  |
|                                                                  |
|  [📷] [😊] [⚡Slack]                              [Publicar]     |
+------------------------------------------------------------------+

Ao clicar em [⚡Slack]:
+---------------------------+
| ☐ Enviar para Slack       |
| +-----------------------+ |
| | #geral              ▼ | |
| +-----------------------+ |
+---------------------------+
```

### Detalhes Técnicos

**Edge Function `send-slack-message`:**
```text
POST /send-slack-message
Body: {
  channel_id: string,
  message: string,
  author_name: string,
  images?: string[]
}

GET /send-slack-message?action=list-channels
Response: { channels: [{ id, name }] }
```

**SlackChannelSelector Props:**
```text
- enabled: boolean
- channelId: string | null
- onEnabledChange: (enabled: boolean) => void
- onChannelChange: (channelId: string) => void
- disabled?: boolean
```

### Pré-requisito Importante
Antes de implementar, será necessário conectar o Slack ao projeto. O sistema irá solicitar que você selecione ou crie uma conexão Slack.

### Resultado Esperado
- Botão com ícone do Slack ao lado do emoji picker
- Ao ativar, usuário pode escolher um canal
- Ao publicar, o post vai para o feed E para o Slack
- Mensagem no Slack inclui nome do autor, texto e imagens (se houver)
- Feedback visual de sucesso/erro para ambos os destinos

