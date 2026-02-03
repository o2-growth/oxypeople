

## Plano: Integração Completa com Slack para Posts do Feed

### Visão Geral
Configurar a chave do Slack fornecida e implementar a funcionalidade para enviar posts do feed simultaneamente para canais do Slack.

### Etapa 1: Armazenar a Chave do Slack
- Adicionar a chave `xoxb-...` como secret `SLACK_BOT_TOKEN` no projeto
- Isso disponibilizará a chave para as Edge Functions de forma segura

### Etapa 2: Criar Edge Function `send-slack-message`

**Arquivo:** `supabase/functions/send-slack-message/index.ts`

Funcionalidades:
- **POST** - Enviar mensagem para um canal do Slack
  - Parâmetros: `channel_id`, `message`, `author_name`, `images[]`
  - Usa API direta do Slack (`https://slack.com/api/chat.postMessage`)
  
- **GET** (`?action=list-channels`) - Listar canais disponíveis
  - Retorna lista de canais públicos do workspace
  - Usa `https://slack.com/api/conversations.list`

### Etapa 3: Criar Hook `useSlackChannels`

**Arquivo:** `src/hooks/useSlackChannels.ts`

- Query para buscar canais disponíveis
- Cache de 5 minutos para evitar chamadas excessivas
- Tratamento de erro quando Slack não está configurado

### Etapa 4: Criar Componente `SlackChannelSelector`

**Arquivo:** `src/components/feed/SlackChannelSelector.tsx`

Layout:
```text
+---------------------------+
| ☐ Enviar para Slack       |
| +-----------------------+ |
| | #geral              ▼ | |
| +-----------------------+ |
+---------------------------+
```

Características:
- Ícone do Slack (usando Lucide `MessageSquare` ou SVG personalizado)
- Toggle para ativar/desativar envio
- Dropdown com canais disponíveis
- Estado visual quando ativado (cor de destaque)

### Etapa 5: Atualizar `CreatePost`

**Arquivo:** `src/components/feed/CreatePost.tsx`

Mudanças:
- Adicionar estados `slackEnabled` e `slackChannelId`
- Adicionar `SlackChannelSelector` ao lado do `EmojiPicker`
- Modificar `handleSubmit` para chamar edge function quando Slack ativado
- Mostrar feedback de sucesso/erro para ambos destinos

### Etapa 6: Atualizar `usePosts`

**Arquivo:** `src/hooks/usePosts.ts`

- Adicionar parâmetros opcionais `slackChannelId` e `slackEnabled` no `useCreatePost`
- Após criar post, chamar edge function de envio se Slack estiver configurado

### Estrutura da Mensagem no Slack

```text
📢 Novo post de [Nome do Autor]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Conteúdo do post]

[Imagens anexadas, se houver]
```

### Resultado Esperado
- Botão do Slack visível ao lado do emoji picker
- Ao ativar, usuário escolhe um canal
- Ao publicar, post vai para feed E Slack simultaneamente
- Mensagens formatadas com nome do autor e imagens
- Feedback visual de sucesso/erro

