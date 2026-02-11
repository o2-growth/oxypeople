

## Mural Corporativo - Redesign Completo

Transformar a pagina atual do Mural (Feed) em um painel de informativos da empresa, centralizado em eventos, comunicados, reconhecimentos e calendario. Layout visual rico com secoes bem definidas.

---

### Estrutura Visual da Pagina

```text
+---------------------------------------------------------------+
|  Mural da Empresa                              [+ Novo Evento] |
+---------------------------------------------------------------+
|                                                                 |
|  [Proximos Eventos]  cards horizontais com scroll               |
|  | 15 Fev - Monthly | 20 Fev - Happy Hour | 28 Fev - Town... | |
|                                                                 |
+---------------------------------------------------------------+
|                                                                 |
|  Col Esquerda (2/3)              |  Col Direita (1/3)           |
|  +-----------------------------+ |  +------------------------+  |
|  | Avisos Fixados (pinned)     | |  | Mini Calendario        |  |
|  | - Aviso urgente...          | |  | Fev 2026               |  |
|  | - Comunicado importante...  | |  | [dias com eventos      |  |
|  +-----------------------------+ |  |  destacados]            |  |
|  +-----------------------------+ |  +------------------------+  |
|  | Feed de Atividades          | |  +------------------------+  |
|  | (posts + reconhecimentos    | |  | Aniversariantes do Mes |  |
|  |  + celebracoes misturados)  | |  | - Joao (15/02)         |  |
|  | [Criar Post inline]         | |  | - Maria (22/02)        |  |
|  | [Post 1...]                 | |  +------------------------+  |
|  | [Post 2...]                 | |  +------------------------+  |
|  | [Reconhecimento...]         | |  | Destaques do Mes       |  |
|  +-----------------------------+ |  | Top 3 reconhecidos     |  |
|                                  |  +------------------------+  |
+---------------------------------------------------------------+
```

---

### Nova Tabela: `company_events`

Para armazenar eventos da empresa (monthly, happy hour, town hall, treinamentos, etc.):

- `id` UUID PK
- `company_id` UUID FK
- `created_by` UUID (autor)
- `title` TEXT
- `description` TEXT
- `event_date` TIMESTAMPTZ (data/hora do evento)
- `end_date` TIMESTAMPTZ (opcional, fim do evento)
- `location` TEXT (local ou link de reuniao)
- `event_type` TEXT (monthly, happy_hour, training, town_hall, celebration, other)
- `color` TEXT (cor do card/indicador no calendario)
- `is_recurring` BOOLEAN default false
- `metadata` JSONB (dados extras)
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

RLS: membros da empresa podem ver; admins podem criar/editar/excluir.

---

### Componentes da Pagina

**1. Carrossel de Proximos Eventos** (topo)
- Cards horizontais com scroll dos proximos eventos (da tabela `company_events`)
- Cada card mostra: data, titulo, tipo (badge colorido), local
- Clique abre detalhes em dialog

**2. Avisos Fixados**
- Busca da tabela `announcements` onde `is_pinned = true`
- Cards compactos com tipo, titulo e preview do conteudo
- Maximo de 3 exibidos, com "ver mais" para pagina de automacao

**3. Feed de Atividades** (coluna principal)
- Mantem o CreatePost existente no topo
- Lista os posts, reconhecimentos e celebracoes em ordem cronologica (como ja funciona)
- Remove o layout masonry, volta a lista vertical na coluna principal

**4. Mini Calendario** (sidebar direita)
- Calendario visual do mes atual (usa `react-day-picker` ja instalado)
- Dias com eventos marcados com pontos coloridos
- Dados: combina `company_events` + aniversarios do `useHRCalendar`
- Clique no dia mostra lista dos eventos daquele dia

**5. Aniversariantes do Mes** (sidebar direita)
- Lista de colaboradores que fazem aniversario no mes atual
- Avatar, nome e data
- Dados: reutiliza logica do `useHRCalendar` filtrado por `birthday`

**6. Destaques do Mes** (sidebar direita)
- Top 3 reconhecidos (reutiliza `useTopRecognized`)
- Em Alta / trending topics (reutiliza `useTrendingTopics`)

**7. Dialog "Criar Evento"**
- Formulario com: titulo, descricao, data/hora, local, tipo, cor
- Visivel apenas para admins/managers
- Salva na tabela `company_events`

---

### Arquivos Novos

| Arquivo | Descricao |
|---------|-----------|
| `src/components/mural/UpcomingEventsCarousel.tsx` | Carrossel horizontal de proximos eventos |
| `src/components/mural/PinnedAnnouncements.tsx` | Secao de avisos fixados |
| `src/components/mural/MiniCalendar.tsx` | Calendario lateral com indicadores de eventos |
| `src/components/mural/BirthdaysList.tsx` | Lista de aniversariantes do mes |
| `src/components/mural/MonthHighlights.tsx` | Destaques: top reconhecidos + trending |
| `src/components/mural/CreateEventDialog.tsx` | Dialog para criar novo evento |
| `src/components/mural/EventDetailDialog.tsx` | Dialog de detalhes do evento |
| `src/hooks/useCompanyEvents.ts` | Hook CRUD para a tabela `company_events` |

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Feed.tsx` | Reescrever completamente com o novo layout de Mural |
| `src/components/layout/AppSidebar.tsx` | Ja esta como "Mural" (manter) |

### Dependencias

Nenhuma nova. Usa `react-day-picker` (ja instalado), `date-fns`, `lucide-react` e componentes shadcn/ui existentes.

---

### Sequencia de Implementacao

1. Criar tabela `company_events` com RLS (migracao SQL)
2. Criar hook `useCompanyEvents` (CRUD)
3. Criar componentes do mural (carrossel, calendario, aniversarios, avisos, eventos)
4. Criar dialogs (criar evento, detalhes do evento)
5. Reescrever `Feed.tsx` montando o layout completo
6. Ajustar permissoes (botao de criar evento so para admins)

