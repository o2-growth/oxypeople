
# Fix: Solid Backgrounds for Objectives Page Components

## Problem
The green gradient background on the Objectives page causes the tree nodes, context bar, and filter area to appear transparent and "floating" without clear boundaries. The Executive Summary cards at the top look fine because they use the `<Card>` component (which has `bg-card`), but everything below blends into the gradient.

## Solution
Add solid opaque backgrounds to all content sections below the hero header so they stand out clearly against the gradient.

## Changes

### 1. ObjectiveTreeNode (`src/components/objectives/ObjectiveTreeNode.tsx`)
- Add `bg-card` to the main wrapper div (line 129-134) so each tree node has a solid white/dark background instead of being transparent against the gradient.

### 2. ObjectivesContextBar (`src/components/objectives/ObjectivesContextBar.tsx`)
- Wrap the entire context bar in a solid `bg-card` container with rounded corners, padding, border, and shadow to create a clear visual panel separating filters from the gradient background.

### 3. Objectives Page (`src/pages/Objectives.tsx`)
- Wrap the tree/map/actions content area in a `bg-card` rounded container so even the empty state and collapsible department headers have a solid background, creating a clean "panel" feel for the entire lower section.

## Technical Details
- `bg-card` maps to `--card` CSS variable (white in light mode, dark surface in dark mode) -- already used by the Card component throughout.
- Adding `shadow-sm` and `border` for subtle depth, matching the existing design system.
- The context bar wrapper will use `rounded-xl p-4 border border-border/40 shadow-sm` for consistency with other panels.
- The content area wrapper will use similar styling to contain all tree nodes in one cohesive panel.
