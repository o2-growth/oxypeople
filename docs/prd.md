# PRD — oxypeople MVP (Feedz Replacement)

**Autor:** Morgan (Product Manager)
**Data:** 2026-04-27 (revisado em 2026-04-30 para ajuste de escopo)
**Versão:** 1.1 (scope-correction)
**Inputs:** `brownfield-assessment.md` · `architecture-review.md` · `database-audit.md`
**Status:** Aprovado — escopo recalibrado para ferramenta interna

---

> **Atualização (2026-04-30):** este PRD foi originalmente escrito assumindo lançamento como SaaS comercial. O escopo real é **ferramenta interna do o2-growth para substituir o Feedz internamente**. Sem billing, sem landing comercial, sem onboarding de novos clientes. As seções abaixo foram revisadas para refletir essa realidade. Ver `docs/SCOPE-CORRECTION-2026-04-30.md` para o sumário das alterações.

---

## 1. Problem Statement

A o2-growth (empresa do usuário) usa hoje o **Feedz (TOTVS)** como plataforma de gestão de pessoas (clima, performance, OKRs, feedback, reconhecimento). O Feedz é fechado, opera dentro do ecossistema TOTVS, tem UX engessada, sem APIs abertas, e impõe limitações operacionais e de customização que pioram conforme o headcount cresce.

A oxypeople é desenvolvida para **substituir o Feedz internamente no o2-growth** com:
- Plataforma própria, sob controle total do time (uma empresa, mas com schema multi-tenant para defesa em profundidade e opcionalidade futura)
- UX moderna (Tailwind/shadcn) e customizável às necessidades reais do RH interno
- Gamificação nativa profunda (engajamento interno)
- Integrações com as ferramentas que o o2-growth usa (Pipefy, Slack)
- Custo previsível (apenas Supabase/infra; sem licenciamento por seat externo)

**Status atual:** o produto cobre ~65% das funcionalidades do Feedz (OKRs, reconhecimento, surveys, ciclos de avaliação). Para ser **adotado em substituição interna**, faltam 5 módulos novos e 2 hardenings críticos.

---

## 2. Goals & Success Metrics

### 2.1 Goal de produto (MVP)

> **"Em 4-6 semanas, ter uma plataforma interna pronta para substituir o Feedz no o2-growth, cobrindo os módulos que o RH e a liderança da empresa efetivamente operam mensalmente."**

### 2.2 Success Metrics (rollout interno o2-growth)

| Categoria | Métrica | Alvo (90 dias pós-rollout interno) |
|---|---|---|
| **Adoção** | % do headcount o2-growth com login ativo | ≥ 95% |
| **Adoção** | Usuários ativos semanais (WAU) | ≥ 70% do headcount |
| **Substituição** | Tempo até desligamento do Feedz (data de cancelamento contratual) | ≤ 8 semanas após go-live interno |
| **Substituição** | Módulos Feedz já não usados (migração concluída) | 100% dos módulos em escopo |
| **Engajamento** | OKRs com pelo menos 1 check-in/mês | ≥ 75% |
| **Engajamento** | Pulse Survey response rate | ≥ 60% (interno tende a ser maior que cliente externo) |
| **Engajamento** | Feedbacks solicitados/respondidos por usuário/mês | ≥ 1 |
| **Engajamento** | 1:1s realizadas vs agendadas | ≥ 70% |
| **Qualidade** | NPS interno (colaboradores o2-growth) sobre a plataforma | ≥ +40 |
| **Qualidade** | Tempo médio de resposta de bugs P0/P1 | < 24h |
| **Confiança** | Incidentes de segurança/privacidade | 0 |
| **Confiança** | Disponibilidade (uptime) | ≥ 99.5% |
| **Eficiência** | Tempo para convidar e ativar um novo funcionário | < 5 min |

### 2.3 Anti-metas (o que NÃO buscar no MVP)

- **NÃO** competir em features de admissão/desligamento (deixar para Pipefy ou ATS)
- **NÃO** virar LMS (trilhas de desenvolvimento ficam para v2)
- **NÃO** ter app nativo mobile (PWA serve)
- **NÃO** ter integrações com folha de pagamento
- **NÃO** ter mapeamento comportamental (DISC) no MVP
- **NÃO** construir landing comercial, pricing page, billing/Stripe, T&C para clientes externos, fluxo de signup multi-empresa — **fora de escopo** (ferramenta interna)
- **NÃO** prospectar/onboardar clientes-piloto externos — apenas o2-growth

---

## 3. Personas

### 3.1 Renata — Gerente de RH / People Ops (admin)
- 35 anos, gerente de pessoas em empresa de 80–250 colaboradores
- **Dores:** UX do Feedz é lenta, exportar dados é sofrível, suporte demora dias, clima organizacional é caixa-preta
- **Objetivos:** ter visibilidade real de engajamento, executar ciclos de performance sem fricção, mostrar valor para o board
- **Jornada típica:** abre o produto 3–5x/dia; configura ciclos, revisa relatórios, responde dúvidas de líderes
- **Motivador-chave:** mostrar resultados ao C-level com gráficos limpos

### 3.2 Bruno — Líder / Gestor de time
- 32 anos, gerencia 4–10 pessoas direto, é gerenciado por outro líder
- **Dores:** sem tempo para feedback, esquece dos 1:1s, não sabe quem está engajado/em risco, avaliação de desempenho é tarefa burocrática
- **Objetivos:** acompanhar OKRs do time, fazer 1:1s consistentes, dar/receber feedback sem fricção, identificar talentos
- **Jornada típica:** abre o produto 1–2x/dia; checa dashboards, responde feedbacks pendentes, anota 1:1s
- **Motivador-chave:** menos meetings improdutivas, mais clareza sobre o time

### 3.3 Camila — Colaboradora individual
- 27 anos, contribuidora individual em time de 6 pessoas
- **Dores:** não sabe se está indo bem, feedback chega só na avaliação anual, plano de carreira é nebuloso
- **Objetivos:** entender o que precisa melhorar, receber reconhecimento, planejar próximo passo na carreira
- **Jornada típica:** abre o produto 2–3x/semana; vê reconhecimentos, atualiza KRs, responde Pulse, abre PDI
- **Motivador-chave:** sentir-se vista e ter clareza de crescimento

### 3.4 Mapa persona × módulo

| Módulo | Renata | Bruno | Camila |
|---|---|---|---|
| OKRs | configura períodos, vê dashboard | edita time, faz check-ins | atualiza KRs próprios |
| Organograma | mantém estrutura | navega time | encontra contatos |
| Pulse | configura, lê resultados | lê resultados do time | responde |
| Nine Box | facilita reunião de calibração | participa | (não vê) |
| Feedback contínuo | acompanha métrica | dá e pede feedback | dá e pede feedback |
| 1:1s | (acompanha frequência) | conduz | participa |
| PDI | aprova ciclo | aprova do liderado | escreve próprio |

---

## 4. Feature Requirements — Epics P0

### Epic 1 — OKRs Hardening
> **Goal:** elevar OKRs de "funcional" para "best-in-class" (paridade Feedz + diferenciais)

**Story 1.1** — Como Renata, quero **administrar períodos** (trimestres/ciclos) via UI para não depender de TI.
- AC: criar/editar/arquivar períodos; validação de não-overlap; só admin acessa
- Implementa: `0003` (trigger) + tela `/admin/periods`

**Story 1.2** — Como Bruno, quero **comentar em objetivos e KRs** para discutir contexto sem precisar de Slack à parte.
- AC: thread de comentários no detalhe do OKR; mention de @pessoas; notificação ao mencionado
- Implementa: tabela `objective_comments`

**Story 1.3** — Como Camila, quero registrar **confidence (0–100)** em cada KR para sinalizar risco antes do check-in.
- AC: slider no card do KR; badge colorido (>70 verde, 30–70 amarelo, <30 vermelho); aparece no executive summary
- Implementa: coluna `key_results.confidence`

**Story 1.4** — Como Renata, quero diferenciar **objetivos committed vs aspirational** para que aspirational não derrube a média geral.
- AC: toggle no Create; badge no card; filtro nos `ObjectivesFilters`; aspirational excluído da média de progresso da empresa
- Implementa: coluna `objectives.commitment_type`

**Story 1.5** — Como Renata, quero garantir que o **`okr-escalation` rode automaticamente todo dia** para que líderes recebam alertas sem ação manual.
- AC: cron agendado às 9h UTC; tela admin mostra "Última execução: HH:MM" + "Próxima: HH:MM"; histórico das últimas 7 execuções
- Implementa: `0009` (cron job) + tela em `/settings/okrs`

**Story 1.6** — Como Bruno, quero **adicionar/remover colaboradores em objetivos existentes** para que mudanças no time refletem sem recriar o OKR.
- AC: aba "Colaboradores" no `ObjectiveDetail`; add/remove com role (contributor/editor); RLS reflete edição
- Implementa: já tem schema; falta UI

**Story 1.7** — Como dev, quero **alinhar enum de tipo de objetivo** entre TS e DB para evitar bugs silenciosos.
- AC: enum TS aceita os 6 tipos do DB; teste verifica equivalência
- Implementa: refactor `useObjectives.ts:10`

**Definition of Done do Epic:** todas stories AC + 1 teste de integração por story crítica + cron rodando em prod por 7 dias sem falhas.

---

### Epic 2 — Organograma 2.0
> **Goal:** transformar organograma de read-only em ferramenta operacional

**Story 2.1** — Como Renata, quero **definir gestor direto** de cada pessoa para ter hierarquia matricial real (não só por departamento).
- AC: campo `manager_id` editável no perfil do colaborador; bulk edit em `/admin/org-structure`; impossível criar ciclo
- Implementa: `0002` (manager_id + trigger anti-ciclo)

**Story 2.2** — Como Bruno, quero **navegar o organograma com zoom/pan** para enxergar empresas grandes sem scroll horizontal.
- AC: zoom in/out (botões + scroll); pan com drag; minimapa opcional; persiste estado em URL
- Implementa: substituir tree custom por **reactflow**

**Story 2.3** — Como Camila, quero **clicar em um nó e ver o perfil** da pessoa para encontrar contato e contexto.
- AC: drawer lateral com avatar, nome, cargo, dept, time, e-mail, gestor, liderados; link "Ver OKRs" e "Ver PDI" (se autorizado)
- Implementa: drawer reusando componentes de `/people/`

**Story 2.4** — Como Renata, quero **filtrar o organograma** por departamento, time ou nome para focar em um pedaço.
- AC: filtros no topo; busca por nome highlight + auto-pan; "ver só meu time" (ancestor + subtree)

**Story 2.5** — Como Renata, quero **exportar o organograma** em PNG/PDF para apresentações.
- AC: botão "Exportar"; PNG via reactflow; PDF via react-pdf; arquivo nomeado `org-{empresa}-{data}.{ext}`

**Story 2.6** — Como Bruno, quero **arrastar pessoas para mudar o gestor** (drag & drop) para reorganizar sem ir na tela admin.
- AC: drag visual; modal de confirmação ("Mover Camila para reportar a Bruno?"); só admin/manager pode; reverter por undo (toast 5s)

**Definition of Done do Epic:** organograma opera com 500 pessoas em <2s no load; export PDF funciona; nenhuma pessoa órfã (todos têm manager OU são root).

---

### Epic 3 — Pulse Survey
> **Goal:** substituir surveys pontuais por medição contínua de clima

**Story 3.1** — Como Renata, quero **criar uma pesquisa Pulse recorrente** (semanal/quinzenal/mensal) com 1 pergunta para medir engajamento sem cansar.
- AC: form com nome, pergunta, tipo (escala 1–5 / eNPS / mood emoji), frequência, dia, segmentação (dept/time/all), anônimo on/off
- Implementa: `0004` (`pulse_surveys`) + tela `/admin/pulse`

**Story 3.2** — Como Camila, quero **responder o Pulse em 1 clique** direto do dashboard sem entrar em outra tela.
- AC: widget no Dashboard "Como você está se sentindo essa semana?"; resposta one-click (emoji ou escala); comentário opcional; auto-fecha após responder
- Implementa: widget novo em `/src/components/dashboard/`

**Story 3.3** — Como Renata, quero ver **gráfico de evolução** do Pulse ao longo do tempo, segmentado por dept/time.
- AC: line chart por período; média geral + linhas por segmento; eNPS calc se tipo for eNPS; comparar 2 períodos
- Implementa: tela `/admin/pulse/[id]`

**Story 3.4** — Como Renata, quero **exportar respostas** (anonimizadas se for o caso) em CSV/Excel para análise externa.
- AC: botão "Exportar"; preserva anonimato (sem user_id em pesquisas anônimas)

**Story 3.5** — Como sistema, preciso **disparar notificações** automaticamente nos dias configurados.
- AC: edge function `pulse-dispatch` roda hourly via cron; verifica `last_dispatched_at` + `frequency`; cria notification para usuários do segmento
- Implementa: nova edge function + 0009

**Definition of Done do Epic:** 1 Pulse semanal rodando em ambiente de dogfood com 100% de entrega; widget no dashboard com response rate > 70% interno.

---

### Epic 4 — Nine Box
> **Goal:** habilitar reunião de calibração de talentos com matriz visual

**Story 4.1** — Como Renata, quero **criar um Nine Box snapshot** vinculado a um ciclo de avaliação para calibrar o time.
- AC: novo snapshot a partir de ciclo concluído; auto-popula performance via `overall_score` (faixas configuráveis); potential começa NULL
- Implementa: `0005` + tela `/nine-box`

**Story 4.2** — Como Bruno, quero **arrastar pessoas entre células** (3×3) na matriz para ajustar minha avaliação durante a reunião.
- AC: matriz 3×3 com avatares; drag entre células atualiza `performance_axis` × `potential_axis`; histórico de mudanças por pessoa
- Implementa: drag & drop com `@dnd-kit`

**Story 4.3** — Como Renata, quero **adicionar justificativa** ao posicionar alguém para deixar rastro da decisão.
- AC: ao mover, modal com campo "Por quê?"; obrigatório se mudou de quadrante (não só de célula adjacente); 100+ chars

**Story 4.4** — Como Renata, quero **finalizar o snapshot** (lock) quando a calibração acabar para evitar mudanças acidentais.
- AC: status `draft → finalized → archived`; finalizado só admin pode reabrir; archived é read-only

**Story 4.5** — Como Renata, quero **exportar a matriz em PDF** para a reunião do board.
- AC: PDF com matriz visual + lista de cada quadrante; nome do snapshot e data; logo da empresa
- Implementa: react-pdf

**Story 4.6** — Como Bruno (manager), quero **ver apenas meu subtree** quando consultar Nine Box para focar no meu time.
- AC: filtro "Meu time" usa `get_org_subtree()`; admin vê tudo

**Definition of Done do Epic:** 1 ciclo de calibração interno completo + PDF aprovado por usuário interno.

---

### Epic 5 — Feedback Contínuo
> **Goal:** descolar feedback do ciclo anual e tornar prática diária

**Story 5.1** — Como Bruno, quero **pedir feedback sobre alguém** para colher impressões pontuais sem esperar o ciclo.
- AC: botão "Pedir Feedback" no perfil de qualquer colaborador; form com pergunta livre, respondente, sobre quem, tags de competência opcionais, prazo, visibilidade
- Implementa: `0006` + tela `/feedback`

**Story 5.2** — Como Camila, quero **responder feedbacks pendentes** em fila clara.
- AC: tab "Recebidos" lista pendentes; clique abre form; texto livre + opção "Recusar com motivo"
- Implementa: 3-tab page (Recebidos / Enviados / Sobre mim)

**Story 5.3** — Como Bruno, quero **ver feedbacks que pedi** para acompanhar status (pendente/respondido/recusado).
- AC: tab "Enviados" com badge de status; alerta visual se vencido

**Story 5.4** — Como Camila, quero **ver feedbacks sobre mim** que foram compartilhados comigo.
- AC: tab "Sobre mim" mostra apenas com `visibility ∈ ('shared_with_subject', 'shared_with_manager')`; respeita privacidade

**Story 5.5** — Como sistema, preciso **notificar todos os participantes** nos eventos certos (request, answer).
- AC: trigger SQL `notify_feedback_event` cria notification; central de notificações exibe; opcional: notificar via Slack se integração ativa
- Implementa: já em `0006`

**Story 5.6** — Como Renata, quero **dashboard de feedback** com volume e tempo médio de resposta para acompanhar saúde da prática.
- AC: cards "Feedbacks no mês", "Tempo médio de resposta", "% respondidos no prazo"; segmentação por dept

**Story 5.7** — Como sistema, preciso **expirar feedback requests vencidos** automaticamente.
- AC: cron diário marca como `expired` requests com `due_date < hoje` e status=`requested`
- Implementa: `0009`

**Definition of Done do Epic:** 30+ feedbacks circulando em dogfood + nenhum feedback privado vazando (test RLS pass).

---

### Epic 6 — 1:1s estruturadas
> **Goal:** transformar 1:1s em ritual com pauta colaborativa e histórico

**Story 6.1** — Como Bruno, quero **agendar uma 1:1** com meu liderado direto pré-preenchendo dados.
- AC: form com data/hora, duração, recorrência (none/weekly/biweekly/monthly), local opcional; auto-detecta liderado se Bruno só tem 1 reporting line, senão escolhe
- Implementa: `0007` + tela `/one-on-ones`

**Story 6.2** — Como Camila, quero **adicionar tópicos de pauta** antes da reunião para garantir que nada importante fique de fora.
- AC: lista drag-and-drop de tópicos; quem criou pode editar/excluir; ambos podem marcar "feito"
- Implementa: tabela `one_on_one_topics`

**Story 6.3** — Como Bruno, quero **anotar notas durante a 1:1** com 3 níveis de visibilidade: compartilhada, privada minha, privada do liderado.
- AC: 3 colunas no detalhe; notas privadas do líder INVISÍVEIS ao membro (e vice-versa); UI deixa claro o ícone de cada
- ⚠️ **Crítico de segurança** — RLS de `one_on_one_notes` precisa testes específicos
- Implementa: `0007` + 5 testes RLS obrigatórios

**Story 6.4** — Como Bruno e Camila, queremos **ver histórico das 1:1s anteriores** para retomar contexto rapidamente.
- AC: timeline colapsável das últimas 10 1:1s; busca por keyword nas notas compartilhadas

**Story 6.5** — Como Bruno, quero **baixar arquivo .ics** para colocar a 1:1 na minha agenda Google/Outlook.
- AC: botão "Adicionar à agenda" gera `.ics` válido (timezone correto, location, descrição)
- Implementa: edge function `one-on-one-ics`

**Story 6.6** — Como sistema, preciso **gerar próxima ocorrência** de 1:1s recorrentes ao completar a atual.
- AC: ao marcar 1:1 como `completed`, se `recurrence != 'none'`, criar nova com `recurrence_parent_id` apontando; 6h cron como fallback
- Implementa: edge function `one-on-one-recurrence` + 0009

**Story 6.7** — Como Renata (admin), quero **ver frequência de 1:1s por gestor** para identificar quem não está fazendo.
- AC: dashboard com tabela "Gestor / 1:1s no mês / % completadas vs agendadas"

**Definition of Done do Epic:** 5 1:1s reais conduzidas internamente + 0 vazamentos de notas privadas em test RLS + .ics importa no Google Calendar.

---

### Epic 7 — PDI
> **Goal:** habilitar plano de desenvolvimento individual rastreável e acionável

**Story 7.1** — Como Camila, quero **criar meu próprio PDI** definindo competências e ações.
- AC: form com título, descrição, prazo; adicionar competências (nome, nível atual 1–5, nível alvo 1–5, categoria); adicionar ações ligadas
- Implementa: `0008` + tela `/pdi`

**Story 7.2** — Como Bruno, quero **criar PDI para meu liderado** quando ele não tomar iniciativa.
- AC: posso criar PDI para qualquer pessoa onde eu sou `manager_id`; ela é notificada e pode editar

**Story 7.3** — Como Camila, quero **gerenciar minhas ações em kanban** (To Do / Doing / Done / Blocked) para visualizar progresso.
- AC: drag & drop entre colunas; ao mover para Done, opcional anexar evidência; recalcula `progress` do plan automaticamente
- Implementa: kanban reusando padrão de `/components/actions/`

**Story 7.4** — Como Camila, quero **anexar evidências** (PDF, imagem, link) às ações concluídas para documentar evolução.
- AC: upload em `pdi-attachments` bucket; tipos: imagem (5MB), PDF (10MB), link externo (URL)
- Implementa: storage policies em `0008`

**Story 7.5** — Como Bruno, quero **aprovar/comentar o PDI** do meu liderado antes de virar `active`.
- AC: status `draft → active` exige aprovação do gestor; botão "Aprovar" ou "Pedir ajustes" com comentário

**Story 7.6** — Como Camila, quero ver **gráfico radar** das minhas competências (atual vs alvo) para enxergar gap.
- AC: chart radar (Recharts) com até 8 competências; 2 polígonos sobrepostos (current vs target)

**Story 7.7** — Como Camila, quero **vincular ações do PDI a feedbacks** que recebi para fechar o ciclo.
- AC: ao criar ação, opcional escolher "Originada de qual feedback?"; FK `feedback_request_id`

**Story 7.8** — Como Renata, quero **dashboard de PDIs** com % concluídos, ativos, em atraso por dept.
- AC: cards e tabela; filtro por dept e status; export CSV

**Definition of Done do Epic:** 3 PDIs reais ativos internamente + 1 finalizado com evidências.

---

## 5. Backlog P1 (pós-MVP, próximas 4–6 semanas)

| # | Item | Para quem | Esforço |
|---|---|---|---|
| P1-01 | **Mood diário** — emoji 1-clique no header | Camila | S |
| P1-02 | **Jornada do colaborador** — timeline unificada (recognitions, feedbacks, OKRs, 1:1s, PDIs) | Renata, Bruno | S |
| P1-03 | **Relatórios exportáveis** PDF/Excel para módulos | Renata | M |
| P1-04 | **Onboarding workflow** — checklist com tarefas e responsáveis | Renata | M |
| P1-05 | **Templates de OKR** — biblioteca por departamento | Bruno | M |
| P1-06 | **Planos de ação** vinculados a Pulse com baixa nota | Renata | M |
| P1-07 | **Central de notificações** — sino na topbar com lista persistente | Todos | S |

## 6. Backlog P2 (v2 — 3+ meses)

- Trilhas de Desenvolvimento (LMS leve)
- Mapeamento Comportamental (DISC/MBTI)
- Calibração de avaliações multi-stakeholder
- Snapshots históricos do organograma
- Vacâncias e posições abertas
- Gantt/Timeline view de OKRs
- Integração OAuth Google Calendar (substituir ICS)
- App mobile nativo
- API pública para clientes
- Multi-idioma (EN/ES)

---

## 7. Technical Constraints (resumo do architecture-review)

- **Stack travada**: Vite + React + TypeScript + shadcn + Supabase
- **Regra global**: nunca migrations destrutivas sem aprovação explícita
- **`pg_cron`** exige Supabase Pro — confirmar plano
- **`one_on_one_notes`** tem policy RLS crítica — testes obrigatórios
- **Lovable Auth** será removido (ADR-006)
- **Dependências novas**: `reactflow`, `react-pdf`, `@sentry/react`, `posthog-js`

---

## 8. Timeline & Milestones

> **Escopo interno (2026-04-30):** timeline encolhe de 8-10 semanas (MVP comercial) para **4-6 semanas** porque fronts F.2 (Stripe), F.3 (signup multi-empresa), F.4 (landing/pricing) e F.5 (marketing) saem do escopo. Resta apenas F.1 (LGPD interno) + F.x (onboarding interno) + F.y (e-mail transacional simples).

| Sprint | Semanas | Entregáveis | Saída |
|---|---|---|---|
| **0 — Prep** | semana 0 | Aplicar `0001` (RLS fixes); remover Lovable Auth; setup Sentry/PostHog; bootstrap testes | Base limpa |
| **1 — OKRs hardening** | semana 1 | Epic 1 completo (7 stories) | Cron rodando, comments, confidence, periods admin |
| **2 — Org + Pulse + Nine Box** | semanas 2–3 | Epic 2 + Epic 3 + Epic 4 | manager_id, reactflow, Pulse semanal, matriz Nine Box |
| **3 — Feedback + 1:1** | semana 4 | Epic 5 + Epic 6 | Feedback contínuo, 1:1s com notas privadas |
| **4 — PDI + onboarding interno + e-mail** | semana 5 | Epic 7 + onboarding interno (admin convida por e-mail) + Resend/SendGrid + suíte mínima de testes | PDI completo, convite-por-email funcional |
| **5 — Rollout interno** | semana 6 | Política de privacidade interna + DPO; rollout no o2-growth; desligamento do Feedz | **Feedz substituído** |

**Marco GA:** fim da semana 6 com checklist de "Internal Rollout Done" abaixo aprovado.

---

## 9. Definition of "Internal Rollout Done"

O rollout interno só é considerado pronto quando **TODOS** os critérios abaixo estão verdes:

### Funcional
- [ ] 7 epics P0 com 100% das stories de AC marcadas como `done`
- [ ] Em todos os módulos, fluxo completo do happy path funciona em <2s
- [ ] 0 bugs P0/P1 abertos

### Qualidade
- [ ] Suíte de testes cobre: auth flow, RLS de `one_on_one_notes`, RLS de `feedback_requests`, fluxo de check-in OKR, criação de PDI
- [ ] Lint + typecheck passam sem warnings
- [ ] Lighthouse score ≥ 85 em mobile (Performance, Accessibility)

### Confiabilidade
- [ ] Sentry capturando erros em prod, sem alertas críticos por 7 dias
- [ ] Cron jobs rodando sem falha por 7 dias
- [ ] Backup diário do Supabase confirmado

### Adoção interna (o2-growth)
- [ ] 100% do headcount o2-growth com convite enviado e ≥95% com login realizado
- [ ] Rollout interno completo no o2-growth com substituição do Feedz iniciada
- [ ] Material interno de onboarding (vídeo/walkthrough/Notion) pronto
- [ ] Cancelamento contratual do Feedz agendado/efetivado

### Segurança & LGPD interno
- [ ] Auditoria RLS: cada tabela testada com 3 personas distintas (owner, manager, member)
- [ ] LGPD interno: política de privacidade interna publicada (intranet/Notion), DPO designado, fluxo de delete-my-data documentado
- [ ] Registro interno das operações de tratamento (RAT) preenchido para dados de funcionários
- [ ] Penetest light (mínimo: SQLi, XSS, CSRF, auth bypass)

---

## 10. Riscos & Mitigações

| Risco | Prob | Impacto | Mitigação |
|---|---|---|---|
| **Vazamento de nota privada de 1:1** | Baixa | 🔴 Crítico | Test suite obrigatório RLS antes de prod (5+ casos); revisão manual da policy por 2 devs |
| **`pg_cron` indisponível** (plano Free) | Média | Médio | Plano B: Vercel cron / GitHub Actions chamando edge fns |
| **Performance do organograma >500 pessoas** | Média | Médio | Virtualização adiada; se cliente piloto >500, ativar `materialized view` |
| **Migração `manager_id` em produção** | Baixa | Médio | Coluna nullable + fallback para `dept.leader_id` por 2 sprints; UI guida admin a preencher |
| **Atraso em algum epic** | Média | Médio | Compromisso pessoal do PM: ao primeiro sinal, descopar story P1 do epic atrasado, **nunca** push de qualidade |
| ~~**Cliente-piloto desiste**~~ | ~~Média~~ | ~~Alto~~ | ~~Vender 2–3 piloto em paralelo; usar dogfood se piloto cair~~ — **removido pelo pivot 2026-04-30 (sem clientes externos)** |
| **react-pdf bundle muito grande** | Baixa | Baixo | Lazy load com `React.lazy` |
| ~~**Concorrência (Feedz lança features novas)**~~ | ~~Média~~ | ~~Médio~~ | ~~Foco em diferenciais (gamificação, UX, integração aberta)~~ — **removido pelo pivot 2026-04-30 (não competimos com Feedz, substituímos internamente)** |
| **Adoção interna baixa** (WAU < 70% no o2-growth) | Média | Médio | Iterar UX baseado em PostHog; gamificação premia uso; campeões internos por departamento; envolvimento direto da liderança no rollout |
| **Resistência ao desligamento do Feedz** (RH/líderes apegados) | Média | Alto | Rodar oxypeople em paralelo com Feedz por 2-4 semanas; comparativo de UX e dados; envolvimento da liderança na decisão de cutoff |

---

## 11. Dependências & Decisões pendentes

### Decisões de produto (precisam do usuário)
- [ ] **Plano Supabase**: confirmar Pro+ para `pg_cron` (ou usar GitHub Actions)
- [ ] **Orçamento Sentry/PostHog**: confirmar uso de free tier ou pago
- [ ] **Janela de rollout interno**: data de cutoff do Feedz no o2-growth?
- [ ] **DPO interno**: quem é o Encarregado de Dados pelo o2-growth (LGPD)?
- [ ] **Domínio interno**: `oxypeople.o2-growth.com.br`? subdomínio interno?
- [ ] **Provider de e-mail transacional**: Resend ou SendGrid (free tier)?
- [ ] **Política de privacidade interna**: revisão jurídica pontual (não precisa T&C de cliente)

### ~~Decisões comerciais (removido pelo pivot 2026-04-30)~~
- ~~Pricing: por seat / por empresa / por módulo~~
- ~~Conta Stripe / KYC PJ~~
- ~~Domínio comercial / landing pública~~
- ~~Material de marketing / vídeo de vendas~~
- ~~Recrutamento de clientes-piloto externos~~
- ~~T&C para clientes B2B~~

### Decisões técnicas (já registradas — confirmar com Aria)
Todos os 12 ADRs do `architecture-review.md` § 8.

---

## 12. Handoff

→ **`/agents:po` (Pax)** — validar este PRD, garantir que cada story tem AC claro e atomicidade, depois shardar em arquivos individuais em `docs/stories/` para o ciclo de implementação.

→ Em paralelo: **`/agents:ux` (Uma)** pode começar wireframes/specs dos 5 módulos novos enquanto Pax shardar.

---

**Status:** ✅ PRD v1.1 — recalibrado para escopo interno o2-growth (2026-04-30). Validado por Pax (PO).
