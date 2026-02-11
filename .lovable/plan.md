

## Remover notificacoes Slack automaticas dos OKRs

### Contexto
As mensagens "Escalonamento OKR" no Slack (screenshot) vem de duas fontes:
1. **Edge Function `okr-escalation`** — envia para o Slack quando objetivos estao "Em Risco" ou "Atrasado" (linhas 143-160)
2. **Hook `useCheckins.ts`** — envia para o Slack a cada check-in realizado (linhas 100-110)

Ambas enviam automaticamente sem controle do usuario. O pedido e remover essas notificacoes Slack dos OKRs, mantendo apenas as do modulo de Automacao (que tem botao liga/desliga).

### Alteracoes

**1. `supabase/functions/okr-escalation/index.ts`**
- Remover todo o bloco de envio ao Slack (linhas ~143-160) que usa `SLACK_BOT_TOKEN` para postar no `#general`
- Remover a leitura da variavel `SLACK_BOT_TOKEN` (linha 18)
- Manter as notificacoes internas (tabela `notifications`) — essas aparecem apenas dentro da plataforma

**2. `src/hooks/useCheckins.ts`**
- Remover o bloco "Send Slack notification (fire-and-forget)" no `onSuccess` da mutation `useCreateCheckin` (linhas 100-110)
- Check-ins continuarao funcionando normalmente, apenas sem disparar mensagem no Slack

### O que permanece
- Notificacoes internas na plataforma (sino) continuam funcionando para OKRs
- Automacoes do modulo de Automacao (aniversarios, tempo de empresa, etc.) continuam enviando ao Slack **quando o botao estiver ligado**
- Feed de avisos continua funcionando normalmente
