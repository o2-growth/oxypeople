# Scope Correction — 2026-04-30

**Autor:** Morgan (Product Manager)
**Data:** 2026-04-30
**Tipo:** Recalibração de escopo (não-quebra técnica)

---

## A correção em 3 parágrafos

Os artefatos de planejamento da oxypeople (PRD, gap-map, brownfield assessment, PO validation report) foram escritos entre 2026-04-27 e 2026-04-30 sob a premissa **errada** de que o produto seria lançado como **SaaS comercial multi-tenant** vendido a empresas de médio porte que hoje usam Feedz. Essa premissa puxava todo um ecossistema de trabalho não-técnico para o caminho crítico: T&C aprovado por advogado, Stripe + NF-e, landing page comercial, pricing model, signup multi-empresa, material de marketing, recrutamento de clientes-piloto, suporte externo e SLA contratual.

Em 2026-04-30 o usuário (growth@o2inc.com.br, o2-growth) esclareceu: **"nao é para um saas é apenas para as pessoas da empresa usar"**. Ou seja, oxypeople é uma **ferramenta interna do o2-growth**, com objetivo único de **substituir o Feedz (TOTVS) internamente** no departamento de RH da própria empresa. Apenas uma instância em produção, apenas uma empresa, apenas funcionários do o2-growth como usuários. O schema multi-tenant **continua no banco** (companies + memberships + RLS por company_id) como defesa em profundidade e opcionalidade futura caso o2-growth queira spin-up de instâncias para empresas-irmãs no futuro — mas o **fluxo de "criar empresa" desaparece**, o `company_id` é fixo via seed.

Esta recalibração reduz o timeline de **8-10 semanas (MVP comercial)** para **4-6 semanas (rollout interno)**, elimina dependências externas (advogado especializado em T&C, KYC Stripe, marketing) e troca o foco para três entregas pequenas internas: **F.1 LGPD interna + DPO**, **F.x onboarding interno simplificado** (admin convida funcionário por e-mail, sem criar empresa) e **F.y e-mail transacional interno** (Resend ou SendGrid). Toda a engenharia de produto (Sprints 0-4, Epics 1-7) fica intacta — paridade de feature com Feedz continua sendo o objetivo. A diferença é que o produto será adotado internamente em vez de vendido externamente.

---

## Documentos atualizados in-place

### `docs/prd.md` — v1.0 → v1.1
- Adicionado banner de scope-correction no topo (em **bold**).
- §1 Problem Statement: reformulado de "empresas brasileiras médio porte" para "o2-growth". Removido "vendável", "pricing previsível por seat".
- §2 Goals & Success Metrics: substituídas métricas comerciais (MRR, paying clients) por métricas internas (% adoção no o2-growth, tempo até cutoff do Feedz, NPS interno). Goal de produto agora é "4-6 semanas para rollout interno", não "8 semanas para vendável".
- §2.3 Anti-metas: incluído explicitamente "NÃO construir landing comercial / pricing / billing / T&C externo / signup multi-empresa".
- §8 Timeline: encolhida de 8 semanas (Sprint 5: prep clientes-piloto) para 6 semanas (Sprint 5: rollout interno + cutoff Feedz).
- §9 Definition of Done: renomeado de "MVP Done" para "Internal Rollout Done"; substituídos critérios comerciais (Stripe checkout, pricing page, cliente piloto dogfood) por internos (95% headcount logado, RAT preenchido, cutoff Feedz agendado).
- §10 Riscos: removidos "Cliente-piloto desiste" e "Concorrência Feedz" via strikethrough; adicionados "Adoção interna baixa no o2-growth" e "Resistência ao desligamento do Feedz".
- §11 Decisões pendentes: substituídas comerciais (pricing, Stripe, cliente piloto, advogado, domínio comercial) via strikethrough por internas (DPO, e-mail provider, janela de cutoff Feedz, subdomínio interno, plano Supabase).

### `docs/next-fronts-gap-map.md` — v1.0 → v1.1 (maior recalibração)
- Adicionado banner de scope-correction no topo.
- Tabela "Estado atual": substituído "LGPD/billing/pricing/landing/T&C" (riscado) por "LGPD interna + DPO", "Onboarding interno" e "E-mail transacional interno".
- Tabela "Frentes restantes": Frente F antiga substituída por F.1 (LGPD reduzido), F.x (NOVO onboarding interno), F.y (NOVO e-mail interno). F.2/F.3/F.4/F.5 marcadas como descartadas. Soma de dev: ~10 semanas → ~6.5 semanas (4-6 paralelizando).
- Frente F.1: escopo reduzido (sem T&C externo, sem DPA B2B, sem advogado especializado). RICE rebaixado de 9.5 para 7.5.
- Frentes F.x e F.y: adicionadas como seções novas.
- "Frentes descartadas — pivot para tool interna": tabela nova listando F.2, F.3, F.4 antigo, F.5, F.6 com motivo de descarte e RICE original.
- Conteúdo original de F.2-F.6 preservado dentro de bloco `<details>` `<summary>` para audit trail (riscado).
- Gantt textual recut: 10 semanas (com Stripe, landing, GATE pricing, cliente piloto firmado) → 6 semanas (com rollout interno + cutoff Feedz).
- CPM redesenhado: caminho crítico agora termina em "Rollout interno", não "Piloto". Gargalo real é DNS SPF/DKIM, não advogado.
- Top 5 decisões pendentes: substituídas (#3 pricing, #4 cliente piloto, #5 advogado) por (#3 DPO interno, #4 provider e-mail, #5 janela cutoff Feedz).
- Riscos consolidados: removidos R-F1 antigo (advogado), R-F2 (pricing), R-F4 (Teams mercado), R-F5 (sem inbound). Adicionados R-Adoção (resistência interna ao Feedz cutoff), R-Fy (DNS spam), R-Fx (convite não chega), R-F1 novo (DPO atrasado).
- Definition of "MVP comercialmente vendável" renomeada para "Internal Rollout Done"; seção "Comercial" inteira (Stripe checkout, pricing page, landing comercial, NF-e, cliente piloto dogfood, marketing, domínio comercial, status page externo) removida via strikethrough; substituída por seção "Rollout interno (o2-growth)" com 9 itens internos.
- Conclusão executiva: "8-10 semanas MVP comercial" → "4-6 semanas rollout interno"; próximos passos do usuário ajustados.

### `docs/brownfield-assessment.md` — banner + ajustes pontuais
- Banner de scope-correction no topo.
- §1 Sumário: SaaS multi-tenant para clientes externos → ferramenta interna do o2-growth.
- §9 Decisões pendentes: "lista de clientes-piloto" riscado; adicionados "DPO interno designado?" e "Janela de cutoff do Feedz".
- §7 Estimativa: "~8 semanas para MVP comercializável" → "~4-6 semanas para rollout interno o2-growth".
- §8 Diferenciais vs Feedz: reformulado de "pontos de venda contra concorrente" para "justificam o esforço de substituir internamente"; adicionado item "controle total dos dados".

### `docs/po-validation-report.md` — banner + tabela de decisões
- Banner de scope-correction no topo.
- §6 Decisões Pendentes Consolidadas: D5 (cliente piloto) e D6 (pricing model) riscados; D7 (LGPD) reformulado para "Política de privacidade interna + DPO" sem advogado externo; D9 (cutoff Feedz) e D10 (provider de e-mail) adicionados.

### `docs/epics/epic-02-organograma-2.md`
- DoD: "100% dos colaboradores em ambiente de dogfood" → "100% dos colaboradores no rollout interno do o2-growth".

### `docs/epics/epic-03-pulse-survey.md`
- DoD: "Pulse semanal rodando em ambiente de dogfood" → "rodando no rollout interno do o2-growth"; "response rate > 70% interno" → "response rate > 70% no o2-growth".

### `docs/epics/epic-05-feedback-continuo.md`
- DoD: "30+ feedbacks circulando em dogfood" → "circulando no rollout interno do o2-growth"; "tempo médio < 3 dias em dogfood" → "no rollout interno do o2-growth".

### `docs/SCOPE-CORRECTION-2026-04-30.md` (NEW — este arquivo)
- Documenta a correção e o que mudou em cada doc.

---

## Documentos preservados sem alterações (e por quê)

| Documento | Por que NÃO foi alterado |
|---|---|
| `docs/feedz-parity-audit.md` | A paridade com Feedz **continua sendo o objetivo funcional** do MVP. O fato de o uso ser interno em vez de comercial não muda quais features precisam existir. Útil intacto. |
| `docs/architecture-review.md` | Arquitetura técnica é **scope-agnostic**. Stack, decisões de RLS, ADRs (1-12), edge functions, schema, integrações Pipefy/Slack — tudo igual. Lovable Auth removal continua sendo a mesma decisão. |
| `docs/database-audit.md` | Auditoria de tabelas, FKs, índices, triggers, RLS frágeis — todas as recomendações continuam válidas independente de uso interno ou comercial. |
| `docs/decisions/story-0.2-lovable-auth-decision.md` | Decisão técnica sobre auth, **scope-agnostic**. Mantida intacta. |
| `docs/architecture/*.md` (tech-stack, source-tree, coding-standards) | Definições técnicas, **scope-agnostic**. |
| `docs/migrations-draft/*.sql` | Migrations 0001-0009 são schema-level. O schema multi-tenant **fica** (defesa em profundidade + opcionalidade futura). Apenas uma migration adicional `0010_seed_o2growth.sql` (opcional, P1) seedará o `company_id` fixo. |
| `docs/epics/epic-01-okrs-hardening.md` | DoD não mencionava clientes externos. Inalterado. |
| `docs/epics/epic-04-nine-box.md` | DoD já dizia "ciclo de calibração interno completo" — alinhado. Inalterado. |
| `docs/epics/epic-06-one-on-ones.md` | DoD já dizia "5 1:1s reais conduzidas internamente". Inalterado. |
| `docs/epics/epic-07-pdi.md` | DoD já dizia "3 PDIs reais ativos internamente". Inalterado. |
| `docs/epics/README.md` | Apenas índice, sem menção comercial. Inalterado. |
| `docs/stories/sprint-*/*.md` | Stories detalhadas pelo SM são scope-agnostic em sua maioria; quando vier a hora de criar Sprint 5 (rollout), o SM usará o novo escopo via gap-map v1.1. |
| **Código-fonte (`src/`, `supabase/`, testes)** | **NÃO TOCADO.** O schema multi-tenant fica. Nenhuma feature técnica precisa ser removida. As únicas adições são F.x (admin invite UI) e F.y (edge function send-email + provider config) — que viram stories normais de sprint. |

---

## Definition of Done — Rollout Interno (o2-growth)

A "Internal Rollout Done" definida no PRD §9 e no gap-map é o substituto canônico do antigo "MVP comercialmente vendável". Em síntese:

### Funcional (paridade Feedz para uso interno o2-growth)
- 7 epics P0 com 100% das stories `done`
- OKRs com check-ins, comments, confidence, commitment_type, períodos UI, cron operacional
- Organograma 2.0 com manager_id, drag&drop, drawer, filtros
- Pulse Survey rodando semanalmente no o2-growth
- Nine Box com 1 snapshot completo + export PDF
- Feedback contínuo com 30+ requests circulando entre funcionários do o2-growth
- 1:1s com 5+ ocorrências reais conduzidas + zero vazamento RLS (Story 6.3)
- PDI com 3+ planos ativos + 1 finalizado com evidências

### Operacional / Qualidade
- Sentry capturando, PostHog recebendo, cron jobs rodando 7 dias sem falha
- Suíte de testes cobre fluxos críticos (auth, RLS de notas privadas, RLS de feedback, check-in OKR, criação de PDI)
- Lint + typecheck + CI verdes; 0 bugs P0/P1; Lighthouse ≥ 85 mobile

### Rollout interno (o2-growth)
- Política de Privacidade interna publicada (intranet/Notion)
- DPO interno designado + RAT preenchido para dados de funcionários
- E-mail transacional ativo (Resend/SendGrid) com 6 templates
- DNS SPF/DKIM/DMARC configurado e validado
- Onboarding interno funcional (admin convida por e-mail, ativação <5min)
- 100% do headcount o2-growth convidado e ≥95% logado pelo menos 1 vez
- **Cutoff do Feedz agendado/efetivado**
- Documentação interna no Notion da empresa

### Segurança / LGPD interna
- Fluxo "delete my data" funcional + RAT
- Auditoria RLS testada com 3 personas (owner, manager, member)
- Penetest light (SQLi, XSS, CSRF, auth bypass) — 0 críticos
- Rate limiting em edge functions críticas

### Suporte interno
- Slack #oxypeople-help (ou similar) ativo
- Runbooks de operação (deploy, rollback, incident response)
- On-call informal definido

---

## Implicações materiais para engenharia (3 maiores)

1. **F.x e F.y entram no escopo, F.2/F.3/F.4 antigo/F.5/F.6 antigo saem.** O dev tem agora **uma tela** (`/admin/invite`) e **uma edge function** (`send-email`) novas para escrever — em vez de Stripe webhook, NF-e, signup wizard multi-empresa, landing page Next.js, status page Better Uptime, etc. Economia líquida: ~5-6 semanas de dev.

2. **Schema multi-tenant fica intacto.** Nenhuma migration de remoção. `companies`, `company_memberships`, RLS por `company_id` continuam ativos como defesa em profundidade. O `company_id` do o2-growth vira constante (seed migration `0010` aditiva, opcional). Em prod só haverá uma row em `companies`. Isso preserva a opcionalidade de spin-up futuro sem mudar arquitetura.

3. **Caminho crítico muda de "advogado externo" para "DNS interno".** Antes, o gargalo real era T&C/Privacy precisando de advogado especializado (lead time 2-4 semanas, fora do controle do dev). Agora o gargalo é configurar SPF/DKIM/DMARC no domínio do o2-growth para o e-mail transacional não cair em spam. Isso depende de quem administra o DNS na empresa — geralmente é coisa de 1 dia se a TI estiver disponível, mas precisa ser priorizado **na semana 1**.

---

**Status:** ✅ Scope-correction documentada. Planejamento sincronizado com a realidade declarada pelo usuário em 2026-04-30. Próximo passo: usuário responder as 5 decisões pendentes no `next-fronts-gap-map.md` v1.1 e iniciar Sprint 0 fechamento.
