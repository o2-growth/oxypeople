

## Mover toda a aba Pessoas para o RH

A pagina "Pessoas" (/people) sera eliminada e todo o seu conteudo sera absorvido pela pagina "RH" (/hr), que passa a ser o ponto unico de gestao de colaboradores.

---

### O que a pagina Pessoas tem que o RH ainda nao tem

| Funcionalidade | Pessoas | RH |
|---|---|---|
| Colaboradores (tabela + cards + filtros com aniversario) | Sim (completo, com view cards/table, filtro aniversario, acoes admin) | Sim (versao simplificada, so tabela, sem cards, sem aniversario) |
| Organograma | Sim | Nao |
| Feedback 30 Dias (admin) | Sim | Nao |
| NPS (admin) | Sim | Nao |
| Botao Convidar Pessoa (admin) | Sim | Nao |
| Stats cards (total, ativos, novos, departamentos) | Sim (inline) | Sim (HRStats - similar) |

---

### Plano de execucao

**1. Adicionar novas abas ao RH (`src/pages/HR.tsx`)**

Incluir as abas que so existem em Pessoas:
- **Organograma** - importar `OrganizationChart` de `src/components/people/OrganizationChart`
- **Feedback 30 Dias** (admin only) - importar `FeedbackTab` de `src/components/people/FeedbackTab`
- **NPS** (admin only) - importar `NPSTab` de `src/components/people/NPSTab`

Adicionar botao "Convidar Pessoa" no header (admin only), com `InviteModal`.

Substituir a aba "Colaboradores" do HR pela versao completa da pagina Pessoas (com toggle table/cards, filtro de aniversario, acoes de ativar/desativar).

**2. Remover a pagina Pessoas**

- Deletar `src/pages/People.tsx`
- Remover rota `/people` de `src/App.tsx`
- Remover import de People do `App.tsx`

**3. Atualizar referencias a `/people`**

Todos os links que apontam para `/people` serao redirecionados para `/hr`:

| Arquivo | Mudanca |
|---|---|
| `src/components/layout/AppSidebar.tsx` | Remover item "Pessoas" do `mainNavItems` |
| `src/components/dashboard/ShortcutCards.tsx` | Trocar `/people` por `/hr` |
| `src/components/dashboard/QuickActions.tsx` | Trocar `/people` por `/hr` |
| `src/components/dashboard/CollaboratorsDetailDialog.tsx` | Trocar `/people` por `/hr` |
| `src/pages/Surveys.tsx` | Trocar `/people` por `/hr` |

**4. Nenhum arquivo de componente sera deletado**

Os componentes em `src/components/people/` continuam existindo, apenas passam a ser importados pelo HR ao inves de People. Os componentes de HR existentes (`HRCollaboratorsTab`, `HRCollaboratorsFilters`) ficam obsoletos pois a versao completa de Pessoas os substitui, mas podem ser mantidos por ora.

---

### Estrutura final das abas do RH

```text
RH
+-- Visao Geral (stats + Pipefy sync)
+-- Colaboradores (versao completa: tabela/cards, filtros, aniversarios, acoes admin)
+-- Organograma (novo)
+-- Feedback 30 Dias (novo, admin only)
+-- NPS (novo, admin only)
+-- Turnover (existente)
+-- Calendario (existente)
+-- Relatorios (existente)
```

---

### Resumo de alteracoes

| Acao | Arquivo |
|---|---|
| Reescrever | `src/pages/HR.tsx` (absorver toda logica de People + novas abas) |
| Deletar | `src/pages/People.tsx` |
| Editar | `src/App.tsx` (remover rota /people) |
| Editar | `src/components/layout/AppSidebar.tsx` (remover "Pessoas" do menu) |
| Editar | `src/components/dashboard/ShortcutCards.tsx` (link /hr) |
| Editar | `src/components/dashboard/QuickActions.tsx` (link /hr) |
| Editar | `src/components/dashboard/CollaboratorsDetailDialog.tsx` (link /hr) |
| Editar | `src/pages/Surveys.tsx` (link /hr) |

Nenhuma alteracao no banco de dados.

