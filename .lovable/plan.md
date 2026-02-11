

## Indicadores Clicaveis no Dashboard

Cada um dos 4 cards de indicadores (Total de Colaboradores, Reconhecimentos, Objetivos Concluidos, Engajamento) se tornara clicavel e abrira um modal/dialog com informacoes detalhadas.

---

### Conteudo de cada Modal

**1. Total de Colaboradores**
- Lista dos colaboradores ativos com avatar, nome e cargo
- Mini-stats: total ativos, novos este mes, por departamento (top 5)
- Barra de distribuicao por departamento (Progress bars)
- Botao "Ver todos" que navega para `/people`

**2. Reconhecimentos**
- Resumo: total do mes, comparacao com mes anterior
- Top 5 mais reconhecidos do mes (avatar + nome + contagem)
- Top 5 badges mais utilizados (emoji + nome + contagem)
- Ultimos 5 reconhecimentos recentes (remetente, destinatario, badge)
- Botao "Ver todos" que navega para `/recognition`

**3. Objetivos Concluidos**
- Resumo: taxa de conclusao, total de objetivos ativos vs concluidos
- Distribuicao por status (on_track, attention, risk, completed) com barras coloridas
- Top 5 objetivos concluidos recentemente (titulo + responsavel + data)
- Objetivos em risco (top 3, se houver)
- Botao "Ver todos" que navega para `/objectives`

**4. Engajamento**
- Resumo: taxa atual, posts este mes, reconhecimentos este mes
- Grafico de barras simples com engajamento por semana (ultimas 4 semanas)
- Top 5 usuarios mais engajados (posts + reconhecimentos + comentarios)
- Botao "Ver detalhes" que navega para `/feed`

---

### Implementacao Tecnica

**Arquivos novos:**
- `src/components/dashboard/CollaboratorsDetailDialog.tsx` - Modal de colaboradores
- `src/components/dashboard/RecognitionsDetailDialog.tsx` - Modal de reconhecimentos
- `src/components/dashboard/ObjectivesDetailDialog.tsx` - Modal de objetivos
- `src/components/dashboard/EngagementDetailDialog.tsx` - Modal de engajamento
- `src/hooks/useDashboardDetails.ts` - Hook com queries detalhadas para cada modal (colaboradores por departamento, top reconhecidos, objetivos por status, engajamento semanal)

**Arquivos modificados:**
- `src/components/dashboard/StatCard.tsx` - Adicionar prop `onClick` e estilo `cursor-pointer` com hover effect
- `src/pages/Index.tsx` - Adicionar estado para controlar qual modal esta aberto e passar `onClick` para cada StatCard

**Dados do banco:** Todas as queries utilizarao tabelas existentes (`company_memberships`, `recognitions`, `objectives`, `posts`, `comments`, `users`) filtradas por `company_id`. Nao sera necessario criar tabelas novas.

**Componente base:** Todos os modals usarao o `Dialog` do shadcn/ui ja instalado, com `ScrollArea` para listas longas.

