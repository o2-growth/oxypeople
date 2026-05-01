# Story 6.5 — Download de arquivo .ics

**Epic:** epic-06-one-on-ones
**Sprint:** 4
**Status:** Approved
**Estimate:** S
**Priority:** P1
**Owner:** unassigned (Dex)

## Context
Decidimos NÃO integrar com Google/Outlook OAuth (ADR-005). Em vez disso, geramos um arquivo `.ics` (RFC 5545) que o usuário baixa e importa em qualquer cliente de calendário (Google, Outlook, Apple).

**Pre-condition:** Story 6.1 entregue.

## Acceptance Criteria

### AC1 — Botão "Baixar .ics" na 1:1
**Given** usuário (parte) na página de detalhe de uma 1:1
**Then** vê botão "Baixar .ics" no header
**And** mesmo botão na lista de "Próximas" para download rápido

### AC2 — Conteúdo .ics correto
**Given** usuário clica
**When** download dispara
**Then** arquivo `1on1-{leader_name}-{member_name}-{YYYYMMDD}.ics` baixa
**And** conteúdo conforme RFC 5545:
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OxyPeople//1on1//PT-BR
BEGIN:VEVENT
UID:{one_on_one.id}@oxypeople
DTSTAMP:{now em UTC}
DTSTART;TZID=America/Sao_Paulo:{scheduled_at em local time}
DTEND;TZID=America/Sao_Paulo:{scheduled_at + duration_minutes}
SUMMARY:1:1 — {leader_name} & {member_name}
LOCATION:{location ou "A definir"}
DESCRIPTION:Reunião 1:1 agendada via OxyPeople. Acesse: {URL detalhe}
ORGANIZER;CN={leader_name}:mailto:{leader_email}
ATTENDEE;CN={member_name};RSVP=TRUE:mailto:{member_email}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

### AC3 — Timezone correto
**Given** 1:1 agendada para 2026-05-10 14:00 horário de São Paulo
**Then** .ics usa `TZID=America/Sao_Paulo` (NÃO offset UTC fixo)
**And** importado em Google Calendar mostra "14:00 BRT" não 17:00

### AC4 — Recorrência reflete RRULE
**Given** 1:1 com `recurrence='weekly'`
**Then** .ics inclui `RRULE:FREQ=WEEKLY;BYDAY=...` baseado no dia da semana de `scheduled_at`
**And** `recurrence='biweekly'` → `FREQ=WEEKLY;INTERVAL=2`
**And** `recurrence='monthly'` → `FREQ=MONTHLY`
**And** `recurrence='none'` → sem RRULE

### AC5 — Geração 100% client-side
**Given** download
**Then** geração do .ics acontece no browser (Blob + download anchor) — SEM edge function
**And** evento PostHog `one_on_one_ics_downloaded`

### AC6 — Compatibilidade testada
**Given** .ics gerado
**When** importado em:
- Google Calendar
- Outlook (web)
- Apple Calendar
**Then** evento aparece na hora correta com título, descrição e local (manual QA)

## Technical Notes
- **Migration:** nenhuma
- **Files novos:**
  - `src/lib/ics.ts` (gerador puro: `buildIcs(meeting, leader, member): string`)
  - `src/components/one-on-ones/DownloadIcsButton.tsx`
- **Files modificados:**
  - `src/pages/OneOnOneDetail.tsx`
  - `src/components/one-on-ones/OneOnOneList.tsx`
- **Padrões:**
  - Usar `Intl.DateTimeFormat` para conversão; NÃO depender de lib pesada
  - Linhas .ics terminam em CRLF (`\r\n`) — RFC obriga
  - `UID` único por linha de `one_on_ones` (id é UUID, suficiente)
  - Encode caracteres especiais em SUMMARY/DESCRIPTION (escape `\,`, `\;`, `\n`)

### RLS Privacy Notes
- O hook que busca a 1:1 já é RLS-protected — só consegue gerar .ics de 1:1 que vê
- Não incluir notas no .ics (PRIVADO)
- Email da contraparte só aparece no .ics se UI tem permissão para ver email — verificar tabela `users`

## Test Plan
- **Manual:** baixar .ics e importar nos 3 clientes
- **Unit:** `buildIcs()` com casos: sem recorrência, weekly, biweekly, monthly
- **Unit:** escape de caracteres especiais em SUMMARY (vírgula, ponto e vírgula, quebra de linha)
- **Manual:** verificar timezone com user em outro fuso (override system tz)

## Dependencies
- Story 6.1
- Bloqueia: nenhuma — paralela com 6.6 e 6.7

## Definition of Done
- [ ] AC1-AC6 done
- [ ] Testado em Google + Outlook + Apple Calendar
- [ ] Unit tests do `buildIcs`
- [ ] Evento `one_on_one_ics_downloaded` PostHog
- [ ] PR reviewed
