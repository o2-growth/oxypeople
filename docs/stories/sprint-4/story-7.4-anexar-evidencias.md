# Story 7.4 — Anexar evidências (upload)

**Epic:** epic-07-pdi
**Sprint:** 4
**Status:** Approved
**Estimate:** S
**Priority:** P0
**Owner:** unassigned (Dex)

## Context
Cada ação do PDI pode ter UMA evidência anexada (certificado, screenshot, PDF, vídeo curto). Storage usa o bucket `pdi-attachments` criado em `0008_pdi.sql` — bucket privado, pasta por user (`{user_id}/...`). Acesso a downloads via signed URLs (NUNCA URL pública).

**Pre-condition:** Story 7.3 entregue. Migration `0008_pdi.sql` aplicada — bucket `pdi-attachments` existe com 3 policies (INSERT/SELECT/DELETE) restritas a `(storage.foldername(name))[1] = auth.uid()::text`.

## Acceptance Criteria

### AC1 — Botão "Anexar evidência" em ActionCard
**Given** usuário (owner do PDI) na ação
**Then** vê botão "Anexar evidência" se `evidence_url IS NULL`
**And** se já tem evidência, mostra preview/link "Ver evidência" + botão "Substituir"

### AC2 — Upload com validações
**Given** usuário seleciona arquivo
**When** upload dispara
**Then** valida client-side: tamanho ≤ 10 MB, tipo em [pdf, png, jpg, jpeg, mp4 (≤ 30s), docx, pptx]
**And** validação de tamanho **também** server-side (configurar bucket ou check antes do upload)
**And** se inválido, toast "Arquivo muito grande (max 10MB)" ou "Tipo não suportado"

### AC3 — Path correto no bucket
**Given** upload válido
**When** chama `supabase.storage.from('pdi-attachments').upload(path, file)`
**Then** `path = ${auth.uid()}/${pdi_plan_id}/${action_id}/${uuid}-${filename}`
**And** primeiro segmento é `auth.uid()::text` — RESPEITA policy do bucket
**And** após upload, UPDATE `pdi_actions.evidence_url = path`
**And** evento PostHog `pdi_evidence_uploaded` com `{file_type, file_size_kb}`

### AC4 — Visualizar evidência (signed URL)
**Given** ação com evidência
**When** usuário (com permissão) clica "Ver evidência"
**Then** chama `supabase.storage.from('pdi-attachments').createSignedUrl(path, 60)` (válido 60s)
**And** abre em nova aba

### AC5 — Acesso à signed URL respeita papel
**Given** Camila (owner) tem ação com evidência
**Then** Camila gera signed URL → SUCESSO (path começa com seu user_id)
**Given** Bruno (gestor) tenta visualizar
**Then** ⚠️ **PROBLEMA**: bucket policy SELECT atual restringe a `(storage.foldername(name))[1] = auth.uid()::text` — Bruno seria BLOQUEADO. Solução nesta story:
  - Acesso de leitura para gestor/admin via **edge function** `pdi-evidence-signed-url` que valida (via DB) se o requisitor é owner OU manager OR admin do PDI, e usa service role para gerar signed URL
  - UI chama essa edge function em vez de `createSignedUrl` direto quando user ≠ owner

### AC6 — Substituir evidência
**Given** ação com `evidence_url` existente
**When** usuário (owner) clica "Substituir" e faz novo upload
**Then** novo arquivo upado → UPDATE `evidence_url`
**And** arquivo antigo deletado do bucket (`storage.remove`)

### AC7 — Deletar evidência
**Given** ação com evidência
**When** owner clica "Remover evidência"
**Then** confirmação + DELETE no bucket + UPDATE `evidence_url = NULL`

### AC8 — Listar todas as evidências do PDI
**Given** PDI detalhe
**Then** seção "Evidências" lista todos os `evidence_url IS NOT NULL` com ação associada — útil para revisão final

## Technical Notes
- **Migration:** `0008_pdi.sql` — bucket `pdi-attachments` (private), policies por folder. Coluna `pdi_actions.evidence_url`
- **Bucket name (LITERAL):** `pdi-attachments`
- **Files novos:**
  - `src/components/pdi/EvidenceUpload.tsx`
  - `src/components/pdi/EvidencePreview.tsx`
  - `src/hooks/usePDIEvidence.ts`
  - `supabase/functions/pdi-evidence-signed-url/index.ts` (edge function para gestor/admin)
- **Files modificados:**
  - `src/components/pdi/ActionCard.tsx` (slot de evidência)
  - `src/pages/PDIDetail.tsx` (seção lista de evidências)
- **Padrões:** seguir estrutura de `supabase/functions/okr-escalation/index.ts` para edge function

### Storage Bucket Policy Notes (CRÍTICO)
- Bucket: `pdi-attachments` (privado, definido em `0008_pdi.sql`)
- Policies INSERT/SELECT/DELETE no bucket atualmente: **APENAS o owner do path** (`(storage.foldername(name))[1] = auth.uid()::text`)
- **Quem pode escrever:** apenas o usuário cujo UUID é o primeiro segmento do path. Para o caso "gestor anexa evidência ao PDI do liderado" — gestor NÃO pode escrever direto (path teria user_id do liderado). MVP: apenas owner anexa. Se gestor precisar, usar edge function com service role + validação `is_user_manager`
- **Quem pode ler:**
  - Owner: lê direto
  - Gestor / admin: precisa edge function `pdi-evidence-signed-url` que (1) valida via DB se requisitor é gestor/admin do owner do PDI, (2) usa `SUPABASE_SERVICE_ROLE_KEY` para gerar signed URL, (3) retorna URL para o cliente
- **Quem pode deletar:** apenas owner (mesma policy do bucket)
- ⚠️ NUNCA tornar o bucket público (`public: false` deve permanecer)
- ⚠️ Validar tamanho client + server (configurar bucket file_size_limit no Supabase dashboard ou via SQL: `UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'pdi-attachments';` — adicionar a migration aditiva se necessário)

## Test Plan
- **Manual:** Camila anexa PDF, vê preview, gestor Bruno acessa via edge function
- **Validation:** upload de 11MB → bloqueado client + server
- **RLS:** user X tenta `createSignedUrl` para path do Camila → ERRO
- **RLS:** user X chama edge function → edge valida is_manager → bloqueado
- **Manual:** substituir evidência → arquivo antigo é deletado do storage

## Dependencies
- Story 7.3 (existe ação para anexar)
- Bucket `pdi-attachments` criado via migration `0008`
- Bloqueia: nenhuma

## Definition of Done
- [ ] AC1-AC8 done
- [ ] Edge function `pdi-evidence-signed-url` deployada
- [ ] Upload funciona em browsers principais (Chrome/Safari/Edge)
- [ ] Tamanho validado client + server (bucket limit)
- [ ] Evento `pdi_evidence_uploaded` PostHog
- [ ] PR reviewed
- [ ] Storage testado para upload e signed URL (DoD do epic)
