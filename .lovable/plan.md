

# Plano de Execucao: OKRs 100% Funcional

## Analise do Estado Atual

O sistema ja possui uma base solida. Abaixo o mapeamento do que existe vs o que falta:

### Ja implementado (OK)
- Modelo de dados completo: objectives, key_results, okr_checkins, actions, periods, okr_audit_log, okr_settings
- Triggers de cascata no PostgreSQL (update_objective_progress, cascade_objective_progress, process_okr_checkin)
- Validacoes de hierarquia, pesos de KR, pesos de filhos
- Calculo automatico de status (determine_objective_auto_status, calculate_expected_progress)
- Filtros empilhados com multi-selecao (Tipo, Status, Depto, Dono)
- Pagina de Gestao com ExecutiveSummary, ContextBar, TreeView, agrupamento por departamento
- Detail Panel com breadcrumb, gauge, metric cards, KRs expandiveis, tabs (Check-ins/Acompanhamento/Acoes/Historico)
- CheckinDialog com campos obrigatorios (valor, comentario, risco, bloqueio)
- ProgressChart com curva esperada vs real
- Mapa de Objetivos com pan/zoom/clique
- Kanban de Acoes semanal com drag-and-drop (@dnd-kit)
- CreateObjectiveDialog com pai opcional, KRs inline, direction up/down
- CreateActionDialog com vinculo a objetivo
- Auditoria (okr_audit_log) e OkrSettingsPanel
- RLS completo em todas as tabelas

### Gaps Identificados (o que falta para 100%)

## Tarefas a Implementar

### 1. Correcao: CreateActionDialog sem campo de KR vinculado
O dialog de criacao de acao permite selecionar objetivo mas nao permite selecionar KR dependente. O backlog exige que ao criar acao, o usuario possa vincular a um KR especifico (dropdown dependente do objetivo selecionado).

**Arquivo:** `src/components/actions/CreateActionDialog.tsx`
- Adicionar Select de KR (opcional) que filtra key_results pelo objective_id selecionado
- Passar key_result_id ao useCreateAction

### 2. Correcao: CreateActionInline no DetailPanel sem campo KR
Mesmo problema no componente inline dentro do ObjectiveDetailPanel.

**Arquivo:** `src/components/objectives/ObjectiveDetailPanel.tsx` (funcao CreateActionInline ~linha 618)
- Adicionar dropdown de KR opcional

### 3. Period herdado e travado ao criar filho
Quando o usuario seleciona um objetivo pai no CreateObjectiveDialog, o periodo deve ser herdado automaticamente e o campo travado (disabled). Atualmente o campo nao trava.

**Arquivo:** `src/components/objectives/CreateObjectiveDialog.tsx`
- Ao selecionar parentId, buscar o period_id do pai e setar no form
- Desabilitar o select de periodo quando parent esta selecionado

### 4. Validacao visual de peso dos KRs = 100%
O backlog exige barra de validacao "Pesos: 80/100" e bloqueio para ativar objetivo se pesos incompletos. Atualmente nao ha feedback visual.

**Arquivo:** `src/components/objectives/CreateObjectiveDialog.tsx`
- Mostrar barra com soma atual dos pesos vs 100
- Warning se soma != 100 ao ter mais de 1 KR
- Impedir submit se soma > 0 e != 100

### 5. Acoes visiveis no detalhe do KR
O backlog exige que acoes vinculadas a um KR aparecam no detalhe expandido daquele KR (KeyResultDetailPanel). Atualmente so aparece no tab "Acoes" do objetivo.

**Arquivo:** `src/components/objectives/KeyResultItem.tsx` (funcao KeyResultDetailPanel)
- Adicionar terceira tab "Acoes" que lista actions filtradas por key_result_id
- Botao "Nova Acao" para criar acao ja vinculada ao KR

### 6. Gráfico de progresso no KR — passar periodStart/periodEnd
O ProgressChart no KeyResultDetailPanel nao recebe periodStart/periodEnd, entao nao mostra curva esperada.

**Arquivo:** `src/components/objectives/KeyResultItem.tsx`
- O KeyResult nao tem acesso ao periodo do objetivo pai
- Passar period_id via props ou buscar via objective_id
- Alternativa mais simples: adicionar periodStart/periodEnd como props opcionais no KeyResult interface e preencher no ObjectiveDetailPanel

### 7. Overdue check baseado em checkin_frequency (nao so 7 dias fixos)
Atualmente isCheckinOverdue usa 7 dias hardcoded. O backlog exige respeitar o checkin_frequency do objetivo (weekly=7, biweekly=14, monthly=30).

**Arquivo:** `src/hooks/useObjectivesFilters.ts` (funcao isCheckinOverdue)
- Buscar frequencia do objetivo (campo nao existe ainda na tabela objectives)
- Se nao existir, usar as settings da empresa (okr_settings.checkin_frequency)

**Nota:** A tabela `objectives` nao tem campo `checkin_frequency`. Opcoes:
  - Usar o valor global de `okr_settings` (ja existe)
  - Ou criar migration para adicionar campo por objetivo (fase posterior)
  - Recomendacao: usar okr_settings por agora

### 8. Slack: notificacao automatica no check-in
O backlog pede que check-ins postem no Slack. A edge function `send-slack-message` ja existe.

**Arquivo:** `src/hooks/useCheckins.ts` (useCreateCheckin)
- Apos sucesso do check-in, chamar edge function send-slack-message com dados do check-in
- Incluir: objetivo, KR, valor, progresso, link

### 9. Mapa de Objetivos — conectar linhas entre nos
O ObjectivesMap atual renderiza nos em coluna sem linhas/edges visuais conectando pai-filho. O backlog exige edges visuais.

**Arquivo:** `src/components/objectives/ObjectivesMap.tsx`
- Adicionar SVG lines ou CSS connectors entre nodes pai e filho
- Usar refs dos nos para calcular posicoes

### 10. Mapa — layout horizontal hierarquico
O mapa atual empilha nos verticalmente. O backlog sugere layout de grafo com hierarquia horizontal (CEO a esquerda, operacionais a direita).

**Arquivo:** `src/components/objectives/ObjectivesMap.tsx` e `ObjectiveMapNode.tsx`
- Reestruturar layout para horizontal com niveis (strategic | tactical | operational)

---

## Ordem de Implementacao

```text
Prioridade 1 (Correcoes de logica — impacto funcional direto)
  3. Period herdado/travado ao criar filho
  4. Validacao visual pesos KR
  7. Overdue baseado em frequencia (usar okr_settings)

Prioridade 2 (Vinculos completos — feature completeness)
  1. KR no CreateActionDialog
  2. KR no CreateActionInline
  5. Tab Acoes no KR detail
  6. ProgressChart com periodo no KR

Prioridade 3 (Integracao e visual polish)
  8. Slack notify no check-in
  9. Linhas de conexao no mapa
  10. Layout horizontal do mapa
```

## Detalhes Tecnicos

### Tarefa 3 — Period herdado
No `CreateObjectiveDialog`, ao detectar `parentId` mudou:
1. Buscar objetivo pai em `objectives` (ja carregados via useObjectives)
2. `form.setValue("periodId", parent.period_id)`
3. Renderizar Select de periodo com `disabled={!!watchedParentId}`

### Tarefa 4 — Validacao pesos
No step de KRs do CreateObjectiveDialog:
```text
totalWeight = fields.reduce((sum, kr) => sum + kr.weightPercentage, 0)
Se fields.length > 0 e totalWeight != 100 => mostrar warning
Se fields.length > 1 e totalWeight != 100 => bloquear submit
```

### Tarefa 5 — Tab Acoes no KR
No KeyResultDetailPanel, mudar grid de 2 para 3 tabs, adicionar:
```text
<TabsTrigger value="actions">Acoes</TabsTrigger>
<TabsContent value="actions">
  // Filtrar actions por key_result_id === krId
  // Reusar logica similar ao ObjectiveActionsTab
</TabsContent>
```

### Tarefa 7 — Overdue dinamico
```text
function getOverdueDays(settings): number {
  switch(settings?.checkin_frequency) {
    case 'weekly': return 7;
    case 'biweekly': return 14;
    case 'monthly': return 30;
    default: return 7;
  }
}
```
Passar como parametro para isCheckinOverdue.

### Tarefa 8 — Slack notify
No onSuccess do useCreateCheckin, chamar:
```text
supabase.functions.invoke('send-slack-message', {
  body: { channel: '#general', text: formatCheckinMessage(...) }
})
```

### Tarefa 9 — Linhas SVG no mapa
Usar SVG overlay com `<line>` elements calculados a partir de getBoundingClientRect dos nos renderizados, ou CSS pseudo-elements com bordas.

