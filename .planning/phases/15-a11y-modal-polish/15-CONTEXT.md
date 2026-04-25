# Phase 15: A11y + Modal Polish (GAP) - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Hygiene cleanup of accessibility + selector-scope debt surfaced by v1.0-MILESTONE-AUDIT.md. Closes:

- Phase 07.1 WR-02 (no focus trap on aria-modal drawer)
- Phase 07.1 WR-03 (no automated focus-return test on dialog close)
- Phase 07.1 WR-04 (no body scroll lock on drawer — partial; needs lift to dialogs)
- Phase 12.8 WR-01/02 (unscoped `document.querySelector` in `feat-sheet.tsx:274` + `skill-sheet.tsx:151`)
- Phase 06 WR-01 (unscoped zustand subscriptions in `feat-search.tsx:55`, `feat-board.tsx:14`, `feat-detail-panel.tsx:17`, `feat-sheet-tab.tsx:15`)
- Phase 06 WR-02 (unsafe `featId as CanonicalId` cast in `feat-sheet.tsx`)

**Out of scope:**
- New a11y features (skip-to-content, landmark roles, contrast tokens)
- New copy keys (Spanish surface frozen)
- Visual / style changes (D-NO-CSS invariant — see decisions)
- Phase 06 WR-03 (`FeatLevelInput.level` typed as number) + WR-04 (`selectFeatBoardView` per-render recomputation) — not listed in audit cluster; out of phase 15 SC
- Phase 16 feat-engine completion (separate phase)

</domain>

<decisions>
## Implementation Decisions

### Invariants (user-locked)
- **D-NO-CSS:** No style or visual changes. Zero new tokens, zero new font-weight, zero new hex colors, zero new spacing, zero new CSS files, zero CSS deletions. Diff `apps/planner/src/styles/` MUST be empty after phase 15. Reason: user instruction "no rompas estilos".
- **D-NO-COPY:** No new Spanish copy keys, no copy-string mutations. Reason: surface freeze + LANG-01 (catalog-sourced strings).
- **D-NO-DEPS:** No new npm dependencies. Reuse `zustand/react/shallow` (already in package), reuse existing refs idiom, reuse existing regex helpers. Reason: minimize attack surface, audit close.

### Focus Management
- **D-01 Focus trap mechanism:** Single shared `useFocusTrap` hook in `apps/planner/src/lib/a11y/use-focus-trap.ts`. Implements Tab/Shift-Tab cycle inside a container ref, no-op when `enabled === false`. Applied ONLY to non-`<dialog>` aria-modal surfaces (currently: mobile-nav-toggle drawer). The 4 native `<dialog>` surfaces (`confirm-dialog`, `save-slot-dialog` save+load, `version-mismatch-dialog`) trust browser top-layer trap from `showModal()` — already correct, no test value in re-trapping. Reason: minimal-surface, browser-native is correct, hook becomes future-proof for any custom modal added later.
- **D-02 Focus return:** Native `<dialog>.close()` returns focus to invocation element by browser convention; mobile-nav drawer already uses `wasOpenRef` + `toggleButtonRef.current?.focus()` pattern. Phase 15 adds RTL spec asserting focus-return behavior on close for ALL 4 dialogs + drawer (Phase 15 SC#2 acceptance gate). No new behavior added — only test coverage to lock the contract.

### Body Scroll Lock
- **D-03 Body scroll lock strategy:** Extract `useBodyScrollLock(active: boolean)` hook from existing mobile-nav-toggle.tsx inline impl (lines 59–67) into `apps/planner/src/lib/a11y/use-body-scroll-lock.ts`. Apply to: mobile-nav drawer (replace inline impl), `confirm-dialog`, `save-slot-dialog` (save + load), `version-mismatch-dialog`. Pattern: save previous `document.body.style.overflow`, set `'hidden'` while active, restore on cleanup. Stacking: hook is idempotent — multiple modals stacked use a module-level counter (`active++` on mount, `--` on cleanup; restore body when counter returns to 0) so a confirm-on-overwrite layered atop save-slot-dialog does not prematurely release lock. SSR-safe: `typeof document === 'undefined'` early-return preserved.

### Selector-Scope Cleanup
- **D-04 querySelector replacement:** Replace `document.querySelector` in `feat-sheet.tsx:274` (auto-scroll to general section on class-feat fill) + `skill-sheet.tsx:151` (scroll-reset on level change) with prop-threaded refs. Pattern: parent owners (`FeatBoard` for feat-sheet, `SkillBoard` parent for skill-sheet) forward a `scrollerRef: RefObject<HTMLElement>` to child via prop or `useImperativeHandle`. The `[data-slot-section="general"]` lookup in feat-sheet stays scoped via `scrollerRef.current?.querySelector('[data-slot-section="general"]')` — local-tree query NOT global-document query. Reason: closes the audit's "global selector" complaint while preserving runtime semantics; no DOM markup changes.
- **D-05 Cross-callsite scope check:** Grep confirms exactly 2 `document.querySelector` callsites in `apps/planner/src/`. No additional discovery work.

### Phase 06 Cleanup
- **D-06 Zustand subscription tightening:** Use `useShallow` from `zustand/react/shallow` (Zustand 5.x canonical). Single-line import per file. Apply to:
  - `feat-search.tsx:55` (replace `useFeatStore()` with `useFeatStore(useShallow((s) => ({...})))` selecting only `levels`, `activeLevel`, `datasetId`, `lastEditedLevel`)
  - `feat-board.tsx:14` (same pattern)
  - `feat-detail-panel.tsx:17` (same pattern, narrow to slices used)
  - `feat-sheet-tab.tsx:15` (same pattern)
  Reason: action functions excluded from subscription → reference stable across unrelated mutations → `useMemo` deps stop thrashing → cascade fix for Phase 06 WR-04 (selectFeatBoardView per-render thrash). Already on Zustand 5.0.10 — no upgrade needed.
- **D-07 Unsafe cast remediation (Phase 06 WR-02):** Add `canonicalIdRegex.test(featId)` guard at `feat-sheet.tsx` line 287 (handleSelectClassFeat) + line 296 (handleSelectGeneralFeat) before `setClassFeat` / `setGeneralFeat` dispatch. Silent fail-closed on mismatch (early return) — matches existing OptionList contract where invalid selections are programmer errors not user-visible. No new copy. `canonicalIdRegex` already exported from `@rules-engine/contracts/canonical-id`.

### Test Coverage (Phase 15 SC #2 mandate)
- **D-08 Focus-return spec:** New file `tests/phase-15/focus-return.spec.tsx` (jsdom). Asserts each of 4 native dialogs + drawer returns focus to opener element on close. Drives via fireEvent.click on opener → assert `document.activeElement === <dialog inner button>` after open → fireEvent.click on close button → assert `document.activeElement === opener` after close. JSDOM `<dialog>.showModal()` polyfill: install via test setup file (jsdom 22+ supports show/close but not focus return — manual focus restore in spec teardown if needed; verify with smoke test first plan task).
- **D-09 Focus-trap spec:** New file `tests/phase-15/focus-trap-drawer.spec.tsx`. Asserts Tab from last focusable inside mobile-nav drawer cycles back to first; Shift-Tab from first cycles to last.
- **D-10 Body-scroll-lock spec:** New file `tests/phase-15/body-scroll-lock.spec.tsx`. Asserts `document.body.style.overflow === 'hidden'` while any modal active; restores on close; stacking counter releases only on outermost close.
- **D-11 Vitest config:** Add `tests/phase-15/**/*.spec.tsx` to the jsdom glob in `vitest.config.ts` (mirror Phase 12.7 / 12.8 pattern).

### Plan Structure
- **D-12 Wave layout:** Single wave acceptable (no inter-plan deps requiring serialization). Suggested 3 plans for executor parallelization:
  - **15-01** A11y hooks + dialog wiring: extract `useFocusTrap` + `useBodyScrollLock`, apply to 4 dialogs + drawer, write tests D-08/D-09/D-10/D-11.
  - **15-02** querySelector scope-down: ref-thread feat-sheet:274 + skill-sheet:151, regression specs.
  - **15-03** Phase 06 cleanup: useShallow rollout to 4 files + canonicalIdRegex guard at feat-sheet, regression specs.
  Plans 15-01 / 15-02 / 15-03 touch disjoint files: parallelizable in one wave.

### Claude's Discretion
User said "tu decides, no rompas estilos" — Claude chose recommended option for every gray area. Open to revision before plan-phase. Style invariant D-NO-CSS is strict-locked.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 15 scope source
- `.planning/v1.0-MILESTONE-AUDIT.md` — phase 15 cluster (lines containing WR-01/02/03/04 entries scheduled for Phase 15) — authoritative scope list
- `.planning/ROADMAP.md` §"### Phase 15: A11y + Modal Polish (GAP)" — locked Success Criteria #1..#5

### Prior code reviews (root cause + suggested fixes)
- `.planning/phases/07.1-shell-narrow-viewport-nav-fix/07.1-REVIEW.md` — WR-02/03/04 root-cause analysis for drawer (focus trap, focus-return, body scroll lock)
- `.planning/phases/06-feats-proficiencies/06-REVIEW.md` §WR-01 + §WR-02 — root-cause + fix sketch for zustand + cast issues
- `.planning/phases/06-feats-proficiencies/06-VERIFICATION.md` — confirms warnings classification + risk

### Phase 12.8 audit context
- `.planning/phases/12.8-uat-04-23-residuals/12.8-REVIEW.md` §WR-01 + §WR-02 — `document.querySelector` callsites under audit
- `.planning/phases/12.8-uat-04-23-residuals/12.8-01-SUMMARY.md` §"D-02 retarget" — explains why the current scroll-reset uses `.skill-board .selection-screen__content` selector

### Source files in scope (live code)
- `apps/planner/src/components/shell/mobile-nav-toggle.tsx` — drawer (lines 14–25 Esc handler, 30–54 focus return, 59–67 body scroll lock; gap: focus trap missing on lines 83–101)
- `apps/planner/src/components/ui/confirm-dialog.tsx` — native dialog
- `apps/planner/src/components/ui/version-mismatch-dialog.tsx` — native dialog
- `apps/planner/src/features/summary/save-slot-dialog.tsx` — SaveSlotDialog + LoadSlotDialog (both native)
- `apps/planner/src/features/feats/feat-sheet.tsx` — querySelector L274, unsafe cast L287/L293/L296/L307
- `apps/planner/src/features/skills/skill-sheet.tsx` — querySelector L151
- `apps/planner/src/features/feats/feat-search.tsx` — unscoped `useFeatStore()` L55
- `apps/planner/src/features/feats/feat-board.tsx` — unscoped `useFeatStore()` L14
- `apps/planner/src/features/feats/feat-detail-panel.tsx` — unscoped `useFeatStore()` L17
- `apps/planner/src/features/feats/feat-sheet-tab.tsx` — unscoped `useFeatStore()` L15

### Idiom references (in-repo)
- `apps/planner/src/components/shell/mobile-nav-toggle.tsx:59-67` — body-scroll-lock impl to extract
- `apps/planner/src/components/shell/mobile-nav-toggle.tsx:30-54` — wasOpenRef focus-return idiom (reuse model)
- `packages/rules-engine/src/contracts/canonical-id.ts` (or wherever `canonicalIdRegex` lives) — runtime guard pattern
- `vitest.config.ts` — jsdom glob registration pattern (used by phase 12.6/12.7/12.8)

### External docs
- Zustand 5.x `useShallow` — https://github.com/pmndrs/zustand/blob/v5.0.10/docs/migrations/migrating-to-v5.md (confirm import path is `zustand/react/shallow`)
- `<dialog>` HTML spec — `showModal()` top-layer focus-trap behavior: https://html.spec.whatwg.org/multipage/interactive-elements.html#dom-dialog-showmodal
- WAI-ARIA `aria-modal` requirements — https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`document.body.style.overflow` swap pattern** at `mobile-nav-toggle.tsx:59-67` — already battle-tested for iOS Safari momentum scroll. Lift verbatim into `useBodyScrollLock`. Add stacking counter to handle layered modals (overwrite-confirm atop save-slot).
- **`wasOpenRef` open-transition pattern** at `mobile-nav-toggle.tsx:30-54` — distinguishes "default-closed on mount" from "just-closed transition". Pattern is the same shape needed for any focus-trap exit cleanup.
- **`useEffect` open/close mirror with `dialog.open` guard** at all 4 dialogs (`if (open && !el.open) el.showModal(); else if (!open && el.open) el.close()`) — stable contract, do not refactor; new hooks compose alongside it.
- **`canonicalIdRegex`** in `@rules-engine/contracts/canonical-id` — runtime regex already exists for Zod-typed shape `${kind}:${slug}`. Reuse.

### Established Patterns
- **Phase-numbered Vitest globs** in `vitest.config.ts` — `tests/phase-XX/**/*.spec.tsx` registered as jsdom. Pattern: append `tests/phase-15/**/*.spec.tsx` for the new specs without disturbing existing globs.
- **Atomic per-store-action selectors** in `mobile-nav-toggle.tsx:7-9` (`useStore((s) => s.X)` × 3) — the cheapest narrow-subscription pattern. `useShallow` reserved for cases needing >3 fields where 3 atomic calls would be noisier.
- **No-CSS phase precedent** — Phase 12.7-03 shipped 3 UAT findings with `git diff apps/planner/src/styles/` empty (D-13 invariant). Phase 15 inherits the same gate.

### Integration Points
- New hooks land in `apps/planner/src/lib/a11y/` — directory does not yet exist; first use creates it.
- New tests land in `tests/phase-15/` — directory does not yet exist; first use creates it.
- `vitest.config.ts` gains exactly one new glob entry.
- 5 source files modified (mobile-nav-toggle + 4 dialogs) for hook adoption.
- 2 source files modified (feat-sheet + skill-sheet) for ref scope-down.
- 4 source files modified (feat-search + feat-board + feat-detail-panel + feat-sheet-tab) for `useShallow`.
- 1 source file modified (feat-sheet again) for canonicalIdRegex guard — coordinate with 15-02 ref-scope changes (same file).

### Constraints From This Codebase
- **No JSX in `.spec.tsx`** — Vitest default esbuild lacks React runtime auto-inject. Use `createElement(Component, props)` (Phase 12.8-03 D-13 invariant).
- **`afterEach(cleanup)` required** in every Vitest RTL suite with multiple `it` blocks — globals don't auto-cleanup (Phase 12.8-03 invariant).
- **Windows CRLF** on .ts/.tsx — when Edit's old_string normalization fails on long multi-line blocks, fall back to `powershell -Command 'ReadAllLines + WriteAllText'` (Phase 12.8-04 idiom).

</code_context>

<specifics>
## Specific Ideas

User instruction (verbatim): "tu decides, no rompas estilos" → translates to D-NO-CSS strict invariant + Claude-discretion on every other choice.

No other specific references. Standard hook-extract + ref-thread + selector-narrow patterns acceptable.

</specifics>

<deferred>
## Deferred Ideas

- **Phase 06 WR-03** — `FeatLevelInput.level: number` should be `ProgressionLevel` union — not in Phase 15 audit cluster. Defer.
- **Phase 06 WR-04** — `selectFeatBoardView` per-render recomputation — not in Phase 15 audit cluster, but D-06 useShallow rollout partially mitigates. Defer the deeper fix.
- **DEF-12.4-02** — `font-weight: 700` carry-forward design-token violation — explicitly out of scope (D-NO-CSS).
- **6 pre-existing Vitest baseline failures** (BUILD_ENCODING_VERSION literal=1 + 5 prestige-gate.fixture/class-picker schema drift) — out of scope; Phase 13 baseline.
- **Skip-to-content link / landmark role audit / WCAG 2.2 contrast pass** — would be its own A11y hardening phase if pursued.
- **`inert` attribute on background root** — modern alternative to focus-trap, but not universally supported pre-Safari 15.4. Re-evaluate post-v1.0 if browser baseline shifts.

</deferred>

---

*Phase: 15-a11y-modal-polish*
*Context gathered: 2026-04-25*
