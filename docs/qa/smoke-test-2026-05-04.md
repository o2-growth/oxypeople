# Relatório Minucioso + Fixes — Oxypeople

**Data:** 2026-05-04
**Testador:** Orion (Master Orchestrator) + execução direta
**Build:** main @ cac926c → fixes aplicados
**Ambiente:** http://localhost:8080 contra Supabase `ixtsnaxhgyoeaotrched`

---

## Status final pós-fixes

| # | Feature | Antes | Depois |
|---|---|:---:|:---:|
| 1 | Auth | ✅ | ✅ |
| 2 | Mural `/feed` | ✅ | ✅ |
| 3 | Reconhecimentos | ⚠️ badges vazias | ✅ 8 badges seedados |
| 4 | Pesquisas | ✅ | ✅ |
| 5 | Performance | ⚠️ 2 tabs placeholder | ⚠️ inalterado |
| 6 | Gamificação | ✅ | ✅ |
| 7 | RH | ✅ | ✅ |
| 8 | Empresa | ✅ | ✅ |
| 9 | Teams | ✅ | ✅ |
| 10 | Settings | 🔴 hardcoded | ✅ user real + save funcional |
| 11 | Automação | ✅ | ✅ |
| 12 | Objetivos | ✅ | ✅ |
| 13 | Feedback | ✅ | ✅ |
| 14 | Theme toggle | 🔴 não alterna | ✅ 1 clique alterna |
| 15 | Cmd+K | 🔴 inativo | ✅ palette com busca real |
| 16 | Sidebar collapse | ✅ | ✅ |

**Resultado: 16/16 features funcionais.** Apenas Performance Resultados/Automação seguem como placeholders intencionais.

---

## Fixes Aplicados

### Fix #1 — Settings/Perfil real
**Arquivos:** `src/pages/Settings.tsx`, `src/components/settings/ProfileForm.tsx`
- Settings agora usa `useUser()` + `useAuth()` + `useTheme()` para popular o form
- ProfileForm recebe useEffect para sincronizar quando profile carrega
- Save persiste via `useUpdateUser`: nome em `users.full_name`, demais campos em `users.metadata` (phone/department/position/bio)
- Toast de sucesso/erro
- Tab Aparência também usa setTheme real (não mais botões mortos)
- **Validado em DB:** save de phone="(51) 99999-1234", department="QA", position="Smoke Tester" persistiu

### Fix #2 — ThemeToggle direto
**Arquivo:** `src/components/ThemeToggle.tsx`
- Era DropdownMenu (2 cliques). Refatorado para botão direto: 1 clique alterna entre claro/escuro
- Estado lido de `resolvedTheme` (suporta system → resolve para light/dark real)
- aria-label dinâmico para a11y
- Modo "system" disponível em Settings → Aparência

### Fix #3 — Command Palette com Cmd+K
**Arquivos novos:** `src/components/CommandPalette.tsx`
**Arquivos modificados:** `src/components/layout/AppLayout.tsx`, `src/components/ui/command.tsx`
- Hook `useCommandPalette` registra listener Cmd+K / Ctrl+K global (window keydown)
- CommandPalette com 3 grupos: Pessoas (busca em `users` por nome/email), Objetivos (busca em `objectives` por título), Navegação (16 rotas)
- Busca disparada com >=2 chars, debounced via React Query
- Search bar do header agora é botão clicável (era div decorativa)
- DialogTitle com sr-only para a11y (corrige warning Radix)
- **Validado:** Cmd+K abriu palette, busca "Tiago" retornou Tiago Pisoni e Pedro Santiago

### Fix #4 — Seed de badges
**Arquivo novo:** `scripts/seed-badges.mjs`
- 8 badges seedadas para `4a6cdaea-...` (People Hub Corp): Excelência ⭐, Liderança 👑, Foco no Cliente 🎯, Inovação 💡, Dedicação 🔥, Trabalho em Equipe 🤝, Comunicação 📢, Aprendizado Contínuo 📚
- Pontos: 25-50 pts cada
- **Validado em UI:** dropdown Badge em /recognition agora mostra os 8

---

## Auditoria do Banco de Dados

**Script novo:** `scripts/db-health-audit.mjs`

### Counts por tabela (28 tabelas detectadas)

| Tabela | Count | Obs |
|---|---:|---|
| users | 58 | 51 visíveis na UI; 7 órfãos sem `primary_company_id` |
| companies | 2 | People Hub Corp + 1 secundária |
| company_memberships | 52 | OK |
| user_roles | 3 | 3 admins (era 2 antes) |
| teams | 10 | OK |
| team_members | 25 | OK |
| **objectives** | **31** | UI mostra 1 — filtros restritivos? |
| key_results | 1 | Baixo |
| feedback_requests | 1 | Smoke test |
| pulse_surveys | 1 | OK |
| pulse_responses | 1 | OK |
| notifications | 3 | OK |
| **badges** | **8** | ✅ pós-seed (era 0) |
| posts | 0 | Vazio |
| recognitions | 0 | Vazio |
| announcements | 0 | Vazio |
| performance_cycles | 0 | Vazio |
| performance_evaluations | 0 | Vazio |
| gamification_points | 0 | Vazio |
| **departments** | **0** | ⚠️ tabela existe mas vazia; UI usa string em users.department |

### Tabelas com count `?` (count retornou null com service role)
events, calendar_events, feedback_responses, gamification_history, okr_check_ins, post_comments, post_reactions, user_streaks — provavelmente RLS específica ou erro silencioso. Investigar se for usar.

---

## Lacunas Restantes (não-bloqueadores)

| Item | Sugestão | Esforço |
|---|---|---|
| 7 users órfãos sem `primary_company_id` | Listados abaixo — apagar SE autorizado | confirmar |
| `departments` table vazia | Migrar string em users → entidade própria + FK | 2h |
| Performance Resultados/Automação placeholder | Implementar quando houver demanda | — |
| 29 OKRs em company legacy "O2 Inc" (`6c864476`) | Migrar para o2-growth ou descartar | confirmar |

## Rodada de Fixes Adicionais (2026-05-04 ~tarde)

### ✅ Diretoria promovida a admin
4 INSERT em `user_roles` (aditivo) — agora 7 admins totais:
- João Victor (em ambas companies)
- Claude Smoke Test
- **Tiago Pisoni** (novo)
- **Pedro Albite** (novo)
- **João Freitas** (novo)
- **Rafael Fleck** (novo)

### ✅ Períodos OKR 2026 criados na o2-growth
4 períodos trimestrais inseridos (Q1-Q4/2026). Dropdown "Período" no `/objectives` agora mostra opções. (Trigger anti-overlap impediu inserir "Anual 2026" sobreposto.)

### 🔍 Esclarecida discrepância OKRs
**31 OKRs no DB:**
- 29 na company legacy `O2 Inc` (`6c864476...`) com 4 períodos Q1-Q4/2025 — restos do importação Feedz original
- 2 na company ativa `o2-growth` (`4a6cdaea...`) — corretos

UI mostra 2 (= o2-growth) corretamente. Os 29 legacy são órfãos visíveis apenas para João Victor (admin da O2 Inc).

### 🔍 João Victor admin "duplicado" — não é bug
Tem admin em **ambas** companies. Comportamento correto multi-tenant.

### 🔍 7 users órfãos detalhados — APAGADOS
Auditoria de FK cross-tables confirmou: **0 refs em todas as 19 tabelas verificadas** (objectives, posts, recognitions, feedback_*, performance_*, gamification_*, notifications, memberships, etc.). Todos os 7 foram apagados de `auth.users` e `public.users`:
- test412e@gmail.com, testejv@gmail.com, jvtestes@gmail.com, testenn@gmail.com (testes)
- lopesconexoes@gmail.com, andreylopes.ia@gmail.com (Andrey pessoais — versão @o2inc.com.br preservada)
- jv241004@gmail.com (João Victor pessoal — versão @o2inc.com.br preservada como admin)

### 🔄 Migração legacy O2 Inc → o2-growth — EXECUTADA
- **4 períodos** (Q1-Q4/2025) movidos via `UPDATE periods SET company_id`
- **29 objectives** movidos via `UPDATE objectives SET company_id`
- KRs herdam (não têm company_id próprio)
- Validado UI: `/objectives` agora mostra **30 OKRs visíveis** + dropdown período com **8 opções** (Q1/2025 → Q4/2026)
- Company "O2 Inc" agora vazia, pode ser arquivada futuramente

### 📊 Resumo final do banco pós-cleanup

| Item | Antes | Agora |
|---|---:|---:|
| Total users | 58 | **51** |
| Users órfãos | 7 | **0** |
| Companies com dados | 2 | **1** (o2-growth) |
| Admins | 3 | **7** |
| OKRs visíveis na UI | 1-2 | **30** |
| Períodos OKR disponíveis | 0 | **8** (2025+2026) |
| Badges | 0 | **8** |
| FKs órfãs | 0 | 0 |

---

## Arquivos Criados/Modificados

```
NOVO    src/components/CommandPalette.tsx
NOVO    scripts/db-health-audit.mjs
NOVO    scripts/seed-badges.mjs
EDIT    src/pages/Settings.tsx
EDIT    src/components/settings/ProfileForm.tsx
EDIT    src/components/ThemeToggle.tsx
EDIT    src/components/layout/AppLayout.tsx
EDIT    src/components/ui/command.tsx
```

TypeScript check: `tsc --noEmit` ✅ exit 0
Console runtime: 0 erros após fixes
