---
phase: 3
slug: character-origin-base-attributes
status: approved
shadcn_initialized: false
preset: none
created: 2026-03-30
---

# Phase 3 — UI Design Contract

> Visual and interaction contract for frontend phases. Generated manually after the UI subagent workflow stalled, then validated against the standard UI-SPEC dimensions.

---

## Reference Inputs

- `C:/Users/pzhly/Pictures/Screenshots/Captura de pantalla 2026-03-30 133648.png` — baseline reference for the in-game character-creation layout, sheet framing, and dark gold presentation.
- `C:/Users/pzhly/Documents/GitHub/NWN 1 character builder/NWN UI Mock/` — broader reference library for related creation screens, button treatment, help panes, and selection lists.
- `.planning/phases/03-character-origin-base-attributes/03-CONTEXT.md` — locked user decisions for Phase 3 scope and behavior.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | lucide-react |
| Font | Cormorant Garamond (display) + Spectral (body) |

---

## Layout Contract

- Preserve the Phase 2 routed shell and persistent summary panel, but make the `Construcción` and `Atributos` views feel like embedded NWN character-creation boards rather than generic content pages.
- `Construcción` uses a two-zone board inside the main content area: a left stacked creation-step rail and a right live character-sheet/help pane.
- Phase 3 substeps in `Construcción`: `Raza`, `Subraza`, `Alineamiento`, `Deidad`.
- `Atributos` mirrors the same board logic: the left pane owns base-attribute allocation and budget controls, while the right pane shows the live sheet, derived totals, and rule explanations.
- Only the Phase 3 subset of the creation flow is active. Later-phase concerns such as `Clase`, `Conjuntos`, `Retrato`, and similar steps may appear only as non-interactive future shell context, not as active controls.
- Primary action buttons stay bottom-aligned inside the board, matching the in-game accept or cancel rhythm rather than floating page CTAs.
- On mobile, the left step rail collapses into a top step strip or stacked stage cards, but the right-side sheet preview remains visible directly below the active controls.

---

## Interaction Contract

- Origin selection is visibly stepped and dependent: users always see the ordered steps, but locked steps remain visibly present until prerequisites are satisfied.
- `Atributos` is not editable until the origin is sufficiently defined; do not allow early edits followed by later reconciliation.
- Optional deity handling uses a visible `Sin deidad` state, not a hidden or disabled field.
- Budget-led attribute editing is the primary interaction model when the supported creation rule exposes spend or remaining points.
- Validation is immediate and local: blocked or illegal choices show the reason beside the affected control, while the outer summary panel reflects the global state as `Bloqueada` or `Inválida`.
- Help text lives in a dedicated pane that feels like in-game rule guidance, not a tooltip cloud or modern helper banner.
- Active selections use a restrained blue-black fill inside a gold frame, echoing the reference screens.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, stat glyph spacing, thin inline separators |
| sm | 8px | Compact list padding, row spacing inside sheet tables |
| md | 16px | Default control padding, label spacing, local inline feedback |
| lg | 24px | Internal panel padding, action row spacing |
| xl | 32px | Gap between left step rail and right sheet pane |
| 2xl | 48px | Major section break inside the main board |
| 3xl | 64px | Page-level spacing and outer shell breathing room |

Exceptions: none

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 600 | 1.3 |
| Heading | 30px | 600 | 1.2 |
| Display | 42px | 700 | 1.1 |

Notes:
- Section titles and board headers use `Cormorant Garamond`.
- Body copy, list labels, and rule explanations use `Spectral`.
- Avoid sans-serif replacements inside the Phase 3 creation board.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #050403 | Board background, deep void surfaces, main creation canvas |
| Secondary (30%) | #17120f | Inner panels, help pane, sheet table surfaces |
| Accent (10%) | #9f7a31 | Borders, active step frames, stat controls, confirm buttons, status badges |
| Selection Fill | #41506a | Active list item background only |
| Destructive | #7a1f1f | Destructive actions only |

Accent reserved for: panel outlines, active row frames, confirm actions, blocked-state markers, and stat-adjust controls only.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | Confirmar origen |
| Empty state heading | El origen del personaje sigue incompleto |
| Empty state body | Selecciona raza, subraza, alineamiento y deidad en Construcción para desbloquear Atributos. |
| Error state | Elección bloqueada: completa el paso anterior o cambia la opción marcada para continuar. |
| Destructive confirmation | Reiniciar base: se perderán el origen y las características iniciales. |

---

## State and Feedback Contract

- `legal`: quiet confirmation only; avoid bright success green or celebratory banners.
- `illegal`: inline reason plus the affected row or field framed with destructive tint.
- `blocked`: use blocked language when data or prerequisites are missing; do not pretend a blocked choice is merely invalid.
- Summary panel status must stay synchronized with the most severe current state.
- Locked steps remain legible and visible so the user understands the creation sequence.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | none | not required |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-03-30
