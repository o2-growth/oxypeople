# PO Validation Report — oxypeople MVP

**Autor:** Pax (Product Owner)
**Data:** 2026-04-27 (revisado 2026-04-30 para ajuste de escopo)
**Documentos validados:** `brownfield-assessment.md` · `architecture-review.md` · `database-audit.md` · `prd.md` · `migrations-draft/0001-0009.sql`

---

> **Atualização (2026-04-30):** este relatório foi originalmente escrito assumindo lançamento como SaaS comercial. O escopo real é **ferramenta interna do o2-growth para substituir o Feedz internamente**. Sem billing, sem landing comercial, sem onboarding de novos clientes. Trechos de GTM/comercial foram marcados com ~~strikethrough~~ e a nota "removido pelo pivot 2026-04-30". Ver `docs/SCOPE-CORRECTION-2026-04-30.md`.

---

## 1. Validação de Consistência Cross-Document

### 1.1 PRD ↔ Architecture Review

| PRD Epic | Architecture §§ | Status |
|---|---|---|
| Epic 1 — OKRs Hardening | §5.1 | ✅ Cobertura completa |
| Epic 2 — Organograma 2.0 | §5.2 + ADR-001, ADR-002 | ✅ Cobertura completa |
| Epic 3 — Pulse Survey | §5.6 + ADR-004 | ✅ Cobertura completa |
| Epic 4 — Nine Box | §5.7 + ADR-007 | ✅ Cobertura completa |
| Epic 5 — Feedback Contínuo | §5.3 | ✅ Cobertura completa |
| Epic 6 — 1:1s | §5.4 + ADR-005, ADR-008 | ✅ Cobertura completa |
| Epic 7 — PDI | §5.5 + ADR-012 | ✅ Cobertura completa |

**Sem epics órfãos. Sem ADRs sem story.**

### 1.2 PRD ↔ Database Audit

| Story | Tabela/Coluna | Migration | Status |
|---|---|---|---|
| 1.1 (períodos UI) | `periods` + `validate_period_no_overlap` | 0003 | ✅ |
| 1.2 (comments) | `objective_comments` | 0003 | ✅ |
| 1.3 (confidence) | `key_results.confidence` | 0003 | ✅ |
| 1.4 (commitment_type) | `objectives.commitment_type` | 0003 | ✅ |
| 1.5 (cron escalation) | cron job | 0009 | ✅ |
| 1.6 (collaborators edit) | `objective_collaborators` (existente) | — | ✅ schema OK, falta UI |
| 1.7 (enum sync) | enum TS | — | ✅ refactor only |
| 2.1 (manager_id) | `company_memberships.manager_id` | 0002 | ✅ |
| 2.2-2.6 (org chart) | helpers `get_org_subtree`/`get_org_ancestors` | 0002 | ✅ |
| 3.1-3.5 (Pulse) | `pulse_surveys`, `pulse_responses` | 0004 + 0009 | ✅ |
| 4.1-4.6 (Nine Box) | `nine_box_snapshots`, `nine_box_placements` | 0005 | ✅ |
| 5.1-5.7 (Feedback) | `feedback_requests` + trigger + cron | 0006 + 0009 | ✅ |
| 6.1-6.7 (1:1) | `one_on_ones`, `_topics`, `_notes` + cron | 0007 + 0009 | ✅ |
| 7.1-7.8 (PDI) | `pdi_plans`, `_competencies`, `_actions` + bucket | 0008 | ✅ |

**Sem stories sem schema. Sem schema sem story.**

### 1.3 Inconsistências detectadas

| # | Inconsistência | Resolução |
|---|---|---|
| INC-1 | PRD Story 1.7 menciona "6 tipos no DB" — mas só `strategic`, `tactical`, `operational`, `personal`, `team`, `individual` aparecem no enum DB. PRD não diz qual UI vai expor | **Resolução PO:** simplificar PRD — UI expõe os 3 tipos atuais (`strategic`/`tactical`/`operational`); enum TS aceita os 6 só para tipo-segurança. Story atualizada abaixo. |
| INC-2 | PRD §3 menciona Bruno como "líder", mas RLS de Pulse usa `is_company_admin` para criar pesquisa (Bruno não cria) | **OK** — admin task é da Renata. PRD já reflete isso na matriz § 3.4. |
| INC-3 | Architecture §7.3 cita 4 cron jobs; PRD timeline não dimensiona admin UI para visualizar status | **Resolução PO:** Story 1.5 já cobre tela mínima. Visualização avançada vai para P1. |
| INC-4 | Database audit R6 pede confirmação de não-overlap em `periods` antes de aplicar 0003 | **Resolução PO:** virou pre-condition na story 1.1 |
| INC-5 | PRD não menciona Sentry/PostHog como story explícita — só na timeline Sprint 0 | **Resolução PO:** criadas stories 0.3 e 0.4 no Sprint 0 |
| INC-6 | Story 6.5 (.ics) não tem migration nem edge function listada no architecture | **Resolução PO:** documentado no epic-06 que `one-on-one-ics` é nova edge function (sem migration — apenas Deno code) |

---

## 2. Validação de Qualidade das Stories

### 2.1 Checklist por epic

| Epic | Stories | AC claros | Tem dependências sequenciadas | Estimativa | Cobertura de teste |
|---|---|---|---|---|---|
| 1 | 7 | ✅ | ✅ | ✅ via sprint | ⚠️ a detalhar em SM |
| 2 | 6 | ✅ | ✅ (manager_id antes de tudo) | ✅ | ⚠️ a detalhar |
| 3 | 5 | ✅ | ✅ (admin UI antes do widget) | ✅ | ⚠️ |
| 4 | 6 | ✅ | ✅ (snapshot antes de placement) | ✅ | ⚠️ |
| 5 | 7 | ✅ | ✅ | ✅ | ⚠️ — RLS test obrigatório |
| 6 | 7 | ✅ | ✅ | ✅ | 🔴 **RLS test crítico** |
| 7 | 8 | ✅ | ✅ (plan antes de competency, competency antes de action) | ✅ | ⚠️ |

**46 stories total** — todas com AC. Detalhe de testes vai para SM por story.

### 2.2 Stories críticas que exigem revisão extra

🔴 **Story 6.3** (notas privadas em 1:1) — RLS é o mais sensível do app. **Plano de teste obrigatório antes de PR mergear.**

🔴 **Story 5.1** (criar feedback request) — RLS de visibility ('private_requester' / 'shared_with_subject' / 'shared_with_manager') exige teste.

🟡 **Story 1.5** (cron OKR escalation) — depende de plano Supabase Pro. Se Free, story muda para "Vercel cron" (não bloqueia, só refactor).

🟡 **Story 2.1** (manager_id) — migration aditiva, mas muda modelo conceitual. Plano: rollout coexistindo com `dept.leader_id` por 2 sprints (dual-source).

---

## 3. Sharding Plan

Estrutura criada:

```
docs/
├── prd.md                               (master)
├── architecture-review.md               (master)
├── database-audit.md                    (master)
├── po-validation-report.md              ← este arquivo
├── epics/                               ← novo
│   ├── README.md                        (índice)
│   ├── epic-01-okrs-hardening.md
│   ├── epic-02-organograma-2.md
│   ├── epic-03-pulse-survey.md
│   ├── epic-04-nine-box.md
│   ├── epic-05-feedback-continuo.md
│   ├── epic-06-one-on-ones.md
│   └── epic-07-pdi.md
├── stories/                             ← novo (lazy — preenchido pelo SM)
│   ├── README.md                        (índice + ciclo de vida)
│   ├── sprint-0/                        (4 stories prep — DETALHADAS)
│   │   ├── story-0.1-apply-rls-fixes.md
│   │   ├── story-0.2-remove-lovable-auth.md
│   │   ├── story-0.3-setup-sentry.md
│   │   └── story-0.4-setup-posthog.md
│   └── sprint-1/                        (Epic 1 — DETALHADAS)
│       ├── story-1.1-periods-admin-ui.md
│       ├── story-1.2-objective-comments.md
│       ├── story-1.3-kr-confidence.md
│       ├── story-1.4-commitment-type.md
│       ├── story-1.5-okr-cron-escalation.md
│       ├── story-1.6-edit-collaborators.md
│       └── story-1.7-align-objective-enum.md
├── architecture/                        ← novo (suporte)
│   ├── tech-stack.md
│   ├── source-tree.md
│   └── coding-standards.md
└── migrations-draft/                    (Dara)
```

**Decisão de sharding (lazy):** stories de Sprint 2–5 são criadas pelo SM **na vez delas**, não agora. Evita inflar repo com 39 arquivos que ainda vão mudar. Epics têm a lista completa.

---

## 4. Master Validation Checklist

### Document Consistency
- [x] PRD goals align with architecture design
- [x] Stories trace back to PRD epics
- [x] Architecture supports all PRD features
- [ ] Frontend spec matches PRD user flows — **PENDENTE: invocar `/agents:ux` para wireframes**
- [x] No orphan stories (all link to epics)

### Story Quality (Sprint 0 + Epic 1)
- [x] Clear acceptance criteria (Given/When/Then) — nas stories detalhadas
- [x] Technical notes reference architecture
- [x] Dependencies identified and sequenced
- [x] Testing requirements specified
- [x] Definition of Done per epic

### Completeness
- [x] All epics have stories (46 stories mapeadas)
- [ ] All stories have estimates — **estimadas em S/M/L; pontos a definir com Dex**
- [x] All critical paths identified (Sprint 0 → Sprint 1 → ...)
- [x] Risks documented with mitigations (PRD §10 + database-audit §7)

---

## 5. Backlog Priorizado (ordem de execução)

```
Sprint 0 (preparação)
├── 0.1 Apply RLS fixes (migration 0001)
├── 0.2 Remove Lovable Auth dead code
├── 0.3 Setup Sentry
└── 0.4 Setup PostHog
                     ↓
Sprint 1 (OKRs hardening)
├── 1.7 Align objective_type enum (BLOQUEIA outras)
├── 1.1 Periods admin UI (depende de 0003 migration)
├── 1.2 Objective comments
├── 1.3 KR confidence
├── 1.4 Commitment type
├── 1.5 OKR cron escalation
└── 1.6 Edit collaborators
                     ↓
Sprint 2 (Org + Pulse + Nine Box)         Sprint 3 (Feedback + 1:1)
├── 2.1 manager_id migration              ├── 5.1-5.7 Feedback Contínuo
├── 2.2-2.6 Org chart features            └── 6.1-6.7 1:1s (RLS crítico!)
├── 3.1-3.5 Pulse Survey
└── 4.1-4.6 Nine Box                      Sprint 4 (PDI + qualidade)
                                          ├── 7.1-7.8 PDI
                                          └── Suíte de testes mínima

Sprint 5 (Hardening) — polish + docs + cliente piloto
```

---

## 6. Decisões Pendentes Consolidadas

> Bloqueiam ou afetam o início do Sprint 0/1.

| # | Decisão | Bloqueia? | Recomendação Pax |
|---|---|---|---|
| D1 | Plano Supabase Pro+? | Story 1.5, 0009 | Confirmar antes do Sprint 1 |
| D2 | Conta Sentry e PostHog | Sprint 0 (0.3, 0.4) | Free tier serve; criar antes |
| D3 | Aplicar 0001 (fix RLS) em staging | Sprint 0 (0.1) | Aprovar — risco zero |
| D4 | Aplicar 0002 (manager_id) em staging | Sprint 2 | Aprovar quando chegar |
| ~~D5 Cliente-piloto definido?~~ | ~~Final do Sprint 5~~ | ~~Iniciar prospecção paralela~~ — **removido pelo pivot 2026-04-30 (sem clientes externos)** |
| ~~D6 Pricing model~~ | ~~Sprint 5~~ | ~~Definir até semana 6~~ — **removido pelo pivot 2026-04-30 (sem cobrança)** |
| D7 | Política de privacidade interna + DPO | Sprint 5 | Iniciar com jurídico interno (sem advogado externo) |
| D8 | UX wireframes (Uma) | Não bloqueia, mas acelera | Invocar em paralelo a Dev |
| D9 | Janela de cutoff do Feedz | Sprint 5 (rollout) | Rodar paralelo 2 semanas; cutoff semana 6 |
| D10 | Provider de e-mail transacional (Resend/SendGrid) | Sprint 0 (F.y) | Resend recomendado (free 3k/mês) |

---

## 7. Próximos Passos

→ **Aprovação do usuário deste validation report**
→ **`/agents:dev` (Dex)** começa Sprint 0 com as 4 stories detalhadas
→ Em paralelo: **`/agents:ux` (Uma)** produz wireframes para os 5 módulos novos (epics 2-7)
→ **`/agents:sm` (River)** detalha stories dos sprints 2-5 sob demanda (lazy)

---

**Status:** ✅ Validação completa. **6 inconsistências resolvidas**. PRD aprovado pela governance do PO. Pronto para implementação.
