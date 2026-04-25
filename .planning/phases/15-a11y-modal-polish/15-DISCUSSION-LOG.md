# Phase 15: A11y + Modal Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 15-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 15-a11y-modal-polish
**Areas discussed:** All 4 gray areas (user delegated)

---

## Gray Area Selection

**Question:** Which gray areas to discuss for Phase 15?

| Option | Description | Selected |
|--------|-------------|----------|
| Focus trap mechanism | Shared useFocusTrap hook ALL aria-modal vs trust native <dialog> + custom drawer trap | ✓ (delegated) |
| Body scroll lock | Extract useBodyScrollLock hook vs inline per-dialog vs inert vs body-scroll-lock npm | ✓ (delegated) |
| querySelector replacement | Prop-threaded refs vs Context vs scoped useRef on ancestor | ✓ (delegated) |
| Phase 06 cleanup | useShallow vs atomic selectors + canonicalIdRegex guard vs Zod parse vs invariant comment | ✓ (delegated) |

**User's choice:** "tu decides, no rompas estilos" (You decide, don't break styles)
**Notes:** User delegated all gray areas to Claude with one strict invariant: no style/visual changes. This locked D-NO-CSS as the controlling constraint across all decisions.

---

## Locked Decisions (Claude's Discretion)

### Focus trap mechanism
- **Chosen:** Shared `useFocusTrap` hook applied ONLY to non-`<dialog>` aria-modal surfaces (mobile-nav drawer). Native `<dialog>` surfaces trust browser top-layer trap from `showModal()`.
- **Rationale:** Browser-native trap is correct for `<dialog>`. Re-trapping atop it adds zero value, costs test surface. Extracted hook is future-proof for any custom modal pattern added later.
- **Rejected:** Belt-and-braces hook on all 5 surfaces (rejected — no behavior delta on the 4 dialogs, only test churn).

### Body scroll lock
- **Chosen:** Extract `useBodyScrollLock` from existing mobile-nav-toggle inline impl. Apply to drawer + 4 dialogs. Stacking counter for layered modals.
- **Rationale:** Pattern already proven at lines 59–67 of mobile-nav-toggle (iOS Safari momentum scroll handled). No new dep, no new bundle weight, zero CSS impact.
- **Rejected:** `body-scroll-lock` npm package (rejected — D-NO-DEPS), `inert` attribute (rejected — Safari pre-15.4 gap), inline copy-paste per dialog (rejected — 5 sites would drift).

### querySelector replacement
- **Chosen:** Prop-threaded refs via `forwardRef` / `useImperativeHandle` on the panel ancestor. Internal scoped queries via `scrollerRef.current?.querySelector`.
- **Rationale:** 2 callsites — Context provider is overkill. Refs are the React-canonical pattern for cross-component DOM coordination. Zero markup or style churn.
- **Rejected:** React Context (rejected — overkill for 2 sites), unique data-attribute global lookup (rejected — same audit complaint as the original `document.querySelector`).

### Phase 06 cleanup
- **Zustand:** `useShallow` from `zustand/react/shallow`. Single import per file, narrow object selector.
- **WR-02 cast:** `canonicalIdRegex.test(featId)` guard, silent fail-closed return on mismatch.
- **Rationale:** `useShallow` is canonical Zustand 5.x pattern, package already pinned at 5.0.10. `canonicalIdRegex` already exported, matches existing OptionList programmer-error contract (no user-visible copy needed).
- **Rejected:** Atomic per-field selectors (rejected — 4-field shape thrash, useShallow cleaner), Zod parse helper (rejected — unnecessary heft for already-trusted catalog data), invariant comment only (rejected — does not satisfy SC #5 "unsafe type assertion removed").

---

## User-Locked Invariants

- **D-NO-CSS:** No style or visual changes. `git diff apps/planner/src/styles/` MUST be empty.
- **D-NO-COPY:** No new Spanish copy keys.
- **D-NO-DEPS:** No new npm dependencies.

These flow into 15-CONTEXT.md as strict gates that downstream agents (researcher, planner, executor) MUST honor.

---

## Deferred Ideas

See `15-CONTEXT.md` `<deferred>` section.

- Phase 06 WR-03 (`FeatLevelInput.level` as `number`) — not in audit cluster
- Phase 06 WR-04 (`selectFeatBoardView` per-render recompute) — not in audit cluster
- DEF-12.4-02 font-weight:700 — out of scope (D-NO-CSS)
- 6 pre-existing baseline Vitest failures — Phase 13 carry-forward
- WCAG 2.2 contrast pass / skip-to-content / landmark role audit — would be its own phase
- `inert` attribute on background root — re-evaluate post-v1.0 when Safari baseline ≥15.4
