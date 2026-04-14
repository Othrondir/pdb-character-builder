---
phase: 4
slug: level-progression-class-path
status: approved
shadcn_initialized: false
preset: none
created: 2026-03-30
---

# Phase 4 — UI Design Contract

> Visual and interaction contract for the level-progression editor inside `Construcción`. Generated inline after the UI workflow gate, then validated manually against the standard UI-SPEC dimensions.

---

## Reference Inputs

- `.planning/phases/03-character-origin-base-attributes/03-UI-SPEC.md` — approved NWN1 board language, typography, and color contract that Phase 4 must preserve.
- `.planning/phases/04-level-progression-class-path/04-CONTEXT.md` — locked screen, rail, and downstream-repair decisions.
- `.planning/phases/04-level-progression-class-path/04-RESEARCH.md` — progression-store, class-path, and validation recommendations.
- `apps/planner/src/features/character-foundation/origin-board.tsx` — current Build board structure and left-control/right-sheet composition.
- `apps/planner/src/features/character-foundation/attributes-board.tsx` — current board density and stat-editor treatment.
- `apps/planner/src/styles/tokens.css` and `apps/planner/src/styles/app.css` — active tokens and motion already present in the planner shell.

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

- Preserve the existing routed shell and persistent summary panel. Phase 4 changes only the contents of `Construcción`, not the global navigation structure.
- `Construcción` remains a single board-like screen with three visible layers inside the main content area:
  1. a compact foundation summary strip near the top,
  2. a dominant level rail covering `1-16`,
  3. a right-side active level sheet for the selected level.
- The foundation summary is secondary in visual weight. It must confirm race, subrace, alignment, deity, and base-attribute snapshot without competing with the progression editor.
- The level rail is the primary navigator. It should read like a progression ledger rather than a modern stepper: each level cell stays visible, numbered, and status-coded.
- The active level sheet owns the editable details for the currently selected level: class selection, prerequisite state, gains, and level-based ability increase if that level grants one.
- The rail and active sheet should sit inside the same dark framed creation board introduced in Phase 3; do not split them into separate page cards with different visual language.
- Desktop layout target:
  - top: foundation summary strip,
  - left or center column: vertical or stacked rail with dense level cells,
  - right column: wider detail sheet with the selected level's controls and rule feedback.
- Mobile layout target:
  - foundation summary stays first,
  - the rail compresses into a horizontal strip or stacked compact list,
  - the active level sheet appears immediately after the active rail segment,
  - users should never have to navigate to another route or drawer to edit a level.

---

## Interaction Contract

- Clicking any level in the rail switches the active level sheet without discarding later levels or unsaved in-memory edits.
- Upstream edits are preserve-first. When a lower level invalidates later choices, the later levels remain present in the rail with explicit blocked or invalid status.
- Broken downstream levels must look repairable, not dead. The user needs to understand both which levels broke and why.
- The selected level cell uses the same restrained blue-black fill from Phase 3, framed by gold, to connect the rail with the active sheet.
- Level cells must expose at least four states at a glance:
  - `Pendiente`
  - `Legal`
  - `Bloqueada`
  - `Inválida`
- The active sheet should surface prerequisite outcomes inline, close to the affected class choice, not in detached banners at page top.
- When a level grants an ability increase, that decision appears as a first-class block inside the active level sheet. It should not be hidden behind `Atributos`.
- The sheet must summarize gains for the chosen class at that level in a readable ledger style, not as a dense rules paragraph.
- The foundation summary may include a shortcut or reminder to revisit `Atributos`, but it must not let users edit aggregate attributes from inside Phase 4.
- Primary actions stay local to the level sheet or board footer and follow the in-game accept rhythm rather than floating web CTAs.

---

## Visual Direction

- Keep the approved NWN1-inspired dark-and-gold board language. The progression editor should feel like a deeper character-sheet stage, not a new product area.
- The rail should evoke a class ledger or campaign record:
  - compact framed level plates,
  - visible numbering,
  - subtle separators for status and class label,
  - no rounded modern pill strip spanning the whole board.
- The active level sheet should feel slightly more ceremonial than the rail, with a wider inner frame and clear sub-sections for `Clase`, `Requisitos`, `Ganancias`, and `Aumento de característica`.
- Use gold borders and panel glows sparingly. Accent should identify active/important state, not flood the board.
- Invalid or blocked downstream levels should rely on dark red or muted bronze framing, never bright warning yellow or generic app toasts.
- Reuse the existing reveal motion (`section-fade`, `shell-reveal`) or a close cousin. Do not introduce flashy slide carousels for level switching.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline separators inside level cells, micro gaps in gain rows |
| sm | 8px | Dense rail-cell padding, icon gaps, tag spacing |
| md | 16px | Default control spacing, inline validation blocks, summary rows |
| lg | 24px | Rail-to-sheet breathing room, inner board padding |
| xl | 32px | Gap between summary strip and progression board |
| 2xl | 48px | Major split between rail cluster and active sheet on desktop |
| 3xl | 64px | Outer page breathing room only |

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
- Level numbers may use display styling, but only inside compact framed cells; avoid oversized numerals that dominate the board.
- Section titles inside the active level sheet use `Cormorant Garamond`.
- Class labels, validation copy, and gain summaries use `Spectral`.
- Do not introduce sans-serif UI fallback in the progression board unless already required by an external widget.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #050403 | Main progression board background, rail canvas, deep sheet surfaces |
| Secondary (30%) | #17120f | Inner cards, summary strip interior, inactive level cells |
| Accent (10%) | #9f7a31 | Borders, active frames, headings, key separators, confirm actions |
| Selection Fill | #41506a | Active level cell and focused choice rows only |
| Destructive | #7a1f1f | Invalid states, illegal prerequisites, hard-stop rule framing |

Accent reserved for: active level frame, headings, cell borders, section dividers, confirm actions, and blocked markers only.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Foundation strip heading | Base del personaje |
| Rail heading | Progresión 1-16 |
| Active sheet heading | Hoja del nivel |
| Class section heading | Clase del nivel |
| Prerequisites heading | Requisitos de entrada |
| Gains heading | Ganancias del nivel |
| Ability increase heading | Aumento de característica |
| Pending level label | Pendiente |
| Blocked level label | Bloqueada |
| Invalid level label | Inválida |
| Legal level label | Legal |
| Downstream repair message | Este nivel se conserva, pero depende de corregir decisiones anteriores. |
| Class blocked message | La clase no puede elegirse todavía: revisa los requisitos marcados. |
| Ability increase helper | Este nivel concede un aumento de característica que se reflejará en Atributos. |

---

## State and Feedback Contract

- `pending`: the level exists in the 1-16 rail but still lacks the decisions required to be considered complete.
- `legal`: use quiet confirmation only. The cell may feel complete, but avoid celebratory green.
- `blocked`: use when the level cannot currently be repaired because earlier levels or missing data prevent legal evaluation.
- `illegal`: use when the selected class path or decision is known to violate a rule at that level.
- The same status vocabulary must appear consistently in the rail, the active sheet, and the persistent summary panel.
- Inline issues should reference the specific broken prerequisite or progression rule whenever possible; avoid vague global copy like `Hay errores en la construcción`.
- Downstream issues should identify that the break was inherited from an earlier edit, not presented as if the user manually broke only the active level.

---

## Mobile and Responsiveness Contract

- At widths below the current board breakpoint, the rail and sheet stack into one column without losing the active-level context.
- The active level must remain visibly associated with its rail entry after the stack; spacing and repeated level heading should make the association obvious.
- The foundation summary strip may wrap into two columns or stacked rows, but it must remain more compact than the progression editor.
- Level cells should stay tappable at mobile sizes with a minimum 44px interaction target.
- Avoid horizontal overflow traps inside the active sheet. Gain summaries and prerequisite lists must wrap cleanly.

---

## Motion Contract

- Reuse subtle fade or rise-in transitions already present in the planner shell when switching the active level or first revealing the progression board.
- Motion should clarify focus changes only:
  - rail selection updates,
  - active sheet content refresh,
  - downstream status changes after upstream edits.
- Do not animate every rail cell independently on load.

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
