
# Gestao de Objetivos Avancada para Admin

## Visao Geral

Implementar uma interface avancada de gestao de objetivos (OKRs) com filtros robustos, visualizacao por departamento, estatisticas dinamicas e exportacao de dados, baseado na referencia visual fornecida.

---

## Funcionalidades Principais

### 1. Barra de Filtros Superior
- **Departamentos**: Select multi-opcao para filtrar por departamento (usando `teams.department`)
- **Responsaveis**: Select para filtrar por dono/responsavel do objetivo
- **Periodo**: Seletor de periodo predefinido (Q1, Q2, Q3, Q4 do ano atual, ou custom)
- **Botao "Mais Filtros"**: Abre popover com filtros adicionais:
  - Status (Ativos, Concluidos, Todos)
  - Porcentagem (0-25%, 25-50%, 50-75%, 75-100%)
  - Privacidade (Todos, Empresa, Privado)
  - Status de Check-in (Em dia, Atrasado, Todos)
- **Botao "Filtrar"**: Aplica os filtros selecionados
- **Limpar filtros**: Remove todos os filtros aplicados
- **Badges de filtros ativos**: Exibe os filtros aplicados com opcao de remover individualmente

### 2. Acoes do Cabecalho
- **Botao de Lista/Arvore**: Alterna entre visualizacao em grid e agrupada por departamento
- **Botao de Organograma**: Visualizacao hierarquica
- **Menu de Exportacao**: Dropdown com opcoes para baixar CSV/Excel
- **Botao "Novo Objetivo"**: Abre o dialog de criacao

### 3. Cards de Estatisticas Dinamicas
Os stats devem refletir os filtros aplicados:
- **Objetivos**: Total de objetivos filtrados
- **Progresso**: Media de progresso em porcentagem (com icone de grafico)
- **Encaminhado**: Porcentagem de objetivos no prazo
- **Em Atencao**: Porcentagem de objetivos em risco ou atrasados

### 4. Visualizacao por Departamento
Quando ativada, agrupa os objetivos:
- Header colapsavel por departamento (ex: "Objetivos Growth")
- Lista de objetivos do departamento
- Cada objetivo exibe:
  - Titulo do objetivo
  - Badges (Check-in Atrasado, Departamento, Tipo)
  - Avatar e nome do responsavel
  - Barra de progresso com porcentagem
  - Key Results expansiveis com tabs (Check-ins | Acompanhamento)

### 5. Detalhes Expandidos do Objetivo
Ao expandir um objetivo:
- Lista de Key Results com:
  - Responsavel (avatar + nome)
  - Titulo do KR
  - Valor atual vs Meta
  - Badges de categoria
  - Barra de progresso
- Tabs de Acompanhamento:
  - **Check-ins**: Historico de atualizacoes
  - **Acompanhamento**: Grafico de evolucao ao longo do tempo (usando Recharts)

### 6. Exportacao de Dados
- Gerar arquivo CSV/Excel com:
  - Dados dos objetivos filtrados
  - Key Results associados
  - Responsaveis e progresso

---

## Estrutura de Arquivos

### Novos Arquivos:
```text
src/components/objectives/ObjectivesFilters.tsx       # Barra de filtros
src/components/objectives/ObjectivesStats.tsx         # Cards de estatisticas
src/components/objectives/DepartmentObjectives.tsx    # Visualizacao agrupada
src/components/objectives/ObjectiveDetailCard.tsx     # Card expandido com KRs
src/components/objectives/KeyResultProgress.tsx       # KR com grafico
src/components/objectives/ObjectivesExport.tsx        # Logica de exportacao
src/hooks/useObjectivesFilters.ts                     # Estado e logica de filtros
src/hooks/useDepartments.ts                           # Lista de departamentos
```

### Arquivos a Editar:
```text
src/pages/Objectives.tsx                              # Integrar novos componentes
src/components/objectives/ObjectiveCard.tsx           # Adicionar expansao detalhada
src/hooks/useObjectives.ts                            # Suportar filtros avancados
```

---

## Secao Tecnica

### Interface de Filtros:
```text
interface ObjectivesFilters {
  departments: string[];          // IDs de departamentos
  responsibleIds: string[];       # IDs de usuarios responsaveis
  period: {
    startDate: string | null;
    endDate: string | null;
    preset: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'custom' | null;
  };
  status: 'all' | 'active' | 'completed';
  progressRange: [number, number] | null;
  visibility: 'all' | 'company' | 'private';
  checkInStatus: 'all' | 'on-time' | 'late';
}
```

### Hook useObjectivesFilters:
- Gerencia estado dos filtros
- Aplica filtros na query do Supabase
- Retorna objetivos agrupados por departamento
- Calcula estatisticas dinamicas

### Query de Objetivos com Filtros:
A query sera expandida para:
- Filtrar por `teams.department` (via join com teams)
- Filtrar por `owner_id` ou `assignee_id`
- Filtrar por `due_date` dentro do periodo
- Filtrar por `status` e `visibility`
- Calcular % de check-in baseado em `key_results.updated_at`

### Agrupamento por Departamento:
```text
{
  "Growth": ObjectiveWithDetails[],
  "Comercial": ObjectiveWithDetails[],
  "Tecnologia": ObjectiveWithDetails[],
  ...
}
```

### Exportacao CSV:
Usar funcao nativa do navegador para gerar CSV:
- Formatar dados dos objetivos e KRs
- Criar Blob e disparar download
- Incluir cabecalhos em portugues

### Grafico de Acompanhamento:
Usar Recharts (ja instalado) para:
- LineChart com duas linhas: Meta vs Check-in
- Eixo X: meses
- Eixo Y: valores do KR
- Dados gerados a partir do historico de key_results

---

## Fluxo de Implementacao

1. Criar hook `useObjectivesFilters` com estado e logica de filtros
2. Criar hook `useDepartments` para listar departamentos unicos
3. Criar componente `ObjectivesFilters` com UI de filtros
4. Criar componente `ObjectivesStats` com cards dinamicos
5. Criar componente `DepartmentObjectives` para visualizacao agrupada
6. Criar componente `KeyResultProgress` com grafico de acompanhamento
7. Criar componente `ObjectivesExport` para download CSV
8. Atualizar `useObjectives` para suportar filtros avancados
9. Redesenhar `Objectives.tsx` integrando novos componentes
10. Atualizar `ObjectiveCard` para modo expandido com tabs

---

## UI/UX

### Cores e Badges:
- Check-in Atrasado: Badge vermelho/rosa
- Departamento: Badge azul
- Tipo (Aspiracionais/Compromissadas): Badge amarelo/verde
- Progresso: Barra com cor baseada na % (vermelho < 25%, amarelo < 50%, verde >= 50%)

### Layout Responsivo:
- Desktop: 3 filtros em linha + botoes a direita
- Mobile: Filtros em coluna, botao "Mais filtros" essencial

### Animacoes:
- Transicao suave ao expandir/colapsar departamentos
- Fade in nos graficos de acompanhamento

---

## Dependencias

- **Recharts** (ja instalado): Para graficos de acompanhamento
- **date-fns** (ja instalado): Para manipulacao de datas e periodos
- Nao requer novas instalacoes

---

## Consideracoes de Segurança

- A exportacao usa apenas dados que o usuario ja tem acesso via RLS
- Os filtros sao aplicados no frontend primeiro, respeitando as policies existentes
- Nenhuma nova policy de banco necessaria
