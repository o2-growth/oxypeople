# Design System Migration — O2 × shadcn/ui Audit

> **Author:** Aria (System Architect)
> **Date:** 2026-05-04
> **Status:** APPROVED FOR IMPLEMENTATION
> **Audience:** Dex (implementer), Uma (visual mapping), Orion (orchestrator)
> **Strategy:** Hybrid B — keep shadcn primitives, repaint via tokens; rewrite 5 high-impact primitives from scratch.

---

## 0. TL;DR for Dex

The fastest viable path to an O2-branded UI without rewriting 90+ components:

1. **Keep all Tailwind utilities and shadcn primitives intact.** Repaint by overwriting the existing `--background`, `--primary`, etc. CSS vars in `src/index.css` with HSL versions of Lima/Ink — see § 2.
2. **Convert all O2 hex tokens to HSL triplets** (`#63F161` → `127 86% 66%`). This is non-negotiable: shadcn consumes `hsl(var(--x) / <alpha>)` patterns 15+ places and recharts files use `hsl(var(--primary))` strings — see § 3.
3. **Add a parallel O2 token layer** (`--bg`, `--fg`, `--accent`, `--lima-500`, `--ink-900`) that the 5 hand-rewritten primitives consume directly. Both layers coexist; the O2 layer is the source of truth for new code, the shadcn layer is the bridge for legacy code.
4. **Hand-rewrite 5 primitives** in priority order: `Button`, `Card`, `Badge`, `AppSidebar`, `AppLayout` header. These give >80% of the visual signal change with minimal blast radius (Sidebar has 2 importers, AppLayout has 1, the others are propagated through CSS vars without touching call-sites).
5. **Wire fonts incrementally:** add Tusker Grotesk + Montserrat + JetBrains Mono in parallel with the existing Inter/Space Grotesk, then swap the Tailwind `fontFamily` aliases. Body migrates Inter → Montserrat in one move; `font-heading` (already used in 25 places) becomes the Tusker bridge.

---

## 1. Surface area assessment

Quantitative footprint of the current shadcn coupling — informs every trade-off below.

| Concern | Count | Source |
|---|---|---|
| `Button` import sites | **118** | `grep -l "from \"@/components/ui/button\""` |
| `Card` import sites | **81** | idem |
| `Badge` import sites | **84** | idem |
| `Input` import sites | **44** | idem |
| `Sidebar` import sites | **2** (AppLayout, AppSidebar) | idem |
| `Select`/`Textarea`/`Checkbox`/`RadioGroup` import sites | **49** | idem |
| Files using `hsl(var(--primary))` (recharts + CSS) | **9** | `grep -rEn "hsl\(var\(--"` |
| `bg-X/<opacity>` patterns | **15+** | `grep "bg-(primary\|accent\|...)/[0-9]"` |
| Hardcoded hex in component code | **48** | `grep "#[0-9a-fA-F]{3,6}"` |
| `font-heading` consumers (already wired) | **25+** | `grep "font-heading"` |

**Conclusion:** Full rewrite is a 2–3 week proposition; hybrid B targets the same visual outcome in 1–2 days.

---

## 2. Token-by-token mapping (shadcn HSL ↔ O2)

The shadcn vars in `src/index.css` are defined as **HSL triplets without the `hsl()` wrapper** (e.g. `--background: 150 10% 97%`). Tailwind wraps them at consumption time via `hsl(var(--background))`. **The O2 hex palette must therefore be converted to HSL triplets** — this preserves the entire `hsl(var(--x) / <alpha>)` opacity-scaling contract that 15+ components depend on.

### 2.1 HSL conversion table (compute once, hard-code)

| O2 hex | HSL triplet (`H S% L%`) | Notes |
|---|---|---|
| `#3A3A3A` (`--bg` dark)        | `0 0% 23%`    | Pure neutral grey |
| `#2E2E2E` (`--bg-elev` dark)   | `0 0% 18%`    | |
| `#252525` (`--bg-elev-2` dark) | `0 0% 15%`    | |
| `#4A4A4A` (`--surface` dark)   | `0 0% 29%`    | |
| `#FAFAFA` (`--fg` dark)        | `0 0% 98%`    | |
| `#C4C4C4` (`--fg-muted` dark)  | `0 0% 77%`    | |
| `#9A9A9A` (`--fg-subtle` dark) | `0 0% 60%`    | |
| `#FBFBFA` (`--bg` light)       | `60 9% 98%`   | |
| `#FFFFFF` (`--bg-elev` light)  | `0 0% 100%`   | |
| `#F4F4F3` (`--bg-elev-2` light)| `60 4% 95%`   | |
| `#111111` (`--fg` light)       | `0 0% 7%`     | |
| `#555555` (`--fg-muted` light) | `0 0% 33%`    | |
| `#888888` (`--fg-subtle` light)| `0 0% 53%`    | |
| `#63F161` (Lima 400 — dark accent)  | `119 84% 66%` | For `data-theme="dark"` accent |
| `#00D842` (Lima 500 — light accent) | `138 100% 42%`| For `data-theme="light"` accent |
| `#00B038` (Lima 600 — hover/depth)  | `135 100% 35%`| |
| `#494949` (Ink 700)            | `0 0% 29%`    | Used for `--surface` dark |
| `#212121` (Ink 900)            | `0 0% 13%`    | `--accent-ink` light, dark backgrounds |
| `#676767` (Ink 500)            | `0 0% 40%`    | |
| `#AAAAAA` (Ink 300)            | `0 0% 67%`    | |
| `#BFBFBF` (Ink 200)            | `0 0% 75%`    | |
| `#EAEAEA` (Ink 150)            | `0 0% 92%`    | |

**Validation rule:** always paste the triplet (no `#`, no `hsl()`). The shadcn vars MUST stay in `H S% L%` format for `hsl(var(--x) / 0.4)` syntax to keep working.

### 2.2 shadcn → O2 mapping (DARK = default)

| shadcn var | New value (HSL triplet) | O2 token equivalent | Rationale |
|---|---|---|---|
| `--background` | `0 0% 23%`     | `--bg` (`#3A3A3A`)         | Page background |
| `--foreground` | `0 0% 98%`     | `--fg` (`#FAFAFA`)         | Body text |
| `--card`       | `0 0% 18%`     | `--bg-elev` (`#2E2E2E`)    | Cards / panels (raised surface) |
| `--card-foreground` | `0 0% 98%`| `--fg`                     | |
| `--popover`    | `0 0% 13%`     | `--ink-900` (`#212121`)    | Popovers darker than cards (matches `.download-menu-panel` spec § 6.14) |
| `--popover-foreground` | `0 0% 98%` | `--fg`                | |
| `--primary`    | `119 84% 66%`  | `--accent` = Lima 400      | Brand accent — drives buttons, recharts strokes, focus rings |
| `--primary-foreground` | `0 0% 4%` | `--accent-ink` (`#0A0A0A`)| **Critical:** dark text on Lima for legibility (§ 3.2 of spec) |
| `--secondary`  | `0 0% 18%`     | `--bg-elev`                | shadcn secondary buttons / muted CTAs |
| `--secondary-foreground` | `0 0% 77%` | `--fg-muted`         | |
| `--muted`      | `0 0% 18%`     | `--bg-elev`                | Used for skeletons, table footer, muted backgrounds |
| `--muted-foreground` | `0 0% 60%`| `--fg-subtle`              | Caption / placeholder text |
| `--accent` (shadcn hover surface) | `0 0% 29%` | `--surface` (`#4A4A4A`) | shadcn uses `--accent` as a hover *surface* (e.g. dropdown item hover, tabs trigger), NOT as the brand accent. Must be a neutral elevation, not Lima — otherwise every dropdown item turns green on hover |
| `--accent-foreground` | `0 0% 98%` | `--fg`                  | |
| `--destructive` | `0 72% 51%`   | (keep — outside O2 palette)| O2 spec is silent on destructive; retain shadcn red for consistency. Emit a follow-up ADR if O2 publishes a destructive token |
| `--destructive-foreground` | `0 0% 100%` | white            | |
| `--border`     | `0 0% 100% / opacity baked in` → use `0 0% 100%` and apply opacity via `border-border/10` | `--border` = `rgba(255,255,255,0.10)` | **Edge case:** O2's `--border` is rgba with alpha. shadcn uses solid HSL. Map `--border` to `0 0% 100%` and rely on Tailwind's `border-border/10` (`hsl(var(--border) / 0.1)`) at call-sites — but this requires touching call-sites. **Pragmatic alternative:** ship `--border: 0 0% 30%` (a solid lookalike) and apply true alpha only in the 5 hand-rewritten primitives via `var(--o2-border)`. **Recommended path: Pragmatic alternative.** |
| `--input`      | `0 0% 30%`     | (mirror of border)         | |
| `--ring`       | `119 84% 66%`  | `--accent`                 | Focus ring = Lima |
| `--sidebar-background` | `0 0% 13%` | `--ink-900`            | Sidebar darker than page (matches O2 navigation darkness) |
| `--sidebar-foreground` | `0 0% 77%` | `--fg-muted`           | |
| `--sidebar-primary` | `119 84% 66%` | `--accent`            | Active item Lima |
| `--sidebar-primary-foreground` | `0 0% 4%` | `--accent-ink`     | |
| `--sidebar-accent` | `0 0% 18%`  | `--bg-elev`               | Item hover surface |
| `--sidebar-accent-foreground` | `0 0% 98%` | `--fg`             | |
| `--sidebar-border` | `0 0% 30%`  | mirror of `--border`      | |
| `--sidebar-ring` | `119 84% 66%` | `--accent`               | |

### 2.3 shadcn → O2 mapping (LIGHT mode)

| shadcn var | New value (HSL triplet) | O2 token | Notes |
|---|---|---|---|
| `--background`     | `60 9% 98%`     | `--bg`        | Off White |
| `--foreground`     | `0 0% 7%`       | `--fg`        | |
| `--card`           | `0 0% 100%`     | `--bg-elev`   | Pure white |
| `--popover`        | `0 0% 100%`     | `--bg-elev`   | |
| `--primary`        | `138 100% 42%`  | `--accent` = Lima 500 | **Different from dark mode** — see contrast rule § 3.1 of spec |
| `--primary-foreground` | `0 0% 100%` | `--accent-ink` (light)| White text on Lima 500 |
| `--secondary`      | `60 4% 95%`     | `--bg-elev-2` | |
| `--muted`          | `60 4% 95%`     | `--bg-elev-2` | |
| `--muted-foreground` | `0 0% 53%`    | `--fg-subtle` | |
| `--accent`         | `60 4% 95%`     | `--bg-elev-2` | hover surface, NOT Lima |
| `--border`         | `0 0% 0%` (with `/8` alpha at call) or `0 0% 88%` solid | Pragmatic: `0 0% 88%` |
| `--ring`           | `138 100% 42%`  | `--accent`    | |

### 2.4 New O2-only tokens (additive, no shadcn equivalent)

These do not replace anything — they are added so hand-rewritten components and future code can target the O2 spec verbatim:

```css
:root {
  /* O2 primitive tokens (mirrors of shadcn but with original O2 names) */
  --o2-bg:            hsl(var(--background));
  --o2-bg-elev:       hsl(var(--card));
  --o2-bg-elev-2:     hsl(var(--popover));
  --o2-surface:       hsl(var(--accent));
  --o2-fg:            hsl(var(--foreground));
  --o2-fg-muted:      hsl(var(--muted-foreground));
  --o2-fg-subtle:     hsl(var(--muted-foreground) / 0.7);
  --o2-accent:        hsl(var(--primary));
  --o2-accent-ink:    hsl(var(--primary-foreground));
  --o2-accent-soft:   hsl(var(--primary) / 0.14);
  --o2-border:        rgba(255, 255, 255, 0.10);
  --o2-border-strong: rgba(255, 255, 255, 0.20);

  /* Brand palette (raw, for explicit cases) */
  --lima-400: #63F161;
  --lima-500: #00D842;
  --lima-600: #00B038;
  --ink-900:  #212121;
  --ink-700:  #494949;
  --ink-500:  #676767;
  --ink-300:  #AAAAAA;
  --ink-200:  #BFBFBF;
  --ink-150:  #EAEAEA;

  /* Forma + motion (additive — no shadcn equivalent) */
  --radius-pill: 999px;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
}

[data-theme="light"], :root:not(.dark) {
  --o2-border:        rgba(0, 0, 0, 0.08);
  --o2-border-strong: rgba(0, 0, 0, 0.18);
}
```

**Note on theme switching:** the existing app uses `<html class="dark">` (see `index.html` lines 28–43). The O2 spec uses `data-theme="dark"`. **Recommendation:** keep `class="dark"` as the source of truth (zero JS rewrite), and add `[data-theme]` only as an alias if O2-original components are imported externally. Document this in an ADR.

---

## 3. Coexistence strategy & risk register

### 3.1 Recharts (`hsl(var(--primary))` strings) — LOW risk

**Affected:** 9 files (`PulseLineChart`, `ProgressChart`, `EngagementDetailDialog`, `HeadcountSparkline`, `EngagementChart`, `HRTurnoverTab`, `ObjectiveDetail`, `HR.tsx`, `OrgFlowNodes`, `OrganizationChartFlow`).

**Behavior after migration:** Because shadcn vars stay HSL triplets, `hsl(var(--primary))` continues to evaluate correctly — it will just render Lima instead of emerald. **No code change needed.**

**Caveat:** Lima `#63F161` against `#3A3A3A` is high-saturation high-luminance — bar/area charts may look loud. If charts are too aggressive, introduce a chart-specific ramp (`--chart-1`, `--chart-2`…) that uses desaturated Lima derivatives. Defer until QA flags it.

### 3.2 Opacity scaling (`bg-primary/10`, `bg-accent/50`) — LOW risk **only because we kept HSL**

**Why this matters:** Tailwind's `bg-primary/10` compiles to `background-color: hsl(var(--primary) / 0.1)`. This **only works because `--primary` is an HSL triplet**. If anyone ever rewrites the variables as hex (e.g. `--primary: #63F161`), every `/10` `/20` `/50` `/80` `/90` syntax across the codebase silently breaks.

**Enforcement:** the pattern is used 15+ places (avatars, focus states, gamification cards, BulkCheckin selection states). **Add a one-line comment in `src/index.css` warning future contributors.** Optionally, add an ESLint rule that bans hex in CSS var declarations under `@layer base`.

### 3.3 Toasts (sonner + shadcn toast) — LOW risk

`sonner.tsx` and `toast.tsx`/`toaster.tsx` consume `--background`, `--foreground`, `--border` directly. They will repaint automatically. No refactor needed.

### 3.4 Dialogs/Sheets/Drawers/Popovers/Dropdowns — LOW risk

All consume `--background`, `--popover`, `--border` via Tailwind utilities. Repaint is automatic. The only visual drift to watch: `border-border/50` patterns will become near-invisible on dark grey if `--border` is mapped to a low-contrast value. Recommendation: ship `--border: 0 0% 30%` (solid lookalike of `rgba(255,255,255,0.10)` over `#3A3A3A`) so existing `/50` half-borders remain perceptible.

### 3.5 Form primitives (Input, Select, Textarea, Checkbox, Radio) — MEDIUM risk

44–49 import sites. Repaint via token swap is cheap; the **risk is shape**: shadcn uses `rounded-md` (~10px), O2 spec uses pill for triggers but `--radius` 12px for fields. Keep shadcn's `rounded-md` for the primitives — the visual delta is small enough that this is not on the critical path. **Defer field shape harmonization to a v1.1 polish pass.**

### 3.6 Existing `objectives-page-bg`, `hero-header`, gradient utilities — MEDIUM risk

`src/index.css` defines a green-emerald gradient palette (`--gradient-primary`, `--gradient-hero`, `objectives-page-bg`) that hardcodes HSL values inline. These will visually clash with Lima. **Scope decision:** mark deprecated for v1, schedule rewrite in story §design-system-v1.1. Replace with a single `--o2-gradient-accent` (Lima 400 → Lima 600) when needed.

### 3.7 48 hardcoded hex literals across `components/` and `pages/` — TRACKED, NOT BLOCKING

Result of `grep "#[0-9a-fA-F]{3,6}"`. These are pre-existing tech debt (mostly in chart configs, status colors, avatar fallbacks). Not introduced by this migration. Schedule a follow-up sweep AFTER tokens land.

---

## 4. Rewrite priority — the 5 (+1) primitives

Ranked by **(visual impact × surface area frequency) ÷ rewrite cost**.

### Priority 1 — `Button` (118 import sites)

- **Why rewrite:** O2 button is a pill (`border-radius: 999px`), uppercase-ready, with specific padding (`14px 22px`), explicit `--accent` background, `filter: brightness(1.08)` hover, `translateY(1px)` active. shadcn default is `rounded-md`, no pill, generic hover. **Fundamentally different shape and motion.**
- **Strategy:** rewrite from scratch in `src/components/ui/button.tsx` preserving the existing `ButtonProps` and `buttonVariants` API — every call site keeps working.
- **Variants:** map `default → btn-primary`, `outline/ghost → btn-ghost`, `secondary → btn-ghost`, `destructive → btn-destructive` (custom), `link → keep underline style`, `sm → btn-sm`.
- **Risk:** the cva API + variant signature MUST stay identical or you break 118 files. Keep `forwardRef`, keep `asChild`, keep `Slot`. Only the class composition changes.
- **Test plan:** snapshot the rendered HTML on 3–4 high-traffic pages (Dashboard, Objectives, Mural).

### Priority 2 — `Card` (81 import sites)

- **Why rewrite:** O2 card is `border-radius: 20px` (`--radius-lg`), `padding: 28px`, border `var(--border)` with `:hover { border-color: var(--border-strong); }`. Current is `rounded-2xl border-border/50` with `hover:shadow-md`. Close visually but not on-spec.
- **Strategy:** rewrite while preserving the `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter` exports. Push the new spec values via class composition.
- **Risk:** `CardHeader` adds `p-6` and `CardContent` adds `p-6 pt-0`. If you change to `p-7` (28px), you'll subtly shift every layout. **Keep current padding in headers/content; apply 28px only on the outer `Card` for new pages**, OR ship the change and accept the visual reflow as part of the rebrand.
- **Recommended:** ship the reflow; a coordinated visual reset is more honest than half-a-design.

### Priority 3 — `AppSidebar` + `AppLayout` header (3 files total)

- **Why rewrite:** the sidebar is the most visible chrome — every authenticated screen has it. The shadcn `sidebar.tsx` is 22 KB of Radix primitives; it's preserved (don't rewrite the primitive), but **`AppSidebar.tsx` and `AppLayout.tsx` are application code** and they should be hand-tuned to O2's `.site-header` + dropdown patterns.
- **Surface area:** `AppSidebar` imported by `AppLayout` only; `AppLayout` imported by every authenticated page (~30). But the changes are localized to 2 files — call sites don't change.
- **Strategy:**
  - Keep `SidebarProvider`/`SidebarInset` shadcn primitives (free repaint via tokens).
  - Rewrite `AppSidebar.tsx` items to use Tusker for headings, JetBrains Mono for the brand label (`brand-name` § 6.7), Lima active states, pill hover.
  - Rewrite `AppLayout.tsx` header to match `.site-header` blur + `color-mix(in srgb, var(--bg) 90%, transparent)` background.
- **Risk:** LOW — the entire change is in 2 files no other code imports.

### Priority 4 — `Badge` (84 import sites)

- **Why rewrite:** O2 has a strong `chip` spec (§ 6.3) — JetBrains Mono, uppercase, `0.08em` letter-spacing, pill, dot indicator. Current shadcn badge is generic. Badges appear everywhere (status, departments, roles).
- **Strategy:** rewrite in place, keep `BadgeProps` and `badgeVariants` API. Map `default → chip with --accent dot`, `secondary → chip neutral`, `destructive → chip destructive`, `outline → chip ghost`.
- **Risk:** uppercase + mono changes the visual rhythm of every list. **Verify with Uma's mapping** before shipping — some surfaces (e.g. user names rendered as badges) should NOT be uppercase.
- **Mitigation:** introduce a `case` prop (`"upper" | "normal"`), default to `"upper"` for status, allow opt-out for proper-noun badges.

### Priority 5 — `Input` (44 import sites) — **OPTIONAL for v1**

- **Why defer:** O2 spec § 6.13 only documents `.copy-field` (a click-to-copy display field), NOT a generic input. Without explicit spec we'd be inventing. Repaint via tokens covers 95% of the visual delta.
- **Recommendation:** **TOKEN REPAINT ONLY for v1.** Promote to rewrite in v1.1 once Uma extracts visual specs from production O2 forms.

### Adapt-via-tokens-only (do NOT rewrite)

| Component | Reason |
|---|---|
| Dialog, AlertDialog, Sheet, Drawer | Radix primitives; repaint is enough. O2 spec doesn't define these. |
| Popover, HoverCard, DropdownMenu, Tooltip | Same — token repaint matches O2 dropdown aesthetic well. |
| Tabs, Toggle, Accordion | shadcn shapes are close enough to O2 implicit norms. |
| Avatar, Skeleton, Separator, ScrollArea, Progress | Pure structural; tokens cover them. |
| Select, Textarea, Checkbox, RadioGroup | See "Input" above — defer to v1.1. |
| Toast, Sonner, Toaster | Token repaint only. |
| Calendar, Carousel, Chart container, Command, ContextMenu, NavigationMenu, Pagination, Resizable | Niche / unmodified. |

---

## 5. Typography migration plan

### 5.1 Current state

- **Already loaded** (`index.html` line 13): Inter (300–700), Space Grotesk (400–700), JetBrains Mono (400, 500).
- **Already mapped** (`tailwind.config.ts` lines 18–20): `font-sans → Inter`, `font-heading → Space Grotesk`, `font-mono → JetBrains Mono`.
- **`font-heading` already used** in 25+ places (Index, Teams, Settings, NineBox, dashboard cards, dialogs).

### 5.2 Target state

- **Add** Tusker Grotesk (self-hosted, weights 600/700/900 — see spec § 2.5).
- **Add** Montserrat (Google Fonts, weights 300–800).
- **Keep** JetBrains Mono (weights 300/400/500/600 — extend the existing import).
- **Tailwind aliases:**
  - `font-sans` → `Montserrat` (replaces Inter as body)
  - `font-heading` → `Tusker Grotesk` (replaces Space Grotesk; adds `Anton`/`Barlow Condensed` fallbacks per § 2.6)
  - `font-mono` → `JetBrains Mono` (no change)
  - `font-display` → alias of `font-heading` (additive, for clarity)

### 5.3 Migration sequence

| Step | Action | Files | Effect |
|---|---|---|---|
| **T1** | Update Google Fonts `<link>` in `index.html` to add Montserrat (300–800) and extend JetBrains Mono (300, 600). Drop Inter once T4 lands. | `index.html` | Body font swap |
| **T2** | Drop Tusker Grotesk `.woff2` files in `public/fonts/tusker-grotesk/` and add `@font-face` declarations at top of `src/index.css`. **Do NOT block on this — fallback to Anton/Barlow Condensed (already loaded with O2 fonts) is acceptable for the first paint.** | `src/index.css`, `public/fonts/tusker-grotesk/*` | Display headlines |
| **T3** | Update `tailwind.config.ts` `fontFamily.sans` to `['Montserrat', 'system-ui', 'sans-serif']` and `fontFamily.heading` to `['"Tusker Grotesk"', 'Anton', '"Barlow Condensed"', 'Impact', 'sans-serif']`. Add `fontFamily.display` mirroring heading. | `tailwind.config.ts` | All `font-sans` / `font-heading` utilities switch globally |
| **T4** | In `src/index.css` `@layer base`, change `h1–h4` selectors: add `text-transform: uppercase`, `letter-spacing: 0.005em`, drop `font-bold/font-semibold` (Tusker carries weight from the family). Match § 2.7 of spec. | `src/index.css` lines 181–195 | Headings become editorial display |
| **T5** | Audit places where the current code uses `font-bold`/`font-semibold` on top of `font-heading` and decide per-case to keep (semantic emphasis) or drop (visual noise). 25 call sites — small. | various | Cleanup |
| **T6** | Introduce an `Eyebrow` component (spec § 6.4) — JetBrains Mono 11px `0.14em` uppercase. Use it in page heads, section labels. | `src/components/ui/eyebrow.tsx` (new) | Brings the editorial mono signal |

### 5.4 Where each font lives

| Family | Where |
|---|---|
| **Tusker Grotesk** | `<h1>` page titles, `<h2>` section heads, hero numbers, dashboard stat numbers (`StatCard.tsx`), `AppSidebar` brand wordmark. **NOT** in body, NOT in buttons, NOT in inputs. |
| **Montserrat** | Body, paragraphs, labels, button text, input text, dropdown menu items, table cells, dialog descriptions. Default for everything not explicitly Tusker or Mono. |
| **JetBrains Mono** | Eyebrows (section captions), KR chips, period labels, brand wordmark sub-label, breadcrumbs, copy fields, code/keyboard shortcuts (`<kbd>`), table column headers if uppercase. Already used in 6+ places (`PulseCommentsDrawer`, `BulkCheckinDialog`, `AppLayout.tsx kbd`). |

### 5.5 Risk

- **Visual reflow:** Montserrat is wider than Inter → expect 5–8% layout drift. QA all dense tables (people lists, OKR detail).
- **Tusker `.woff2` not yet present:** if Tusker files are missing at first deploy, Anton renders as fallback — visually close enough that a soft launch is acceptable.

---

## 6. Decision log

### ADR-DS-001 — Keep Tailwind utilities; repaint via shadcn HSL var swap

**Context:** 376+ shadcn import sites, plus chart strings, plus opacity scaling syntax, all depend on the `hsl(var(--x) / <alpha>)` contract.

**Decision:** Mutate the *values* of the existing shadcn HSL vars in `src/index.css`, do NOT introduce a parallel hex token system as the primary source of truth.

**Consequence:** All 9 chart files, all 15+ opacity-scaling sites, all third-party Radix primitives repaint with zero call-site changes.

**Trade-off accepted:** O2 hex tokens must be hand-converted to HSL triplets (one-time work, 18 conversions). The pure O2 token names (`--bg`, `--accent`) are introduced as **secondary aliases** that resolve to the shadcn vars.

---

### ADR-DS-002 — Charts continue using `hsl(var(--primary))` strings

**Context:** Dynamic recharts colors are baked into 9 component files as JSX string props (e.g. `stroke="hsl(var(--primary))"`).

**Decision:** Do not refactor chart files. The HSL triplet contract from ADR-001 makes them transparently re-color to Lima.

**Consequence:** Zero churn on charts. If chart color quality regresses (Lima too saturated for area fills), introduce `--chart-1..--chart-5` ramp tokens in a follow-up.

---

### ADR-DS-003 — Theme toggle stays on `class="dark"`, not `data-theme`

**Context:** O2 spec uses `<html data-theme="dark|light">`. Current app uses Tailwind's `darkMode: ["class"]` with `<html class="dark">` (see `index.html` lines 28–43, `tailwind.config.ts` line 5).

**Decision:** Keep the `class` strategy. Add `[data-theme="dark"]` as a duplicate selector wrapping the same vars only if/when O2-authored components are imported as a library.

**Consequence:** Zero JS changes to theme code. The `useTheme` hook in `index.html` keeps working. O2-authored CSS with `[data-theme]` selectors would not match — acceptable, we author our own.

---

### ADR-DS-004 — Hand-rewrite Button, Card, Badge, AppSidebar, AppLayout header. Defer Input and form primitives to v1.1

**Context:** Pill shape, padding, hover motion, and uppercase typography for buttons/badges are not achievable via token repaint alone. AppSidebar/AppLayout are the most visible chrome and have low blast radius (3 files).

**Decision:** Rewrite these 5 in priority order (Button → Card → Sidebar+Header → Badge). Preserve component APIs (props, variant names, exports) so call sites are untouched. Defer Input/Select/Textarea/Checkbox/RadioGroup to v1.1 once Uma extracts production specs.

**Consequence:** ~80% of the visual signal change ships with ~5 files of focused work. v1.1 polish pass closes the remaining 20%.

---

### ADR-DS-005 — Border tokens map to solid HSL lookalikes, not rgba

**Context:** O2 spec uses `--border: rgba(255,255,255,0.10)`. shadcn vars are HSL triplets. Mixing alpha-rgba into the shadcn slot breaks `border-border/50` syntax (you cannot multiply alphas).

**Decision:** Map `--border` to `0 0% 30%` (a solid HSL lookalike of `rgba(255,255,255,0.10)` over `#3A3A3A`). Expose the true rgba value as `--o2-border` for hand-rewritten primitives that need authentic alpha.

**Consequence:** `border-border/50` keeps working; visual diff is sub-perceptual. The 5 hand-rewritten primitives use `var(--o2-border)` directly for spec-perfect alpha.

---

## 7. Implementation start point for Dex

**Order of operations (one PR per step, each independently shippable):**

1. **PR 1 — Token swap.** Edit `src/index.css` only. Convert all dark/light shadcn vars to the values in § 2.2/2.3. Add the O2 alias layer from § 2.4. Add the deprecation comment for hex-in-vars. **Visual diff: full app reskins to Lima/Ink. No code changes.** Smoke test: every page renders without errors.

2. **PR 2 — Typography wiring.** Steps T1–T5 from § 5.3. **Visual diff: body font becomes Montserrat, headings shift toward Tusker (or Anton fallback if `.woff2` absent).** Smoke test: dense pages (People list, OKR detail) for layout regression.

3. **PR 3 — Button rewrite.** In place edit of `src/components/ui/button.tsx`. Preserve API, change class composition. **Visual diff: every button becomes a pill.** Smoke test: dialog footers, form submits, filters.

4. **PR 4 — Card rewrite.** In place edit of `src/components/ui/card.tsx`. Preserve API. **Visual diff: 20px radius, on-hover border emphasis.**

5. **PR 5 — AppSidebar + AppLayout rewrite.** Two files. Lima active states, JetBrains Mono brand label, blur header per § 6.7. **Visual diff: chrome locks in O2 identity.**

6. **PR 6 — Badge rewrite + Eyebrow primitive.** In place `badge.tsx` edit + new `eyebrow.tsx`. **Visual diff: status surfaces gain editorial typography.**

After PR 6: hand off to Uma for visual QA pass. Schedule v1.1 for Input/Select/forms.

---

## 8. Out of scope (tracked, not in this migration)

- Tusker Grotesk `.woff2` procurement (designer task — Uma to download from O2 Drive).
- 48 hardcoded hex literals in component code (separate cleanup story).
- `objectives-page-bg`, `gradient-hero`, `gradient-primary` legacy emerald gradients (deprecate, replace in v1.1).
- Form primitive shape harmonization (v1.1).
- Chart color ramp (introduce `--chart-1..5` only if QA flags Lima as too aggressive).
- `index.html` removal of Inter import (defer until PR 2 ships and confirms no fallback usage).

---

*— Aria, System Architect. End of audit.*
