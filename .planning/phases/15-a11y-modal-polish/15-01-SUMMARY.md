---
phase: 15-a11y-modal-polish
plan: 01
subsystem: ui
tags: [a11y, dialog, focus-trap, body-scroll-lock, jsdom, vitest, react-19, phase-07.1-WR-02, phase-07.1-WR-03, phase-07.1-WR-04]

# Dependency graph
requires:
  - phase: 07.1-shell-narrow-viewport-nav-fix
    provides: drawer wasOpenRef focus-return + Esc handler + inline body-scroll-lock impl (lifted into useBodyScrollLock)
  - phase: 14-persistence-robustness
    provides: SaveSlotDialog + LoadSlotDialog + VersionMismatchDialog show/close mirrors (preserved byte-identical here)
provides:
  - useFocusTrap hook (apps/planner/src/lib/a11y/use-focus-trap.ts) — Tab/Shift-Tab cycle inside container ref, no-op when disabled
  - useBodyScrollLock hook (apps/planner/src/lib/a11y/use-body-scroll-lock.ts) — module-level stacking counter, SSR-safe
  - jsdom dialog-element polyfill (tests/phase-15/setup.ts) — complete reimplementation of showModal/close + browser top-layer focus-return contract for jsdom 29
  - mobile-nav drawer wrapper with role=dialog + aria-modal=true (closes Phase 07.1 WR-02)
  - body-scroll-lock parity across drawer + 4 native <dialog> surfaces (closes Phase 07.1 WR-04)
  - automated focus-return spec coverage for 4 dialogs + drawer via polyfill (closes Phase 07.1 WR-03)
affects: [15-02-querySelector-scope, 15-03-zustand-shallow, future custom-modal a11y phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hooks under apps/planner/src/lib/a11y/ — host-agnostic a11y primitives composing alongside existing component effects"
    - "Module-level stacking counter pattern — survives across React hook instances mounted simultaneously; restore body style only when counter returns to 0"
    - "jsdom polyfill via tests/phase-15/setup.ts loaded globally through vitest setupFiles — test-only, never ships to production"
    - "Focus-trap container scope (NOT window scope) — bounded by enabled prop + ref; cleanup removes listener; T-15-01-02 mitigation"
    - "Native <dialog> trust-the-platform pattern: 4 native dialogs delegate focus-trap to browser top-layer; only non-<dialog> aria-modal surfaces (drawer) get useFocusTrap"

key-files:
  created:
    - apps/planner/src/lib/a11y/use-focus-trap.ts
    - apps/planner/src/lib/a11y/use-body-scroll-lock.ts
    - tests/phase-15/setup.ts
    - tests/phase-15/use-focus-trap.spec.tsx
    - tests/phase-15/focus-trap-drawer.spec.tsx
    - tests/phase-15/focus-return.spec.tsx
    - tests/phase-15/body-scroll-lock.spec.tsx
  modified:
    - apps/planner/src/components/shell/mobile-nav-toggle.tsx
    - apps/planner/src/components/ui/confirm-dialog.tsx
    - apps/planner/src/components/ui/version-mismatch-dialog.tsx
    - apps/planner/src/features/summary/save-slot-dialog.tsx
    - vitest.config.ts

key-decisions:
  - "Polyfill rewritten as complete reimplementation (jsdom 29 ships HTMLDialogElement WITHOUT showModal/close on the prototype; original wrap-and-call-original design crashed with 'Cannot read properties of undefined (reading call)'). Polyfill toggles the open attribute and records/restores activeElement; SC#2 contract preserved."
  - "Drawer wrapper keeps role=dialog + aria-modal=true but DROPS id=planner-stepper-drawer to avoid duplicate-id collision with the canonical stepper sidebar in planner-shell-frame.tsx:19 (which the toggle's aria-controls already targets). Focus-trap mechanism does not need the id."
  - "Native <dialog> surfaces (ConfirmDialog, VersionMismatchDialog, SaveSlotDialog, LoadSlotDialog) compose useBodyScrollLock(open) as a sibling effect; show/close mirrors stay byte-identical (D-02 stable contract)."

patterns-established:
  - "a11y-hooks-directory: New `apps/planner/src/lib/a11y/` for cross-cutting accessibility primitives; first inhabitants are useFocusTrap + useBodyScrollLock"
  - "stacking-lock-counter: Module-level integer + saved-overflow-string; mount increments, cleanup decrements, restore only when counter hits 0. Idiom replicable for any future scoped global lock."
  - "jsdom-polyfill-via-setupFiles: Project-local polyfill loaded globally; guarded by `typeof HTMLDialogElement !== 'undefined'` so non-jsdom suites no-op cleanly. D-NO-DEPS preserved."
  - "Plan-internal RED-spec authoring: 4 phase-15 specs were authored before the implementation in earlier session — Plan 15-01 implementation lands until they go GREEN. TDD-flavored without using the strict tdd=true gate."

requirements-completed: []

# Metrics
duration: 23min
completed: 2026-04-26
---

# Phase 15 Plan 01: A11y Hooks + Drawer Focus-Trap + Body-Scroll-Lock Wiring Summary

**Two new a11y hooks (`useFocusTrap` + `useBodyScrollLock` with module-level stacking counter), drawer aria-modal wrapper, body-scroll-lock parity across 4 native `<dialog>` surfaces, and a jsdom polyfill that makes the browser top-layer focus-return contract testable end-to-end.**

## Performance

- **Duration:** 23 min (1366 s)
- **Started:** 2026-04-26T11:07:08Z
- **Completed:** 2026-04-26T11:29:50Z
- **Tasks:** 2
- **Files created:** 7 (2 hooks + 1 polyfill setup + 4 specs)
- **Files modified:** 5 (drawer + 3 dialog files + vitest.config)

## Accomplishments

- **SC#1 (focus trap on aria-modal drawer)** closed via `useFocusTrap(drawerRef, mobileNavOpen)` in mobile-nav-toggle.tsx; mechanism locked by `tests/phase-15/use-focus-trap.spec.tsx` (3 cases against synthetic 3-focusable container) and wiring locked by `tests/phase-15/focus-trap-drawer.spec.tsx` (drawer wrapper presence + role/aria invariants).
- **SC#2 (focus-return on dialog/drawer close)** locked end-to-end via the new jsdom polyfill (`tests/phase-15/setup.ts`) which monkey-patches `HTMLDialogElement.prototype.showModal/close` to model the browser top-layer focus-return contract jsdom 29 does not ship. `tests/phase-15/focus-return.spec.tsx` covers 4 dialogs + drawer (5 cases) with NO manual `opener.focus()` in spec bodies (vacuous-assertion guard enforced).
- **SC#3 (body scroll lock across drawer + 4 dialogs)** closed via `useBodyScrollLock` with a module-level stacking counter; layered modals (ConfirmDialog overwrite atop SaveSlotDialog, VersionMismatchDialog atop LoadSlotDialog) keep the lock until the outermost closes. `tests/phase-15/body-scroll-lock.spec.tsx` covers lock/restore + stacking + active=false no-op.
- jsdom 29 dialog gap fully closed: complete polyfill (showModal sets `open` attribute and records `activeElement`; close removes attribute and restores) installed via vitest `setupFiles` for global coverage, no new packages.
- Phase 07.1 spec compatibility preserved by dropping the duplicate `id=planner-stepper-drawer` from the mobile-nav wrapper (the canonical id stays on the stepper sidebar in planner-shell-frame.tsx).

## Task Commits

1. **Task 1: a11y hooks + jsdom polyfill + 4 specs + vitest config glob/setupFiles** — `5c48a94` (feat)
2. **Task 2: wire useBodyScrollLock + useFocusTrap into drawer + 4 dialogs** — `c550143` (feat)

## Files Created/Modified

### Created

- `apps/planner/src/lib/a11y/use-focus-trap.ts` — `useFocusTrap(containerRef, enabled)` hook. Tab/Shift-Tab cycle inside container; FOCUSABLE_SELECTOR excludes disabled + tabindex="-1"; listener attached at container scope and removed on cleanup. No-op when `enabled === false`.
- `apps/planner/src/lib/a11y/use-body-scroll-lock.ts` — `useBodyScrollLock(active)` hook. Module-level `activeLocks` counter + `savedOverflow` capture; SSR-safe via `typeof document` guard; outermost-modal-only restore.
- `tests/phase-15/setup.ts` — jsdom polyfill. Guarded by `typeof HTMLDialogElement !== 'undefined'`; reimplements `showModal` (sets `open` attribute, records `document.activeElement`) and `close` (removes attribute, restores prior focus, accepts optional returnValue). WeakMap-keyed; test-only — never ships to production.
- `tests/phase-15/use-focus-trap.spec.tsx` — direct hook unit test, 3 cases (Tab cycle from C→A; Shift-Tab cycle from A→C; enabled=false short-circuits).
- `tests/phase-15/focus-trap-drawer.spec.tsx` — drawer wiring smoke test, 2 cases (wrapper present with role+aria-modal when open; absent when closed).
- `tests/phase-15/focus-return.spec.tsx` — 5 cases (ConfirmDialog, VersionMismatchDialog, SaveSlotDialog, LoadSlotDialog, mobile-nav drawer); polyfill makes assertions test the BROWSER contract end-to-end. `listSlots` mocked via `vi.spyOn` so LoadSlotDialog does not hit IndexedDB.
- `tests/phase-15/body-scroll-lock.spec.tsx` — 4 cases (lock on mount; restore on unmount; stacking inner-unmount-keeps-lock; active=false no-op).

### Modified

- `apps/planner/src/components/shell/mobile-nav-toggle.tsx` — Imports `useBodyScrollLock` + `useFocusTrap`. Inline `document.body.style.overflow` effect (lines 56-67) replaced by `useBodyScrollLock(mobileNavOpen)`. Added `drawerRef` + `useFocusTrap(drawerRef, mobileNavOpen)`. Close-button JSX wrapped in `<div role="dialog" aria-modal="true" ref={drawerRef}>` (no className change — D-NO-CSS preserved). Esc handler (T-07.1-02) and `wasOpenRef` focus-return effect (D-02) untouched.
- `apps/planner/src/components/ui/confirm-dialog.tsx` — Added `useBodyScrollLock(open)` sibling to existing show/close `<dialog>` mirror.
- `apps/planner/src/components/ui/version-mismatch-dialog.tsx` — Same pattern.
- `apps/planner/src/features/summary/save-slot-dialog.tsx` — `useBodyScrollLock(open)` added in BOTH `SaveSlotDialog` and `LoadSlotDialog`. LoadSlotDialog's `listSlots().then(setSlots).catch(() => setSlots([]))` side-effect inside the show/close effect remains byte-identical (D-02 stable contract).
- `vitest.config.ts` — `tests/phase-15/**/*.spec.tsx` jsdom glob added; `setupFiles` extended to `['tests/setup.ts', 'tests/phase-15/setup.ts']`.

## Decisions Made

- **D-01 enacted:** focus-trap mechanism applied ONLY to non-`<dialog>` aria-modal surfaces (the drawer). The 4 native `<dialog>` elements continue to trust the browser top-layer trap from `showModal()` — minimal-surface, browser-native is correct.
- **D-03 enacted with stacking counter:** Module-level `activeLocks` integer + `savedOverflow` capture; counter increments on mount, decrements on cleanup; outermost-modal-only restore. Layered confirm-on-overwrite atop SaveSlotDialog cannot prematurely release the lock.
- **Polyfill design corrected:** jsdom 29 ships `HTMLDialogElement.prototype.showModal/close` as `undefined`. Original plan's wrap-and-call-original design crashed with `Cannot read properties of undefined (reading 'call')`. Polyfill rewritten as complete reimplementation; SC#2 contract preserved end-to-end.
- **Drawer wrapper id dropped:** The plan instructed `id="planner-stepper-drawer"` on the mobile-nav wrapper. That id is already owned by the canonical stepper sidebar in `planner-shell-frame.tsx:19` (which the toggle's `aria-controls` already targets). Adding the id to the mobile-nav wrapper produced a duplicate-id collision that broke `querySelector` ordering and failed the phase-07.1 spec. Fix: drop the id from the mobile-nav wrapper. Trap mechanism does not need the id; aria-controls still resolves to the canonical drawer.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] jsdom polyfill original design crashed at runtime**

- **Found during:** Task 1 (polyfill validation against focus-return spec)
- **Issue:** The plan's polyfill wrapped `originalShowModal = HTMLDialogElement.prototype.showModal` then called `originalShowModal.call(this)`. jsdom 29 ships `HTMLDialogElement` WITHOUT `showModal/close` on the prototype (`Object.getOwnPropertyDescriptor(proto, 'showModal')` returns `undefined`). The wrapper captured `undefined` as the original, and calling `.call()` on it threw `TypeError: Cannot read properties of undefined (reading 'call')` — focus-return spec failed 4/5 cases.
- **Fix:** Rewrote `tests/phase-15/setup.ts` as a complete reimplementation. `patchedShowModal` now records `document.activeElement` and sets `this.setAttribute('open', '')` (jsdom honors the attribute as the `open` property); `patchedClose` removes the attribute, optionally writes `returnValue`, and calls `prior.focus()`. Guarded by `typeof HTMLDialogElement !== 'undefined'` so non-jsdom suites (which still load setupFiles globally) no-op cleanly.
- **Files modified:** tests/phase-15/setup.ts
- **Verification:** focus-return spec all 5 cases GREEN; the polyfill's open-attribute toggle correctly drives `dialog.open` reads in the existing show/close mirrors.
- **Committed in:** 5c48a94 (Task 1 commit)

**2. [Rule 1 - Bug] Duplicate id="planner-stepper-drawer" broke phase-07.1 selectors**

- **Found during:** Task 2 (post-implementation full-suite verification)
- **Issue:** The plan instructed wrapping the close-button in `<div id="planner-stepper-drawer" role="dialog" aria-modal="true">`. The id `planner-stepper-drawer` is already owned by the canonical stepper sidebar in `apps/planner/src/components/shell/planner-shell-frame.tsx:19` (the toggle button's `aria-controls` resolves there). Adding the id to the mobile-nav wrapper introduced a duplicate-id HTML uniqueness violation; `document.querySelector('#planner-stepper-drawer')` returned the mobile-nav wrapper first (DOM order), bypassing the canonical drawer. The phase-07.1 `planner-shell-drawer.spec.tsx` case "does NOT assert aria-modal" then failed (it expected `aria-modal=null` on the canonical drawer but received `'true'` from the mobile-nav wrapper).
- **Fix:** Dropped `id="planner-stepper-drawer"` from the mobile-nav wrapper. The focus-trap mechanism does not need the id (it uses the React ref to find focusables); `aria-controls` from the toggle button still resolves to the canonical drawer. Inline comment added explaining the fix to prevent regression.
- **Files modified:** apps/planner/src/components/shell/mobile-nav-toggle.tsx
- **Verification:** `tests/phase-07.1/planner-shell-drawer.spec.tsx` 3/3 GREEN; `tests/phase-15/focus-trap-drawer.spec.tsx` 2/2 GREEN (spec does not reference the id).
- **Committed in:** c550143 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 3 blocking, 1 Rule 1 bug)
**Impact on plan:** Both auto-fixes essential for correctness — original plan's polyfill design was non-functional on jsdom 29; original drawer-wrapper `id` instruction would have shipped a duplicate-id HTML invalid render. SC#1/SC#2/SC#3 contracts all closed as planned. No scope creep.

## Issues Encountered

- **Pre-existing baseline failures noted (carry-forward, not phase-15-01 regressions):** 1 phase-08 BUILD_ENCODING_VERSION literal=1 spec + 2 phase-12.4 class-picker prestige-reachability cases. STATE.md confirmed these are Phase 13 baseline drift carried forward unchanged.
- **Plan 15-02 RED specs (`tests/phase-15/feat-sheet-scroll-scope.spec.tsx`, `tests/phase-15/skill-sheet-scroll-scope.spec.tsx`) are present in the working tree (untracked — owned by 15-02) and currently fail.** These are out-of-scope for plan 15-01 and will go GREEN when 15-02 lands. The phase-15 jsdom glob registered in this plan picks them up; once 15-02 implements the ref-thread, they're expected to flip GREEN without further config changes.

## Verification Results

- **Phase 15-01 specs:** 4/4 spec files green; 14/14 individual tests green (use-focus-trap 3 + focus-trap-drawer 2 + focus-return 5 + body-scroll-lock 4).
- **Phase 07.1 drawer spec:** 3/3 green (regression resolved by Rule 1 fix).
- **Full vitest suite:** 2236/2243 passing; 4 failures + 2 errors all pre-existing baseline (Phase 13 drift) or Plan 15-02 RED specs awaiting 15-02 wave.
- **Typecheck:** `pnpm typecheck` exits clean.
- **D-NO-CSS:** `git diff apps/planner/src/styles/` empty.
- **D-NO-COPY:** `git diff apps/planner/src/lib/copy/` empty.
- **D-NO-DEPS:** `git diff package.json apps/planner/package.json packages/*/package.json` empty (no new packages — polyfill is a project file).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 15-02** (querySelector scope-down for `feat-sheet.tsx:274` + `skill-sheet.tsx:151`) can proceed independently. The two RED specs already authored under `tests/phase-15/` are picked up by the jsdom glob registered in this plan; 15-02 only needs to thread `scrollerRef` into FeatSheet/SkillSheet and they should flip GREEN.
- **Plan 15-03** (useShallow rollout to feat-board / feat-detail-panel / feat-sheet-tab + canonicalIdRegex guard at feat-sheet) is wave 2 (depends on 15-02 due to feat-board.tsx coordination). No dependency on 15-01.
- **Future custom-modal a11y:** `useFocusTrap` is now available for any future non-`<dialog>` aria-modal surface. Apply via `useFocusTrap(containerRef, isOpen)` mirroring the drawer pattern.

## Self-Check: PASSED

Verified files exist:
- FOUND: apps/planner/src/lib/a11y/use-focus-trap.ts
- FOUND: apps/planner/src/lib/a11y/use-body-scroll-lock.ts
- FOUND: tests/phase-15/setup.ts
- FOUND: tests/phase-15/use-focus-trap.spec.tsx
- FOUND: tests/phase-15/focus-trap-drawer.spec.tsx
- FOUND: tests/phase-15/focus-return.spec.tsx
- FOUND: tests/phase-15/body-scroll-lock.spec.tsx

Verified commits exist:
- FOUND: 5c48a94 (Task 1)
- FOUND: c550143 (Task 2)

---
*Phase: 15-a11y-modal-polish*
*Completed: 2026-04-26*
