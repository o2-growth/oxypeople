# Migrations Draft — oxypeople MVP

> **⚠️ ATENÇÃO**: Estes arquivos são **RASCUNHOS** para revisão.
> **NÃO** estão na pasta `supabase/migrations/` por design — para evitar aplicação acidental.
> Para aplicar:
> 1. Ler cada arquivo, confirmar o conteúdo
> 2. Validar com o usuário (REGRA GLOBAL — nunca migrations destrutivas sem aprovação)
> 3. Renomear com timestamp atual (`YYYYMMDDHHMMSS_<nome>.sql`)
> 4. Mover para `supabase/migrations/`
> 5. Rodar `supabase db push` em ambiente de staging primeiro

---

## Ordem de aplicação (sequencial — cada uma depende das anteriores)

| # | Arquivo | Tópico | Risco |
|---|---|---|---|
| 0001 | `0001_fix_fragilities.sql` | RLS fixes + DELETE policies + helper `is_user_manager` + índices faltantes | 🟢 Baixo |
| 0002 | `0002_add_manager_id.sql` | `company_memberships.manager_id` + função `get_org_subtree` | 🟡 Médio (impacta UI) |
| 0003 | `0003_okr_hardening.sql` | `objective_comments` + `key_results.confidence` + `objectives.commitment_type` | 🟢 Baixo |
| 0004 | `0004_pulse_survey.sql` | `pulse_surveys` + `pulse_responses` | 🟢 Baixo |
| 0005 | `0005_nine_box.sql` | `nine_box_snapshots` + `nine_box_placements` | 🟢 Baixo |
| 0006 | `0006_feedback_continuo.sql` | `feedback_requests` + notification trigger | 🟢 Baixo |
| 0007 | `0007_one_on_ones.sql` | `one_on_ones` + `topics` + `notes` (com visibility) | 🟡 Médio (RLS sensível) |
| 0008 | `0008_pdi.sql` | `pdi_plans` + `competencies` + `actions` + storage bucket | 🟢 Baixo |
| 0009 | `0009_pg_cron_jobs.sql` | Agendamento de edge functions (requer Supabase Pro) | 🟡 Médio (requer plano) |

## Regra global aplicada

✅ **Tudo aditivo**: apenas `CREATE`, `ALTER ADD`, `INSERT ... ON CONFLICT DO NOTHING`
❌ **Zero `DELETE`/`UPDATE`/`DROP`/`TRUNCATE`** em dados existentes
✅ **Idempotência**: `IF NOT EXISTS`, `DROP POLICY IF EXISTS` antes de recriar

## Convenções seguidas (extraídas do código existente)

- Nome de tabela: `snake_case`, plural
- PK: `id uuid DEFAULT gen_random_uuid()`
- Tenant: `company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE`
- Auditoria: `created_at`, `updated_at` com trigger `update_updated_at()`
- Soft delete: `deleted_at timestamptz` + index parcial
- Helpers de RLS: `is_company_member(uid, comp_id)`, `is_company_admin(uid, comp_id)`, `is_team_leader(uid, team_id)`
- Realtime: opt-in via `ALTER PUBLICATION supabase_realtime ADD TABLE`
- Índices: sempre em FKs + colunas filtradas com frequência
