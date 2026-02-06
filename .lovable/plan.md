
# Plano: Página de Gamificação

## Visão Geral
Criar uma página completa de gamificação que pontue usuários com base no engajamento real na plataforma, incluindo ranking, histórico de pontos e sistema de premiação.

## Localização na Navegação
A página será adicionada no grupo **"Engajamento"** da sidebar, junto com Reconhecimentos, Objetivos, Desempenho e Pesquisas. O ícone será `Gamepad2` ou `Award` do Lucide.

**URL:** `/gamification`

## Sistema de Pontuação

Cada ação do usuário na plataforma gerará pontos:

| Ação | Pontos | Descrição |
|------|--------|-----------|
| Criar post no Feed | +5 | Incentiva comunicação |
| Comentar em post | +2 | Estimula discussões |
| Reagir (curtir) | +1 | Engajamento básico |
| Enviar reconhecimento | +10 | Valoriza colegas |
| Receber reconhecimento | +15 | Premiação por ser reconhecido |
| Completar objetivo | +20 | Atingir metas |
| Atualizar key result | +3 | Manter progresso |
| Responder pesquisa NPS | +5 | Participação em feedbacks |
| Login diário | +2 | Uso contínuo |

## Estrutura do Banco de Dados

### Nova Tabela: `gamification_points`
```sql
CREATE TABLE gamification_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) NOT NULL,
  company_id uuid REFERENCES public.companies(id) NOT NULL,
  action_type text NOT NULL, -- 'post', 'comment', 'reaction', etc.
  points integer NOT NULL,
  reference_id uuid, -- ID do post/comment/recognition relacionado
  description text,
  created_at timestamptz DEFAULT now()
);
```

### Nova Tabela: `gamification_levels`
```sql
CREATE TABLE gamification_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) NOT NULL,
  name text NOT NULL, -- 'Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante'
  min_points integer NOT NULL,
  badge_emoji text,
  color text,
  created_at timestamptz DEFAULT now()
);
```

## Componentes da Página

### 1. Header com Resumo Pessoal
- Total de pontos do usuário
- Nível atual e progresso para o próximo
- Posição no ranking geral

### 2. Ranking Geral (Leaderboard)
- Top 10 usuários com mais pontos (mensal/trimestral/geral)
- Avatar, nome, pontos e nível
- Destaque para top 3 (ouro, prata, bronze)
- Filtro por período

### 3. Histórico de Pontos
- Timeline de pontos ganhos
- Filtro por tipo de ação
- Gráfico de evolução mensal

### 4. Níveis e Conquistas
- Sistema de níveis baseado em pontos totais
- Badges especiais por marcos (100 pts, 500 pts, 1000 pts)
- Conquistas especiais (primeiro post, 10 reconhecimentos, etc.)

### 5. Área de Premiações (Admin)
- Configurar prêmios para campeões
- Definir regras de premiação
- Histórico de premiações

## Arquivos a Criar

```text
src/pages/Gamification.tsx           # Página principal
src/hooks/useGamification.ts         # Hook para buscar/calcular pontos
src/components/gamification/
  ├── UserPointsSummary.tsx          # Resumo do usuário
  ├── GamificationLeaderboard.tsx    # Ranking
  ├── PointsHistory.tsx              # Histórico
  ├── LevelsProgress.tsx             # Níveis e conquistas
  └── GamificationStats.tsx          # Estatísticas gerais
```

## Arquivos a Modificar

```text
src/App.tsx                          # Adicionar rota /gamification
src/components/layout/AppSidebar.tsx # Adicionar item no menu Engajamento
```

## Fluxo de Registro de Pontos

Para registrar pontos automaticamente, será necessário modificar os hooks existentes:

1. **usePosts.ts** - Ao criar post (+5 pts)
2. **useComments.ts** - Ao comentar (+2 pts)
3. **usePosts.ts (useToggleReaction)** - Ao reagir (+1 pt)
4. **useRecognitions.ts** - Ao enviar/receber reconhecimento (+10/+15 pts)
5. **useObjectives.ts** - Ao completar objetivo (+20 pts)

## Interface Visual

A página terá layout similar às outras páginas de engajamento:

- Header com título "Gamificação" e subtítulo
- Grid com estatísticas pessoais no topo
- Layout 3 colunas: Leaderboard (2 cols) + Histórico pessoal (1 col)
- Cards com gradientes para destaque dos top 3
- Animações suaves para mudanças de ranking

## Detalhes Técnicos

### Hook Principal: useGamification
```typescript
// Busca pontos do usuário
// Calcula ranking
// Retorna histórico e estatísticas
```

### RLS Policies
- Usuários podem ver pontos de todos da empresa (SELECT)
- Apenas o sistema pode inserir pontos (via triggers ou edge functions)
- Admins podem ver estatísticas completas

### Cálculo de Níveis
- Bronze: 0-99 pontos
- Prata: 100-499 pontos
- Ouro: 500-999 pontos
- Platina: 1000-2499 pontos
- Diamante: 2500+ pontos

## Ordem de Implementação

1. Criar tabelas no banco de dados com RLS
2. Criar hook useGamification
3. Criar componentes da UI
4. Criar página Gamification.tsx
5. Adicionar rota e item no menu
6. Integrar registro de pontos nos hooks existentes
