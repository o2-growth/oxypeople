# Gap-map das próximas frentes — caminho crítico até MVP comercial

**Autor:** Morgan (Product Manager)
**Data:** 2026-04-30
**Inputs:** `brownfield-assessment.md`, `prd.md`, `po-validation-report.md`, `architecture-review.md`, `epics/*`, `migrations-draft/*`, `git log` recente
**Objetivo:** responder à pergunta do usuário — *"quais as próximas frentes que temos que fazer que estão faltando?"* — com priorização rigorosa (MoSCoW + RICE) e caminho crítico até "MVP comercialmente vendável".

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
| **LGPD / billing / pricing / landing / T&C** | ❌ **Não iniciadas** | Nenhum artefato no repo; PRD §11 lista como "decisões pendentes do usuário" |

### Resumo do estado

- **Funcionalmente:** ~30% do escopo P0 do PRD está mergeado no `main`. Os 70% restantes incluem **5 epics inteiros (3-7)** + **fechamento dos epics 1 e 2**.
- **Operacionalmente:** Sentry/PostHog instrumentados mas **sem credenciais carregadas**; CI funcional; lint/typecheck verde; 37 testes passando.
- **Banco de dados:** apenas migration **0001 está staged** (não aplicada). Migrations **0002 a 0009 ainda são rascunhos** em `docs/migrations-draft/`.
- **Comercial:** **zero** — nem pricing, nem checkout, nem T&C, nem landing, nem cliente piloto comprometido.

---

## Frentes restantes — visão executiva

| Frente | Epics | Migrations envolvidas | Esforço (semanas dev) | Bloqueador imediato | RICE | Status |
|---|---|---|---|---|---|---|
| **A — Sprint 0 fechamento** | — | 0001 apply | 0.5 | Decisão Lovable Auth (A/B/C) + apply 0001 | **Must / 9.0** | 🔴 Bloqueada |
| **B — Sprint 1 destravar** | Epic 1 (1.2-1.5) | 0003, 0009 | 1.5 | Apply 0003 + plano Supabase (cron) | **Must / 8.5** | 🔴 Bloqueada |
| **C — Sprint 2 completar** | Epic 2 (2.1, 2.6) | 0002 | 1.0 | Apply 0002 | **Must / 8.0** | 🔴 Bloqueada |
| **D — Sprint 3 trio** | Epics 3, 4, 5 | 0004, 0005, 0006 | 2.5 | Apply 0004-0006 + UX wireframes | **Should / 7.0** | ⚪ Aguardando |
| **E — Sprint 4 trio** | Epics 6, 7 | 0007, 0008 | 2.5 | Apply 0007-0008 + RLS test plan 1:1 | **Should / 6.5** | ⚪ Aguardando |
| **F — Cross-cutting & GTM** | — | — | 2.0 (paralelo) | Decisões de pricing, advogado LGPD, conta Stripe | **Must (parcial) / 9.5** | 🔴 Não iniciada |

> **Soma direta de dev:** 10.0 semanas se for sequencial. **Crítico:** Frente F é em **paralelo** com B-E e contém bloqueadores comerciais (não técnicos) que **podem virar o prazo crítico** se não começarem imediatamente.

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
- **R-D3 (P=0.2, I=Médio):** Pulse com 0% response rate na primeira semana (sem dogfood). **Mitigação:** ativar internamente 1 sprint antes de cliente piloto.

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

## Frente F — Cross-cutting & Go-to-market

> Esta frente **roda em paralelo** às frentes A-E e contém bloqueadores **não-técnicos** que podem ser o **gargalo crítico real** (não o código).

### F.1 — LGPD / Privacidade
**O que falta:**
- Política de Privacidade publicada (precisa **advogado**).
- Termos & Condições publicados (precisa **advogado**).
- Fluxo "delete my data" funcional (já temos `is_company_admin` policies; falta UI + edge function `gdpr-delete`).
- Consentimento de cookies (banner + storage de consent state).
- DPA (Data Processing Agreement) modelo para clientes B2B.
- Registro de operações de tratamento (RAT) interno.

**Esforço:** 1 semana de jurídico + 0.5 semana de dev. **Bloqueador absoluto** para fechar contrato com qualquer cliente piloto.

**Risco R-F1 (P=0.5, I=CRÍTICO):** advogado demorar 4+ semanas para revisar T&C/Privacy. **Mitigação:** **iniciar agora**; usar template adaptado (ex.: Iubenda, Termly) como ponte enquanto o definitivo fica pronto.

---

### F.2 — Billing / Stripe
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

### F.3 — Multi-tenant Onboarding Flow
**O que falta:**
- Fluxo de signup de **nova empresa** (hoje só convite individual em company existente).
- Wizard pós-signup: criar departamentos básicos, importar CSV de colaboradores, configurar 1º período de OKR, escolher integração inicial (Slack? Google?).
- Subdomain ou path-based routing por empresa (`acme.oxypeople.com.br` ou `app.oxypeople.com.br/acme`).
- Email de boas-vindas automatizado.
- Página de "primeira vez aqui" com walkthrough.

**Esforço:** 1 semana.

**Risco R-F3 (P=0.3, I=Médio):** primeiro cliente leva 4h para fazer onboarding (PRD meta: <2h). **Mitigação:** sessão guiada com Customer Success no piloto + iterar baseado em pain points.

---

### F.4 — E-mail transacional + Slack/Teams
**O que falta:**
- E-mail provider integrado (Resend recomendado, ou SendGrid). Hoje **não há e-mail saindo do produto**.
- Templates: convite, password reset, 1:1 agendado, feedback recebido, PDI aprovado, Pulse semanal.
- Slack integration **estendida** — hoje envia mensagens, falta "comandos" (`/feedback @joão`) e digest semanal.
- Teams integration — apontado como diferencial pelo PRD; **zero código** hoje.

**Esforço:** 1 semana e-mail + 1 semana Slack/Teams (Teams pode virar P1).

**Risco R-F4 (P=0.4, I=Alto):** confiar em "Slack apenas" exclui empresas que usam só Teams (mercado BR ~50/50). **Mitigação:** Teams entra como P1 logo após MVP; comunicar no marketing.

---

### F.5 — Landing / Pricing page / Site público
**O que falta:**
- Landing comercial (`oxypeople.com.br` ou similar). **Não existe**.
- Pricing page com plano comparativo.
- Página /sobre, /contato, /demo (form + Calendly).
- Blog técnico (SEO long-tail comparando com Feedz).
- Material de marketing (vídeo demo de 2min, screenshots, deck de vendas).

**Esforço:** 1.5 semana (dev front simples + copy).

**Risco R-F5 (P=0.4, I=Médio):** lançar sem landing → não há funil de inbound. **Mitigação:** outbound direto a 10 prospects no piloto enquanto site não está pronto.

---

### F.6 — Suporte / Documentação
**O que falta:**
- Centro de ajuda (Crisp, Intercom, ou Notion público).
- Docs de "Como criar OKR", "Como rodar avaliação 360", etc.
- Chat de suporte ou email `support@`.
- SLA de resposta documentado (PRD: <24h para P0/P1).
- Status page (PRD recomendou pular; manter ou usar Better Uptime free).

**Esforço:** 1 semana.

---

## Caminho crítico (Gantt textual)

> **Premissas:** 1 dev sênior + Claude Code + advogado paralelo + UX (Uma) on-demand + usuário responde decisões em <72h.

```
Semana 1  | A (Sprint 0 close)         | F.1 (LGPD - advogado)        | F.2 (Stripe conta)
          | apply 0001, decide LovAuth | template T&C/Privacy         | pricing v1 draft
          | Sentry/PostHog credenciais |
          |                            |
Semana 2  | B (1.2 + 1.3 + 1.4)        | F.5 (landing skeleton)       | F.4 (Resend setup)
          | apply 0003                 |                              | template e-mails
          |                            |
Semana 3  | B (1.5 cron) + C (2.1)     | UX wireframes Pulse+9Box+FB  | F.3 (signup wizard)
          | apply 0009 + 0002          |                              |
          |                            |
Semana 4  | C (2.6 drag) + D (Pulse)   | GATE 1: pricing locked       | F.4 (Slack digest)
          | apply 0004                 | F.5 (landing v1 publicada)   |
          |                            |
Semana 5  | D (Nine Box + Feedback)    | F.1 GATE: T&C/Privacy live   | F.6 (help docs core)
          | apply 0005 + 0006          | F.2 (Stripe checkout end-to-end)|
          |                            |
Semana 6  | E (1:1 - inclui RLS test)  | GATE 2: Onboarding flow done | F.6 (status page)
          | apply 0007                 | sales material               |
          |                            |
Semana 7  | E (PDI)                    | GATE 3: cliente piloto firmado| F.4 (Teams - opcional)
          | apply 0008                 |                              |
          |                            |
Semana 8  | Hardening, polish          | piloto onboard               | observabilidade prod
          | testes, bug-bash, mood,    | dogfood completo             |
          | central de notificações    |                              |
          |                            |
Semana 9  | Buffer / atrasos           | piloto em uso real           | iteração baseada em uso
          | feedback do piloto         | feedback loop                |
          |                            |
Semana 10 | GA "MVP done"              | 2º piloto onboard            | marketing push
          | checklist do PRD §9        |                              |
```

### Caminho crítico (CPM)

```
Decisão Lovable/0001 → 0002 → 0003 → Frente B+C → 0004-0008 → Frentes D+E → Hardening → Piloto
                                                                                          ↑
                              T&C/Privacy advogado (start semana 1) ─────────────────────┘
                              Pricing locked (semana 4) ────────────────────────────────┘
                              Stripe live (semana 5) ───────────────────────────────────┘
```

**Gargalo crítico realista:** **Frente F.1 (advogado LGPD/T&C)** — fora do controle do dev, lead time de 2-4 semanas. Se não iniciar **semana 1**, vira o limitante para fechar piloto em semana 7.

**Segundo gargalo:** decisões pendentes do usuário (vide próxima seção). Cada dia parado em decisão = 1 dia atrasado no MVP.

---

## Top 5 decisões pendentes do usuário

| # | Decisão | Bloqueia | Deadline sugerido | Default proposto se silêncio |
|---|---|---|---|---|
| **1** | **Lovable Auth: A/B/C?** (ver Story 0.2) | Frente A (Sprint 0 close), pode atrasar tudo | 2026-05-03 | **A** (remover Lovable, usar só Supabase) |
| **2** | **Plano Supabase Pro+ confirmado?** | Story 1.5 (cron) e migration 0009. Define plano A vs B. | 2026-05-05 | Plano B (GitHub Actions) — robusto e gratuito |
| **3** | **Pricing model + valor por seat** | Frente F.2 (Stripe) e F.5 (landing). Sem isso, sem checkout. | 2026-05-15 (semana 4 GATE 1) | R$ 18/seat/mês Standard, R$ 28 Premium (Nine Box+PDI), trial 14 dias |
| **4** | **Cliente piloto: quem? quando?** | Frente final do MVP. Define datas reais de produção. | 2026-05-20 | Iniciar prospecção com 5 candidatos da rede; meta: piloto onboard semana 7 |
| **5** | **Advogado para T&C/LGPD: contratar quem?** | Frente F.1 — bloqueador comercial absoluto | 2026-05-03 | Iubenda + revisão pontual de advogado conhecido (R$ 1-2k) |

> **Decisões secundárias (importantes mas não bloqueadoras imediatas):**
> - Domínio: `oxypeople.com.br`? `app.oxypeople.com`?
> - Sentry/PostHog: já tem conta? free tier?
> - Resend ou SendGrid para e-mail transacional?
> - Suporte: Crisp / Intercom / Notion público?
> - Teams integration: MVP ou P1?

---

## Riscos consolidados (R1-R5 ranqueados por exposição = P × I)

| Rank | Código | Risco | Prob | Impacto | Frente | Mitigação ativa |
|---|---|---|---|---|---|---|
| **R1** | R-F1 | **Advogado demora 4+ semanas** para T&C/LGPD → bloqueia fechar piloto | 0.5 | Crítico | F.1 | Iniciar semana 1 com template Iubenda; revisão pontual de advogado em paralelo |
| **R2** | R-E1 | **Vazamento de nota privada de 1:1** — quebra de confiança irrecuperável | 0.2 | Crítico | E (Story 6.3) | 5+ testes RLS obrigatórios + revisão de 2 devs antes do merge |
| **R3** | R-F2 | **Pricing não definido** na semana 4 → não há como contratar piloto | 0.4 | Alto | F.2 | Travar pricing v1 na semana 4 mesmo que mude depois |
| **R4** | R-A2 | **Decisão Lovable Auth demora** → trava Sprint 0 fechamento | 0.4 | Alto | A | Deadline duro de 3 dias; default = opção A se silêncio |
| **R5** | R-D1 | **RLS de feedback_requests** com 4 papéis: bug = vazamento | 0.3 | Alto | D (Story 5.1) | Suíte de 6 cenários de teste antes de merge |
| R6 | R-C1 | Dual-source de hierarquia (manager_id + dept.leader) confunde RLS | 0.3 | Alto | C | ADR + helper SQL `effective_manager_id()` |
| R7 | R-F4 | Sem Teams → exclui ~50% do mercado BR | 0.4 | Alto | F.4 | Comunicar "Teams em breve"; outbound em prospects que usam Slack |
| R8 | R-B1 | Plano Supabase Free → cron via GitHub Actions, +1 migration | 0.3 | Médio | B | Começar em Plano B; migrar se Pro+ for confirmado |
| R9 | R-F5 | Sem landing → sem inbound | 0.4 | Médio | F.5 | Outbound direto enquanto site não estiver pronto |
| R10 | R-D3 | Pulse com 0% response rate na primeira semana | 0.2 | Médio | D | Dogfood interno 1 sprint antes do piloto |

---

## Definition of "MVP comercialmente vendável"

Checklist final — todos os itens **devem** estar verdes para o produto ser considerado MVP comercial:

### Funcional (paridade Feedz mínima)
- [ ] Frentes A, B, C, D, E **completas** (todos os 7 epics P0 com stories `done`)
- [ ] OKRs com check-ins, comments, confidence, commitment_type, períodos UI, cron
- [ ] Organograma com manager_id editável, drag&drop, drawer, filtros, export PNG/PDF
- [ ] Pulse Survey rodando em produção com 1+ pulse ativo
- [ ] Nine Box com 1 snapshot completo + export PDF
- [ ] Feedback contínuo com 30+ requests circulando (dogfood)
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
- [ ] Status page ou monitor externo (Better Uptime free)

### Comercial
- [ ] **T&C e Política de Privacidade publicadas** (advogado-aprovado)
- [ ] **Stripe checkout funcional** com 1 plano pago end-to-end testado
- [ ] **Pricing page online**
- [ ] **Landing comercial publicada** com CTA → demo
- [ ] **NF-e/NFS-e** emitida automaticamente após pagamento
- [ ] **Onboarding wizard** funcional para nova empresa (<2h)
- [ ] **E-mail transacional** ativo (Resend/SendGrid) com templates
- [ ] **Slack integration** completa + digest semanal
- [ ] **1 cliente piloto fazendo dogfood** com sucesso por 2 semanas consecutivas
- [ ] **Documentação de ajuda** publicada (Crisp/Intercom/Notion)
- [ ] **Material de marketing** (vídeo demo, deck, screenshots)
- [ ] **Domínio comercial** ativo com SSL

### Segurança / Conformidade
- [ ] **LGPD:** fluxo "delete my data" funcional + DPA modelo + RAT interno + cookie consent banner
- [ ] **Auditoria RLS:** cada tabela testada com 3 personas distintas (owner, manager, member)
- [ ] **Penetest light:** SQLi, XSS, CSRF, auth bypass — 0 críticos
- [ ] **Service role keys** rotacionáveis; nenhuma chave em código-fonte
- [ ] **Rate limiting** em edge functions críticas (auth, pdi-attachments upload)

### Suporte
- [ ] Canal de suporte ativo (`support@oxypeople.com.br` ou chat)
- [ ] SLA documentado (<24h P0/P1, <72h P2/P3)
- [ ] Runbooks de operação (deploy, rollback, incident response)
- [ ] On-call rotation definido (mesmo que 1 pessoa)

---

## Conclusão executiva

**Estado:** ~30% do P0 mergeado, 70% pela frente. Caminho técnico bem mapeado; **risco real é não-técnico** (LGPD/jurídico + decisões comerciais).

**Caminho mais curto até MVP comercial: 8-10 semanas** se decisões pendentes forem destravadas em <72h e advogado iniciar semana 1.

**Realista (com 1 dev + Claude Code + buffers normais):** **10 semanas** até primeiro cliente piloto pagando.

**Próximo passo recomendado para o usuário:**
1. Responder as **5 decisões pendentes** do quadro acima (deadline 2026-05-05).
2. Aplicar migrations 0001 → 0002 → 0003 em sequência (esta semana).
3. Contratar advogado para T&C/Privacy (esta semana).
4. Criar conta Stripe + iniciar `KYC` (esta semana).

Tudo o mais é executável pelo dev em paralelo.

---

**Status:** ✅ Gap-map completo. Pronto para apreciação do usuário e priorização final pelo PO/PM.
