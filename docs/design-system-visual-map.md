# Design System Visual Map — Oxypeople × O2 Editorial

> **Autora:** Uma (UX/UI Design)
> **Para:** plano híbrido B definido pelo Orion — manter shadcn estilizado via tokens + reescrever 5 componentes-chave do zero seguindo specs O2.
> **Premissa:** preservar usabilidade em telas densas; aplicar tratamento editorial só onde a marca ganha presença sem prejudicar leitura/produtividade.

---

## 1. Audit visual atual

Auditadas 8 superfícies representativas da app (`Index.tsx`, `Auth.tsx`, `Objectives.tsx`, `admin/PulseSurveys.tsx`, `admin/NineBoxEditor.tsx`, `HR.tsx`, `AppSidebar.tsx`, `dashboard/PulseWidget.tsx`, `dashboard/StatCard.tsx`).

### 1.1 Oportunidades editoriais já latentes

| Superfície | Pista visual existente | Movimento pra editorial |
|---|---|---|
| `Index.tsx` linhas 95–103 | já há "hero-header" com saudação (`{getGreeting()}, {userName}`) | trocar `text-2xl/3xl` por display Tusker `clamp(36px, 7vw, 88px)` UPPERCASE; saudação + nome viram a peça heroica do dashboard |
| `Auth.tsx` linhas 113–116 | "Compreender pessoas, oxigenar negócios" já é tipografia hero (`text-5xl font-heading`) | converter pro padrão Tusker `clamp(44px, 9vw, 132px)` line-height 0.92, com `accent-text` no "pessoas"/"oxigenar"; eyebrow mono "01 — INSTITUCIONAL" sobre o título |
| `HR.tsx` linhas 426–447 | header com ícone-quadrado + título + lede + CTA | exatamente o esqueleto de `.page-head` (crumbs + h1 hero + lede + ação) — basta reescalar e adicionar eyebrow mono |
| `Objectives.tsx` linha 184 | `BoardHeader` mas ainda contextualizado como página | adicionar eyebrow + h1 condensado **acima** do board, sem competir com a tabela |
| `StatCard.tsx` linhas 42 | `text-3xl font-heading font-bold tracking-tight` no número | candidato perfeito pra Tusker bold `clamp(40px, 6vw, 64px)` line-height 0.9 — número vira peça gráfica |
| `NineBoxEditor.tsx` linha 166 | `<Grid3X3/>` + "Nine Box" h1 | header da página merece treatment editorial pleno — Nine Box é uma das telas mais "marca" do produto |
| `AppSidebar.tsx` linhas 217–223 | "Oxy People / by O2 Inc" no header da sidebar | logo em pill com glow + tipografia mono nos labels de grupo (PRINCIPAL / ENGAJAMENTO / GESTÃO) |

### 1.2 Zonas DENSAS — manter estritamente funcional

| Superfície | Razão | Decisão |
|---|---|---|
| `admin/PulseSurveys.tsx` linhas 156–256 | tabela com 9 colunas, badges, switches, ícones de ação, tooltips | nem encostar — só repintar via tokens |
| `Objectives.tsx` linhas 219–229 (o "board table") | Monday-style com tree + drag handles + bordas coloridas por grupo | tokens de cor + radius/border, sem mexer em tipografia |
| `admin/NineBoxEditor.tsx` linhas 195–206 (o `DndContext` + grid + pool) | grid 3×3 drag-drop crítico de UX | preservar densidade; só estilo dos avatares/células via tokens |
| `HR.tsx` linhas 596–693 (tabela colaboradores) | tabela longa com avatar, position, dept, role, status, dropdown | tokens só |
| `Auth.tsx` linhas 165–243 (form Card direito) | inputs com ícones internos, labels finos, separator, OAuth Google | manter UX shadcn; tokens fazem o trabalho — Tusker fica do lado esquerdo (branding) |
| `PulseWidget.tsx` em geral | card pequeno com pergunta/escala — tem que ser gentil | tokens, sem hero; manter pequeno e amigável |
| Charts (`HR.tsx` linhas 117–148, 200–230) | Recharts com legendas/eixos | tokens (cores das séries) — gráficos não recebem tipografia editorial |
| Todos os Dialogs/AlertDialog | janelas modais funcionais | tokens; títulos no máximo 18–20px sans-serif |

---

## 2. Matriz de aplicação por componente/página

| Componente / Page | Modo | Justificativa |
|---|---|---|
| **`/auth`** (Auth.tsx) | **Editorial Full** | Primeira impressão. Lado esquerdo é puro branding — usar Tusker hero + grid pattern + glow lima. Lado direito (form) fica funcional. |
| **`/`** (Index.tsx — Dashboard) | **Híbrido** | Hero saudação + StatCards numéricos editorial; widgets da coluna direita e charts ficam tokens. |
| **`/admin/nine-box`** (NineBox.tsx — lista) | **Editorial Full** | Página de mais "personalidade da marca" segundo o Orion. Eyebrow + h1 hero + filtros enxutos. |
| **`/admin/nine-box/editor`** (NineBoxEditor.tsx) | **Híbrido** | Header editorial em cima (page-head), mas a grid drag-drop é tokens-only. |
| **`/objectives`** (Objectives.tsx) | **Híbrido** | Page-head editorial em cima (eyebrow + h1 hero "OBJETIVOS"), board table preservado denso. |
| **`/recognition`** | **Editorial Full** | Página celebrativa — herói + cards de reconhecimento são peças visuais. |
| **`/feed`** (Mural) | **Híbrido** | Header editorial; lista de posts mantém densidade típica de feed. |
| **`/hr`** (HR.tsx) | **Híbrido** | Page-head editorial; tabs + tabelas + charts ficam tokens. |
| **`/company`** | **Híbrido** | Idem HR. |
| **`/teams`** | **Híbrido** | Header editorial; cards de times podem usar `.card` com radius 20. |
| **`/performance`** | **Híbrido** | Header editorial; matrizes/listas são tokens. |
| **`/gamification`** | **Editorial Full** | Tema gamificado pede personalidade — XP/Level usam Tusker bold; rankings usam display. |
| **`/surveys`** (lista pública) | **Híbrido** | Header editorial; lista funcional. |
| **`/pulse/:id`** (responder pulse) | **Tokens-only** | UX precisa ser leve, rápida, sem cerimônia editorial. |
| **`/feedback/new`, `/inbox`, `/sent`, `/about-me`** | **Tokens-only** | Workflow funcional. Page-head simples sans-serif; conteúdo é form/lista. |
| **`/feedback/:id`** | **Tokens-only** | Leitura de feedback — texto deve ser confortável, sem hero competindo. |
| **`/admin/periods`** | **Tokens-only** | CRUD admin puro. |
| **`/admin/pulse-surveys`** (PulseSurveys.tsx) | **Tokens-only** | Tabela 9 colunas + dialogs — densa demais. |
| **`/admin/pulse-analytics`** | **Tokens-only** | Charts e métricas; números podem usar Tusker, mas nada de hero. |
| **`/admin/okr-escalation`** | **Tokens-only** | Página de configuração admin. |
| **`/admin/managers`** | **Tokens-only** | Tabela admin. |
| **`/admin/invitations`** | **Tokens-only** | Tabela admin. |
| **`/automation`** | **Tokens-only** | Tabela de regras / triggers. |
| **`/settings`** | **Tokens-only** | Forms longos de preferências. |
| **`AppSidebar`** | **Híbrido** | Logo + label de grupo em mono uppercase; itens em sans-serif (legível). Sem Tusker — verticalmente comprometido. |
| **`AppLayout/TopBar`** | **Híbrido** | Estilo `.site-header` (sticky + blur + border-bottom) — adapta brand area, mantém actions funcionais. |
| **`StatCard` (dashboard)** | **Editorial Full** | Número gigante em Tusker bold; label em mono uppercase 11px. Identidade da marca em peça repetida. |
| **`Card` shadcn (genérico)** | **Híbrido** | radius 20 + padding 28 + border var(--border); conteúdo interno permanece flexível. |
| **`Button` shadcn** | **Híbrido (reescrever variantes)** | Pill (radius 999) + padding 14×22; 3 variantes: primary/ghost/sm. Manter API do shadcn. |
| **Dialogs/Sheets** | **Tokens-only** | Title 18px sans-serif, content padded normal; nada de Tusker em modal (atrapalha). |
| **Charts (Recharts)** | **Tokens-only** | Cores via `var(--accent)`, `var(--success)` etc.; tipografia de eixos em mono 11px. |
| **Tables (shadcn)** | **Tokens-only** | Header em mono uppercase 11px, body em sans-serif 13–14px. |

---

## 3. Specs detalhadas dos 5 componentes-chave (reescrever do zero)

> Ordem de prioridade visual: **Button → Card → StatCard → Sidebar → TopBar**.
> Cada um vive em `src/components/o2/` (novo namespace) consumindo apenas tokens CSS de `src/styles/tokens.css` (sob responsabilidade da Aria).

### 3.1 Button (atomic) — `o2/Button.tsx`

**Spec base:** seção 6.1 do design system (pill radius 999, padding 14×22, font-weight 600, easing único).

**API proposta** (drop-in para o `<Button>` do shadcn):

```tsx
// src/components/o2/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost";
type Size = "md" | "sm";

interface O2ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const O2Button = forwardRef<HTMLButtonElement, O2ButtonProps>(
  ({ variant = "primary", size = "md", leftIcon, rightIcon, className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={cn("o2-btn", `o2-btn--${variant}`, size === "sm" && "o2-btn--sm", className)}
        {...rest}
      >
        {leftIcon}
        <span>{children}</span>
        {rightIcon}
      </button>
    );
  }
);
O2Button.displayName = "O2Button";
```

**CSS** (em `components.css`):

```css
.o2-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 22px;
  font-family: var(--font-body);
  font-size: 14px; font-weight: 600;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform .15s var(--ease), filter .2s var(--ease),
              background .2s var(--ease), border-color .2s var(--ease);
  text-decoration: none;
}
.o2-btn:active { transform: translateY(1px); }
.o2-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.o2-btn--primary {
  background: var(--accent);
  color: var(--accent-ink);
}
.o2-btn--primary:hover { filter: brightness(1.08); }

.o2-btn--ghost {
  background: transparent;
  color: var(--fg);
  border-color: var(--border-strong);
}
.o2-btn--ghost:hover {
  background: var(--bg-elev);
  border-color: var(--fg-muted);
}

.o2-btn--sm { padding: 9px 14px; font-size: 11px; }

@media (max-width: 767px) {
  .o2-btn { width: 100%; justify-content: center; }
}
```

**Coexistência com shadcn:** manter `<Button>` shadcn vivo dentro de Dialogs/Forms/CRUD; usar `<O2Button>` em hero CTAs, page-head actions, landing.

---

### 3.2 Card (molecule) — `o2/Card.tsx`

**Spec base:** seção 6.5 (padding 28, radius 20, border `var(--border)`, hover border `var(--border-strong)`).

```tsx
// src/components/o2/Card.tsx
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface O2CardProps extends HTMLAttributes<HTMLDivElement> {
  /** se true, aplica scale 0.97 + accent bg no hover (estilo "explore-card") */
  interactive?: boolean;
}

export const O2Card = forwardRef<HTMLDivElement, O2CardProps>(
  ({ interactive, className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn("o2-card", interactive && "o2-card--interactive", className)}
      {...rest}
    />
  )
);
O2Card.displayName = "O2Card";
```

**CSS:**

```css
.o2-card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg); /* 20px */
  padding: 28px;
  transition: border-color .25s var(--ease), background-color .25s var(--ease),
              transform .35s var(--ease);
}
.o2-card:hover { border-color: var(--border-strong); }

.o2-card--interactive { cursor: pointer; }
.o2-card--interactive:hover {
  background: var(--lima-500);
  border-color: var(--lima-500);
  color: var(--ink-900);
  transform: scale(0.97);
}
```

**Coexistência com shadcn `<Card>`:** o shadcn Card recebe tokens (radius/padding/border) via override no `index.css`; o `<O2Card>` é a versão "premium" usada em ShortcutCards, RecognitionCards, etc.

---

### 3.3 StatCard (molecule específica do oxypeople) — `o2/StatCard.tsx`

**Identidade:** número em **Tusker bold** + label em **mono uppercase**; layout existente (icon à direita) preservado por familiaridade.

```tsx
// src/components/o2/StatCard.tsx
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface O2StatCardProps {
  eyebrow?: string;          // "01 — RECONHECIMENTOS"
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export function O2StatCard({ eyebrow, label, value, change, changeLabel, icon, onClick }: O2StatCardProps) {
  const trendIcon =
    change === undefined ? null
    : change > 0 ? <TrendingUp className="h-4 w-4" />
    : change < 0 ? <TrendingDown className="h-4 w-4" />
    : <Minus className="h-4 w-4" />;
  const trendClass =
    change === undefined ? ""
    : change > 0 ? "o2-stat__trend--up"
    : change < 0 ? "o2-stat__trend--down"
    : "o2-stat__trend--flat";

  return (
    <div className={cn("o2-stat", onClick && "o2-stat--clickable")} onClick={onClick}>
      <div className="o2-stat__head">
        {eyebrow && <span className="o2-eyebrow">{eyebrow}</span>}
        <span className="o2-stat__label">{label}</span>
      </div>
      <div className="o2-stat__body">
        <span className="o2-stat__value">{value}</span>
        {icon && <span className="o2-stat__icon">{icon}</span>}
      </div>
      {change !== undefined && (
        <div className={cn("o2-stat__trend", trendClass)}>
          {trendIcon}
          <span>{change > 0 ? "+" : ""}{change}%</span>
          {changeLabel && <span className="o2-stat__trend-label">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
```

**CSS:**

```css
.o2-stat {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  display: flex; flex-direction: column; gap: 16px;
  transition: border-color .25s var(--ease);
}
.o2-stat--clickable { cursor: pointer; }
.o2-stat--clickable:hover { border-color: var(--border-strong); }

.o2-stat__head { display: flex; flex-direction: column; gap: 6px; }
.o2-stat__label {
  font-family: var(--font-mono);
  font-size: 11px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--fg-subtle);
}

.o2-stat__body {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
}
.o2-stat__value {
  font-family: var(--font-display);
  font-weight: 700; /* Tusker Bold */
  font-size: clamp(40px, 6vw, 64px);
  line-height: 0.9;
  letter-spacing: 0.005em;
  color: var(--fg);
  text-transform: uppercase;
}
.o2-stat__icon {
  width: 40px; height: 40px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.o2-stat__trend {
  font-family: var(--font-mono); font-size: 12px;
  letter-spacing: 0.06em;
  display: inline-flex; align-items: center; gap: 6px;
}
.o2-stat__trend--up   { color: var(--accent); }
.o2-stat__trend--down { color: #FF6B6B; } /* error semantic — Aria valida no token */
.o2-stat__trend--flat { color: var(--fg-subtle); }
.o2-stat__trend-label { color: var(--fg-subtle); margin-left: 4px; }
```

> **Substitui:** `src/components/dashboard/StatCard.tsx` (atual usa `text-3xl font-heading`, vira `o2-stat__value` com Tusker `clamp(40,6vw,64)`).

---

### 3.4 Sidebar (organism) — `o2/AppSidebar.tsx`

**Mantém:** estrutura shadcn `<Sidebar>` (a primitive já é boa, lida com colapsar/responsivo).
**Reescreve:** apenas o **shell visual** + labels de grupo + brand area do header.

```tsx
// src/components/o2/AppSidebar.tsx (essencial)
<Sidebar className="o2-sidebar" collapsible="icon">
  <SidebarHeader className="o2-sidebar__brand">
    <div className="o2-sidebar__logo breathe">
      <span>O₂</span>
    </div>
    {!collapsed && (
      <div className="o2-sidebar__brand-text">
        <span className="o2-sidebar__brand-name">Oxy People</span>
        <span className="o2-sidebar__brand-sub">by O2 Inc</span>
      </div>
    )}
  </SidebarHeader>

  <SidebarContent className="o2-sidebar__content">
    <NavGroup label="Principal" items={mainNavItems} />
    <NavGroup label="Engajamento" items={engagementItems} />
    <NavGroup label="Gestão" items={managementItems} />
  </SidebarContent>

  {/* footer: avatar + dropdown — preservado */}
</Sidebar>
```

E o `<SidebarGroupLabel>` recebe a classe `.o2-eyebrow`:

```tsx
<SidebarGroupLabel className="o2-eyebrow">
  {label}
</SidebarGroupLabel>
```

**CSS:**

```css
.o2-sidebar {
  background: var(--bg-elev-2);
  border-right: 1px solid var(--border);
}

.o2-sidebar__brand {
  display: flex; align-items: center; gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}
.o2-sidebar__logo {
  width: 40px; height: 40px;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: var(--accent-ink);
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 700; font-size: 18px;
  filter: drop-shadow(0 0 12px var(--accent-soft));
}
.o2-sidebar__brand-text { display: flex; flex-direction: column; }
.o2-sidebar__brand-name {
  font-family: var(--font-display); font-weight: 700;
  font-size: 16px; text-transform: uppercase; letter-spacing: 0.005em;
  color: var(--fg);
}
.o2-sidebar__brand-sub {
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-subtle);
}

.o2-sidebar__content { padding: 12px 8px; }

/* labels de grupo — eyebrow mono */
.o2-eyebrow {
  font-family: var(--font-mono);
  font-size: 11px; letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--fg-subtle);
  padding: 12px 12px 6px;
}

/* itens da nav: sans-serif (legibilidade), accent verde no ativo */
.o2-sidebar [data-active="true"] {
  background: var(--accent-soft);
  color: var(--accent);
  border-left: 2px solid var(--accent);
}
```

> **Não usar Tusker nos itens** — comprometeria varredura visual em sidebar com 14+ links.

---

### 3.5 TopBar/Header (organism) — `o2/TopBar.tsx`

**Spec base:** seção 6.7 (sticky, blur 12, border-bottom var(--border)). Hoje o `AppLayout` não tem topbar dedicado — proposta é introduzir um.

```tsx
// src/components/o2/TopBar.tsx
import { O2Button } from "./Button";

export function O2TopBar({ pageTitle, eyebrow, actions }: {
  pageTitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="o2-topbar">
      <div className="o2-topbar__inner">
        <div className="o2-topbar__brand">
          {/* trigger sidebar collapse + breadcrumb compacto */}
          <SidebarTrigger />
          {eyebrow && <span className="o2-eyebrow">{eyebrow}</span>}
          {pageTitle && <span className="o2-topbar__title">{pageTitle}</span>}
        </div>

        <div className="o2-topbar__actions">
          {actions}
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
```

**CSS:**

```css
.o2-topbar {
  position: sticky; top: 0; z-index: 50;
  background: color-mix(in srgb, var(--bg) 90%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.o2-topbar__inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px;
  gap: 16px;
}
.o2-topbar__brand {
  display: flex; align-items: center; gap: 16px;
  min-width: 0;
}
.o2-topbar__title {
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--fg-muted);
}
.o2-topbar__actions {
  display: flex; align-items: center; gap: 8px;
}
```

> **Por que mono e não Tusker no título da topbar:** página tem o page-head logo abaixo com h1 hero — repetir Tusker na topbar empilha duas peças display.

---

## 4. Telas-vitrine — onde ir mais a fundo

### 4.1 `/auth` — primeira impressão

**O que muda visualmente:**
O lado esquerdo (50% da tela) abandona o gradient verde "tech grid" atual e vira uma composição editorial puro O2: fundo `var(--bg)` com glow lima radial em opacity 0.14, **eyebrow mono** "01 — INSTITUCIONAL" no topo, logo O₂ em pill com animação `breathe`, e o tagline "Compreender pessoas, oxigenar negócios" em **Tusker** `clamp(44px, 9vw, 132px)` line-height 0.92, com `var(--accent)` aplicado em "pessoas" e "oxigenar" via `<span class="accent-text">`. Lede em Montserrat `clamp(17px, 2vw, 20px)` muted. Embaixo, chip mono "+1000 EMPRESAS" no estilo `.chip` com `dot accent`. O lado direito (form) **fica como está**, só recebe `var(--bg-elev)` no Card e `<O2Button variant="primary">` no submit. O contraste editorial-vs-funcional virou narrativa: "esta é a marca, este é o trabalho".

### 4.2 `/` — Dashboard saudação

**O que muda visualmente:**
A `hero-header` atual (`text-2xl lg:text-3xl`) é substituída por uma faixa de page-head com **eyebrow mono** "DASHBOARD" + saudação em Tusker `clamp(36px, 7vw, 88px)` line-height 0.96 — algo como "BOA TARDE, JOÃO." em UPPERCASE. Lede sans-serif logo abaixo (a frase "Aqui está um resumo..."). Padding vertical generoso (48–64px). Logo abaixo entram os 4 `<O2StatCard>` com números em Tusker bold 64px (Total/Reconhecimentos/Objetivos/Engajamento viram peças visuais — a página inteira ganha "eu sou Oxy"). O resto do dashboard (chart de engajamento, OKR summary, painel de insights à direita) **fica tokens-only** — preservar densidade de leitura e familiaridade.

### 4.3 `/admin/nine-box` (lista de snapshots, NÃO o editor)

**O que muda visualmente:**
Page-head completo: eyebrow "RH / NINE BOX" → h1 hero "NINE BOX" em Tusker `clamp(64px, 11vw, 180px)` (em desktop fica enorme — é a tela mais "marca" do produto), lede explicando o conceito ("Mapeamento performance × potencial de cada colaborador. Crie snapshots periódicos."), CTA `<O2Button variant="primary">` "+ NOVO SNAPSHOT". Logo abaixo, lista de snapshots vira grid `auto-grid-280` de `<O2Card>` (radius 20, padding 28) com: eyebrow mono com período → nome do snapshot em display 28px → meta em mono → status badge → seta `→` no canto inferior direito. Hover: card vira `var(--lima-500)` com texto preto e `scale(0.97)` (estilo `.explore-card`). Já o editor `/admin/nine-box/:id` fica **híbrido** — page-head editorial em cima + grid drag-drop intocada.

---

## 5. "Deixar como está" — onde aplicar editorial PIORA

| Componente / Page | Por que NÃO aplicar editorial |
|---|---|
| `admin/PulseSurveys.tsx` (tabela) | 9 colunas com switches/badges/ícones — Tusker no header da tabela quebra varredura |
| `admin/Managers.tsx` | Tabela admin, idem |
| `admin/Invitations.tsx` | Lista funcional |
| `admin/Periods.tsx` | CRUD admin puro |
| `admin/PulseAnalytics.tsx` | Charts + filtros — números podem ser Tusker, mas página inteira não |
| `admin/OkrEscalation.tsx` | Configurações; forms longos |
| `CreateObjectiveDialog`, `BreakdownObjectiveDialog`, `CreateSnapshotDialog`, `PulseSurveyForm`, `PipefyConfigDialog`, `InviteModal` | Dialogs com forms longos — Tusker no title atrapalha leitura, scroll fica desconfortável |
| `NineBoxEditor.tsx` (a grid drag-drop) | Drag-drop crítico — qualquer hover scale 0.97 vai conflitar com `useSortable` do dnd-kit |
| `/feedback/new`, `/feedback/inbox`, `/feedback/sent`, `/feedback/about-me`, `/feedback/:id` | Workflow de feedback — texto longo, lista compacta. Leitura vence estética. |
| `/pulse/:id` (responder) | UX micro — pulse tem que ser respondido em 5 segundos. Cerimônia editorial atrasa. |
| `/automation` | Tabela de regras + condições |
| `/settings` | Forms longos de preferências |
| Charts em qualquer página (Recharts) | Tipografia editorial em eixo X/Y é ilegível |
| `BoardHeader` + `BoardColumnHeaders` (Objectives) | Header de tabela monday-style precisa ser denso |
| `ObjectiveTreeNode` + `GroupFooter` | Linhas de tabela; Tusker = chaos |
| `ActionsKanban` colunas | Tipografia das colunas tem que ser compacta |
| `ObjectivesContextBar` | Filtros — precisa ser leve |
| `CollaboratorsFilters` (HR.tsx) | Idem |
| `EngagementChart`, `HeadcountSparkline`, `TurnoverMini`, `UserGamificationMini` | Mini-widgets do painel direito — peças funcionais, não vitrine |

> **Regra prática para "tokens-only":** trocar cores/borders/radius pelos tokens O2, manter a tipografia atual (Inter / Montserrat sans). Headers de página dessas telas: h1 em **Montserrat 600 24px** (não Tusker), com eyebrow mono opcional acima.

---

## 6. Resumo executivo (TL;DR)

- **Aplicar Editorial Full em 3 telas:** `/auth`, `/` (dashboard hero), `/admin/nine-box`. Mais `/recognition` e `/gamification` como bônus de personalidade.
- **Híbrido (page-head editorial + corpo funcional):** `/objectives`, `/feed`, `/hr`, `/teams`, `/company`, `/performance`, editor do `/admin/nine-box/:id`.
- **Tokens-only:** todos os admin-CRUD, dialogs, forms longos, workflows feedback/pulse, settings, automation.
- **5 componentes-chave (ordem):** Button → Card → StatCard → Sidebar → TopBar. Vivem em `src/components/o2/`, coexistem com shadcn (não substituem) e consomem apenas tokens CSS.
- **Tusker fica reservado pra:** hero/page-head, números de stats, labels de seção em landing/dashboard. **Nunca em:** itens de menu, headers de tabela, modais, formulários, charts.

---

*Documento produzido por Uma (UX/UI). Validar com Aria (auditoria técnica) antes da implementação dos 5 componentes em `src/components/o2/`.*
