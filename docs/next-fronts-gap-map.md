# Gap-map das próximas frentes — caminho crítico até rollout interno (o2-growth)

**Autor:** Morgan (Product Manager)
**Data:** 2026-04-30 (revisado mesmo dia para escopo interno)
**Versão:** 1.1 (scope-correction)
**Inputs:** `brownfield-assessment.md`, `prd.md`, `po-validation-report.md`, `architecture-review.md`, `epics/*`, `migrations-draft/*`, `git log` recente
**Objetivo:** responder à pergunta do usuário — *"quais as próximas frentes que temos que fazer que estão faltando?"* — com priorização rigorosa (MoSCoW + RICE) e caminho crítico até **rollout interno no o2-growth substituindo o Feedz**.

> **Atualização (2026-04-30):** este documento foi originalmente escrito assumindo lançamento como SaaS comercial. O escopo real é **ferramenta interna do o2-growth para substituir o Feedz internamente**. Sem billing, sem landing comercial, sem onboarding de novos clientes. As Frentes F.2/F.3/F.4/F.5 foram **descartadas** e substituídas por Frente F.x (onboarding interno simplificado) e F.y (e-mail transacional interno). Ver `docs/SCOPE-CORRECTION-2026-04-30.md`.

> **Nota de método:** este documento foi construído a partir do **estado real do repositório** (git log, código, supabase/migrations) e não da promessa do PRD. Quando há divergência entre PRD e código, a verdade é o código.

---

## Estado atual (ground-truth)

### O que efetivamente shipou (commits + arquivos verificados)

| Frente do PRD | Estado real | Evidência |
|---|---|---|
| **Sprint 0.1** RLS fixes (migration 0001) | ⚠️ **Stage**, **não aplicada** | `829b7ef` "stage migration 0001"; arquivo presente em `supabase/migrations/20260427075955_fix_fragilities.sql`, mas requer `manager_id` (0002) e o usuário ainda não rodou `supabase db push` |
| **Sprint 0.2** Lovable Auth → Supabase | ❌ **Bloqueada** (decisão A/B/C pendente) | `package.json` ainda tem `@lovable.dev/cloud-auth-js`; `src/integrations/lovable/index.ts` continua presente; Google OAuth (commits `e7e1b90`, `017dc4b`) já está live em `Auth.tsx` |
| **Sprint 0.3** Sentry | ✅ **Done** (instrumentado, falta DSN) | `4a16328` "wire Sentry and PostHog with conditional init"; `b881753` adiciona ErrorBoundary; precisa `VITE_SENTRY_DSN` no `.env` |
| **Sprint 0.4** PostHog | ✅ **Done** (instrumentado, falta KEY) | `4a16328`; precisa `VITE_POSTHOG_KEY` no `.env` |
| **Sprint 1.1** Períodos admin UI | ✅ **Done** (UI), ⚠️ **trigger 0003 ausente** | `c5e40dd`; `src/pages/admin/Periods.tsx` + `src/components/admin/periods/PeriodFormDialog.tsx`; validação de overlap depende da migration 0003 que não foi aplicada |
| **Sprint 1.2** Comments em OKRs | ❌ **Não iniciada** | Nenhuma referência a `objective_comments` no `src/` |
| **Sprint 1.3** KR confidence | ❌ **Não iniciada** | Nenhuma referência a `confidence` em `key_results` no `src/` |
| **Sprint 1.4** Commitment type | ❌ **Não iniciada** | Nenhuma referência a `commitment_type` no `src/` |
| **Sprint 1.5** OKR cron escalation | 🟡 **Parcial** (UI manual + estrutura), **cron não configurado** | `f61fb59` "admin UI with manual run + report"; `cac926c` instrumenta edge fn; `src/pages/admin/OkrEscalation.tsx` pronto. Falta cron job (0009) ou GitHub Action |
| **Sprint 1.6** Editar collaborators | ✅ **Done** | `4b9bce5`; `src/components/objectives/CollaboratorsTab.tsx` |
| **Sprint 1.7** Enum sync TS↔DB | ✅ **Done** | `4b9bce5` "align objective_type enum"; `a3d9756` cobre com testes |
| **Sprint 2.2-2.5** Organograma 2.0 (reactflow) | 🟡 **Parcial** (visual + drawer + filtros + PNG) | `7bf3545` "replace custom CSS tree with reactflow"; falta drag&drop de manager (2.6) e modo manager_id (2.1) |
| **Sprint 2.1** manager_id no admin | ❌ **Não iniciada** (migration 0002 nem aplicada) | Não há `manager_id` em `company_memberships` no código; só `onboarding_feedbacks.manager_id` (uso pontual) |
| **Sprint 2.6** Drag&drop org | ❌ **Não iniciada** | Não há handlers de drop no `OrganizationChartFlow` |
| **Cross-cutting** ErrorBoundary, lazy routes, manualChunks, CI, lint, tests | ✅ **Done** | `b881753`, `c3cc277`, `f5cbb24`, `a3d9756` (37 testes) |
| **Sprints 3, 4, 5** (Pulse, Nine Box, Feedback, 1:1, PDI, Hardening) | ❌ **Não iniciadas** | Migrations 0004-0008 são **drafts em `docs/migrations-draft/`** — nenhuma rota nem hook criado |
| **LGPD interna + DPO** (escopo reduzido) | ❌ **Não iniciada** | Nenhum artefato; precisa apenas de Política de Privacidade interna + DPO designado, não T&C externo |
| **Onboarding interno (admin convida por e-mail)** | ❌ **Não iniciado** | Não há fluxo de convite-por-email funcional; sem multi-tenant signup |
| **E-mail transacional interno (Resend/SendGrid)** | ❌ **Não iniciado** | Não há provider configurado para convites e notificações |
| ~~Billing / Stripe / pricing / landing / T&C externo~~ | ~~❌ Não iniciado~~ | **Removido pelo pivot 2026-04-30 — fora de escopo (ferramenta interna)** |

### Resumo do estado

- **Funcionalmente:** ~30% do escopo P0 do PRD está mergeado no `main`. Os 70% restantes incluem **5 epics inteiros (3-7)** + **fechamento dos epics 1 e 2**.
- **Operacionalmente:** Sentry/PostHog instrumentados mas **sem credenciais carregadas**; CI funcional; lint/typecheck verde; 37 testes passando.
- **Banco de dados:** apenas migration **0001 está staged** (não aplicada). Migrations **0002 a 0009 ainda são rascunhos** em `docs/migrations-draft/`.
- **Rollout interno:** **zero** — nenhum convite-por-e-mail funcional, sem provider de e-mail transacional configurado, sem política de privacidade interna publicada, sem plano de cutoff do Feedz.

---

## Frentes restantes — visão executiva

| Frente | Epics | Migrations envolvidas | Esforço (semanas dev) | Bloqueador imediato | RICE | Status |
|---|---|---|---|---|---|---|
| **A — Sprint 0 fechamento** | — | 0001 apply | 0.5 | Decisão Lovable Auth (A/B/C) + apply 0001 | **Must / 9.0** | 🔴 Bloqueada |
| **B — Sprint 1 destravar** | Epic 1 (1.2-1.5) | 0003, 0009 | 1.5 | Apply 0003 + plano Supabase (cron) | **Must / 8.5** | 🔴 Bloqueada |
| **C — Sprint 2 completar** | Epic 2 (2.1, 2.6) | 0002 | 1.0 | Apply 0002 | **Must / 8.0** | 🔴 Bloqueada |
| **D — Sprint 3 trio** | Epics 3, 4, 5 | 0004, 0005, 0006 | 2.5 | Apply 0004-0006 + UX wireframes | **Should / 7.0** | ⚪ Aguardando |
| **E — Sprint 4 trio** | Epics 6, 7 | 0007, 0008 | 2.5 | Apply 0007-0008 + RLS test plan 1:1 | **Should / 6.5** | ⚪ Aguardando |
| **F.1 — LGPD interna + DPO** | — | — | 0.5 (paralelo) | Designar DPO; revisão pontual de jurídico | **Must / 7.5** | 🔴 Não iniciada |
| **F.x — Onboarding interno simplificado** | — | — | 0.5 | Decidir provider de e-mail | **Must / 8.0** | 🔴 Não iniciada |
| **F.y — E-mail transacional interno** | — | — | 0.5 | Conta Resend/SendGrid (free) | **Must / 7.5** | 🔴 Não iniciada |
| ~~F.2 / F.3 / F.4 / F.5~~ | — | — | — | — | — | **Descartada (pivot 2026-04-30)** |

> **Soma direta de dev:** ~6.5 semanas se for sequencial. **Realisticamente paralelizando**: ~4-6 semanas. As frentes F.x, F.y e F.1 são leves e rodam em paralelo com B-E.

---

## Frente A — Sprint 0 fechamento

### O que falta
1. **Aplicar migration 0001** em staging e produção (`supabase db push`).
2. **Resolver Story 0.2 (Lovable Auth)** — usuário precisa escolher A, B ou C:
   - **A:** remover totalmente Lovable Auth (recomendado, segue PRD).
   - **B:** manter coexistência (status quo — não recomendado, dívida técnica).
   - **C:** trocar Supabase Auth por Lovable como auth principal (rejeitado pelo PRD ADR-006).
3. **Carregar credenciais** `VITE_SENTRY_DSN` e `VITE_POSTHOG_KEY` no `.env` de produção (Lovable env config).
4. **Validar Sentry capturando** 1 erro sintético em produção e PostHog recebendo 1 evento (smoke test).

### Dependências (decisões + migrations)
- **D-A1:** usuário precisa rodar `supabase db push` (regra global: nunca migrations automáticas).
- **D-A2:** usuário precisa decidir A/B/C de Lovable Auth.
- **D-A3:** usuário precisa criar conta Sentry (free tier) + PostHog (free tier) e fornecer chaves.

### O que dá para adiantar antes (sem aplicar 0001)
- Escrever a remoção do `@lovable.dev/cloud-auth-js` no `Auth.tsx` e `src/integrations/lovable/` em **branch separada**, com testes de fluxo de login Google/email passando.
- Adicionar smoke test E2E para `auth → /` happy path (usar Playwright ou Cypress mínimo).
- Documentar runbook de rollback para 0001 (mesmo sendo aditiva, registrar `DROP POLICY IF EXISTS ...` para o caso).

### Estimativa
- **0.5 semana de dev** (todo o trabalho está pronto; é só destravar decisões).

### Riscos
- **R-A1 (P=0.2, I=Médio):** usuário aplica 0001 em produção sem aplicar 0002 logo depois → função `is_user_manager` continua sem uso real (sem efeito; é só lazy). **Mitigação:** documentar em README de migrations que 0002 deve seguir 0001 em <1 sprint.
- **R-A2 (P=0.4, I=Alto):** demora indefinida na decisão Lovable Auth → bloqueia Sprint 0 fechamento → bloqueia comunicação interna de "Sprint 0 done". **Mitigação:** deadline duro de 3 dias para o usuário responder; se passar, default = opção A.

---

## Frente B — Sprint 1 destravar (OKRs hardening)

### O que falta
- **Story 1.2** — comments em objetivos e KRs (UI + tabela `objective_comments`).
- **Story 1.3** — confidence (0-100) em key results (slider + badge).
- **Story 1.4** — commitment_type (committed vs aspirational, badge + filtro + exclusão da média).
- **Story 1.5** — fechamento: configurar **cron job** (Plano A: `pg_cron` via 0009) ou GitHub Actions (Plano B); ativar histórico real de execuções (já existe estrutura de UI).

### Dependências
- **Migration 0003** aplicada (cria `objective_comments`, `key_results.confidence`, `objectives.commitment_type`).
- **Migration 0009** aplicada (cron jobs) **OU** decisão por GitHub Actions.
- **Decisão D1 do PO report:** plano Supabase Pro+ confirmado para `pg_cron`.

### O que dá para adiantar antes
- **Story 1.2 (UI mock):** criar `<ObjectiveCommentsTab />` com mock data, testes RLS-ready (sem hook real). Quando 0003 sobe, plugar o hook em 1 dia.
- **Story 1.3:** desenhar `<ConfidenceSlider />` standalone testado, plugar quando coluna existir.
- **Story 1.4:** ajustar `ObjectivesFilters` para aceitar `commitment_type`, mas com `enabled: false` enquanto o campo não existir.
- **Story 1.5 (Plano B):** criar workflow `.github/workflows/cron-okr-escalation.yml` agora — não depende de Supabase plan. Roda hoje mesmo.

### Estimativa
- **1.5 semana** se 0003 + 0009 forem aplicadas no início. **+0.5** se cair em Plano B (Github Actions exige criar tabela `cron_run_logs` em migration nova).

### Riscos
- **R-B1 (P=0.3, I=Médio):** usuário não confirma plano Pro → cron migra para GitHub Actions → 1 migration extra + dependência de Github availability. **Mitigação:** começar em Plano B por padrão; migrar para Plano A pós-confirmação.
- **R-B2 (P=0.2, I=Baixo):** comentários sem `@menções` no v1 → expectativa quebrada com usuários. **Mitigação:** entregar `@menção` simples (lista de membros, sem rich-text) na primeira iteração.

---

## Frente C — Sprint 2 completar (Organograma 2.0)

### O que falta
- **Story 2.1** — `manager_id` no schema (migration 0002) + UI `/admin/org-structure` para bulk edit + campo no perfil do colaborador + trigger anti-ciclo.
- **Story 2.6** — drag-and-drop de pessoas no organograma para mudar gestor + modal de confirmação + undo toast.
- **Polish 2.2-2.5:** já mergeado (`7bf3545`); validar que filtros funcionam com `manager_id` (hoje filtram por department); adicionar PDF (PNG já existe) — pode ficar P1.

### Dependências
- **Migration 0002** aplicada (adiciona `company_memberships.manager_id` + `get_org_subtree` + `get_org_ancestors`).
- **Migration 0001** aplicada antes (helper `is_user_manager` é usado por RLS futuras).

### O que dá para adiantar antes
- Hook `useUpdateManager(userId, newManagerId)` escrito com TS types corretos, mock retorno, testes unitários — plugar a query Supabase quando 0002 subir.
- Tela `/admin/org-structure` com tabela editável (já existem padrões em `/admin/`) — ler de `company_memberships` e mostrar `manager_id` nullable hoje (vai aparecer null até migration aplicada).
- Lógica de drag-and-drop em `OrganizationChartFlow.tsx`: `onNodeDragStop` + modal "Mover X para reportar a Y?". Roda contra mock até 0002 subir.

### Estimativa
- **1.0 semana**. Se incluir bulk-edit CSV upload (nice-to-have), **+0.5**.

### Riscos
- **R-C1 (P=0.3, I=Alto):** dual-source de hierarquia (`manager_id` + `dept.leader_id`) confunde RLS de PDI/1:1/Feedback. **Mitigação:** definir em ADR explícito que `manager_id` é a fonte da verdade quando preenchida; fallback documentado para `dept.leader_id`. Implementar helper `effective_manager_id(uid)` em SQL.
- **R-C2 (P=0.2, I=Médio):** ciclos na hierarquia (A reporta a B, B reporta a A) corrompem a recursão. **Mitigação:** trigger `prevent_manager_cycle` antes de UPDATE — já está previsto no draft 0002. Cobrir com 3 testes.

---

## Frente D — Sprint 3 trio (Pulse, Nine Box, Feedback)

### O que falta
**Epic 3 — Pulse Survey (5 stories):**
- 3.1 Admin UI `/admin/pulse` com criação de pulse recorrente.
- 3.2 Widget no Dashboard ("Como você está se sentindo essa semana?").
- 3.3 Gráfico de evolução com segmentação dept/team.
- 3.4 Export CSV/Excel respeitando anonimato.
- 3.5 Edge function `pulse-dispatch` + cron hourly.

**Epic 4 — Nine Box (6 stories):**
- 4.1 Snapshot a partir de ciclo de avaliação.
- 4.2 Matriz 3x3 com drag-and-drop.
- 4.3 Justificativa obrigatória ao mover quadrante.
- 4.4 Lock (draft → finalized → archived).
- 4.5 Export PDF (react-pdf).
- 4.6 Filtro "meu time" via `get_org_subtree`.

**Epic 5 — Feedback Contínuo (7 stories):**
- 5.1 Pedir feedback sobre alguém (form + visibility).
- 5.2 Tab "Recebidos" com fila.
- 5.3 Tab "Enviados" com status.
- 5.4 Tab "Sobre mim" respeitando privacidade.
- 5.5 Trigger SQL de notificações (parte de migration 0006).
- 5.6 Dashboard de saúde (volume, tempo médio).
- 5.7 Cron diário para expirar requests vencidos.

### Dependências
- **Migrations 0004, 0005, 0006** aplicadas em sequência.
- **Migration 0001** (helper `is_user_manager`) já em produção — usado por RLS de `feedback_requests` (visibility=shared_with_manager).
- **Migration 0002** (manager_id) já em produção — usado por Nine Box "meu time" e por feedback "shared_with_manager".
- **react-pdf** novo (já está nos planos do PRD; instalar agora).
- **UX wireframes** das 3 telas novas — invocar **Uma (UX)** em paralelo a Frentes A/B/C.
- **Decisão de produto:** Pulse é anônimo por padrão? Nine Box é só admin/manager? (PRD já responde: sim e sim — confirmar com usuário).

### O que dá para adiantar antes
- Wireframes (Uma) das 3 telas em paralelo.
- Configurar tipo TS de schemas em `src/types/` baseado nos drafts SQL (sem hooks ainda).
- Componente `<NineBoxMatrix />` standalone com fake data para validar UX/drag-and-drop.
- `<PulseWidget />` no Dashboard com mock de pergunta — ativar quando 0004 sobe.
- Skeleton de página `/feedback` com 3 tabs vazias.

### Estimativa
- **2.5 semanas** com 1 dev (paralelizando Pulse + Feedback enquanto Nine Box é dev).
- **1.5 semana** com 2 devs em paralelo.

### Riscos
- **R-D1 (P=0.3, I=Alto):** RLS de `feedback_requests` com 4 papéis distintos (requester, respondent, subject, manager) é complexa. Bug = vazamento. **Mitigação:** suíte de teste obrigatória com 6 cenários antes de mergear (PO já marcou Story 5.1 como crítica).
- **R-D2 (P=0.4, I=Médio):** `react-pdf` aumenta bundle ~150KB. **Mitigação:** lazy-load via `React.lazy` apenas em `/nine-box/export` (já é padrão no app pós `b881753`).
- **R-D3 (P=0.2, I=Médio):** Pulse com 0% response rate na primeira semana (sem dogfood). **Mitigação:** ativar internamente com o time de tech 1 sprint antes do rollout amplo no o2-growth.

---

## Frente E — Sprint 4 (1:1, PDI)

### O que falta
**Epic 6 — 1:1s (7 stories):**
- 6.1 Agendamento (form + recorrência).
- 6.2 Pauta colaborativa (drag-and-drop de tópicos).
- 6.3 **Notas com 3 níveis de visibilidade (CRÍTICO de segurança)**.
- 6.4 Histórico colapsável.
- 6.5 Download `.ics` (edge function).
- 6.6 Recorrência automática.
- 6.7 Dashboard de frequência por gestor.

**Epic 7 — PDI (8 stories):**
- 7.1 Criar próprio PDI.
- 7.2 Gestor cria PDI para liderado.
- 7.3 Kanban de ações (To Do/Doing/Done/Blocked).
- 7.4 Anexar evidências (storage bucket `pdi-attachments`).
- 7.5 Aprovação do gestor (draft → active).
- 7.6 Radar chart de competências.
- 7.7 Vincular ação a feedback origem.
- 7.8 Dashboard admin de PDIs.

### Dependências
- **Migrations 0007, 0008** aplicadas.
- **Migration 0002** já aplicada (manager_id é central para 1:1 e PDI).
- **Edge function `one-on-one-ics`** nova (Deno).
- **Storage bucket `pdi-attachments`** privado + signed URLs.
- **react-pdf** já instalado em Frente D.

### O que dá para adiantar antes
- **CRÍTICO:** desenhar **plano de teste RLS de `one_on_one_notes`** com 5+ cenários (líder lê privadas dele; membro não lê privadas do líder; admin não lê privadas; etc.) — **antes** de a story ser puxada.
- Componente `<OneOnOneTopicsList />` com drag-and-drop standalone.
- Skeleton de `/pdi` com tabs e radar mockado.
- Biblioteca de geração de `.ics` (npm `ics`) prototipada localmente.

### Estimativa
- **2.5 semanas** com 1 dev. **2.0** com 2 devs paralelos.

### Riscos
- **R-E1 (P=0.2, I=CRÍTICO):** vazamento de nota privada de 1:1. Quebra de confiança irrecuperável. **Mitigação:** PR de Story 6.3 não merga sem 5+ testes RLS verdes + revisão manual de 2 devs (já no PRD §10).
- **R-E2 (P=0.3, I=Médio):** `.ics` com timezone errado em Outlook gera bug visual. **Mitigação:** testar em Google Calendar + Outlook + Apple Calendar antes de release.
- **R-E3 (P=0.2, I=Médio):** PDI radar chart sobrecarregado com 15+ competências. **Mitigação:** limitar a 8 visíveis no chart (UI), excedente em tabela.

---

## Frente F — Cross-cutting (escopo interno)

> Recalibrada em 2026-04-30. Foco apenas em **LGPD interno** + **onboarding interno** + **e-mail transacional interno**. Tudo relacionado a clientes externos (billing, landing, pricing, T&C B2B, marketing, signup multi-empresa) foi **descartado** — ver "Frentes descartadas" no fim desta seção.

### F.1 — LGPD interna + DPO (escopo reduzido)
**O que falta:**
- **Política de Privacidade interna** publicada (intranet/Notion) — não precisa T&C de cliente externo, só comunicar aos funcionários do o2-growth como os dados deles são tratados.
- **DPO designado** — pessoa do o2-growth responsável pelo tratamento de dados (LGPD exige Encarregado).
- Fluxo "delete my data" funcional (já temos `is_company_admin` policies; falta UI + edge function `gdpr-delete`).
- **RAT interno** (Registro de Atividades de Tratamento) — documento interno listando o que se trata de dados pessoais de funcionários.
- Consentimento de cookies leve (banner mínimo, mais para PostHog do que LGPD pesado).

**O que NÃO precisa mais (era para B2B):**
- ~~Termos & Condições para clientes externos~~
- ~~DPA (Data Processing Agreement) modelo B2B~~
- ~~Revisão jurídica completa de advogado especializado~~ — basta revisão pontual interna ou consultoria leve.

**Esforço:** 0.5 semana de jurídico interno + 0.5 semana de dev (UI delete-my-data + edge function). RICE rebaixado de **9.5 → 7.5** porque não é mais bloqueador comercial.

**Risco R-F1 (P=0.2, I=Médio):** DPO não designado a tempo do rollout interno. **Mitigação:** designar na semana 1; usar template público de RAT (ex.: do gov.br) e adaptar.

---

### F.x — Onboarding interno simplificado (NOVO)
**O que falta:**
- Tela `/admin/invite` — admin do o2-growth digita e-mail + dept + role; sistema gera link mágico de signup (token via Supabase Auth invite) e dispara e-mail via F.y.
- Aceite do convite: usuário clica no e-mail, define senha (ou logga via Google OAuth já existente), entra automaticamente na company fixa do o2-growth.
- **Sem fluxo de "criar empresa"** — `company_id` é hardcoded para o2-growth (constante em config ou fixa via seed). O schema multi-tenant fica no banco como **defesa em profundidade** e opcionalidade futura.
- Bulk invite por CSV (P1) — útil no rollout inicial para importar todos do o2-growth de uma vez.
- Página de "primeira vez aqui" (walkthrough rápido em 3 telas — onde estão OKRs, 1:1s, feedback).

**Esforço:** 0.5 semana (UI + edge function de signup-by-token; reusa Supabase Auth invitations + Google OAuth).

**Decisões pendentes:**
- ID fixo da company o2-growth — gerar via seed migration ou hardcoded no env? **Recomendação:** seed migration aditiva `0010_seed_o2growth.sql` com `INSERT ... ON CONFLICT DO NOTHING`.
- Bulk import CSV no MVP ou P1? **Recomendação:** P1 — admin convida 1-a-1 no rollout (a base é pequena).

**Risco R-Fx (P=0.2, I=Baixo):** convite não chega por e-mail (spam). **Mitigação:** F.y inclui domínio próprio com SPF/DKIM; testar com 5 inboxes (Gmail, Outlook, mailbox interno).

---

### F.y — E-mail transacional interno (NOVO)
**O que falta:**
- Conta **Resend** (recomendado pela DX) ou **SendGrid** (free tier). Hoje **não há e-mail saindo do produto**.
- Templates simples: convite (F.x), reset de senha, 1:1 agendado, feedback recebido, PDI aprovado, Pulse semanal.
- Edge function `send-email` (Deno) que recebe `{to, template, data}` e dispara via API do provider.
- Configuração SPF/DKIM/DMARC para domínio do o2-growth (`@o2growth.com.br` ou similar) para evitar spam.
- Slack integration **já existe** (`send-slack-message`) — sem mudança; pode complementar e-mail para notificações urgentes.

**O que NÃO precisa (era escopo comercial):**
- ~~Templates ricos com branding comercial / hero image~~
- ~~Domínio comercial + reputation building~~
- ~~Integração Teams (não é necessário para uso interno do o2-growth se a empresa usa Slack)~~

**Esforço:** 0.5 semana (config provider + edge function + 6 templates HTML simples).

**Decisões pendentes:**
- Provider: Resend ou SendGrid? **Recomendação:** Resend (DX moderna, free tier 3k/mês — sobra para o2-growth).
- Domínio remetente: usar `@o2growth.com.br` ou subdomínio dedicado? **Recomendação:** subdomínio `notify@oxypeople.o2growth.com.br` para não poluir reputation do domínio principal.

**Risco R-Fy (P=0.3, I=Médio):** e-mails caem no spam por falta de DKIM. **Mitigação:** configurar DNS antes do rollout; smoke test com 10 inboxes diversos.

---

### Frentes descartadas — pivot para tool interna (2026-04-30)

As seguintes frentes foram **removidas integralmente** do escopo do MVP:

| Frente removida | Por quê | RICE original |
|---|---|---|
| ~~**F.2 — Billing / Stripe / NF-e**~~ | Sem clientes externos. Não há cobrança nem checkout. Custo de infra (Supabase) é despesa interna do o2-growth. | 8.0 |
| ~~**F.3 — Multi-tenant onboarding (criar empresa)**~~ | Apenas o2-growth usa. Schema multi-tenant fica no banco como defesa em profundidade, mas o fluxo de "criar nova empresa" não é necessário. Onboarding interno (F.x) substitui. | 7.5 |
| ~~**F.4 antigo — E-mail + Slack/Teams**~~ | Substituído por F.y (escopo enxuto: só e-mail interno). Slack já está integrado. Teams sai de escopo (o2-growth usa Slack). | 7.0 |
| ~~**F.5 — Landing / Pricing / Site público**~~ | Sem funil de aquisição. Sem prospects externos. Sem necessidade de SEO/copy comercial. | 6.5 |
| ~~**F.6 antigo — Suporte / docs externos**~~ | Sem usuários externos. Documentação interna pode ser Notion da empresa, sem chat de suporte profissional. SLAs internos são acordo informal entre o time de tech e RH. | 5.0 |

**Total economizado:** ~5-6 semanas de dev + paralelos jurídicos/comerciais. **É exatamente o delta entre o timeline antigo (8-10 semanas) e o novo (4-6 semanas).**

---

<details>
<summary>~~Conteúdo original das frentes descartadas (mantido para audit trail — removido pelo pivot 2026-04-30)~~</summary>

### ~~F.2 — Billing / Stripe~~
**O que falta:**
- Conta Stripe ativada com PJ.
- Modelo de pricing **definido pelo usuário** (PRD §11 listou como pendente).
- Tabela `subscriptions` no Supabase.
- Edge function `stripe-webhook` (criar checkout, atualizar status).
- Tela `/billing` para admin da empresa: ver fatura, mudar plano, atualizar cartão.
- Trial de 14 dias com gate em features Premium (Nine Box? Cron Pro? Slack? — definir).
- Integração com NF-e (eNotas, NFe.io) — Brasil precisa de NFS-e.

**Esforço:** 1.5 semana de dev + decisões comerciais paralelas.

**Decisões pendentes:**
- Pricing model: por seat / por empresa / freemium?
- Quanto cobrar? (benchmark Feedz: R$ 12-25/seat/mês).
- Quais features ficam atrás de paywall? (sugestão: Nine Box + PDI = Premium; resto = Standard).
- Anual vs mensal? Desconto?

**Risco R-F2 (P=0.4, I=Alto):** sem pricing definido na semana 6 → não há como contratar piloto. **Mitigação:** travar pricing v1 na semana 4 (mesmo que mude depois).

---

### ~~F.3 — Multi-tenant Onboarding Flow~~
**O que falta:**
- Fluxo de signup de **nova empresa** (hoje só convite individual em company existente).
- Wizard pós-signup: criar departamentos básicos, importar CSV de colaboradores, configurar 1º período de OKR, escolher integração inicial (Slack? Google?).
- Subdomain ou path-based routing por empresa (`acme.oxypeople.com.br` ou `app.oxypeople.com.br/acme`).
- Email de boas-vindas automatizado.
- Página de "primeira vez aqui" com walkthrough.

**Esforço:** 1 semana.

**Risco R-F3 (P=0.3, I=Médio):** primeiro cliente leva 4h para fazer onboarding (PRD meta: <2h). **Mitigação:** sessão guiada com Customer Success no piloto + iterar baseado em pain points.

---

### ~~F.4 — E-mail transacional + Slack/Teams~~
**O que falta:**
- E-mail provider integrado (Resend recomendado, ou SendGrid). Hoje **não há e-mail saindo do produto**.
- Templates: convite, password reset, 1:1 agendado, feedback recebido, PDI aprovado, Pulse semanal.
- Slack integration **estendida** — hoje envia mensagens, falta "comandos" (`/feedback @joão`) e digest semanal.
- Teams integration — apontado como diferencial pelo PRD; **zero código** hoje.

**Esforço:** 1 semana e-mail + 1 semana Slack/Teams (Teams pode virar P1).

**Risco R-F4 (P=0.4, I=Alto):** confiar em "Slack apenas" exclui empresas que usam só Teams (mercado BR ~50/50). **Mitigação:** Teams entra como P1 logo após MVP; comunicar no marketing.

---

### ~~F.5 — Landing / Pricing page / Site público~~
**O que falta:**
- Landing comercial (`oxypeople.com.br` ou similar). **Não existe**.
- Pricing page com plano comparativo.
- Página /sobre, /contato, /demo (form + Calendly).
- Blog técnico (SEO long-tail comparando com Feedz).
- Material de marketing (vídeo demo de 2min, screenshots, deck de vendas).

**Esforço:** 1.5 semana (dev front simples + copy).

**Risco R-F5 (P=0.4, I=Médio):** lançar sem landing → não há funil de inbound. **Mitigação:** outbound direto a 10 prospects no piloto enquanto site não está pronto.

---

### ~~F.6 — Suporte / Documentação~~
**O que falta:**
- Centro de ajuda (Crisp, Intercom, ou Notion público).
- Docs de "Como criar OKR", "Como rodar avaliação 360", etc.
- Chat de suporte ou email `support@`.
- SLA de resposta documentado (PRD: <24h para P0/P1).
- Status page (PRD recomendou pular; manter ou usar Better Uptime free).

**Esforço:** 1 semana.

</details>

---

## Caminho crítico (Gantt textual) — escopo interno 4-6 semanas

> **Premissas:** 1 dev sênior + Claude Code + UX (Uma) on-demand + usuário responde decisões em <72h. Sem advogado externo (jurídico interno pontual). Sem dependências comerciais.

```
Semana 1  | A (Sprint 0 close)         | F.1 (LGPD interna start)     | F.y (Resend setup)
          | apply 0001, decide LovAuth | template RAT + DPO designar  | DNS SPF/DKIM
          | Sentry/PostHog credenciais |                              |
          |                            |                              |
Semana 2  | B (1.2 + 1.3 + 1.4 + 1.5)  | F.x (admin invite UI mock)   | F.y (templates HTML)
          | apply 0003 + 0009          | UX wireframes Pulse+9Box+FB  |
          |                            |                              |
Semana 3  | C (2.1 + 2.6)              | F.x (signup-by-token live)   | F.y (smoke test)
          | apply 0002                 | F.1 (delete-my-data UI)      |
          | + D (Pulse + Nine Box)     |                              |
          | apply 0004 + 0005          |                              |
          |                            |                              |
Semana 4  | D (Feedback)               | F.1 (Privacy interna publish)| Slack/email integ tests
          | apply 0006                 | RAT preenchido               |
          | + E (1:1 incl. RLS tests)  |                              |
          | apply 0007                 |                              |
          |                            |                              |
Semana 5  | E (PDI)                    | rollout interno start        | Convites em massa
          | apply 0008                 | (admin convida funcionários) | piloto interno paralelo
          | + Hardening leve           |                              | ao Feedz
          |                            |                              |
Semana 6  | Bug-bash + polish          | Cutoff Feedz agendado        | observabilidade prod
          | suíte de testes core       | NPS interno coletado         | "Internal Rollout Done"
          |                            |                              |
[Buffer]  | Semana 7 (opcional)        | feedback iterativo do o2     | ajustes UX
```

### Caminho crítico (CPM)

```
Decisão Lovable/0001 → 0002 → 0003 → Frente B+C → 0004-0008 → Frentes D+E → Rollout interno
                                                                                  ↑
                              F.y (Resend + DNS, semana 1) ────────────────────┘
                              F.x (admin invite, semana 2-3) ───────────────────┘
                              F.1 (Privacy interna, semana 4) ─────────────────┘
```

**Gargalo crítico realista:** sem advogado externo no caminho crítico, o gargalo passa a ser **decisões internas pendentes do usuário** (Lovable Auth A/B/C, plano Supabase, DPO designar, provider de e-mail). Cada dia parado em decisão = 1 dia atrasado no rollout interno.

**Segundo gargalo:** **DNS SPF/DKIM/DMARC** do domínio do o2-growth — depende de quem administra o DNS (TI). Se demorar, F.y atrasa e F.x junto. **Iniciar semana 1.**

---

## Top 5 decisões pendentes do usuário (escopo interno)

| # | Decisão | Bloqueia | Deadline sugerido | Default proposto se silêncio |
|---|---|---|---|---|
| **1** | **Lovable Auth: A/B/C?** (ver Story 0.2) | Frente A (Sprint 0 close), pode atrasar tudo | 2026-05-03 | **A** (remover Lovable, usar só Supabase) |
| **2** | **Plano Supabase Pro+ confirmado?** | Story 1.5 (cron) e migration 0009. Define plano A vs B. | 2026-05-05 | Plano B (GitHub Actions) — robusto e gratuito |
| **3** | **DPO interno do o2-growth: quem é?** | Frente F.1 — exigência LGPD para tratamento de dados de funcionários | 2026-05-03 | RH ou C-level designa via portaria interna; pode ser pessoa não-técnica |
| **4** | **Provider de e-mail transacional: Resend ou SendGrid?** | Frente F.y (sem isso, sem convite por e-mail) | 2026-05-03 | **Resend** (DX moderna, free 3k/mês) |
| **5** | **Janela de cutoff do Feedz**: quando desligar a assinatura atual? | Final do rollout interno | 2026-05-31 (alvo: semana 6) | Rodar em paralelo 2 semanas, cutoff na semana 6 |

> **Decisões secundárias (importantes mas não bloqueadoras imediatas):**
> - Subdomínio interno: `oxypeople.o2growth.com.br` ou outro?
> - Sentry/PostHog: já tem conta? free tier?
> - Quem administra DNS do domínio do o2-growth (para SPF/DKIM)?
> - Bulk import CSV no MVP ou P1?

### ~~Decisões removidas pelo pivot 2026-04-30~~
- ~~Pricing model + valor por seat~~
- ~~Cliente piloto: quem? quando?~~
- ~~Advogado para T&C/LGPD~~ (substituído por jurídico interno pontual)
- ~~Domínio comercial~~
- ~~Teams integration~~

---

## Riscos consolidados — escopo interno (R1-R5 ranqueados por exposição = P × I)

| Rank | Código | Risco | Prob | Impacto | Frente | Mitigação ativa |
|---|---|---|---|---|---|---|
| **R1** | R-E1 | **Vazamento de nota privada de 1:1** — quebra de confiança irrecuperável (interno é pior, todos se conhecem) | 0.2 | Crítico | E (Story 6.3) | 5+ testes RLS obrigatórios + revisão de 2 devs antes do merge |
| **R2** | R-D1 | **RLS de feedback_requests** com 4 papéis: bug = vazamento | 0.3 | Alto | D (Story 5.1) | Suíte de 6 cenários de teste antes de merge |
| **R3** | R-A2 | **Decisão Lovable Auth demora** → trava Sprint 0 fechamento | 0.4 | Alto | A | Deadline duro de 3 dias; default = opção A se silêncio |
| **R4** | R-Adoção | **Resistência interna ao desligamento do Feedz** (RH apegado, líderes preferem o que conhecem) | 0.4 | Alto | Rollout | Rodar em paralelo 2-4 semanas; envolver liderança no cutoff; campeões internos por dept |
| **R5** | R-Fy | **DNS SPF/DKIM** demora ou e-mails caem no spam | 0.3 | Médio | F.y | Configurar DNS na semana 1; smoke test com 10 inboxes; fallback Slack para notificações urgentes |
| R6 | R-C1 | Dual-source de hierarquia (manager_id + dept.leader) confunde RLS | 0.3 | Alto | C | ADR + helper SQL `effective_manager_id()` |
| R7 | R-F1 | DPO interno não designado a tempo do rollout | 0.2 | Médio | F.1 | Designar semana 1; usar template gov.br de RAT |
| R8 | R-B1 | Plano Supabase Free → cron via GitHub Actions, +1 migration | 0.3 | Médio | B | Começar em Plano B; migrar se Pro+ for confirmado |
| R9 | R-D3 | Pulse com 0% response rate na primeira semana | 0.2 | Médio | D | Dogfood interno 1 sprint antes do rollout |
| R10 | R-Fx | Convite-por-e-mail não chega (spam ou erro) → onboarding interno trava | 0.2 | Médio | F.x | F.y resolve via DKIM; fallback: admin compartilha link via Slack |

### ~~Riscos removidos pelo pivot 2026-04-30~~
- ~~R-F1 antigo: Advogado demora 4+ semanas para T&C/LGPD~~ (sem T&C externo)
- ~~R-F2: Pricing não definido na semana 4~~ (sem pricing)
- ~~R-F4: Sem Teams → exclui ~50% do mercado BR~~ (sem mercado externo)
- ~~R-F5: Sem landing → sem inbound~~ (sem aquisição)

---

## Definition of "Internal Rollout Done" (substitui "MVP comercialmente vendável")

Checklist final — todos os itens **devem** estar verdes para o rollout interno no o2-growth ser considerado completo:

### Funcional (paridade Feedz para uso interno)
- [ ] Frentes A, B, C, D, E **completas** (todos os 7 epics P0 com stories `done`)
- [ ] OKRs com check-ins, comments, confidence, commitment_type, períodos UI, cron
- [ ] Organograma com manager_id editável, drag&drop, drawer, filtros, export PNG/PDF
- [ ] Pulse Survey rodando em produção com 1+ pulse ativo
- [ ] Nine Box com 1 snapshot completo + export PDF
- [ ] Feedback contínuo com 30+ requests circulando internamente
- [ ] 1:1s com 5+ ocorrências reais conduzidas + zero vazamento RLS
- [ ] PDI com 3+ planos ativos + 1 finalizado com evidências

### Operacional / Qualidade
- [ ] Sentry capturando em produção sem alertas críticos por 7 dias
- [ ] PostHog recebendo eventos com funis básicos configurados
- [ ] Cron jobs (OKR escalation + Pulse + 1:1 recurrence + run-automations) rodando 7 dias seguidos sem falha
- [ ] Backups Supabase diários confirmados
- [ ] Suíte de testes cobrindo: auth flow, RLS de `one_on_one_notes`, RLS de `feedback_requests`, fluxo de check-in OKR, criação de PDI
- [ ] Lint + typecheck + CI verdes
- [ ] Lighthouse score ≥ 85 mobile (Performance + Acessibilidade)
- [ ] 0 bugs P0/P1 abertos

### Rollout interno (o2-growth)
- [ ] **Política de Privacidade interna** publicada (intranet/Notion)
- [ ] **DPO interno designado** + RAT preenchido para dados de funcionários
- [ ] **E-mail transacional** ativo (Resend/SendGrid) com 6 templates funcionais
- [ ] **DNS SPF/DKIM/DMARC** configurado e validado (smoke test em 10 inboxes)
- [ ] **Onboarding interno** funcional (admin convida por e-mail, usuário ativa em <5min)
- [ ] **Slack integration** ativa para notificações
- [ ] **100% do headcount o2-growth** convidado e ≥95% logado pelo menos 1 vez
- [ ] **Cutoff do Feedz** agendado/efetivado
- [ ] **Documentação interna** publicada (Notion da empresa) com "Como criar OKR", "Como rodar 1:1", etc.

### Segurança / Conformidade (LGPD interna)
- [ ] Fluxo "delete my data" funcional + RAT interno
- [ ] **Auditoria RLS:** cada tabela testada com 3 personas distintas (owner, manager, member)
- [ ] **Penetest light:** SQLi, XSS, CSRF, auth bypass — 0 críticos
- [ ] **Service role keys** rotacionáveis; nenhuma chave em código-fonte
- [ ] **Rate limiting** em edge functions críticas (auth, pdi-attachments upload)

### Suporte interno
- [ ] Canal de suporte interno (Slack #oxypeople-help ou similar)
- [ ] Runbooks de operação (deploy, rollback, incident response)
- [ ] On-call informal definido (mesmo que 1 pessoa do time de tech)

### ~~Removido pelo pivot 2026-04-30~~
- ~~T&C externo aprovado por advogado~~
- ~~Stripe checkout funcional~~
- ~~Pricing page / Landing comercial~~
- ~~NF-e/NFS-e automática~~
- ~~Onboarding wizard multi-tenant (<2h)~~
- ~~Cliente piloto externo dogfood 2 semanas~~
- ~~Material de marketing comercial~~
- ~~Domínio comercial com SSL~~
- ~~Status page externo~~

---

## Conclusão executiva

**Estado:** ~30% do P0 mergeado, 70% pela frente. Caminho técnico bem mapeado; sem mais risco jurídico/comercial externo (escopo virou interno em 2026-04-30).

**Caminho mais curto até rollout interno (o2-growth substitui Feedz): 4 semanas** se decisões pendentes forem destravadas em <72h e DNS for configurado na semana 1.

**Realista (com 1 dev + Claude Code + buffers normais):** **6 semanas** até desligamento do Feedz.

**Próximo passo recomendado para o usuário:**
1. Responder as **5 decisões pendentes** do quadro acima (deadline 2026-05-05).
2. Aplicar migrations 0001 → 0002 → 0003 em sequência (esta semana).
3. **Designar DPO interno** + iniciar template RAT (esta semana).
4. **Criar conta Resend** (free) + configurar DNS SPF/DKIM (esta semana).

Tudo o mais é executável pelo dev em paralelo.

---

**Status:** ✅ Gap-map v1.1 — recalibrado para escopo interno (2026-04-30). Pronto para apreciação do usuário e priorização final pelo PO/PM.
