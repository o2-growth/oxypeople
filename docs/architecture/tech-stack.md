# Tech Stack — oxypeople

> Single source of truth para stack do projeto. Ao adicionar dependência, atualize aqui e justifique no `architecture-review.md` (decision log).

## Frontend

| Camada | Tech | Versão | Notas |
|---|---|---|---|
| Build | Vite | 5.x | dev server + bundler |
| Linguagem | TypeScript | 5.x | strict mode |
| Framework | React | 18 | hooks-only, sem class components |
| UI primitives | Radix UI + shadcn/ui | latest | manter shadcn em `src/components/ui/`, não modificar |
| Styling | Tailwind CSS | 3.x | + tailwind-merge |
| Routing | React Router | v6 | `<ProtectedRoute>` para guards |
| Forms | react-hook-form | latest | sempre com Zod resolver |
| Validation | Zod | latest | schema por formulário, types inferidos |
| State (data) | @tanstack/react-query | v5 | source of truth para data; sem Redux |
| State (auth) | React Context | nativo | `AuthContext` único |
| Drag & drop | @dnd-kit | latest | usado em Kanban e Org chart drag |
| Charts | Recharts | latest | line, bar, pie, area, **radar** (PDI) |
| Datas | date-fns + ptBR locale | latest | tudo localizado para PT-BR |
| Toasts | sonner | latest | + shadcn toast |
| Carousels | embla-carousel | latest | usado em events e dashboard |
| Theme | next-themes | latest | dark/light |

### Adições do MVP

| Tech | Versão alvo | Razão | Story |
|---|---|---|---|
| **reactflow** | 11.x | Organograma 2.0 com zoom/pan/drag/export | 2.2 |
| **react-pdf/renderer** | 3.x | Export PDF (org, nine box, relatórios) | 2.5, 4.5 |
| **@sentry/react** + `@sentry/vite-plugin` | latest | Error tracking | 0.3 |
| **posthog-js** | latest | Product analytics | 0.4 |

### Removidos no MVP

| Tech | Razão | Story |
|---|---|---|
| `@lovable.dev/cloud-auth-js` | Dead code (ADR-006) | 0.2 |

## Backend

| Camada | Tech | Notas |
|---|---|---|
| BaaS | Supabase | Postgres + Auth + Realtime + Edge Functions + Storage |
| DB | PostgreSQL 15+ | RLS habilitado em 100% das tabelas |
| Auth | Supabase Auth | email/password (OAuth Google é P2) |
| Realtime | Supabase Realtime | opt-in via `ALTER PUBLICATION` |
| Edge Functions | Deno | service role para tarefas admin |
| Storage | Supabase Storage | buckets: `checkin-attachments`, `post-attachments`, `pdi-attachments` (novo) |
| Cron | `pg_cron` | requer Supabase Pro+ (Plano A); Plano B: GitHub Actions |
| HTTP from DB | `pg_net` | usado por cron jobs para chamar edge functions |

## Observability

| Camada | Tech |
|---|---|
| Frontend errors | Sentry (free tier) |
| Product analytics | PostHog Cloud (free tier) |
| Backend logs | Supabase Logs (nativo) |

## Hosting / Deploy

| Camada | Tech | Notas |
|---|---|---|
| Frontend | Lovable | hosting + CI/CD automático no push |
| Backend | Supabase managed | gerenciado |
| Repo | GitHub | branch `main` é deploy |

## Integrações Externas

| Serviço | Como | Story de origem |
|---|---|---|
| Pipefy | Edge function `pipefy-sync` (já existe) | — |
| Slack | Edge function `send-slack-message` (já existe) | — |
| Google Calendar | ICS download (sem OAuth no MVP) | 6.5 |

## Convenções de versão

- **Pin minor versions** para dependências core (React, Supabase, Vite)
- **Floating patch** (`^x.y.z`) para shadcn/Radix (atualizações frequentes não-breaking)
- **Lockfile**: `bun.lockb` (commit obrigatório)

## Como adicionar uma nova dependência

1. Adicionar `architecture-review.md` decision log entry (ADR)
2. Atualizar este arquivo (`tech-stack.md`)
3. Justificar bundle impact se >50KB minified
4. Considerar lazy loading se for usado em rotas específicas
