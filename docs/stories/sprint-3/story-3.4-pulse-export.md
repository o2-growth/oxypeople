# Story 3.4 — Export CSV/Excel das respostas Pulse

**Epic:** epic-03-pulse-survey
**Sprint:** 3
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Renata (RH) precisa baixar dados crus para análise externa. Story entrega botão "Exportar" na tela de analytics (3.3) que gera CSV (UTF-8 BOM) e Excel (.xlsx) das respostas filtradas. **Crítico:** export de pulse anônimo NÃO pode incluir `user_id`, `email` ou qualquer PII.

## Acceptance Criteria

### AC1 — Botão "Exportar" disponível
**Given** admin na tela `/admin/pulse-surveys/:id/analytics`
**Then** vê dropdown "Exportar" com opções "CSV (.csv)" e "Excel (.xlsx)"

### AC2 — CSV não-anônimo
**Given** `pulse_surveys.anonymous = false`
**When** clica "Exportar CSV"
**Then** baixa arquivo `pulse-{nome-slug}-{YYYY-MM-DD}.csv` com colunas:
- `period_start`
- `respondent_name`
- `respondent_email`
- `department`
- `team`
- `score`
- `emoji` (vazio se não aplicável)
- `comment`
- `created_at` (ISO)
**And** primeira linha = header em PT-BR ("Período", "Nome", "E-mail", "Departamento", "Time", "Nota", "Emoji", "Comentário", "Enviado em")
**And** encoding UTF-8 com BOM (Excel-friendly)
**And** delimiter `;` (padrão Excel BR)

### AC3 — CSV anônimo
**Given** `pulse_surveys.anonymous = true`
**When** clica exportar
**Then** colunas são apenas: `period_start`, `score`, `emoji`, `comment`, `created_at`
**And** **sem** nome/email/department/team mesmo se o admin tentar incluir
**And** se filtro resultar em < 5 respondentes únicos no período → toast de erro "Amostra muito pequena para preservar anonimato" e download é bloqueado

### AC4 — XLSX
**Given** clica "Excel"
**Then** mesmo conteúdo, formato `.xlsx` via biblioteca `xlsx` (SheetJS — adicionar dep)
**And** Sheet name = nome da pesquisa (truncado a 31 chars, regras Excel)

### AC5 — Filtros respeitados
**Given** admin aplicou filtros de departamento + intervalo de datas
**When** exporta
**Then** export inclui apenas as linhas que passariam pelo filtro

### AC6 — Performance / limite
**Given** export > 10.000 linhas
**Then** mostra modal "Esse export tem mais de 10k linhas; vai demorar ~30s. Continuar?"
**And** se confirma, loading state global até concluir

### AC7 — Audit log
**Given** export é gerado
**Then** insert em `audit_log` (se a tabela existir — caso contrário, registrar apenas via PostHog) com `{ action: 'pulse_export', pulse_id, format, row_count, anonymous }`
**And** PostHog `pulse_export_downloaded { pulse_id, format, row_count, anonymous }`

### AC8 — RLS
**Given** export usa o cliente autenticado do admin (via Supabase JS)
**Then** RLS já filtra automaticamente — sem chave de service role no cliente

## Technical Notes
- **Dependência:** adicionar `xlsx` (SheetJS) — `npm i xlsx`
- **Files novos:**
  - `src/lib/export/pulseExporter.ts` (funções `toCsv(rows, anonymous)` e `toXlsx(rows, anonymous, surveyName)`)
  - `src/components/admin/pulse/ExportPulseButton.tsx`
- **Files modificados:**
  - `src/pages/admin/PulseAnalytics.tsx` — adicionar `<ExportPulseButton />`
- **Padrões:** download via `Blob` + `URL.createObjectURL`; nome de arquivo com slug seguro
- **Anonimato:** o util `pulseExporter` recebe `anonymous: boolean` e nunca anexa colunas PII se true — escrever testes que falhem se essa garantia quebrar

## Test Plan
- **Unit:** `pulseExporter.toCsv` com `anonymous=true` — retorno NUNCA contém keys `respondent_name`/`respondent_email`/`department`/`team`
- **Unit:** CSV com BOM presente
- **Integration:** download CSV de pulse com 100 respostas; abre em Excel sem corrupção
- **Manual:** abrir XLSX em Numbers/Excel/Google Sheets

## Dependencies
- **Depends on:** Story 3.3 (mesma tela hospeda o botão)
- **Pode rodar em paralelo com:** Story 3.3 se cuidar do merge

## Definition of Done
- [ ] AC1-AC8 done
- [ ] Tests passing (incluindo teste defensivo de anonimato)
- [ ] Lint clean
- [ ] Evento PostHog disparando
- [ ] Smoke: export CSV de 1 pulse não-anônimo + 1 anônimo, validar colunas
