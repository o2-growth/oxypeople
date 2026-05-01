# Sprint 4 — 1:1s estruturadas + PDI

**Status:** Approved (Ready to start)
**Owner:** unassigned (Dex)
**Scrum Master:** River
**Epics cobertos:** Epic 6 (1:1s), Epic 7 (PDI)

## Resumo
Sprint 4 entrega dois rituais críticos de gestão de pessoas: (a) 1:1s estruturadas com pauta colaborativa, notas com 3 visibilidades e recorrência automática; (b) Plano de Desenvolvimento Individual (PDI) com competências, ações em kanban, evidências e aprovação do gestor.

**🔴 Atenção máxima:** Story 6.3 (notas com 3 visibilidades) é a peça de software mais sensível em segurança/privacidade do produto inteiro. Vazamento = quebra de confiança total.

---

## Ordem de implementação (sequenciada)

### Bloco A — 1:1s base (Epic 6)
1. **Story 6.1** — Agendar 1:1 com recorrência (M, P0) ← BLOQUEIA tudo do Epic 6
2. **Story 6.2** — Tópicos colaborativos (S, P0) — pode iniciar logo após 6.1
3. **Story 6.3** — Notas com 3 visibilidades (M, P0) 🔴 — pode iniciar em paralelo com 6.2

### Bloco B — 1:1s extras (Epic 6)
4. **Story 6.4** — Histórico de anteriores (S, P1) — depende de 6.3
5. **Story 6.5** — Download .ics (S, P1) — depende de 6.1, paralelo a 6.4/6.6/6.7
6. **Story 6.6** — Recorrência cron (S, P1) — depende de 6.1
7. **Story 6.7** — Dashboard frequência (S, P1) — depende de 6.1, 6.6

### Bloco C — PDI base (Epic 7)
8. **Story 7.1** — Criar próprio PDI (M, P0) ← BLOQUEIA tudo do Epic 7
9. **Story 7.3** — Ações em kanban (M, P0) — depende de 7.1
10. **Story 7.5** — Aprovação do gestor (S, P1) — depende de 7.1, 7.3
11. **Story 7.2** — Manager cria PDI para liderado (S, P1) — depende de 7.1

### Bloco D — PDI extras (Epic 7)
12. **Story 7.4** — Anexar evidências (S, P0) — depende de 7.3
13. **Story 7.6** — Gráfico radar (S, P1) — depende de 7.1, paralelo a 7.4
14. **Story 7.7** — Vincular ação a feedback (S, P1) — depende de 7.3 + Epic 5
15. **Story 7.8** — Dashboard admin PDI (M, P1) — depende de 7.1, 7.3, 7.5

---

## Bundles paralelos seguros
- **Onda 1:** 6.1 + 7.1 (paralelos, devs distintos)
- **Onda 2:** 6.2 + 6.3 + 7.3 (paralelos depois das raízes)
- **Onda 3:** 6.4 + 6.5 + 6.6 + 6.7 + 7.4 + 7.5 + 7.6 (todas paralelas)
- **Onda 4:** 7.2 + 7.7 + 7.8

---

## Migrations a aplicar (ordem)

| Ordem | Migration | Stories | Notas |
|---|---|---|---|
| 1 | `0007_one_on_ones.sql` | 6.1, 6.2, 6.3 | Tabelas + RLS sensível |
| 2 | `0008_pdi.sql` | 7.1, 7.3, 7.4 | Inclui bucket `pdi-attachments` |
| 3 | `0009_pg_cron_jobs.sql` | 6.6 | Requer `pg_cron` extension |
| 4 | `0010_one_on_one_recurrence.sql` (NEW) | 6.6 | Trigger + função geração próxima |
| 5 | `0011_pdi_approval_guard.sql` (NEW) | 7.5 | Trigger BEFORE UPDATE em `approved_at` |
| 6 | `0012_users_department.sql` (CONDICIONAL) | 7.8 | Só se schema atual não tiver `department` |

**Pré-requisitos:**
- Migration `0001_fix_fragilities.sql` aplicada (helpers `is_company_admin`, `is_company_member`)
- Migration `0002_add_manager_id.sql` aplicada (helper `is_user_manager`, coluna `users.manager_id`)
- Epic 5 entregue (tabela `feedback_requests` para Story 7.7)

---

## Cross-epic deps
- **Story 7.7 ↔ Epic 5** — vincular ação a feedback requer `feedback_requests` operacional
- **Story 7.2 ↔ Epic 2** — `is_user_manager` depende de `users.manager_id` (migration 0002)
- **Story 6.7 ↔ Epic 2** — dashboard frequência por gestor usa `manager_id`
- **Story 6.6 ↔ DevOps** — `pg_cron` deve estar habilitado pelo @devops antes do merge

---

## 🔴 RLS Sensitivity — Epic 6 (CRÍTICO)

Epic 6 lida com dados de altíssima sensibilidade. As policies RLS de `one_on_ones`, `one_on_one_topics` e especialmente `one_on_one_notes` são a única barreira protegendo conversas privadas entre líder e liderado.

### Princípios não-negociáveis
1. **NUNCA** confiar em filtro client-side. RLS é a única fonte da verdade.
2. **NUNCA** usar service role para consultar notas/tópicos no backend, exceto em operações administrativas explícitas e auditadas.
3. **Admin NÃO vê notas** — comportamento intencional. Admin vê a EXISTÊNCIA da 1:1, mas não conteúdo de notas privadas (e `one_on_one_topics` também não admite admin).
4. **Defesa em profundidade** — UI valida, Zod valida, e RLS valida. Os 3 devem coincidir.
5. **Visibilidade da nota = papel do autor.** UI nunca permite enviar `private_leader` quando autor é o member, e vice-versa.

### Gate de merge — Story 6.3
**Os 5 testes RLS T1-T5 (descritos no Epic 6 e na Story 6.3) DEVEM ser executados e os resultados anexados ao PR antes de qualquer merge.**

Setup: 1:1 entre L (leader) e M (member). Admin = A. Externo = X.

| # | Cenário | Esperado |
|---|---|---|
| T1 | L cria `private_leader` | L vê / M, A, X NÃO veem |
| T2 | M cria `private_member` | M vê / L, A, X NÃO veem |
| T3 | L cria `shared` | L, M veem / A, X NÃO (policy não cobre) |
| T4 | L tenta INSERT `private_member` | WITH CHECK rejeita |
| T5 | X tenta SELECT qualquer nota | retorna VAZIO |

### Aprovação obrigatória
Story 6.3 requer review explícito por **@architect (Aria)** antes do merge.

---

## 🟡 Storage attachments — Epic 7 PDI (relevante)

Bucket: `pdi-attachments` (privado). Path obrigatório: `{user_id}/{pdi_plan_id}/{action_id}/{uuid}-{filename}`.

- Owner pode upload/read/delete diretamente (policies do bucket).
- Gestor/admin precisam de **edge function** `pdi-evidence-signed-url` para gerar signed URLs (validação via DB).
- Limite 10 MB (client + server via `file_size_limit` do bucket).
- Tipos permitidos: pdf, png, jpg, jpeg, mp4 (≤30s), docx, pptx.
- ⚠️ Bucket NUNCA tornar público.

---

## Definition of Done — Sprint 4
- [ ] 15 stories entregues e em produção (staging primeiro)
- [ ] 5 1:1s reais conduzidas internamente (DoD Epic 6)
- [ ] **0 vazamentos de notas privadas nos 5 testes RLS** (gate Story 6.3)
- [ ] .ics importa em Google + Outlook + Apple Calendar
- [ ] 3 PDIs reais ativos internamente, 1 finalizado com evidências (DoD Epic 7)
- [ ] Trigger `recalc_pdi_progress` validado com 5+ ações
- [ ] Storage `pdi-attachments` testado para upload + signed URL via edge function
- [ ] Eventos PostHog disparando: `one_on_one_scheduled`, `one_on_one_note_created`, `pdi_created`, `pdi_action_completed`, etc.
- [ ] RUNBOOK atualizado com novos jobs de cron e edge functions
- [ ] Aprovação de @architect em Stories 6.3 e 7.5

---

## Métricas pós-deploy (Sprint 4 + 30 dias)
**Epic 6:**
- Taxa 1:1s realizadas/agendadas (alvo ≥ 70%)
- # gestores com 1:1s recorrentes ativas
- Saúde da prática: razão notas privadas vs compartilhadas

**Epic 7:**
- # PDIs ativos internamente
- % PDIs concluídos no prazo
- Top competências trabalhadas (insight L&D)
