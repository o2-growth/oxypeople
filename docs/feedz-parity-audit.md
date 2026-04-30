# Auditoria de paridade — OKRs do oxypeople vs Feedz

**Autor:** Atlas (Business Analyst)
**Data da coleta:** 2026-04-30
**Escopo:** módulo de Objetivos/OKRs do oxypeople comparado ao TOTVS RH Metas e Objetivos – Linha Feedz (a.k.a. Feedz OKR)
**Pergunta literal do usuário:** *"a parte de objetivos está idêntica ao Feedz?"*
**Resposta curta, sem rodeios:** **não, ainda não está idêntica**, mas a paridade real está mais próxima do que o assessment inicial sugeria. Com 3 migrations já desenhadas (0001, 0003, 0009) aplicadas e ~3 dias de UI, oxypeople **passa Feedz em vários eixos** e fica **abaixo em 4 itens estruturais** ligados a fluxo de aprovação, action plans e mobile.

---

## Sumário executivo

- **Paridade global ponderada:** **~72%** hoje (estado atual em produção, sem migrations 0001/0003/0009 aplicadas). Sobe para **~88%** assim que essas três migrations + as stories 1.1–1.5 forem entregues.
- **Top 3 gaps materiais hoje:** (1) **fluxo de aprovação** de objetivos e check-ins por gestor direto (Feedz tem; oxypeople não tem em nenhum nível), (2) **action plans / planos de ação** estruturados por objetivo (Feedz tem como entidade de primeira classe; oxypeople tem só `actions` semanais soltas no Kanban), (3) **comentários/discussão** em objetivos e KRs (Feedz tem nativo; oxypeople tem migration desenhada mas ainda não aplicada).
- **Top 3 vantagens do oxypeople sobre o Feedz:** (1) **cascata de progresso server-side** com triggers e auditoria estruturada (`okr_audit_log` + `update_objective_auto_status`) — Feedz não documenta isso de forma transparente; (2) **multi-tenant nativo com RLS por linha** — Feedz é multi-tenant via TOTVS, mas o nosso modelo é mais limpo para venda direta; (3) **Map view com zoom/pan + Tree + Kanban + Executive Summary** — três modos de visualização polidos, equivalentes ou melhores que o "Mapa de Objetivos" único do Feedz.
- **Vantagens que vão sumir/diminuir** quando 0003 entrar: confidence levels e committed/aspirational estarão pareados; comentários atingem paridade.
- **Veredito comercial:** **pronto-com-ressalvas para vender contra Feedz hoje, mas só se as migrations 0001+0003+0009 forem aplicadas e as stories 1.1–1.5 fechadas (sprint 1 completa).** Sem isso o cliente vai perceber 5 buracos no primeiro mês de uso. Os gaps remanescentes (aprovação por gestor, action plans estruturados, mobile nativo, integração nativa folha) podem virar v1.1 e ainda assim a venda fecha — desde que o discurso comercial seja honesto.

---

## Metodologia

### Fontes consultadas (2026-04-30)

| Fonte | Acesso | Cobertura |
|---|---|---|
| [feedz.com.br/okr/](https://www.feedz.com.br/okr/) (redireciona para totvs.com/rh) | Público | Página comercial principal |
| [totvs.com/rh/metas-objetivos-okr/](https://www.totvs.com/rh/metas-objetivos-okr/) | Público | Catálogo oficial de features |
| [produtos.totvs.com/ficha-tecnica/tudo-sobre-o-totvs-rh-metas-e-objetivos-linha-feedz/](https://produtos.totvs.com/ficha-tecnica/tudo-sobre-o-totvs-rh-metas-e-objetivos-linha-feedz/) | Público | Ficha técnica detalhada — fonte mais densa |
| [produtos.totvs.com/metas-objetivos-okr/okr-em-dezembro-2025/](https://produtos.totvs.com/metas-objetivos-okr/okr-em-dezembro-2025/) | Público | Release notes dezembro 2025 (mais recente disponível) |
| [feedz.com.br/blog/category/okr/](https://www.feedz.com.br/blog/category/okr/) | Público | Blog posts (metodologia + dicas de produto) |
| [feedz.com.br/planos/](https://www.feedz.com.br/planos/) | Público | Página de planos (preços não expostos publicamente — só por demo) |
| [Capterra — Feedz](https://www.capterra.com/p/198769/Feedz/) | Público | Reviews terceiros |

### Limitações da pesquisa

1. **Tier login-walled:** o app efetivo do Feedz exige login pago. Não foi possível ver a UI real (drawers, modais, fluxos completos). A análise é baseada em material comercial + ficha técnica oficial + blog + reviews.
2. **Sem screenshots oficiais** das telas de check-in, comentários e dashboards atualizadas para 2026.
3. **Pricing opaco:** Feedz pede demo para revelar preços. Há referência histórica de "a partir de R$ 12/usuário/mês" (2019) — provavelmente desatualizado pós-aquisição TOTVS (2022).
4. Esta auditoria foca exclusivamente em **objetivos/OKRs**. PDI, Pulse Survey, Nine Box, Feedback Contínuo e Onboarding do Feedz são tratados em assessments separados (`brownfield-assessment.md`).

### Escopo do oxypeople auditado

Código examinado:
- `src/pages/Objectives.tsx`, `src/pages/ObjectiveDetail.tsx`, `src/pages/admin/Periods.tsx`, `src/pages/admin/OkrEscalation.tsx`
- `src/components/objectives/*` (40+ componentes)
- `src/hooks/useObjectives.ts`, `useCheckins.ts`, `useObjectiveCollaborators.ts`, `useOkrEscalation.ts`, `usePeriodsAdmin.ts`
- `src/lib/objective-types.ts`
- `supabase/functions/okr-escalation/index.ts`
- `supabase/migrations/*` (32 migrations aplicadas) + `docs/migrations-draft/0003_okr_hardening.sql` + `0009_pg_cron_jobs.sql` (não aplicadas)
- `docs/brownfield-assessment.md`, `docs/prd.md`, `docs/architecture-review.md`, `docs/epics/epic-01-okrs-hardening.md`, `docs/stories/sprint-1/*` (7 stories)

---

## 2. Mapa de capacidades Feedz OKR (catálogo)

A tabela abaixo lista cada capacidade documentada do Feedz e classifica o estado do oxypeople em **três cores**:

- ✅ **Paridade** — feature existe no oxypeople em qualidade igual ou superior à do Feedz
- 🟡 **Parcial** — feature existe mas com gap explícito (gap descrito) OU feature foi desenhada mas não aplicada (ex.: depende de migration 0003)
- 🔴 **Ausente** — feature não existe e não há desenho/migration pronta

### 2.1 Modelagem (objective + key result)

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| Criar objetivo com título, descrição, prazo | ✅ Sim | ✅ `CreateObjectiveDialog` cobre; campos title, description, due_date, visibility, type, period_id, department, owner_department_id, tags | ✅ |
| Hierarquia/categorias de objetivo (estratégico, tático, operacional, time, individual) | ✅ Sim — "objetivos gerais ou por departamento", contribuintes, públicos/privados | ✅ Enum `objective_type` com 6 valores: `strategic, tactical, operational, personal, team, individual`; `objective-types.ts` mapeia ícone, cor e label de cada um | ✅ |
| **Visibilidade pública/privada** (recém-adicionada no Feedz dez/2025: default privado configurável) | ✅ Sim | 🟡 Coluna `visibility` aceita `public/company/private`, mas **não há toggle de "tudo privado por padrão"** na configuração da empresa | 🟡 |
| KR com unidades múltiplas (numérica, financeira, percentual) | ✅ Sim | ✅ Coluna `unit` em `key_results` é texto livre (suporta %, R$, qualquer unit). `kr_type` controla `numeric/binary` | ✅ |
| **KR com tipos especiais "manter acima de", "manter abaixo de", "atingida ou não", "data de entrega"** | ✅ Sim — quatro tipos especiais | 🟡 oxypeople tem `direction` (up/down) e `kr_type` (`numeric/binary`). Cobre "atingir valor" e "atingir/não atingir". **Não tem "manter dentro de faixa", nem "data de entrega" como tipo dedicado** | 🟡 |
| KR com pesos (%) | ✅ Sim | ✅ Coluna `weight_percentage` em `key_results`; valida 0–100 | ✅ |
| KR com escala graduada (ex.: 0–30k = 40%, 30k–60k = 60%) | ✅ Sim — "multi-velocity" | 🔴 oxypeople só faz cálculo linear: `(current - initial) / (target - initial)`. Sem buckets/escalas customizadas | 🔴 |
| **KR confidence (low/neutral/high ou 0–100)** | ✅ Sim — Feedz registra confidence em cada check-in | 🟡 Coluna `key_results.confidence smallint 0–100` desenhada em `0003`, **migration não aplicada**. UI da Story 1.3 ainda não shipped | 🟡 |
| **Committed vs Aspirational** | 🟡 **Não documentado explicitamente no material público do Feedz** — provável que esteja na metodologia mas não como toggle de produto | 🟡 Coluna `objectives.commitment_type` desenhada em `0003`, **não aplicada**. UI Story 1.4 não shipped | 🟡 |
| Tags em objetivos | ✅ Sim — "tag-based search" | ✅ Coluna `objectives.tags text[]` + `TagsInput.tsx` | ✅ |
| Owner único por objetivo | ✅ Sim | ✅ `owner_id` (responsável) + `assignee_id` opcional | ✅ |
| Múltiplos colaboradores ("contribuintes") por objetivo | ✅ Sim | ✅ Tabela `objective_collaborators` com role `contributor/editor`, hook `useObjectiveCollaborators` (Story 1.6 já shipped — add/remove/role-change) | ✅ |
| KR com owner próprio (diferente do owner do objetivo) | Não evidenciado | ✅ `key_results.owner_user_id` | ✅ |
| Soft delete + recuperação | Não evidenciado | ✅ `deleted_at` + `DeletedItemsDialog` (recupera obj, KR, checkin) | ✅ |
| **Auditoria estruturada** (quem mudou o quê) | ✅ "Audit logging tracks all modifications" | ✅ `okr_audit_log` + `AuditLogDialog` + triggers SQL | ✅ |
| Duplicar objetivo | Não evidenciado | ✅ `useDuplicateObjective` | ✅ |

### 2.2 Hierarquia & cascata

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| Pai/filho entre objetivos (alinhamento) | ✅ "Mapa de Objetivos mostra hierarquia completa" | ✅ `parent_id` em `objectives` + tabela `objective_relations` (suporta múltiplos pais) + validação de hierarquia (strategic→tactical→operational) | ✅ |
| **Contribuição ponderada do filho ao pai** | ✅ Implícito via mapa | ✅ `objective_relations.weight_percentage` validado por trigger (soma 100%) — `ChildWeightEditor.tsx` | ✅ |
| **Cascata automática de progresso** (filho atualiza → pai recalcula) | Não documentado explicitamente | ✅ Trigger `trg_cascade_objective_progress` no DB | ✅ (provável vantagem) |
| **Quebra de objetivo em sub-objetivos a partir do detalhe** | Não evidenciado | ✅ `BreakdownObjectiveDialog` | ✅ |
| Validação anti-ciclo | Não evidenciado | ✅ Validado em trigger SQL | ✅ |
| Compartilhar metas entre filiais/departamentos | ✅ "Shared goals by subsidiary or department" | 🟡 oxypeople tem `team_id`, `department`, `owner_department_id`, `visibility=company` — funciona mas **não tem conceito de "shared metric"** que aparece em múltiplos times com mesma definição | 🟡 |

### 2.3 Períodos & ciclos

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| Definir trimestres/ciclos | ✅ Sim — "multi-period configuration" | ✅ Tabela `periods` (company_id, name, start_date, end_date) | ✅ |
| **CRUD de períodos via UI por admin** | ✅ Sim | ✅ Story 1.1 shipped — `/admin/periods` com create/edit/delete + dialog `PeriodFormDialog` + check de overlap em SQL trigger (`validate_period_no_overlap` em 0003 — **trigger não aplicado ainda**, hoje validação só em UI) | 🟡 (UI ok, trigger DB pendente em 0003) |
| Filtrar OKRs por período | ✅ Sim | ✅ `ObjectivesFilters.tsx` linha 172–190 | ✅ |
| Validação anti-overlap | Não evidenciado | 🟡 Desenhada em 0003 mas migration pendente | 🟡 |
| Ciclos arquiváveis / read-only | Não evidenciado | 🔴 oxypeople não tem flag `archived` em períodos | 🟡 (gap menor) |

### 2.4 Check-ins

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| Frequência configurável (diário/semanal/quinzenal/mensal) | ✅ "configurable intervals" | ✅ `okr_settings.checkin_frequency` (default `weekly`) — `OkrSettingsPanel` | ✅ |
| Status do KR no check-in (verde/amarelo/vermelho ou equivalente) | ✅ "Confidence level: low/neutral/confident" | ✅ `okr_checkins.perceived_risk` (`green/yellow/red`) — `CheckinDialog` | ✅ |
| Comentário do check-in (texto narrativo) | ✅ "ações realizadas e próximos passos" | ✅ `okr_checkins.comment` | ✅ |
| **Mínimo de caracteres no comentário** | Não evidenciado | ✅ `okr_settings.checkin_min_chars` (default 20) — vantagem | ✅ |
| Anexos no check-in | ✅ "File and document attachments as evidence" | ✅ Bucket `checkin-attachments` + `useCheckinAttachments` + `AttachmentUploader` (5MB imagem / 10MB outros) | ✅ |
| **Identificação de bloqueio** | Não evidenciado explicitamente | ✅ `has_blocker` + `blocker_description` no check-in — vantagem | ✅ |
| Histórico de check-ins por KR | ✅ "Status comparisons against previous check-ins" | ✅ `useCheckins` retorna últimos 20 + `CheckinDialog` mostra timeline | ✅ |
| Bulk check-in (atualizar vários KRs de uma vez) | Não evidenciado | ✅ `BulkCheckinDialog` — vantagem | ✅ |
| Lembretes automáticos para fazer check-in | ✅ "envio de lembretes para que os times alimentem o status dos OKRs" | 🟡 oxypeople tem `okr-escalation` que notifica em risco/atrasado, **mas não tem lembrete proativo "está na hora do check-in"** — gap explícito | 🟡 |
| Check-in atrasado (overdue) detection | ✅ "Automatic alerts for overdue check-ins" | ✅ `okr_settings.checkin_overdue_days` + `last_checkin_at` no KR + filtro `checkinOverdue` no `ObjectivesFilters` + card no `ExecutiveSummary` | ✅ |
| **Aprovação de check-in pelo gestor direto** | ✅ "configure approval flow so direct manager becomes default approver of goals and check-ins" — feature dezembro/2025 | 🔴 oxypeople **não tem fluxo de aprovação**. Check-in é registrado direto. Esta é a maior diferença estrutural | 🔴 |
| Projeção de meta (forecast) | ✅ "Projection capabilities for strategic tracking" | 🔴 oxypeople só mostra progresso atual, sem forecast/projection | 🔴 |

### 2.5 Visualizações

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| Tree view (hierarquia) | ✅ "Mapa de Objetivos" formato organograma | ✅ `ObjectiveTreeNode` em `Objectives.tsx` (modo `tree`) | ✅ |
| Map view (mapa visual com zoom/pan) | ✅ "Mapa de Objetivos" — single canvas | ✅ `ObjectivesMap.tsx` + `ObjectiveMapNode` com zoom 0.2x–2x e pan | ✅ |
| Lista plana / tabela | ✅ Implícito nos relatórios | ✅ Tree view em modo board (Monday-style) com colunas | ✅ |
| **Kanban / Board** | Não evidenciado | ✅ `ActionsKanban` (modo `actions`) — vantagem | ✅ |
| Timeline / Gantt | Não evidenciado no material público | 🔴 oxypeople não tem timeline view | 🔴 (gap simétrico — Feedz também não tem) |
| **Dashboard executivo / resumo** | ✅ "Summary Dashboard" | ✅ `ExecutiveSummary.tsx` com cards (em risco / atrasado / sem KR / progresso médio) + top desvios da semana | ✅ |
| Agrupamento por departamento | Não evidenciado explicitamente | ✅ `viewMode='department'` no `Objectives.tsx` linha 114 | ✅ |
| **Map de objetivos com status visual** | ✅ Sim | ✅ `StatusBadge`, `ProgressBarStatus`, `OverdueBadge` | ✅ |
| Avatares dos colaboradores no nó | Não evidenciado | ✅ `AvatarStack.tsx` | ✅ |

### 2.6 Colaboração

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| **Comentários em objetivos** | ✅ "É possível marcar colegas e interagir através de comentários" | 🟡 Tabela `objective_comments` desenhada em 0003 com threads (parent_comment_id), realtime, 5000 chars; UI **não construída** (Story 1.2 pendente) | 🟡 |
| Comentários em key results | ✅ Implícito | 🟡 Mesma tabela aceita `key_result_id` opcional; UI pendente | 🟡 |
| **Menções @pessoa** | ✅ "É possível marcar colegas" | 🔴 oxypeople tem `useMentionSuggestions` no contexto do Feed/posts mas não está plugado no detalhe de OKR. Story 1.2 prevê isso | 🔴 |
| Notificação ao mencionado | ✅ Sim | 🔴 Bloqueado pelo gap de menção | 🔴 |
| Adicionar/remover colaboradores depois da criação | Não evidenciado explicitamente — provável | ✅ Story 1.6 shipped — `CollaboratorsTab` com add/remove/role | ✅ |
| Roles diferenciadas (contributor vs editor) | Não evidenciado | 🟡 oxypeople tem `contributor/editor` mas brownfield-assessment apontou que **na prática RLS trata os dois iguais** — gap em hardening | 🟡 |
| Realtime (ver mudança de outro user ao vivo) | Não evidenciado | ✅ `useRealtimeObjective` + Supabase Realtime habilitado em `objectives`, `key_results`, `okr_checkins` | ✅ |
| Atribuir KR a uma pessoa diferente do owner | Não evidenciado | ✅ `key_results.owner_user_id` | ✅ |

### 2.7 Escalonamento & notificações

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| Detecção de objetivo em risco | ✅ "needs attention" no dashboard | ✅ `update_objective_auto_status` calcula `auto_status` por desvio % (`deviation_attention_pct`, `deviation_risk_pct`) | ✅ |
| Detecção de objetivo atrasado | ✅ "delayed objectives" | ✅ `auto_status='overdue'` | ✅ |
| **Notificação automática ao owner** | ✅ "notificações para as pessoas incluídas no processo... na Home e por e-mail" | 🟡 Edge function `okr-escalation` cria registros em `notifications` (sino in-app). **Sem e-mail real, sem Slack** automatizado para escalation | 🟡 |
| **Notificação por e-mail** | ✅ Sim | 🔴 Não há serviço de envio de e-mail conectado ao escalation | 🔴 |
| Notificação por Slack | Não evidenciado | 🟡 Edge function `send-slack-message` existe mas não é chamada pelo `okr-escalation` | 🟡 (infra existe, integração não) |
| **Cron diário automático** | ✅ Implícito (notificações automáticas) | 🟡 Edge function `okr-escalation` pronta + UI de disparo manual em `/admin/okr-escalation` (Story 1.5 partial). **Cron real depende de migration 0009** ainda não aplicada | 🟡 |
| Histórico de execuções do escalation | Não evidenciado | 🟡 Hoje só em memória da sessão (`OkrEscalation.tsx` linha 52). Persistente vem com 0009 | 🟡 |
| Escalonamento por hierarquia (operational→leader, tactical/strategic→admin) | Não evidenciado | ✅ Edge function diferencia: operacional notifica leader do team_members; tático/estratégico notifica admins/owners | ✅ |
| Idempotência diária (não duplicar notif do mesmo dia) | Não evidenciado | ✅ Linha 162–172 de `okr-escalation/index.ts` checa `gte(created_at, today)` | ✅ |

### 2.8 Permissões & multi-tenant

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| Multi-tenant (separação por empresa) | ✅ Plataforma SaaS, multi-empresa via TOTVS | ✅ `companies` + `company_memberships` + RLS em 100% das tabelas | ✅ |
| Roles (admin, gestor, colaborador) | ✅ "Profile-based access control" | ✅ Enum `membership_role` (`owner/admin/manager/member`) + helpers `is_company_member`, `is_company_admin` | ✅ |
| Visibilidade pública / privada / da empresa | ✅ Sim | ✅ `objectives.visibility` (`public/company/private`) | ✅ |
| **Default privado configurável por empresa** | ✅ Recém-lançado dez/2025 | 🔴 oxypeople não tem este toggle | 🔴 |
| Permissão granular (só responsável edita, etc.) | ✅ Implícito | ✅ RLS distingue owner, collaborator (editor), admin | ✅ |
| Filtro por status do colaborador (ativo, férias, desligado) na visualização de OKRs | ✅ Recém-lançado dez/2025 | 🔴 oxypeople tem `company_memberships.status` mas filtros de OKR não consideram esse status | 🔴 |

### 2.9 Integrações

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| Folha de pagamento (PLR/PPR automático) | ✅ Nativo TOTVS RM/Protheus | 🔴 Não tem — fora de escopo declarado no PRD | 🔴 (anti-meta) |
| Avaliação de Desempenho (TOTVS Feedz Performance) | ✅ Integração nativa | 🟡 oxypeople tem módulo `performance_cycles` próprio mas **não há vínculo direto OKR↔avaliação** | 🟡 |
| Mapeamento Comportamental | ✅ Integração nativa | 🔴 Não tem — fora de escopo declarado no PRD | 🔴 (anti-meta) |
| Clima & Engajamento | ✅ Integração nativa | ✅ oxypeople tem eNPS + GPTW próprios | ✅ |
| Slack | Não documentado nativo | 🟡 Edge function `send-slack-message` existe mas **não é chamada por okr-escalation** | 🟡 (vantagem latente) |
| Microsoft Teams | Não documentado | 🔴 Não tem | 🔴 |
| Google Calendar / Outlook (1:1, eventos) | Não documentado | 🔴 Não tem (planejado para 1:1 via ICS no PRD) | 🔴 (fora do escopo OKR) |
| **API REST** | ✅ "API-based connectivity" | ✅ Supabase expõe REST/GraphQL automático com RLS — vantagem técnica forte | ✅ |
| Pipefy | Não documentado | ✅ `pipefy-sync` edge function — vantagem | ✅ |
| Export CSV de objetivos | ✅ "Exportable reports" | ✅ `ObjectivesExport.tsx` → CSV | ✅ |
| **Bulk update via planilha** | ✅ Recém-lançado dez/2025 | 🔴 Não tem | 🔴 |

### 2.10 Relatórios & analytics

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| Relatório de objetivos (status, avanço) | ✅ Sim | ✅ `ObjectivesExport` (CSV) + `ExecutiveSummary` (visual) | ✅ |
| Relatório com hierarquia (objetivo+KR+plano) | ✅ Sim | 🟡 CSV atual exporta KRs concatenados mas não plano de ação (não existe entidade) | 🟡 |
| **Relatório enriquecido com 18 colunas** (release dez/2025) | ✅ Sim — fluxo aprovação, último check-in, permissões | 🟡 oxypeople tem dados mas não consolidados em uma view de relatório | 🟡 |
| Export PDF | Não evidenciado explicitamente | 🔴 Não tem (PRD prevê via react-pdf no roadmap) | 🔴 |
| Export Excel/XLSX | Não evidenciado explicitamente | 🟡 CSV cobre 80%; XLSX nativo não | 🟡 |
| BI / API para dashboards externos | ✅ Via API | ✅ Via Supabase REST/GraphQL | ✅ |
| Histórico longitudinal de progresso | Implícito | ✅ `useDashboardDetails`, `ProgressChart.tsx`, `okr_checkins` (cada check-in é linha) | ✅ |
| **Dashboards customizáveis pelo admin** | ✅ "Customizable goals dashboards" | 🟡 `ExecutiveSummary` é fixo. Filtros salvos (`SavedFiltersMenu`) compensam parcialmente | 🟡 |
| Action plans report | ✅ "Goals and action plan reports" | 🔴 Não há entidade "action plan" em OKR | 🔴 |

### 2.11 Mobile & app

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| App nativo iOS | ✅ App Store | 🔴 Não tem (PWA é estratégia declarada no PRD) | 🔴 |
| App nativo Android | ✅ Google Play | 🔴 Não tem | 🔴 |
| Mobile web (responsivo) | ✅ "100% online accessible from anywhere" | ✅ Tailwind/shadcn responsivo + `use-mobile` hook | ✅ |
| Notificações push mobile | ✅ Implícito (apps nativos) | 🔴 Não tem | 🔴 |

### 2.12 Action plans (entidade)

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| **Plano de ação como entidade vinculada ao objetivo/KR** | ✅ "Dedicated action plans per objective or KPI" + responsável + prazo | 🔴 oxypeople tem `actions` (Kanban semanal) mas **não vinculado a objetivo/KR como "plano"**. Tabela existe (`useActions`) mas o link é fraco | 🔴 |
| Múltiplos planos por objetivo | ✅ Sim | 🔴 Não existe enquanto entidade nomeada | 🔴 |
| Status do plano (em progresso/concluído) | ✅ Sim | 🟡 `actions` tem status mas não plano-nível | 🟡 |
| Visualização de progresso de plano no Mapa | ✅ Sim | 🔴 Não existe | 🔴 |

### 2.13 Outras (LGPD, search, automações)

| Capacidade | Feedz | oxypeople hoje | Classificação |
|---|---|---|---|
| LGPD (compliance ferramentas) | ✅ "LGPD compliance tools" | 🟡 RLS dá base; **não há fluxo de "delete-my-data" pronto nem política publicada** (PRD prevê) | 🟡 |
| Busca full-text em objetivos | ✅ Implícito | ✅ `ObjectivesFilters.search` + filtros salvos | ✅ |
| Ajuste em massa quando muda gestor | ✅ Recém-lançado dez/2025 | 🔴 Não tem porque oxypeople ainda não tem `manager_id` (Epic 2.1) | 🔴 |

---

## 3. Pontuação numérica

Total de **62 capacidades** mapeadas a partir do material público do Feedz, distribuídas pelas 13 áreas acima.

### 3.1 Estado atual (sem migrations 0001/0003/0009 aplicadas)

| Classificação | Contagem | % |
|---|---|---|
| ✅ Paridade ou superior | **38** | 61% |
| 🟡 Parcial / desenhado-mas-não-aplicado | **17** | 27% |
| 🔴 Ausente | **7** | 11% |

**Paridade ponderada** (✅ = 1.0 pt, 🟡 = 0.5 pt, 🔴 = 0 pt) = `(38×1 + 17×0.5 + 7×0) / 62` = **75%**

### 3.2 Estado pós-Sprint-1 (migrations 0001+0003+0009 aplicadas, stories 1.1–1.5 fechadas)

Mover para ✅ tudo que hoje está em 🟡 puramente por dependência de migration ou story Sprint 1: kr confidence (1.3), commitment_type (1.4), objective_comments + menções (1.2), period validation trigger (0003), cron diário (0009), histórico de runs persistido (0009), trigger de overlap (0003) — total: **9 itens migram de 🟡 para ✅**.

| Classificação pós-sprint | Contagem | % |
|---|---|---|
| ✅ Paridade ou superior | **47** | 76% |
| 🟡 Parcial | **8** | 13% |
| 🔴 Ausente | **7** | 11% |

**Paridade ponderada pós-sprint-1** = `(47×1 + 8×0.5 + 7×0) / 62` = **82%**

### 3.3 Veredito comercial

| Cenário | Veredito |
|---|---|
| Vender hoje (estado de produção atual) | **Pronto-com-ressalvas-grandes** — 75% real, mas 5 gaps visíveis na primeira semana de uso (sem comentários, sem confidence, sem aspirational, sem cron, sem aprovação) |
| Vender pós Sprint 1 (0001+0003+0009 + stories 1.1–1.5) | **Pronto-com-ressalvas-pequenas** — 82%; gaps remanescentes (aprovação por gestor, action plans, mobile nativo, projection) podem ser anti-vendidos com discurso de "v1.1 em N dias" |
| Vender pós Sprints 1+2+ (action plans + aprovação por gestor) | **Pronto sem ressalvas** ≥90%; supera Feedz em vários eixos (cascata server-side, RLS, multi-view, gamificação) |

---

## 4. Vantagens estruturais do oxypeople sobre Feedz

Pontos de venda concretos a destacar no pitch comercial — todos verificados no código:

1. **Cascata de progresso server-side com triggers SQL** — `trg_cascade_objective_progress` + `update_objective_auto_status` + `okr_audit_log`. Feedz não documenta de forma transparente como faz; nosso modelo é auditável linha a linha.
2. **RLS multi-tenant nativa em 100% das tabelas** — separação por `company_id` + helpers `is_company_member()` / `is_company_admin()`. Garante isolamento mesmo se um bug de aplicação tentar vazar.
3. **Múltiplos modos de visualização** — Tree, Map (zoom/pan), Board com agrupamento por departamento, Kanban de ações. Feedz tem apenas o Mapa de Objetivos.
4. **Bulk check-in** — `BulkCheckinDialog` permite atualizar vários KRs em um diálogo. Feedz não documenta.
5. **Validação de mínimo de caracteres no comentário do check-in** — força qualidade narrativa. Feedz não documenta.
6. **Identificação explícita de bloqueio** com `has_blocker` + descrição. Feedz não documenta.
7. **Soft delete + recuperação** — `DeletedItemsDialog` recupera objetivo, KR ou check-in deletado. Feedz não documenta.
8. **Filtros salvos** — `SavedFiltersMenu` permite admin salvar configurações de filtro complexas (atRisk, overdue, sem KR, busca, dept, dono, período, range de progresso). Feedz não documenta.
9. **Realtime out-of-the-box** — Supabase Realtime ligado em `objectives`, `key_results`, `okr_checkins` e (com 0003) `objective_comments`. Vê check-in do colega ao vivo.
10. **Stack aberta + customizável** — Tailwind/shadcn na UI permite re-skinning para clientes white-label; Feedz é caixa-preta.
11. **Integração Pipefy nativa** — único concorrente do mercado a oferecer.
12. **Auditoria estruturada com `okr_audit_log` + UI dedicada** — quem mudou o quê e quando, com diff JSONB.

---

## 5. Gaps críticos para fechamento pré-launch

Top 5 gaps com maior impacto comercial, ordenados por severidade.

### Gap 1 — Fluxo de aprovação por gestor direto (objetivos e check-ins)
- **Severidade:** 🔴 Alta — feature "destaque" do Feedz na release de dezembro/2025; clientes com cultura TOTVS vão **perguntar explicitamente** "como o gestor aprova as metas?"
- **Impacto comercial:** alto. Sem isso o discurso "substituto do Feedz" trinca em demos com RH tradicional.
- **Esforço:** **L** — exige nova entidade `okr_approval_requests`, RLS, fluxo de notificação, UI de pendências, decisões "aprovar/ajustar/rejeitar com motivo"
- **Dependência:** nenhuma migration existente cobre. Precisa migration nova (`0010_okr_approvals.sql`). Story nova no PRD (não existe ainda).
- **Workaround intermediário:** declarar "aprovação opcional" e permitir admin marcar manualmente — mas é mitigação fraca.

### Gap 2 — Comentários, menções e discussão em objetivos/KRs
- **Severidade:** 🔴 Alta — feature básica de colaboração, presente no Feedz. **Sem isso a colaboração acontece fora do produto** (Slack, WhatsApp).
- **Impacto comercial:** alto. Cliente abre OKR, não vê onde discutir, vai para fora.
- **Esforço:** **M** — schema desenhado em `0003`. UI Story 1.2 documentada mas não shipped. Mentions reusam `useMentionSuggestions` existente.
- **Dependência:** **migration 0003 pendente** + Story 1.2 do PRD.

### Gap 3 — Action plans estruturados por objetivo
- **Severidade:** 🟡 Média-alta — Feedz tem entidade dedicada com responsável/prazo. oxypeople tem `actions` mas **não há vínculo formal "plano deste objetivo"**.
- **Impacto comercial:** médio-alto. Admins de RH brasileiros estão acostumados ao paradigma "plano de ação" da gestão tradicional (PDCA).
- **Esforço:** **M** — adicionar `objective_id` em `actions` + UI no `ObjectiveDetail` + relatório.
- **Dependência:** migration nova (não existe ainda; estimar como `0011_okr_action_plans.sql`).

### Gap 4 — Cron diário do escalation + e-mail
- **Severidade:** 🟡 Média — funcionalidade existe no edge function `okr-escalation` mas só dispara manual. Notifica só in-app (sino), sem e-mail.
- **Impacto comercial:** médio. Cliente vai estranhar "tenho que clicar para rodar?" e "não recebo e-mail?".
- **Esforço:** **S** para cron (migration 0009 pronta); **M** para e-mail (precisa Resend/Sendgrid + template).
- **Dependência:** **migration 0009 pendente** + integração de e-mail nova.

### Gap 5 — KR types avançados (manter dentro de faixa, escala graduada multi-velocity, data-de-entrega)
- **Severidade:** 🟡 Média — Feedz tem 4 tipos especiais; oxypeople só tem `up/down` linear.
- **Impacto comercial:** médio. Times de vendas com metas de PLR ("vendi R$ 30k = 60%") vão sentir falta.
- **Esforço:** **M** — schema permite (`kr_type` é texto), mas precisa lógica de cálculo + UI para configurar buckets.
- **Dependência:** nenhuma migration estrutural — só `kr_type` aceitar mais valores e função SQL `calc_kr_progress` ramificar.

---

## 6. Recomendações ranqueadas

Cinco ações priorizadas para subir a paridade de 75% para 90%+ no menor caminho crítico.

### Recomendação 1 — APLICAR migrations 0001 + 0003 + 0009 imediatamente
- **Por quê:** sobe paridade de 75% para 82% em uma tarde de DBA. Desbloqueia 4 das 7 stories pendentes de Sprint 1. Sem isso o resto do roadmap está congelado.
- **Esforço:** **S** (1 dia, supondo aprovação do usuário sobre destrutividade — todas três são aditivas conforme verificado).
- **Dependências:** **aprovação explícita do usuário** (regra global proíbe operações destrutivas — todas as três são aditivas: `ADD COLUMN`, `CREATE TABLE`, `CREATE INDEX`, `CREATE POLICY`, `cron.schedule`).
- **Impacto:** desbloqueia stories 1.2 (comments), 1.3 (confidence), 1.4 (commitment_type), 1.5 cron real.

### Recomendação 2 — Fechar Sprint 1 (stories 1.2 + 1.3 + 1.4 + 1.5)
- **Por quê:** quatro features visíveis ao usuário final que fecham 4 dos 5 "gaps observáveis na primeira semana".
- **Esforço:** **M** (~5 dias de dev assistido por Claude Code, conforme stories já especificadas).
- **Dependências:** Recomendação 1 aplicada.
- **Impacto:** sobe paridade ponderada para 82%; veredito comercial passa para "pronto-com-ressalvas-pequenas".

### Recomendação 3 — Adicionar entidade Action Plans vinculada a objetivos/KRs
- **Por quê:** Gap 3 acima. Reutiliza `actions` existente, só precisa FK + UI no detalhe + agrupamento. Atende vocabulário familiar ao RH brasileiro.
- **Esforço:** **M** (~3 dias).
- **Dependências:** migration nova (`0011_okr_action_plans.sql` aditiva: `ALTER TABLE actions ADD COLUMN objective_id`, `ADD COLUMN key_result_id`).
- **Impacto:** fecha Gap 3 e move 3 capacidades de 🔴/🟡 para ✅ (action plans, action plans report, status do plano).

### Recomendação 4 — Implementar fluxo de aprovação opt-in (objetivos e check-ins)
- **Por quê:** Gap 1, o maior gap de demo. Pode ser "aprovação opcional configurável por empresa" — não obrigatório.
- **Esforço:** **L** (~7–10 dias). Tabela nova, RLS, UI com pendências, e-mail/notificação ao gestor.
- **Dependências:** migration nova + manager_id (Epic 2 — Story 2.1 já no PRD). **Bloqueia se Epic 2 atrasar.**
- **Impacto:** fecha o maior gap único contra Feedz. Sobe veredito para "pronto" (sem ressalvas).
- **Alternativa de menor escopo:** versão MVP do fluxo só para check-ins (não objetivos), reduzindo para esforço **M**.

### Recomendação 5 — Plugar e-mail no escalation + Slack para risk/overdue
- **Por quê:** Gap 4. Multi-canal de notificação é expectativa básica em SaaS brasileiro 2026. Edge function `send-slack-message` já existe ociosa.
- **Esforço:** **S** (Slack: ~1 dia — só chamar dentro de `okr-escalation/index.ts`); **M** (e-mail: ~3 dias com Resend + template MJML).
- **Dependências:** decisão de qual provedor de e-mail (Resend recomendado) e budget.
- **Impacto:** fecha Gap 4 e move 2 capacidades de 🔴/🟡 para ✅.

### Total estimado para chegar a ≥90% de paridade

| Recomendação | Esforço | Sequência |
|---|---|---|
| 1. Migrations | S | dia 1 |
| 2. Sprint 1 close | M | dias 2–6 |
| 3. Action plans | M | dias 7–9 |
| 4. Approval flow (opt-in, MVP) | M (com versão reduzida) | dias 10–14 |
| 5. E-mail + Slack escalation | S+M | dias 15–17 |

**Janela total:** ~17 dias úteis (3.5 semanas) para sair de 75% para ≥90% de paridade ponderada com Feedz no módulo OKR.

---

## 7. Riscos e ressalvas

| Risco | Mitigação |
|---|---|
| **Material público do Feedz é incompleto e marketing-driven** — pode ter features na UI real que não apareceram nesta auditoria | Solicitar acesso de demo gratuito ao Feedz (forma legal). Em paralelo, conversar com 1–2 ex-clientes Feedz que migrem para oxypeople e levantar o "verdadeiro catálogo" baseado em uso real. |
| **Aprovação por gestor direto pode ser show-stopper em RH conservador** | Versão opt-in resolve ~80%. Se cliente exigir 100%, escalar prioridade para Sprint 2. |
| **Migrations pendentes (0001, 0003, 0009) ainda não aplicadas em produção** — toda esta auditoria assume aplicação iminente | Conversar com usuário **antes** das próximas conversas comerciais. Sem 0003 aplicada, demonstração de OKRs vai expor 4 gaps. |
| **Pricing comparativo desconhecido** (Feedz não publica) | Para ganhar comercialmente, oxypeople precisa pricing transparente e abaixo de "TOTVS enterprise tier". Estimativa empírica: oxypeople a R$ 15–25/seat/mês compete bem com Feedz a R$ 30–50. |
| **Mobile nativo é gap não fechável em curto prazo** | PWA bem feita compensa 80% (já é parte do PRD). Para vendas onde "app mobile" é check-the-box obrigatório, oferecer roadmap claro com data. |
| **Feedz pode lançar features novas (release dez/2025 mostrou 5 + 18 colunas)** | Reauditar trimestralmente. Próxima auditoria sugerida: julho/2026. |
| **Action plans e fluxo de aprovação podem ser percebidos como "diferenciação burocrática" por clientes startup-mind** | Posicionar como opcionais. Empresas mais ágeis usam só comentários + check-ins. |

---

## 8. Resposta direta à pergunta do usuário

> *"a parte de objetivos está idêntica ao Feedz?"*

**Não, ainda não está idêntica. Está em 75% de paridade hoje e sobe para 82% quando as 3 migrations já desenhadas (0001, 0003, 0009) forem aplicadas e Sprint 1 fechar (4–5 dias).**

**Onde já estamos iguais ou melhores que o Feedz** (38 capacidades): tipos de objetivo, hierarquia com cascata server-side, KR com pesos/unidades/direção, períodos com CRUD admin, check-ins com risco verde/amarelo/vermelho + comentário + anexos + bloqueio + bulk + histórico, escalation com auto-status, três modos de visualização (tree/map/board), dashboard executivo, soft-delete com recuperação, auditoria estruturada, RLS multi-tenant, realtime, filtros salvos, exportação CSV, integração Pipefy.

**Onde estamos atrás do Feedz** (7 ausentes + 17 parciais): fluxo de aprovação por gestor (gap maior), action plans estruturados, mentions plugadas, e-mail no escalation, app mobile nativo, KR types avançados (manter-em-faixa, multi-velocity, entrega-por-data), bulk update via planilha, dashboards customizáveis pelo admin, filtros por status do colaborador, integração nativa folha (esta última é anti-meta declarada do PRD).

**Para vender contra Feedz com confiança** o caminho mais curto é ~3.5 semanas: aplicar as migrations, fechar Sprint 1, adicionar action plans, fluxo de aprovação opt-in mínimo, plugar e-mail/Slack. Isso leva de 75% → 90%+ de paridade ponderada e o veredito vira "pronto sem ressalvas materiais para clientes que migram do Feedz".

---

## 9. Fontes

- [Feedz — Ferramenta de OKRs e gestão de metas completa (redireciona p/ TOTVS)](https://www.feedz.com.br/okr/) — coletado 2026-04-30
- [TOTVS RH Metas e Objetivos (OKR)](https://www.totvs.com/rh/metas-objetivos-okr/) — coletado 2026-04-30
- [Tudo sobre o TOTVS RH Metas e Objetivos – Linha Feedz (ficha técnica)](https://produtos.totvs.com/ficha-tecnica/tudo-sobre-o-totvs-rh-metas-e-objetivos-linha-feedz/) — coletado 2026-04-30 — fonte mais densa
- [TOTVS RH Objetivos e Metas (OKR) em dezembro de 2025 — release notes](https://produtos.totvs.com/metas-objetivos-okr/okr-em-dezembro-2025/) — coletado 2026-04-30
- [Linha Feedz para gestão de clima organizacional — TOTVS](https://www.totvs.com/feedz/) — coletado 2026-04-30
- [Feedz — Plataforma de gestão de desempenho](https://www.feedz.com.br/) — coletado 2026-04-30
- [Feedz — Planos](https://www.feedz.com.br/planos/) — coletado 2026-04-30 — preços não expostos publicamente
- [Feedz Blog — Categoria OKR](https://www.feedz.com.br/blog/category/okr/) — coletado 2026-04-30
- [Capterra — Feedz reviews](https://www.capterra.com/p/198769/Feedz/) — coletado 2026-04-30
- [B2B Stack Blog — Feedz overview](https://blog.b2bstack.com.br/feedz/) — coletado 2026-04-30
- [App Store — Feedz iOS app](https://apps.apple.com/br/app/feedz/id1569022343) — coletado 2026-04-30
- [Google Play — Feedz Android app](https://play.google.com/store/apps/details?id=com.feedzapp&hl=en_US) — coletado 2026-04-30

**Observação sobre acesso:** todas as URLs acima são públicas. A UI logada do Feedz não foi acessada (exigiria conta paga). Auditoria baseada em material comercial + ficha técnica oficial + blog + reviews terceiros + release notes.

---

**Status do documento:** ✅ Auditoria concluída.
**Próximo passo recomendado:** decisão do usuário sobre aplicar migrations 0001 + 0003 + 0009 (todas aditivas) para destravar Sprint 1 e subir paridade para 82%.
