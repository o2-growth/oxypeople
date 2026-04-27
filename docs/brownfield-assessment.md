# Brownfield Assessment — oxypeople

**Autor:** Atlas (Business Analyst)
**Data:** 2026-04-27
**Objetivo:** Substituir o Feedz (TOTVS) por uma plataforma própria. Foco do MVP: **paridade funcional** com os módulos mais usados do Feedz, em condição de uso real.

---

## 1. Sumário Executivo

O **oxypeople** é um SaaS multi-tenant de **People Ops / Engajamento / Performance** construído com Vite + React + TypeScript + shadcn/ui no frontend e Supabase (Postgres + Auth + Edge Functions) no backend. Já existe **base sólida**: 14 páginas, 47 hooks, 30 tabelas Postgres com RLS habilitado em todas, 5 edge functions e integrações com Pipefy e Slack.

**Veredito de prontidão para MVP substituto do Feedz:**

- ✅ **Cobre hoje (mas com lacunas a fechar)**: OKRs (~70% cobertura), Organograma (~40% cobertura), Reconhecimentos, Gamificação, eNPS, GPTW, Avaliação de Desempenho (ciclos), Departamentos, Times, Calendário/Eventos, Mural/Feed, Automação básica, Integração Pipefy.
- ⚠️ **Lacunas para paridade Feedz**: **PDI**, **1:1s estruturadas**, **Feedback contínuo**, **Matriz Nine Box**, **Pulse Survey**, **Onboarding automatizado** (parcial), **Trilhas de Desenvolvimento**, **Mapeamento Comportamental**, **Planos de Ação** vinculados às pesquisas, **Humor/Mood tracking**.
- ❌ **Risco operacional**: zero testes automatizados, RLS frágil em 3 tabelas, enums alterados sem backfill, validações críticas em camada de aplicação.

**Conclusão:** o produto está **~65% do caminho** (revisão pós-auditoria detalhada). Para um MVP comercial, o trabalho restante é: (a) **endurecer OKRs e Organograma** (módulos âncora — usuário pediu prioridade), (b) **fechar 5 lacunas funcionais novas** (PDI, 1:1, Feedback contínuo, Pulse survey, Nine Box) e (c) **endurecer qualidade** (testes, RLS, observabilidade) — em ordem nessa prioridade.

---

## 2. Stack & Arquitetura Atual

| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React 18 + TypeScript |
| UI | shadcn/ui + Tailwind + Radix |
| Estado | React Query + AuthContext |
| Roteamento | React Router v6 com `<ProtectedRoute>` |
| Backend | Supabase (Postgres + Auth + Realtime + Edge Functions/Deno) |
| Forms | React Hook Form + Zod |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |
| Build | Vite, ESLint |
| Testes | Vitest + Testing Library (instalado, não usado) |
| Hosting | Lovable (`@lovable.dev/cloud-auth-js`) |

**Multi-tenancy:** modelado por `companies` + `company_memberships` + `user_roles` + helper functions `is_company_member()` / `is_company_admin()` aplicadas nas RLS policies.

**Roles atuais:** `owner`, `admin`, `manager`, `member` (enum `membership_role`).

---

## 3. Inventário de Funcionalidades Implementadas

### 3.1 Páginas e Rotas

| Rota | Arquivo | Estado |
|---|---|---|
| `/auth` | `src/pages/Auth.tsx` | ✅ |
| `/` (Dashboard) | `src/pages/Index.tsx` | ✅ |
| `/feed` | `src/pages/Feed.tsx` | ✅ |
| `/recognition` | `src/pages/Recognition.tsx` | ✅ |
| `/objectives` | `src/pages/Objectives.tsx` | ✅ |
| `/objectives/:id` | `src/pages/ObjectiveDetail.tsx` | ✅ |
| `/surveys` | `src/pages/Surveys.tsx` | ✅ |
| `/company` | `src/pages/Company.tsx` | ✅ |
| `/teams` | `src/pages/Teams.tsx` | ✅ |
| `/performance` | `src/pages/Performance.tsx` | ✅ |
| `/hr` | `src/pages/HR.tsx` | ✅ |
| `/gamification` | `src/pages/Gamification.tsx` | ✅ |
| `/settings` | `src/pages/Settings.tsx` | ✅ |
| `/automation` | `src/pages/Automation.tsx` | ⚠️ (UI ok, execução depende de Edge Function) |

### 3.2 Módulos e Estado

| Módulo | Status | Observações |
|---|---|---|
| **OKRs** (objectives + KRs + checkins + audit) | ✅ Funcional | Tree/Map/Kanban, cascata de progresso, validação de hierarquia, anexos em check-ins, recuperação soft-delete, filtros salvos |
| **Reconhecimentos** | ✅ Funcional | Envio entre pares, leaderboard, comentários, integração com gamificação |
| **Gamificação** | ✅ Funcional | Pontos por ação, badges customizáveis, níveis, leaderboard |
| **eNPS** | ✅ Funcional | Criação, segmentação por dept/time/usuário, métricas |
| **GPTW** | ✅ Funcional | Modelo Great Place to Work com cálculo de métricas |
| **Avaliação de Desempenho** | ✅ Funcional | Ciclos (self/180/360/leader/custom), perguntas, respostas, scores |
| **Colaboradores / People** | ✅ Funcional | Lista, convites, status, filtros, org chart hierárquico |
| **Departamentos** | ✅ Funcional | CRUD completo |
| **Times** | ✅ Funcional | CRUD com membros e líderes |
| **Mural / Feed** | ✅ Funcional | Posts, comentários (threads), reações, anexos |
| **Eventos corporativos** | ✅ Funcional | Calendário, carrossel, detalhes |
| **Aniversariantes** | ✅ Funcional | Widget no dashboard, calendário HR |
| **Turnover / Headcount** | ✅ Funcional | Métricas históricas |
| **Notificações** | ⚠️ Parcial | Backend realtime ok; UI mínima (toast) |
| **Ações (Kanban semanal)** | ⚠️ Parcial | UI Kanban + CRUD; sem workflow complexo |
| **Avisos / Anúncios** | ✅ Funcional | Com agendamento e integração Slack |
| **Automações** | ⚠️ Parcial | birthday/anniversary/new_hire/reminder via edge function `run-automations` |
| **Integração Pipefy** | ✅ Funcional | Sync configurável com field_mapping JSONB |
| **Integração Slack** | ✅ Funcional | Envio de mensagens via bot token |

### 3.3 Backend — Resumo

- **30 tabelas** organizadas em 8 domínios (auth/org, OKRs, performance, surveys, feed, gamificação, integrações, eventos)
- **RLS habilitado em 100% das tabelas**
- **21+ funções SQL** (helpers de role, cálculo de progresso esperado, status automático, cascata de progresso, auditoria)
- **5 edge functions**: `send-slack-message`, `run-automations`, `pipefy-sync`, `pipefy-tables`, `okr-escalation`
- **1 storage bucket público**: `post-attachments`
- **pg_cron** e **pg_net** habilitados (mas sem cronjobs criados ainda)
- Última migration: `20260416175337` (ajuste menor de field_mapping Pipefy)

---

## 4. Benchmark Funcional — Feedz vs oxypeople

Com base na pesquisa pública dos módulos do Feedz (TOTVS), eis o mapa:

| Módulo Feedz | oxypeople hoje | Gap |
|---|---|---|
| **Avaliação de Desempenho** (90º/180º/360º + Nine Box) | ✅ Ciclos + perguntas + scores | ⚠️ Falta **Matriz Nine Box** e **calibração** |
| **OKR / Metas** | ✅ Completo (provavelmente acima do Feedz) | — |
| **Pesquisa de Clima por Pulsos** | ⚠️ Tem eNPS e GPTW pontuais | ❌ Falta **modelo de pulso recorrente** + **planos de ação** vinculados |
| **Feedback Contínuo** | ❌ Não existe | ❌ Criar módulo dedicado |
| **1:1s estruturadas** | ❌ Não existe | ❌ Criar módulo (agenda + template + histórico) |
| **PDI (Plano de Desenvolvimento Individual)** | ❌ Não existe | ❌ Criar módulo |
| **Trilhas de Desenvolvimento** | ❌ Não existe | ❌ Pode ficar para v2 (não bloqueia MVP) |
| **Reconhecimento / Mural** | ✅ Completo | — |
| **Onboarding Automatizado** | ⚠️ Tem `onboarding_feedbacks` table | ⚠️ Falta jornada/checklist de onboarding (não só feedback) |
| **Mapeamento Comportamental (DISC etc.)** | ❌ Não existe | ❌ Pode ficar para v2 |
| **Humor / Mood Tracking** | ❌ Não existe | ❌ Esperado pelos usuários Feedz; criar módulo simples |
| **Jornada do Colaborador** | ⚠️ Parcial (perfil + histórico) | ⚠️ Consolidar timeline única do colaborador |
| **Gamificação / Engajamento** | ✅ Completo | — (vantagem competitiva vs Feedz) |
| **Relatórios / Analytics RH** | ⚠️ Dashboard tem alguns KPIs | ⚠️ Faltam relatórios exportáveis (PDF/Excel) |
| **Gestão de Pessoas (admissão/desligamento)** | ❌ Não escopo (Pipefy faz isso) | OK manter integração |

---

## 5. Auditoria Detalhada — OKRs e Organograma (módulos âncora)

> **Reforço de prioridade do usuário:** OKRs e Organograma são módulos críticos. Esta seção lista o que **já funciona** e os **gaps específicos** a fechar antes do MVP.

### 5.1 OKRs — cobertura ~70%

**Já funciona bem:**
- ✅ Tree view, Map view (com zoom 0.2x–2x e pan), List view, Executive Summary com cards de risco/atrasado/sem-KR
- ✅ Hierarquia pai-filho via `objective_relations` com pesos somando 100% (validados por trigger)
- ✅ Cascata automática de progresso (filho → pai), trigger `trg_cascade_objective_progress`
- ✅ Validação de hierarquia (strategic → tactical → operational)
- ✅ Key Results: tipos numeric/binary, direção up/down, pesos, status visual
- ✅ Check-ins: frequência configurável, mínimo de caracteres, perceived risk (green/yellow/red), bloqueadores, anexos (5MB imgs / 10MB outros)
- ✅ Status automático via `update_objective_auto_status` (deviation %), edge function `okr-escalation` notifica owner/leader/admin
- ✅ Auditoria completa em `okr_audit_log` com UI (`AuditLogDialog`) — quem mudou o quê e quando
- ✅ Filtros poderosos: status, tipo, departamento, owner, período, progresso (range slider), quick filters (atRisk, checkinOverdue, noKR), busca full-text, view modes (company/dept/my)
- ✅ Recuperação de itens deletados (objetivos, KRs, check-ins) via `DeletedItemsDialog`

**Gaps críticos a fechar para MVP:**

| Gap | Severidade | Esforço |
|---|---|---|
| **Enum TS desincronizado do DB**: `useObjectives.ts:10` só tem `strategic\|tactical\|operational`; o DB também aceita `personal\|team\|individual` (mas UI não os usa) | 🔴 Alta | XS — alinhar enums e decidir se mantém os 6 ou simplifica DB |
| **Comentários em objetivos e KRs** — colaboração inexistente | 🔴 Alta | M — nova tabela `objective_comments` ou reusar `comments` |
| **Confidence levels** (KR % de confiança 0–100) — padrão moderno OKR | 🟡 Média | S — coluna `confidence` em `key_results` + UI |
| **Aspirational vs Committed** (objetivos "moonshot" vs comprometidos) | 🟡 Média | S — flag em `objectives` |
| **Templates de OKR** (acelerar criação) | 🟡 Média | M — tabela `objective_templates` + biblioteca por dept |
| **Editar colaboradores depois da criação** (`objective_collaborators` só na criação hoje) | 🟡 Média | S |
| **Diferença real entre roles `contributor` vs `editor`** — hoje as duas têm o mesmo poder | 🟡 Média | S — ajustar RLS |
| **CRUD de Períodos no UI** (hoje só via DB) | 🔴 Alta | S — tela admin de períodos |
| **Cron schedule do `okr-escalation`** não está configurado (`pg_cron` instalado mas sem job) | 🟡 Média | XS — criar job pg_cron diário |
| **Export PDF** do roadmap de OKRs | 🟢 Baixa | M — react-pdf ou edge function |
| **Dashboard executivo C-level** (visão consolidada) | 🟢 Baixa | M — pode evoluir o `ExecutiveSummary` |
| **Gantt/Timeline view** | 🟢 Baixa (pós-MVP) | L |

### 5.2 Organograma — cobertura ~40%

**Já funciona:**
- ✅ Visualização tree vertical (`OrganizationChart.tsx`) baseada em `useOrganizationHierarchy`
- ✅ CEO no topo (owner da company), departamentos como colunas, líderes de dept identificados, membros sob seus depts
- ✅ Cores por departamento, avatar, posição
- ✅ Membros órfãos (sem dept) listados separadamente

**Gaps críticos a fechar para MVP:**

| Gap | Severidade | Esforço |
|---|---|---|
| **Sem relação manager↔subordinado direta** — não existe `manager_id` em `users` nem em `company_memberships`. Hierarquia hoje é só "líder de departamento → membros do dept" | 🔴 Alta | M — adicionar `manager_id` + migration aditiva + UI para definir |
| **Só leitura** — não dá para arrastar para mudar gestor nem editar inline | 🔴 Alta | M — drag & drop com `@dnd-kit` (já usado no projeto) |
| **Click no nó não faz nada** (ícone `ExternalLink` está lá, sem onClick) | 🟡 Média | XS — abrir perfil do colaborador |
| **Sem filtros** (departamento, time, sub-árvore) | 🟡 Média | S |
| **Sem zoom/pan** (Map view de OKRs já tem isso — reusar lógica) | 🟡 Média | S |
| **Sem export PNG/PDF** | 🟡 Média | M |
| **Sem virtualização** — vai sofrer com 500+ pessoas | 🟢 Baixa | M — react-window ou similar |
| **Sem vacâncias / posições abertas** | 🟢 Baixa (pós-MVP) | M |
| **Sem snapshots históricos** ("como era o org em jan/2026") | 🟢 Baixa (pós-MVP) | L |

---

## 6. Gap Analysis Priorizado para MVP

Critério: **impacto comercial vs esforço**, mantendo o foco em **paridade Feedz** + **OKRs e Organograma sólidos** declarado pelo usuário.

### Gaps **bloqueantes** para MVP (P0)

**Trilho A — endurecimento dos módulos âncora:**

1. **OKRs hardening**: alinhar enums TS↔DB, CRUD de períodos no UI, comentários em objetivos/KRs, confidence levels, ativar cron de `okr-escalation`. *Esforço: M*
2. **Organograma 2.0**: adicionar `manager_id`, edição drag-and-drop, click → perfil, filtros, zoom/pan. *Esforço: M*

**Trilho B — fechar lacunas funcionais Feedz:**

3. **Feedback contínuo** — solicitar feedback a qualquer pessoa, a qualquer momento, com tags de competências. *Esforço: M*
4. **1:1s** — agenda entre líder e liderado, pauta colaborativa, anotações privadas e públicas, histórico. *Esforço: M*
5. **PDI** — competências, ações, prazos, status, vínculo a feedbacks/avaliações. *Esforço: M*
6. **Pulse Survey** — pesquisas curtas recorrentes (semanal/mensal) com métricas de evolução. *Esforço: S* (reusa infra de surveys)
7. **Nine Box** — matriz visual cruzando performance × potencial, alimentada pelos ciclos. *Esforço: S*

### Gaps **importantes** mas não bloqueantes (P1)

8. **Mood / Humor diário** (1 clique no header) — *Esforço: S*
9. **Planos de ação** vinculados a resultados de pesquisa — *Esforço: M*
10. **Jornada do Colaborador** (timeline unificada) — *Esforço: S* (agregação)
11. **Relatórios exportáveis** (PDF/Excel) — *Esforço: M*
12. **Onboarding workflow** (checklist + tarefas + responsáveis) — *Esforço: M*
13. **Templates de OKR** (acelerar criação) — *Esforço: M*

### Gaps **desejáveis** (v2)

- Trilhas de Desenvolvimento (LMS leve)
- Mapeamento Comportamental (DISC/MBTI)
- Calibração de avaliações
- Snapshots históricos do organograma + vacâncias
- Gantt/Timeline view de OKRs
- App mobile (PWA já viável; nativo depois)

---

## 6. Riscos Técnicos para Produção

| Risco | Severidade | Mitigação |
|---|---|---|
| **Zero testes automatizados** | 🔴 Alta | Implementar suíte mínima: hooks de OKR, RLS via supabase-js, fluxos críticos |
| **RLS permissiva em `reactions` (`SELECT USING (true)`)** | 🟡 Média | Restringir por `is_company_member` |
| **Enum `objective_status` alterado sem backfill** | 🟡 Média | Auditar dados existentes; backfill `UPDATE` (com aprovação do usuário, conforme regra global) |
| **Falta DELETE policies em `survey_questions`, `performance_questions`, `performance_answers`** | 🟡 Média | Adicionar policies; senão admins não conseguem corrigir surveys |
| **Validação `block_manual_progress` desativada** | 🟡 Média | Reativar com session var ou confiar em camada de app + audit log |
| **Sem índices em FKs de `onboarding_feedbacks.manager_id` e algumas em `performance_evaluations`** | 🟢 Baixa | Adicionar `CREATE INDEX IF NOT EXISTS` aditivo |
| **`pg_cron`/`pg_net` instalados sem jobs** | 🟢 Baixa | Configurar cron para `okr-escalation` e `run-automations` |
| **Notificações apenas via toast** | 🟡 Média | Implementar central de notificações (sino + lista persistente) |
| **Ausência de observabilidade** (Sentry, logs estruturados) | 🟡 Média | Plug Sentry/PostHog antes do go-live |
| **README ainda é template Lovable** | 🟢 Baixa | Reescrever |
| **Lovable Auth + Supabase Auth coexistem** | 🟡 Média | Decidir um (Supabase) e remover redundância |

> **Lembrete da regra global**: nenhuma migration destrutiva (`UPDATE`, `DELETE`, `DROP`, `TRUNCATE`) sem confirmação explícita do usuário. Backfill de enum exige autorização.

---

## 7. Estimativa de Esforço para MVP

Pressupondo 1 dev full-time + Claude Code assistido:

| Fase | Escopo | Tempo |
|---|---|---|
| **Sprint 1** | P0 #1 (OKRs hardening) + correções RLS críticas | 1 semana |
| **Sprint 2** | P0 #2 (Organograma 2.0) + P0 #6 (Pulse Survey) + P0 #7 (Nine Box) | 2 semanas |
| **Sprint 3** | P0 #3 (Feedback contínuo) + P0 #4 (1:1s) | 2 semanas |
| **Sprint 4** | P0 #5 (PDI) + observabilidade + suíte de testes mínima | 2 semanas |
| **Sprint 5 (hardening)** | P1 #8 (Mood) + P1 #10 (Jornada) + bugs/polish + docs | 1 semana |
| **Total para MVP comercializável** | | **~8 semanas** |

P1 #9 (Planos de ação), P1 #11 (Relatórios), P1 #12 (Onboarding workflow) e P1 #13 (Templates OKR) podem entrar em **v1.1** logo após o lançamento.

> **Nota**: a estimativa cresceu de ~6 para ~8 semanas porque OKRs e Organograma viraram trilho dedicado. Se o organograma puder ficar com manager_id + edição básica (sem zoom/pan/export inicial), volta para ~7 semanas.

---

## 8. Diferenciais vs Feedz já presentes

Vale destacar — são pontos de venda contra o concorrente:

1. **Gamificação nativa profunda** (pontos por ação, badges customizáveis, níveis, leaderboard) — Feedz não tem com essa profundidade
2. **OKRs com cascata automática e auditoria** — provável paridade ou superior ao Feedz
3. **Integração Pipefy nativa** (Feedz é fechado no ecossistema TOTVS)
4. **Integração Slack nativa**
5. **Multi-tenant desde o dia zero** (companies + memberships)
6. **Customização de UI** (oxypeople usa Tailwind/shadcn — Feedz é caixa-preta)

---

## 9. Recomendações para o Próximo Passo

**Caminho sugerido no workflow brownfield:**

1. **Aprovar este assessment** (ou pedir ajustes — escopo do MVP, prioridades, etc.)
2. **Step 0.2 → `/agents:architect` (Aria)**: revisar arquitetura para suportar os 5 módulos novos sem quebrar o que já existe
3. **Step 0.3 → `/agents:data-engineer` (Dara)**: planejar as novas tabelas (PDI, 1:1, feedback, pulse, nine_box) já com RLS e índices
4. **Step 1.1 → `/agents:pm` (Morgan)**: PRD com epics e success metrics para os 5 P0
5. **Step 1.2 → `/agents:po` (Pax)**: validar e shardar em stories
6. **Fase 2**: ciclo `/agents:sm → /agents:dev → /agents:qa → /agents:devops` por story

**Decisões pendentes que precisam do usuário:**

- [x] **OKRs e Organograma elevados a P0** ✅ confirmado pelo usuário
- [ ] **OKRs hardening — escopo mínimo aceitável?** (alinhar enums, comentários, períodos UI, cron, confidence levels — algum desses pode ficar para v1.1?)
- [ ] **Organograma — adicionar `manager_id` é OK?** (migration aditiva, sem destruir dados; mas muda modelo de hierarquia — hoje é por dept leader)
- [ ] **Confirma os 7 P0**? Trocaria a ordem? (ex.: PDI antes de 1:1?)
- [ ] **MVP fecha em ~8 semanas** ou há prazo mais agressivo?
- [ ] **Onboarding workflow** entra no MVP ou v1.1?
- [ ] **Lovable Auth** fica ou sai? (recomendo sair — usar só Supabase Auth)
- [ ] **Existe lista de clientes-piloto** já comprometidos? (impacta priorização)

---

## 10. Fontes da Pesquisa de Mercado

- [Linha Feedz para gestão de clima organizacional - TOTVS](https://www.totvs.com/feedz/)
- [Feedz - Plataforma de gestão de desempenho](https://www.feedz.com.br/)
- [Tudo sobre o TOTVS RH Metas e Objetivos – Linha Feedz](https://produtos.totvs.com/ficha-tecnica/tudo-sobre-o-totvs-rh-metas-e-objetivos-linha-feedz/)
- [Tudo sobre o TOTVS RH Mapeamento Comportamental – Linha Feedz](https://produtos.totvs.com/ficha-tecnica/tudo-sobre-o-totvs-rh-mapeamento-comportamental-linha-feedz/)
- [Ferramenta PDI para plano de desenvolvimento individual - Feedz](https://www.feedz.com.br/pdi/)
- [Ferramenta de avaliação de desempenho - Feedz](https://www.feedz.com.br/avaliacao-de-desempenho-cliente/)
- [Plataforma de pesquisa de clima por pulsos - Feedz](https://www.feedz.com.br/pesquisa-de-clima/)
- [Nine Box - Feedz blog](https://www.feedz.com.br/blog/nine-box/)
- [Software de avaliação 360 graus - Feedz blog](https://www.feedz.com.br/blog/avaliacao-360-graus/)

---

**Status do documento:** ✅ Assessment concluído, aguardando aprovação para avançar para `architecture-review.md`.
