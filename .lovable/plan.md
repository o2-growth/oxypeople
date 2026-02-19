
# Melhorias Visuais UI/UX - Toda a Plataforma

## Objetivo
Aplicar padroes modernos de UI/UX inspirados em shadcn/ui, Tailwind CSS, Linear, Vercel e Stripe para elevar a qualidade visual de toda a plataforma Oxy People.

## Melhorias Planejadas

### 1. Transicoes e Micro-interacoes Globais
- Adicionar `transition-colors duration-150` em todos os elementos interativos que ainda nao tem
- Melhorar hover states dos cards com `hover:border-primary/30` sutil
- Adicionar `focus-visible` rings consistentes em todos os botoes e inputs
- Suavizar animacoes de entrada nas paginas com stagger delays

### 2. Tipografia e Espacamento
- Padronizar headers de pagina: todos usando o mesmo padrao (`text-2xl font-heading font-bold` + descricao `text-sm text-muted-foreground`)
- Reduzir titulos h1 de `text-3xl` para `text-2xl` para consistencia (menos gritante)
- Melhorar line-height e letter-spacing nos cards de stats
- Adicionar `tracking-tight` nos numeros grandes para visual mais premium

### 3. Cards e Superficies
- Padronizar todos os cards com `rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow`
- Remover `border-none` dos cards de PerformanceStats (inconsistente)
- Adicionar efeito de hover lift sutil e consistente em cards clicaveis
- Melhorar separadores usando `border-border/40` ao inves de `border-border` para suavidade

### 4. Pagina de Login (Auth)
- Adicionar animacao de entrada no card de login (fade-in + slide-up)
- Melhorar inputs com `focus:border-primary/60` mais visivel
- Adicionar animacao no logo O2 (pulse suave ou glow)
- Melhorar contraste do texto "by O2 Inc" no painel esquerdo

### 5. Sidebar (AppSidebar)
- Adicionar indicador visual de item ativo com barra lateral colorida (2px left border primary)
- Melhorar transicao de colapso com animacao mais suave
- Adicionar tooltip nos icones quando colapsado (ja parcialmente implementado, garantir consistencia)
- Suavizar cores do footer/dropdown com hover states mais refinados

### 6. Header (AppLayout)
- Melhorar a search bar com animacao de foco (expandir sutilmente ao focar)
- Adicionar separador visual sutil entre trigger e search
- Melhorar badge de notificacoes com animacao de pulse quando ha novas

### 7. Dashboard (Index)
- Melhorar StatCards com gradiente sutil no icone ao inves de cor solida
- Adicionar numeros animados (count-up) nos stats principais
- Melhorar skeleton loading com shimmer effect ao inves de pulse padrao
- Hero header: adicionar animacao de particulas sutis ou mesh gradient animado

### 8. Feed/Mural
- Melhorar cards de eventos com imagem de fundo sutil ou gradiente
- Adicionar animacao de entrada staggered nos cards
- Melhorar mini-calendario com highlight mais visivel no dia atual
- Adicionar hover effect nos aniversariantes

### 9. Reconhecimentos
- Melhorar RecognitionCard com avatar overlapping mais elegante (remover seta "->")
- Adicionar animacao de confetti sutil ao enviar reconhecimento
- Melhorar badges com borda gradient ao inves de cor solida
- Card de leaderboard com ranking mais visual (medalhas 1o, 2o, 3o)

### 10. Objetivos (OKRs)
- Melhorar barras de progresso com gradiente animado
- Adicionar indicador visual de nivel (strategic/tactical/operational) com cores distintas
- Melhorar empty state com ilustracao SVG mais atrativa
- Hover state das linhas do tree com highlight mais suave

### 11. Pagina Empresa
- Melhorar Company Info Card com gradiente mais suave e avatar maior
- Adicionar badge de status (online/offline) nos membros
- Melhorar DepartmentCards com cor do departamento como accent sutil
- Tabs com underline animada ao trocar

### 12. Gamificacao
- Adicionar brilho/glow no card de nivel atual
- Melhorar barras de progresso de niveis com cores de gradiente
- Leaderboard com efeito de destaque no top 3 (ouro, prata, bronze)
- Adicionar animacao de ganho de pontos

### 13. Configuracoes
- Melhorar selecao de tema com preview visual real (mini screenshot do tema)
- Cards de integracao com logo real ao inves de letra
- Adicionar animacao de toggle nos switches
- Melhorar Zona de Perigo com borda pulsante sutil

### 14. Componentes Base (shadcn/ui)
- Melhorar Button default com gradiente mais suave e sombra menos agressiva
- Tabs com animacao de underline sliding
- Dialog/Sheet com backdrop blur mais forte
- Toast com icones de status (check verde, X vermelho)
- Select/Dropdown com animacao de abertura mais suave
- Progress bar com gradiente e rounded ends

### 15. CSS Global (index.css)
- Adicionar scrollbar customizada (estilizada, fina, com cor primary)
- Melhorar selection color (::selection) com cor primaria
- Adicionar smooth scroll behavior global
- Melhorar focus states globais para acessibilidade

## Detalhes Tecnicos

### Arquivos que serao modificados:
- `src/index.css` - Novas utilidades CSS, scrollbar, selection, animacoes globais
- `tailwind.config.ts` - Novas keyframes e tokens de animacao
- `src/components/ui/button.tsx` - Gradiente e hover refinados
- `src/components/ui/card.tsx` - Hover states padronizados
- `src/components/ui/progress.tsx` - Gradiente animado
- `src/components/layout/AppLayout.tsx` - Search bar animada, header refinado
- `src/components/layout/AppSidebar.tsx` - Active indicator, transicoes
- `src/components/dashboard/StatCard.tsx` - Hover, gradientes, numeros
- `src/components/recognition/RecognitionCard.tsx` - Layout avatares, badges
- `src/components/performance/PerformanceStats.tsx` - Consistencia de cards
- `src/pages/Auth.tsx` - Animacoes de entrada
- `src/pages/Index.tsx` - Shimmer loading, stagger animations
- `src/pages/Feed.tsx` - Stagger animations
- `src/pages/Recognition.tsx` - Layout melhorado
- `src/pages/Company.tsx` - Header consistente
- `src/pages/Gamification.tsx` - Glow effects, leaderboard
- `src/pages/Settings.tsx` - Toggle animations, logos

### Nenhuma alteracao em:
- Banco de dados
- RLS policies
- Logica de negocio / hooks de dados
- Funcionalidade existente (apenas visual)

### Abordagem:
Todas as mudancas sao puramente visuais/CSS. Nenhuma funcionalidade sera alterada. O foco e consistencia, animacoes suaves, melhor hierarquia visual e um acabamento premium em toda a plataforma.
