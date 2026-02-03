
## Plano: Simplificar Integração Slack para Usar Apenas #general

### Visão Geral
Remover a busca dinâmica de canais e fixar o envio para o canal `#general`, simplificando a interface e evitando chamadas desnecessárias à API do Slack.

### Mudanças a Realizar

#### 1. Simplificar o Componente `SlackChannelSelector`

**Arquivo:** `src/components/feed/SlackChannelSelector.tsx`

Mudanças:
- Remover a busca de canais via `useSlackChannels`
- Remover o dropdown de seleção de canais
- Mostrar apenas o toggle com indicação fixa do canal `#general`
- Quando ativado, passar automaticamente o nome do canal "general"

Interface simplificada:
```
+----------------------------------+
| [Slack Icon] Enviar para Slack  [Toggle] |
| #general                                   |
+----------------------------------+
```

#### 2. Atualizar `CreatePost`

**Arquivo:** `src/components/feed/CreatePost.tsx`

Mudanças:
- Remover o estado `slackChannelId` (não precisa mais)
- Quando Slack estiver ativado, usar "general" como canal fixo
- Simplificar a prop passada para o `SlackChannelSelector`

#### 3. Atualizar Edge Function para aceitar nome do canal

**Arquivo:** `supabase/functions/send-slack-message/index.ts`

Mudanças:
- Aceitar tanto `channel_id` quanto `channel_name` no POST
- Se receber `channel_name: "general"`, enviar para `#general`
- A API do Slack aceita tanto o ID do canal quanto o nome (com #)

### Resultado Esperado
- Interface mais simples: apenas um toggle "Enviar para Slack #general"
- Sem dropdown de canais
- Menos chamadas à API do Slack
- Funcionalidade garantida pois o canal `#general` sempre existe

### Seção Técnica

**SlackChannelSelector simplificado:**
```tsx
export function SlackChannelSelector({ enabled, onEnabledChange }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" ...>
          <SlackIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlackIcon />
            <div>
              <span>Enviar para Slack</span>
              <span className="text-xs text-muted-foreground">#general</span>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

**Edge Function - aceitar canal por nome:**
```typescript
const { channel_id, channel_name, message, author_name, images } = await req.json();

// Usar channel_id se fornecido, senão usar #channel_name
const channel = channel_id || (channel_name ? `#${channel_name}` : null);
```
