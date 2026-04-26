---
phase: 15-a11y-modal-polish
verified: 2026-04-26T14:30:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 15: A11y + Modal Polish — Verification Report

**Phase Goal (from ROADMAP.md §"### Phase 15: A11y + Modal Polish (GAP)"):**
Close Phase 07.1 WR-02..04 + Phase 06 / 12.8 selector-scope cluster from the re-audit: install focus trap on `aria-modal` surfaces, automate focus-return on dialog close, install body scroll lock, scope the 4 cross-cutting `document.querySelector` / unscoped zustand callsites.

**Verified:** 2026-04-26T14:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification.

## Goal Achievement

### Observable Truths (mapped to ROADMAP Success Criteria)

| #   | Truth (Phase 15 SC)                                                                                                                | Status     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | All `aria-modal="true"` surfaces trap focus (Tab / Shift-Tab cycle stays inside dialog).                                            | VERIFIED   | `useFocusTrap` hook implemented at `apps/planner/src/lib/a11y/use-focus-trap.ts:22-52` (Tab/Shift-Tab cycle, `enabled` short-circuit, container-scoped listener with cleanup). Wired into the only non-`<dialog>` aria-modal surface (mobile-nav drawer) at `apps/planner/src/components/shell/mobile-nav-toggle.tsx:68`. Native `<dialog>` surfaces delegate to browser top-layer (D-01). Locked by `tests/phase-15/use-focus-trap.spec.tsx` (3 tests, all green). |
| 2   | Automated Vitest / RTL test asserts focus returns to invoking element on dialog close.                                              | VERIFIED   | `tests/phase-15/focus-return.spec.tsx` covers 4 dialogs + drawer (5 tests, all green). jsdom polyfill at `tests/phase-15/setup.ts:20-44` reimplements `HTMLDialogElement.prototype.showModal/close` (jsdom 29 ships these as `undefined`) recording `document.activeElement` and restoring on close. Vacuous-assertion guard satisfied: zero manual `opener.focus()` calls inside spec bodies.                                                                       |
| 3   | Body scroll lock installs on dialog open, removes on close; no stray scroll bleed.                                                  | VERIFIED   | `useBodyScrollLock` hook implemented at `apps/planner/src/lib/a11y/use-body-scroll-lock.ts:12-34` (module-level `activeLocks` stacking counter + `savedOverflow` capture; SSR-safe via `typeof document` guard). 5 wired call-sites: drawer (mobile-nav-toggle.tsx:61) + ConfirmDialog (confirm-dialog.tsx:34) + VersionMismatchDialog (version-mismatch-dialog.tsx:43) + SaveSlotDialog/LoadSlotDialog (save-slot-dialog.tsx:47, 158). Locked by `tests/phase-15/body-scroll-lock.spec.tsx` (4 tests, all green) including the stacking case. |
| 4   | `feat-sheet.tsx:288-299` + `skill-sheet.tsx:150-154` drop `document.querySelector` in favor of ref-based or scoped selectors.       | VERIFIED   | `grep -c "document.querySelector"` returns 0 in both files. `feat-sheet.tsx:294-305` now scopes the `[data-slot-section="general"]` lookup under `scrollerRef?.current` (parent-owned ref attached to `.feat-board__main` in `feat-board.tsx:125`). `skill-sheet.tsx:157-162` mutates `scrollerRef.current.scrollTop = 0` directly (ref forwarded through `SelectionScreen.contentRef` from `skill-board.tsx:37,40`). Locked by `tests/phase-15/feat-sheet-scroll-scope.spec.tsx` (4 tests) + `tests/phase-15/skill-sheet-scroll-scope.spec.tsx` (3 tests). |
| 5   | Phase 06 zustand subscriptions tightened (subscribe only to needed slices); unsafe type assertion removed.                          | VERIFIED   | All 3 in-scope feat-* consumers use `useShallow` slice-as-input (`feat-board.tsx:51-65`, `feat-detail-panel.tsx:24-38`, `feat-sheet-tab.tsx:20-34`). `useFeatStore()` no-arg full subscription eliminated from those 3 files. `canonicalIdRegex.test` silent fail-closed guards installed at handler entries `feat-sheet.tsx:323` (handleSelectClassFeat) and `feat-sheet.tsx:332` (handleSelectGeneralFeat) before the unsafe `featId as CanonicalId` casts. Locked by `tests/phase-15/feat-store-shallow.spec.tsx` (6 tests) + `tests/phase-15/feat-sheet-scroll-scope.spec.tsx` B1/B2/C1 cases. |

**Score:** 5/5 truths verified.

### Required Artifacts

| Artifact                                                                  | Expected                                       | Status     | Details                                                                              |
| ------------------------------------------------------------------------- | ---------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| `apps/planner/src/lib/a11y/use-focus-trap.ts`                             | Tab/Shift-Tab cycle hook                       | VERIFIED   | 52 lines, exports `useFocusTrap`, container-scoped listener, `enabled` short-circuit |
| `apps/planner/src/lib/a11y/use-body-scroll-lock.ts`                       | Stacking counter scroll lock                   | VERIFIED   | 34 lines, exports `useBodyScrollLock`, module-level `activeLocks` + SSR guard        |
| `apps/planner/src/components/shell/mobile-nav-toggle.tsx`                 | Drawer wrapped, hooks wired                    | VERIFIED   | `useBodyScrollLock(mobileNavOpen)` L61 + `useFocusTrap(drawerRef, mobileNavOpen)` L68; drawer wrapper has `role="dialog"`, `aria-modal="true"`, ref attached |
| `apps/planner/src/components/ui/confirm-dialog.tsx`                       | `useBodyScrollLock(open)` sibling effect       | VERIFIED   | L34, after show/close mirror unchanged                                               |
| `apps/planner/src/components/ui/version-mismatch-dialog.tsx`              | `useBodyScrollLock(open)` sibling effect       | VERIFIED   | L43, after show/close mirror unchanged                                               |
| `apps/planner/src/features/summary/save-slot-dialog.tsx`                  | `useBodyScrollLock(open)` in BOTH dialogs      | VERIFIED   | L47 (SaveSlotDialog) + L158 (LoadSlotDialog); `listSlots()` side-effect intact at L150-152 |
| `apps/planner/src/features/feats/feat-sheet.tsx`                          | Scoped scroller ref + canonicalIdRegex guard   | VERIFIED   | `scrollerRef?: RefObject<HTMLDivElement \| null>` prop L25; scoped query L294-305; 2× `canonicalIdRegex.test` guards L323 + L332; 3× `featId as CanonicalId` casts retained behind regex guards |
| `apps/planner/src/features/feats/feat-board.tsx`                          | `scrollerRef` declaration + useShallow         | VERIFIED   | L100 declares `scrollerRef`; L125 attaches to `.feat-board__main`; L163 passes to `<FeatSheet>`; L51-65 useShallow slice-as-input subscription; L92 single `activeLevel` declaration preserved (Phase 12.8-03 BLOCKER 2 invariant) |
| `apps/planner/src/features/feats/feat-detail-panel.tsx`                   | useShallow slice-as-input                      | VERIFIED   | L24-38 useShallow slice; `useFeatStore()` no-arg eliminated                          |
| `apps/planner/src/features/feats/feat-sheet-tab.tsx`                      | useShallow slice-as-input                      | VERIFIED   | L20-34 useShallow slice; `useFeatStore()` no-arg eliminated                          |
| `apps/planner/src/features/skills/skill-sheet.tsx`                        | Scoped scroller ref                            | VERIFIED   | `SkillSheetProps` L128-134 with optional `scrollerRef`; useLayoutEffect L157-162 mutates `scrollerRef.current.scrollTop = 0`; no `document.querySelector` |
| `apps/planner/src/features/skills/skill-board.tsx`                        | Owns scroller ref, threads to both consumers   | VERIFIED   | L20 declares ref; L37 forwards via `SelectionScreen.contentRef`; L40 forwards to `<SkillSheet scrollerRef={...}>`                                  |
| `apps/planner/src/components/ui/selection-screen.tsx`                     | Optional `contentRef` prop                     | VERIFIED   | L11 prop type; L19 destructure; L27 attached to `.selection-screen__content` div     |
| `vitest.config.ts`                                                        | tests/phase-15 jsdom glob + setupFiles entry   | VERIFIED   | L22 glob; L31 setupFiles array includes `tests/phase-15/setup.ts`                     |
| `tests/phase-15/setup.ts`                                                 | jsdom dialog polyfill                           | VERIFIED   | 44 lines; reimplements `showModal`/`close` with WeakMap-keyed `previouslyFocused`; guarded by `typeof HTMLDialogElement !== 'undefined'` |
| `tests/phase-15/use-focus-trap.spec.tsx`                                  | 3 cases (cycle + reverse + disabled)           | VERIFIED   | 3/3 green                                                                            |
| `tests/phase-15/focus-trap-drawer.spec.tsx`                               | 2 cases (drawer wrapper present/absent)        | VERIFIED   | 2/2 green                                                                            |
| `tests/phase-15/focus-return.spec.tsx`                                    | 5 cases (4 dialogs + drawer)                   | VERIFIED   | 5/5 green; no manual `opener.focus()` calls in spec bodies                           |
| `tests/phase-15/body-scroll-lock.spec.tsx`                                | 4 cases (lock/restore/stacking/no-op)          | VERIFIED   | 4/4 green                                                                            |
| `tests/phase-15/feat-sheet-scroll-scope.spec.tsx`                         | 4 cases (subtree scope + regex guard contract) | VERIFIED   | 4/4 green                                                                            |
| `tests/phase-15/skill-sheet-scroll-scope.spec.tsx`                        | 3 cases (level-change scrollTop + tolerance)   | VERIFIED   | 3/3 green                                                                            |
| `tests/phase-15/feat-store-shallow.spec.tsx`                              | 6 cases (synthetic + integration)              | VERIFIED   | 6/6 green                                                                            |

### Key Link Verification

| From                                                  | To                                                             | Via                                       | Status   | Details                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------- | -------- | -------------------------------------------------------------------- |
| `mobile-nav-toggle.tsx`                               | `use-focus-trap.ts`                                            | `useFocusTrap(drawerRef, mobileNavOpen)`  | WIRED    | mobile-nav-toggle.tsx:6 (import) + L68 (call). Trap mechanism unit-tested. |
| `mobile-nav-toggle.tsx`                               | `use-body-scroll-lock.ts`                                      | `useBodyScrollLock(mobileNavOpen)`        | WIRED    | L5 (import) + L61 (call). Inline lines 56-67 from prior code removed (grep `document.body.style.overflow` returns 0 in this file). |
| `confirm-dialog.tsx`                                  | `use-body-scroll-lock.ts`                                      | `useBodyScrollLock(open)`                 | WIRED    | L3 + L34                                                             |
| `version-mismatch-dialog.tsx`                         | `use-body-scroll-lock.ts`                                      | `useBodyScrollLock(open)`                 | WIRED    | L5 + L43                                                             |
| `save-slot-dialog.tsx` (Save + Load)                  | `use-body-scroll-lock.ts`                                      | `useBodyScrollLock(open)` ×2              | WIRED    | L6 + L47 + L158                                                      |
| `feat-sheet.tsx` (auto-scroll effect)                 | `feat-board.tsx` (scrollerRef owner)                           | `scrollerRef` prop                        | WIRED    | feat-sheet.tsx:240 destructure; feat-sheet.tsx:294-305 scoped query; feat-board.tsx:100 ref + L125 attach + L163 prop pass |
| `skill-sheet.tsx` (scroll-reset effect)               | `skill-board.tsx` (scrollerRef owner)                          | `scrollerRef` prop + `SelectionScreen.contentRef` | WIRED    | skill-sheet.tsx:158-160 mutates scrollTop; skill-board.tsx:20 + L37 + L40                              |
| `feat-sheet.tsx` handlers                             | `@rules-engine/contracts/canonical-id` (`canonicalIdRegex`)    | regex `.test(featId)` guards              | WIRED    | feat-sheet.tsx:4 (named import) + L323 (handleSelectClassFeat) + L332 (handleSelectGeneralFeat); 3 retained `as CanonicalId` casts at L324, L334, L345 — all behind verified regex check |
| `feat-board.tsx` / `feat-detail-panel.tsx` / `feat-sheet-tab.tsx` | `zustand/react/shallow`                                | `useShallow` import + slice-as-input      | WIRED    | All 3 files import `useShallow` and pass it to `useFeatStore(useShallow((s) => ({...})))` |
| `vitest.config.ts`                                    | `tests/phase-15/**`                                            | environmentMatchGlobs jsdom + setupFiles entry | WIRED | L22 glob, L31 setupFiles                                            |
| `tests/phase-15/setup.ts`                             | `HTMLDialogElement.prototype`                                  | monkey-patch `showModal`/`close`          | WIRED    | L23-43 reimplements both methods; WeakMap-keyed prior-focus tracking |

### Data-Flow Trace (Level 4)

| Artifact                                | Data Variable / Behaviour                          | Source                                    | Produces Real Data | Status         |
| --------------------------------------- | -------------------------------------------------- | ----------------------------------------- | ------------------ | -------------- |
| `useFocusTrap`                          | container ref → focusable[] → activeElement cycle  | `containerRef.current.querySelectorAll`   | Yes (via test harness with 3 buttons) | FLOWING |
| `useBodyScrollLock`                     | `document.body.style.overflow` ↔ `savedOverflow`   | `document.body.style.overflow` read/write | Yes (verified by stacking test)       | FLOWING |
| `feat-sheet.tsx` auto-scroll            | `[data-slot-section="general"]` → scrollIntoView   | `scrollerRef.current.querySelector(...)`  | Yes (test C1 dispatches `setClassFeat('feat:carrera')` → spy fires on subtree node)  | FLOWING |
| `skill-sheet.tsx` scroll reset          | `scroller.scrollTop = 0` on level change           | `scrollerRef.current` from SkillBoard     | Yes (test mutates scrollTop=100 then triggers level change → asserts scrollTop===0)  | FLOWING |
| `feat-board.tsx` useShallow slice       | 4 data + 7 action FeatStoreState fields            | `useFeatStore(useShallow(...))`           | Yes (test A4 setActiveLevel → re-render; A1 unrelated mutation → no re-render)        | FLOWING |

### Behavioral Spot-Checks

| Behavior                                                          | Command                                                        | Result                              | Status    |
| ----------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------- | --------- |
| Phase 15 vitest suite all green                                   | `corepack pnpm vitest run tests/phase-15`                      | 7 spec files / 27 tests / all pass  | PASS      |
| Phase 07.1 drawer regression intact                               | `corepack pnpm vitest run tests/phase-07.1`                    | 12 tests pass (planner-shell-drawer 3/3 + mobile-nav-close-affordances 9/9) | PASS |
| Phase 12.7 skill-sheet-scroll-reset still green                   | `corepack pnpm vitest run tests/phase-12.7`                    | 5 spec files / all tests pass; the 12.7 harness was updated as authorized fixture-only change | PASS |
| Phase 12.8 specs still green                                      | `corepack pnpm vitest run tests/phase-12.8`                    | All jsdom specs pass                | PASS      |
| Phase 06 specs still green                                        | `corepack pnpm vitest run tests/phase-06`                      | Per 15-03 SUMMARY: 103/103 phase-06 + phase-15 union | PASS |
| TypeScript clean                                                  | `corepack pnpm typecheck`                                      | Exits 0, no output                  | PASS      |
| D-NO-CSS gate                                                     | `git diff bcbe969..HEAD -- apps/planner/src/styles/`           | empty diff                          | PASS      |
| D-NO-COPY gate                                                    | `git diff bcbe969..HEAD -- apps/planner/src/lib/copy/`         | empty diff                          | PASS      |
| D-NO-DEPS gate                                                    | `git diff bcbe969..HEAD -- package.json apps/planner/package.json packages/*/package.json` | empty diff | PASS |
| feat-sheet.tsx: 0 `document.querySelector` calls                  | grep                                                           | 0                                    | PASS      |
| skill-sheet.tsx: 0 `document.querySelector` calls                 | grep                                                           | 0                                    | PASS      |
| feat-board / feat-detail-panel / feat-sheet-tab: ≥1 `useShallow`  | grep                                                           | 5 / 3 / 3 hits                       | PASS      |
| feat-board / feat-detail-panel / feat-sheet-tab: 0 `useFeatStore()` no-arg | grep                                                  | 0 / 0 / 0                            | PASS      |
| feat-sheet.tsx: 2× `canonicalIdRegex.test` guards                 | grep                                                           | 2                                    | PASS      |
| `useFocusTrap` consumed only by drawer (not native dialogs)       | grep across apps/planner/src                                   | 1 import + 1 call (mobile-nav-toggle.tsx) | PASS  |
| `useBodyScrollLock` wired into 5 modal surfaces                   | grep across apps/planner/src                                   | 5 imports + 5 calls (drawer + 4 dialogs) | PASS |

### Requirements Coverage

Phase 15 ROADMAP entry declares `Requirements: (none — a11y hygiene + perf scope; no REQ-IDs reopened)`. All 3 PLAN frontmatters carry `requirements: []`. Nothing to cross-reference against REQUIREMENTS.md.

### Anti-Patterns Found

| File                                                       | Line | Pattern                                | Severity | Impact                                                                                                  |
| ---------------------------------------------------------- | ---- | -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `apps/planner/src/components/shell/mobile-nav-toggle.tsx`  | 38-48 | `requestAnimationFrame` around focus restore | INFO | Pre-existing pattern preserved unchanged from Phase 07.1; the project_raf_scroll_pitfall.md memory applies to nested scroller `scrollIntoView`, NOT to focus restoration on a button (which is sync-stable). Phase 15 plans explicitly say to keep this effect untouched (D-02). Not a regression. |
| `apps/planner/src/features/skills/skill-board.tsx`         | 19    | `// scrollTop without a global document.querySelector` | INFO | Comment-only mention of `document.querySelector` (referring to the OLD impl). Code itself contains 0 hits. Not a stub indicator. |

No blockers, no warnings, no stub indicators in production code paths.

### Pre-Existing Baseline Failures (NOT counted against Phase 15)

The full vitest suite still surfaces 2 pre-existing failures in `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx`:

1. `L9 con Guerrero 8 niveles: fila Caballero Arcano muestra blocker arcane-spell exacto`
2. `L1 regresión: toda clase de prestigio sigue con copy de rama 2 (no L1)`

**Confirmation these are pre-phase-15 baseline drift (not phase-15 regressions):**

I checked out the pre-phase-15 baseline source (`git checkout bcbe969 -- apps/ tests/ vitest.config.ts`) and ran the same spec file. **Same 2 failures, identical assertion messages**, then restored master. Documented as Phase 13 baseline drift in 15-01-SUMMARY.md "Issues Encountered", 15-02-SUMMARY.md "Issues Encountered", and 15-03-SUMMARY.md "Issues Encountered". Not phase-15 regressions.

### Human Verification Required

None. All 5 success criteria were lockable via jsdom + RTL specs (focus trap mechanism via 3-focusable harness, focus return via dialog-element polyfill, body scroll lock via stacking spec, scroller-ref containment via spy on `Element.prototype.scrollIntoView`, useShallow re-render contract via synthetic TestConsumer). No visual / cross-browser / real-time / external-service surface introduced — phase 15 is pure hygiene cleanup with no new user-visible UI.

Optional manual smoke checks documented in plan verification blocks remain available but are not gating:
- Mobile-nav drawer Tab cycle on a real keyboard.
- Stacked modal scroll-lock on iOS Safari momentum scroll.
- `<dialog>` focus-return on Chrome/Firefox/Safari (browser-native, already correct).

### Gaps Summary

None. All 5 ROADMAP success criteria for Phase 15 are met, locked by 27 passing jsdom specs across 7 new spec files, with all 3 invariant gates (D-NO-CSS, D-NO-COPY, D-NO-DEPS) showing empty diffs against the pre-phase-15 baseline `bcbe969`. Phase 07.1 drawer regression spec passes (Rule 1 fix from 15-01 dropped the duplicate `id="planner-stepper-drawer"`). Phase 12.7 / 12.8 / 06 regression specs all green. TypeScript clean.

The 2 pre-existing `class-picker-prestige-reachability` failures are Phase 13 baseline drift, confirmed via baseline-rerun and unrelated to any phase-15-touched file.

---

*Verified: 2026-04-26T14:30:00Z*
*Verifier: Claude (gsd-verifier)*
