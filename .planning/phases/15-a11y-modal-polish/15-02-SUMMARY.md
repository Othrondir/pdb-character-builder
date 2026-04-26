---
phase: 15-a11y-modal-polish
plan: 02
subsystem: ui
tags: [selector-scope, dom-query-narrowing, ref-threading, canonical-id-guard, phase-12.8-WR-01, phase-12.8-WR-02, phase-06-WR-02, react-19, jsdom, vitest]

# Dependency graph
requires:
  - phase: 12.8-uat-04-23-residuals
    provides: feat-sheet auto-scroll-to-general effect (D-04, F3) and skill-sheet retargeted scroll-reset useLayoutEffect (D-02, F1+F2) — both consuming document.querySelector at the time of the audit
  - phase: 06-feats-proficiencies
    provides: canonicalIdRegex export from @rules-engine/contracts/canonical-id and unsafe `featId as CanonicalId` cast sites in feat-sheet handlers
  - phase: 15-01
    provides: tests/phase-15 jsdom glob registration in vitest.config.ts (used to pick up the two new RED specs without further config)
provides:
  - SelectionScreen.contentRef optional prop forwarded to .selection-screen__content (apps/planner/src/components/ui/selection-screen.tsx) — backward compatible when omitted
  - FeatBoard-owned scrollerRef threaded into FeatSheet.scrollerRef prop; auto-scroll lookup now scopes [data-slot-section="general"] under the .feat-board__main subtree
  - SkillBoard-owned scrollerRef threaded into both SelectionScreen.contentRef and SkillSheet.scrollerRef; useLayoutEffect mutates scrollerRef.current.scrollTop without any document-level query
  - canonicalIdRegex.test silent fail-closed guards at handleSelectClassFeat + handleSelectGeneralFeat entries (closes Phase 06 WR-02)
  - Two new jsdom regression specs (tests/phase-15/feat-sheet-scroll-scope.spec.tsx, tests/phase-15/skill-sheet-scroll-scope.spec.tsx) locking the scoped behaviour and the regex-guard contract
affects: [15-03-zustand-shallow, future selector-scope hardening passes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parent-owned ref threaded through prop boundary — Board owns useRef<HTMLDivElement>(null); SelectionScreen.contentRef + Sheet.scrollerRef receive the SAME ref; both effects (scroll-reset, auto-scroll) scope queries / mutations under that ref"
    - "Optional ref props with React 19 RefObject<T | null> types — components stay backward compatible when the prop is omitted (existing harnesses keep mounting; effect no-ops on null current)"
    - "Handler-entry runtime regex guard — canonicalIdRegex.test(featId) before unsafe `as CanonicalId` cast; silent fail-closed (early return, no copy, no toast) per existing OptionList contract"

key-files:
  created:
    - tests/phase-15/feat-sheet-scroll-scope.spec.tsx
    - tests/phase-15/skill-sheet-scroll-scope.spec.tsx
  modified:
    - apps/planner/src/components/ui/selection-screen.tsx
    - apps/planner/src/features/feats/feat-board.tsx
    - apps/planner/src/features/feats/feat-sheet.tsx
    - apps/planner/src/features/skills/skill-board.tsx
    - apps/planner/src/features/skills/skill-sheet.tsx
    - tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx

key-decisions:
  - "Single ref attached to .feat-board__main (Option A from CONTEXT) instead of .selection-screen__content for FeatBoard — the [data-slot-section] attribute lives strictly inside <FeatSheet> which is a child of .feat-board__main, so the inner wrapper is sufficient and avoids the SelectionScreen.contentRef forwarding for FeatBoard. SkillBoard does need contentRef forwarding because the SkillSheet's overflow owner is the SelectionScreen content div itself (12.7-03 + 12.8-01 invariant)."
  - "Phase 12.7 harness updated as fixture-only edit per plan verification block (tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx) — production wiring now requires the parent owner to thread scrollerRef, and the 12.7 harness mirrors that wiring so C1/C2 still exercise the same scroller node the effect mutates. No production behaviour change."
  - "canonicalIdRegex guards placed at handler ENTRIES (handleSelectClassFeat after the deselect-by-equality short-circuit; handleSelectGeneralFeat at the very top, before the indexOf) — deselect paths are intentionally unguarded because the equality / index predicates already imply prior-validated storage. Guarding clears would trap users with previously-stored ids if a future regex tightens."

patterns-established:
  - "scrollerRef prop convention: Board components own useRef<HTMLDivElement>(null) and forward it to both SelectionScreen.contentRef (when the scroller is owned by SelectionScreen itself) and the inner Sheet.scrollerRef. Inner sheet effects scope queries / scrollTop mutations under that ref."
  - "fixture-only test update vs production change: when the production source moves a responsibility from inner to outer (here: scroll-reset moves from skill-sheet self-query to skill-board ref-thread), legacy harnesses that mounted only the inner component need updating to mirror the production wiring. Documented as a fixture-only deviation with no production behaviour delta."

requirements-completed: []

# Metrics
duration: 28min
completed: 2026-04-26
---

# Phase 15 Plan 02: querySelector Scope-Down + canonicalIdRegex Guard Summary

**Replaced two unscoped `document.querySelector` callsites in feat-sheet.tsx + skill-sheet.tsx with parent-owned scrollerRef-scoped lookups, and installed `canonicalIdRegex.test` silent-fail-closed guards at the two feat-sheet handler entries — closing Phase 12.8 WR-01/02 and Phase 06 WR-02 in a single coordinated edit pass.**

## Performance

- **Duration:** ~28 min (1675 s)
- **Started:** 2026-04-26T11:35:22Z
- **Completed:** 2026-04-26T12:03:17Z
- **Tasks:** 1 (TDD-flagged single task — RED specs pre-authored under tests/phase-15/)
- **Files created:** 2 (the two RED specs)
- **Files modified:** 6 (5 source + 1 fixture-only test harness)

## Accomplishments

- **SC#4 closed (querySelector scope-down):** `apps/planner/src/features/feats/feat-sheet.tsx` and `apps/planner/src/features/skills/skill-sheet.tsx` both drop `document.querySelector` entirely. The feat-sheet auto-scroll-to-general effect now does `scrollerRef?.current?.querySelector('[data-slot-section="general"]')` under the .feat-board__main subtree; the skill-sheet useLayoutEffect now does `scrollerRef?.current?.scrollTop = 0` directly. `grep -c "document.querySelector"` against both files returns 0.
- **SC#5 partial closed (canonicalIdRegex guard):** `feat-sheet.tsx` imports `canonicalIdRegex` from `@rules-engine/contracts/canonical-id` and gates both `handleSelectClassFeat` (after the deselect-by-equality short-circuit) and `handleSelectGeneralFeat` (at handler entry) with `if (!canonicalIdRegex.test(featId)) return;`. The three `featId as CanonicalId` casts (L324 / L334 / L345 post-edit) sit behind a verified runtime regex check. Closes Phase 06 WR-02.
- **Two new regression locks:** `tests/phase-15/feat-sheet-scroll-scope.spec.tsx` (4 cases — A1 subtree containment via `vi.spyOn(scrollIntoView)` + B1/B2 regex contract + C1 canonical round-trip via setClassFeat dispatch) and `tests/phase-15/skill-sheet-scroll-scope.spec.tsx` (3 cases — level-change scrollTop reset, null-ref tolerance, no-prop tolerance). Both spec files GREEN (`exit=0`, no unhandled errors).
- **Phase 12.8-03 BLOCKER 2 invariant preserved:** `const activeLevel = boardView.activeSheet.level;` remains the single declaration in feat-board.tsx (grep confirms count = 1).
- **project_raf_scroll_pitfall.md respected:** zero `requestAnimationFrame` references in feat-sheet.tsx; the `scrollIntoView({block:'nearest'})` call shape stays synchronous from inside the useEffect body.
- **Phase 15-03 file-coordination boundary respected:** No edits to the L42 `useFeatStore()` line in feat-board.tsx. 15-02 only touches the JSX-tree edits + scroll-related imports per CONTEXT.md B1 file-coordination notice.

## Task Commits

1. **Task 1: scoped scroll lookups + canonicalIdRegex guards + 2 regression specs** — `d375bb8` (feat)

## Files Created/Modified

### Created

- `tests/phase-15/feat-sheet-scroll-scope.spec.tsx` — 4 cases. A1 spies `Element.prototype.scrollIntoView` (with a suite-level stub installed in `beforeEach` so jsdom's missing-API behaviour does not leak unhandled errors when the auto-scroll branch fires during render); asserts every spy invocation's `this` context lives inside the `.feat-board__main` subtree. B1/B2 lock the canonicalIdRegex shape against the malformed/canonical samples Phase 06 WR-02 flagged. C1 confirms a canonical id round-trips through `setClassFeat` and lands in `useFeatStore.getState().levels`.
- `tests/phase-15/skill-sheet-scroll-scope.spec.tsx` — 3 cases. (1) Level-change dep firing zeros `scrollerRef.current.scrollTop`; (2) Mounting `<SkillSheet scrollerRef={ref}>` with a never-attached ref does not throw (silent no-op); (3) Mounting `<SkillSheet />` with no prop at all does not throw (backward compat).

### Modified

- `apps/planner/src/components/ui/selection-screen.tsx` — Added optional `contentRef?: RefObject<HTMLDivElement | null>` prop forwarded to the `.selection-screen__content` div. Backward compatible when omitted.
- `apps/planner/src/features/feats/feat-board.tsx` — Added `useRef` import, declared `const scrollerRef = useRef<HTMLDivElement>(null);`, attached to `<div className="feat-board__main">`, passed to `<FeatSheet scrollerRef={scrollerRef} />`. KEPT untouched: line 42 `useFeatStore()` (15-03's territory) and the line 64 `const activeLevel = boardView.activeSheet.level;` single-declaration invariant.
- `apps/planner/src/features/feats/feat-sheet.tsx` — Imported `RefObject` (type) + `canonicalIdRegex` (named) alongside the existing `CanonicalId` type. Extended `FeatSheetProps` with `scrollerRef?: RefObject<HTMLDivElement | null>`. Auto-scroll effect now scopes the `[data-slot-section="general"]` lookup under `scrollerRef?.current ?? null` (effect no-ops when ref is unattached). Both handlers gained `if (!canonicalIdRegex.test(featId)) return;` guards before the unsafe casts.
- `apps/planner/src/features/skills/skill-board.tsx` — Added `useRef` import, declared `scrollerRef`, forwarded as both `SelectionScreen.contentRef` and `SkillSheet.scrollerRef`.
- `apps/planner/src/features/skills/skill-sheet.tsx` — Imported `RefObject` (type). Added `SkillSheetProps` interface with optional `scrollerRef`. Replaced the `document.querySelector` body of the useLayoutEffect with `const scroller = scrollerRef?.current ?? null; if (scroller !== null) scroller.scrollTop = 0;` (deps `[activeSheet.level, scrollerRef]`).
- `tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx` — **Fixture-only update** authorized by the plan's verification block. The `SkillSheetHarness` now accepts a `scrollerRef` prop and forwards it to both `SelectionScreen.contentRef` and `SkillSheet.scrollerRef`, mirroring the production wiring. C1/C2/C3 each create a `createRef<HTMLDivElement>()` and thread it. No production behaviour change asserted by the spec; same scroller node, same scrollTop reset contract.

## Decisions Made

- **D-04 enacted with FeatBoard scoping at .feat-board__main (Option A):** The `[data-slot-section="general"]` attribute is owned by `<FeatSheet>` which renders inside `<div className="feat-board__main">`. Attaching the ref to that wrapper is sufficient and avoids SelectionScreen.contentRef forwarding for FeatBoard. SkillBoard's case is different — the overflow owner IS the `.selection-screen__content` div itself (12.7-03 + 12.8-01 retarget invariant) — so SkillBoard forwards the ref via SelectionScreen.contentRef.
- **D-07 enacted with handler-entry guards:** Guards placed where CONTEXT specified (handler entries L287/L296 in the original line numbers, now L323/L332 post-edit). The three `featId as CanonicalId` cast sites (L324, L334, L345 post-edit) are RETAINED — they sit behind the verified runtime regex test, preserving type-system correctness while the runtime branch is fail-closed.
- **Optional `scrollerRef` prop instead of required:** Keeps existing component callers (and the legacy 12.7 harness pre-update) compiling and mounting. Effect no-ops on null current. Phase 15-02 plan-explicit acceptance criterion (`grep -c "scrollerRef" >= 2 in each file`) satisfied with 5+ occurrences in each modified file (declaration + prop in interface + destructure + effect body + dep array).
- **No new packages, no styles, no copy:** D-NO-CSS, D-NO-COPY, D-NO-DEPS gates green. `git diff apps/planner/src/styles/` and `git diff apps/planner/src/lib/copy/` and `git diff package.json apps/planner/package.json packages/*/package.json` all empty.

## Patterns Established

- **scrollerRef threading idiom:** Board (owner) → `useRef<HTMLDivElement>(null)` → forwarded to either the SelectionScreen.contentRef (when the scroller IS the SelectionScreen content div) or attached directly to the inner wrapper that contains the queried subtree (when the scope is one level deeper). Sheet (consumer) takes `scrollerRef?: RefObject<HTMLDivElement | null>` and uses it inside effects to scope queries / mutations. This is the canonical replacement for `document.querySelector` callsites that previously relied on the parent-component className being globally unique.
- **Pre-authored RED + same-task GREEN:** RED specs were authored in a prior session (committed with 15-01's Phase 15 jsdom glob registration). 15-02 ships GREEN code that flips both specs from FAIL → PASS in a single feat commit. The plan task uses `tdd="true"` flag without the strict RED/GREEN/REFACTOR cycle as separate commits because the RED authorship was pre-staged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] tests/phase-15/feat-sheet-scroll-scope.spec.tsx leaked unhandled "scrollIntoView is not a function" exceptions**

- **Found during:** Task 1 (post-implementation verification of `pnpm vitest run tests/phase-15`)
- **Issue:** The pre-authored RED spec installed the jsdom `scrollIntoView` no-op stub only inside test A1's `try/finally` block. After A1 cleaned up (removing the stub from `HTMLElement.prototype`), test C1 rendered FeatBoard then dispatched `setClassFeat('feat:carrera')` — which triggered the auto-scroll effect → `firstRow.scrollIntoView(...)` → unhandled `TypeError: firstRow.scrollIntoView is not a function`. Vitest still reported all 7 tests passing but exited with code 1 due to the unhandled rejections, breaking the plan's `exit=0` acceptance criterion.
- **Fix:** Promoted the stub installation to suite-level (`beforeEach` + `afterEach`) via `installScrollIntoViewStub` / `removeScrollIntoViewStub` helpers. Stub state stored in a module-level variable so afterEach can correctly restore prior presence. A1 still creates `vi.spyOn` in the test body (because the test asserts the spy's `mock.instances`) but no longer manages stub lifecycle.
- **Files modified:** tests/phase-15/feat-sheet-scroll-scope.spec.tsx
- **Verification:** `corepack pnpm vitest run tests/phase-15/feat-sheet-scroll-scope.spec.tsx tests/phase-15/skill-sheet-scroll-scope.spec.tsx` → 7/7 GREEN, 0 errors, exit=0.
- **Committed in:** d375bb8 (Task 1 commit)

**2. [Rule 2 - Critical] tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx harness needed scrollerRef threading to keep C2 GREEN**

- **Found during:** Task 1 (production-source change moved the scroll-reset responsibility from SkillSheet self-query to a parent-owned ref). The 12.7 spec C2 case asserts `scroller.scrollTop === 0` after a level change. With the production change, SkillSheet only zeros scrollTop when `scrollerRef.current` is non-null. The legacy harness wrapped `<SkillSheet />` without threading any ref → effect no-oped → C2 would have failed.
- **Fix:** Updated `SkillSheetHarness` (still in tests/phase-12.7) to accept `scrollerRef: RefObject<HTMLDivElement | null>` and forward it to both `SelectionScreen.contentRef` and `SkillSheet.scrollerRef`. Each `it` block now creates a `createRef<HTMLDivElement>()` locally and threads it. This is the SAME wiring shape SkillBoard uses in production, so C2's assertion now exercises the same code path real users hit.
- **Files modified:** tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx
- **Verification:** `corepack pnpm vitest run tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx` → 3/3 GREEN. Plan's verification block explicitly authorized this (`"may need fixture updates if they assumed document.querySelector shape; if so document the fixture-only update in SUMMARY"`).
- **Committed in:** d375bb8 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 bug, 1 Rule 2 critical fixture maintenance)
**Impact on plan:** Both auto-fixes were correctness-mandatory. The first prevents the new spec file from leaking unhandled rejections that would have failed the `exit=0` acceptance criterion. The second is the fixture-only test maintenance the plan's verification block explicitly authorized — it locks the same scroll-reset contract against the new ref-threaded shape. No scope creep.

## Issues Encountered

- **Pre-existing baseline failures noted (carry-forward, not phase-15-02 regressions):**
  - 1 phase-08 BUILD_ENCODING_VERSION literal=1 spec
  - 2 phase-12.4 class-picker-prestige-reachability cases (L1 regresión + L9 Caballero Arcano blocker copy)
  - These are documented as Phase 13 baseline drift carried forward unchanged (referenced in STATE.md `stopped_at` and 15-01-SUMMARY.md "Issues Encountered"). Confirmed via stash-and-rerun on baseline: same failures with my changes stashed.
- **Run-to-run flakiness in baseline failure count:** the full `pnpm test` run reported 3 failures one run and 4 (with 2 errors) another. The variance comes from prestige-gate.fixture-related flakiness in the broader baseline; my changes do not contribute to it (phase-15 / phase-12.7 / phase-12.8 runs are deterministically GREEN across multiple runs).

## Verification Results

- **Phase 15 plan-15-02 specs:** `tests/phase-15/feat-sheet-scroll-scope.spec.tsx` 4/4 GREEN, `tests/phase-15/skill-sheet-scroll-scope.spec.tsx` 3/3 GREEN. `exit=0`, 0 unhandled errors.
- **Phase 15 (full plan-15 jsdom suite):** 22/22 individual tests across 6 spec files (15-01 plan specs + 15-02 plan specs) all GREEN.
- **Phase 12.7 regression specs:** 3/3 in skill-sheet-scroll-reset.spec.tsx GREEN. The 12.7-03 D-10 useLayoutEffect + useRef scroll-reset semantics preserved (no regression to the 12.7-03 invariant).
- **Phase 12.8 regression specs:** all jsdom specs GREEN (Playwright e2e specs out of vitest scope).
- **Phase 06 regression specs:** 7 spec files, all GREEN (canonicalIdRegex source untouched; new guards don't reach store-level invariants).
- **Phase 12.4 regression specs:** 16/19 spec files GREEN (3 pre-existing baseline failures documented above).
- **Full vitest suite:** 2237/2243 passing; 3 failures all pre-existing Phase 13 baseline drift; 0 new regressions.
- **Typecheck (`corepack pnpm typecheck`):** clean exit, no new errors.
- **Acceptance grep gates:**
  - `document.querySelector` count = 0 in feat-sheet.tsx ✓
  - `document.querySelector` count = 0 in skill-sheet.tsx ✓
  - `document.getElementById` count = 0 in all 5 touched source files ✓
  - `scrollerRef` count >= 2 in each of feat-sheet.tsx (5), feat-board.tsx (3), skill-sheet.tsx (5), skill-board.tsx (3) ✓
  - `contentRef` count >= 2 in selection-screen.tsx (3) ✓
  - `canonicalIdRegex.test` count = 2 in feat-sheet.tsx ✓
  - `requestAnimationFrame` count = 0 in feat-sheet.tsx ✓
  - `featId as CanonicalId` count = 3 in feat-sheet.tsx ✓ (3 retained casts, all behind the regex guard)
  - Single `const activeLevel = boardView.activeSheet.level;` declaration in feat-board.tsx ✓ (Phase 12.8-03 BLOCKER 2 invariant preserved)
- **D-NO-CSS:** `git diff apps/planner/src/styles/` empty ✓
- **D-NO-COPY:** `git diff apps/planner/src/lib/copy/` empty ✓
- **D-NO-DEPS:** `git diff package.json apps/planner/package.json packages/*/package.json` empty ✓

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 15-03** (Wave 2; depends on 15-02) can now proceed. The file-coordination boundary on `apps/planner/src/features/feats/feat-board.tsx` was respected: 15-02 only touched the JSX-tree (`useRef` import, scrollerRef declaration, ref attached to .feat-board__main, scrollerRef passed to FeatSheet). 15-03's territory (line 42 `useFeatStore()` -> `useShallow` selector + the `useShallow` import) is untouched. The two edits are textually disjoint by line range — 15-03 should merge cleanly atop 15-02.
- **Phase 12.8 WR-01/02 closed:** `feat-sheet.tsx` and `skill-sheet.tsx` no longer call `document.querySelector`. The audit cluster's "global selector" complaint is closed at the source level.
- **Phase 06 WR-02 closed:** unsafe `featId as CanonicalId` cast in feat-sheet.tsx fronted by canonicalIdRegex.test silent fail-closed guard at both handler entries.
- **Pattern available for future selector-narrow phases:** the scrollerRef threading idiom can be reused for any other inner-component effect that previously relied on a globally-unique parent className being present in the document. Apply via `Board.useRef → SelectionScreen.contentRef + Sheet.scrollerRef`.

## Self-Check: PASSED

Verified files exist:
- FOUND: apps/planner/src/components/ui/selection-screen.tsx
- FOUND: apps/planner/src/features/feats/feat-board.tsx
- FOUND: apps/planner/src/features/feats/feat-sheet.tsx
- FOUND: apps/planner/src/features/skills/skill-board.tsx
- FOUND: apps/planner/src/features/skills/skill-sheet.tsx
- FOUND: tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx
- FOUND: tests/phase-15/feat-sheet-scroll-scope.spec.tsx
- FOUND: tests/phase-15/skill-sheet-scroll-scope.spec.tsx

Verified commits exist:
- FOUND: d375bb8 (Task 1: scoped scroll lookups + canonicalIdRegex guards + 2 regression specs)

---
*Phase: 15-a11y-modal-polish*
*Completed: 2026-04-26*
