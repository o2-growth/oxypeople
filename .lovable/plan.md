

## Pesquisas: 2 tipos - e-NPS e GPTW

Reestruturar a pagina de Pesquisas para suportar dois tipos distintos de pesquisa, eliminando os dados mock e organizando tudo com dados reais do banco.

---

### Estrutura da pagina

A pagina tera duas abas principais no topo: **e-NPS** e **GPTW**. Cada aba contem a criacao (admin), pesquisas pendentes (todos) e historico.

```text
Pesquisas
+-- [e-NPS]  [GPTW]
|
|  Aba e-NPS (ja existe, limpar mocks):
|    - Card de criacao (admin)
|    - Pesquisas pendentes para responder
|    - Historico de pesquisas criadas (admin) / minhas respostas (user)
|
|  Aba GPTW (nova):
|    - Card de criacao (admin) - configurar segmentacao e data
|    - Pesquisas pendentes para responder (questionario completo)
|    - Historico com metricas por dimensao (admin)
```

---

### Banco de dados - 2 novas tabelas

**Tabela `gptw_surveys`**
- id, company_id, created_by
- target_departments, target_teams, target_users, target_all
- end_date, status (draft/active/completed)
- created_at, updated_at
- RLS: admins gerenciam, members veem surveys ativos

**Tabela `gptw_responses`**
- id, survey_id, user_id
- answers (JSONB) - contem todas as 29 respostas Likert como `{"q1": 5, "q2": 3, ...}` onde 1=Discordo totalmente, 5=Concordo totalmente
- enps_score (integer 0-10) - pergunta eNPS separada
- comment (text, opcional)
- created_at
- RLS: admins veem todas, users veem as proprias, users podem inserir

---

### Questionario GPTW - perguntas fixas no frontend

As 30 perguntas sao constantes definidas no codigo (padrao Trust Index). Nao ficam no banco pois sao fixas:

**Categorias e perguntas:**
1. **Certificacao** (1 pergunta-chave)
2. **Credibilidade** (4 perguntas)
3. **Respeito** (4 perguntas)
4. **Imparcialidade** (7 perguntas)
5. **Orgulho** (5 perguntas)
6. **Camaradagem** (5 perguntas)
7. **Adicionais** (3 perguntas - nao entram na nota)
8. **eNPS** (1 pergunta 0-10)

Escala Likert: Discordo totalmente (1) / Discordo parcialmente (2) / Nem concordo nem discordo (3) / Concordo parcialmente (4) / Concordo totalmente (5)

Favoraveis = respostas 4 e 5.

---

### Arquivos novos

| Arquivo | Descricao |
|---|---|
| `src/hooks/useGPTWSurveys.ts` | Hook com queries e mutations para gptw_surveys e gptw_responses, calculo de metricas por dimensao |
| `src/components/surveys/CreateGPTWSurveyCard.tsx` | Formulario de criacao (admin) - segmentacao + data, similar ao CreateNPSSurveyCard |
| `src/components/surveys/GPTWSurveyCard.tsx` | Card de pesquisa GPTW com status e metricas por dimensao |
| `src/components/surveys/GPTWResponseDialog.tsx` | Dialog com questionario completo em etapas (wizard): cada categoria e uma etapa, navegacao prev/next, barra de progresso |
| `src/components/surveys/GPTWQuestions.ts` | Constantes com todas as perguntas organizadas por categoria |
| `src/components/surveys/LikertScale.tsx` | Componente reutilizavel de escala Likert (5 opcoes com radio buttons) |

### Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| `src/pages/Surveys.tsx` | Reescrever: remover todos os mocks (mockSurveys, stats hardcoded), adicionar Tabs e-NPS / GPTW, integrar novos componentes |
| `src/components/surveys/SurveyCard.tsx` | Pode ser removido (era usado apenas pelos mocks) |

---

### Metricas GPTW (admin)

O calculo por dimensao:
- **Indice de favorabilidade** = (respostas 4 + 5) / total de respostas * 100
- Calculado por categoria (Credibilidade, Respeito, etc.)
- **Score geral** = media dos indices de todas as 5 dimensoes (sem adicionais)
- **eNPS** separado com a mesma logica que ja existe (promotores - detratores)

---

### Dialog de resposta GPTW (wizard)

O respondente vera um wizard com 8 etapas:
1. Instrucoes + pergunta de certificacao
2. Credibilidade (4 perguntas)
3. Respeito (4 perguntas)
4. Imparcialidade (7 perguntas)
5. Orgulho (5 perguntas)
6. Camaradagem (5 perguntas)
7. Adicionais (3 perguntas)
8. eNPS (escala 0-10) + comentario opcional

Barra de progresso no topo. Botoes "Anterior" e "Proximo". Na ultima etapa, botao "Enviar".

---

### Resumo tecnico

- 2 migrations SQL (gptw_surveys + gptw_responses com RLS)
- 6 arquivos novos no frontend
- 1 arquivo reescrito (Surveys.tsx)
- 1 arquivo removido (SurveyCard.tsx - mocks)
- Nenhuma edge function necessaria

