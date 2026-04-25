---
phase: 14-persistence-robustness
plan: 01
subsystem: ui
tags: [toast, react, vitest, fake-timers, queue, fifo, dos-mitigation, rtl]

requires:
  - phase: 08-persistence-share
    provides: pushToast/dismissToast/Toast API + save-slot-dialog/resumen-board/share-entry consumers
provides:
  - FIFO queue + MIN_VISIBLE_MS=1500 guard preventing toast clobber race
  - DoS cap (queue.length >= 8 drops oldest) per T-14-01-03
  - __resetToastForTests test-only deterministic-state hook
  - tests/phase-14/ glob mapped to jsdom in vitest.config.ts
affects: [14-02-onwards, ux-polish, milestone-v1.0-tech-debt]

tech-stack:
  added: []
  patterns:
    - "Module-scoped FIFO queue with single deferred drainTimer setTimeout (cancel + reschedule on growth)"
    - "Visibility-window guard: rapid arrivals (<MIN_VISIBLE_MS) queue; slow arrivals (>=MIN_VISIBLE_MS) replace"
    - "Test-only reset hook (`__resetToastForTests`) annotated `@internal` for deterministic Vitest fake-timer state"
    - "Two-stage vi.advanceTimersByTime sequencing inside separate act() blocks so React useEffect cleanup runs between timer firings"

key-files:
  created:
    - tests/phase-14/toast-clobber-race.spec.tsx
  modified:
    - apps/planner/src/components/ui/toast.tsx
    - vitest.config.ts

key-decisions:
  - "MIN_VISIBLE_MS exported as `const = 1500` so the spec can import + assert parity (sentinel test)"
  - "DoS cap = 8 (vs realistic chained-action ceiling of 3) — comfortable headroom + grep-verifiable T-14-01-03 mitigation"
  - "Drain scheduling via single module-scoped setTimeout that calls dismissToast (reuses queue-shift path, avoids duplicate logic)"
  - "Caller signature pushToast(body, tone) preserved unchanged — zero changes to save-slot-dialog/resumen-board/share-entry/planner-shell-frame consumers"
  - "Test-only reset hook prefixed `__` + JSDoc `@internal` to signal it must not be called from production code"

patterns-established:
  - "Phase-14 jsdom glob convention in vitest.config.ts mirrors phase-12.x conventions"
  - "createElement-not-JSX + explicit afterEach(cleanup) pattern carried forward from Phase 12.8-03 D-13"
  - "Two-stage fake-timer advance with one act() block per logical timer firing (React effect cleanup contract)"

requirements-completed:
  - SHAR-02
  - SHAR-03

duration: 9min
completed: 2026-04-25
---

# Phase 14-01: Toast Clobber Race Fix Summary

**FIFO queue + MIN_VISIBLE_MS=1500 guard in `apps/planner/src/components/ui/toast.tsx` so a second `pushToast` fired within 1500 ms of the prior message is queued instead of clobbering it; auto-dismiss + DoS cap (8) preserved.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-25T13:41:30Z
- **Completed:** 2026-04-25T13:50:54Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 3 (1 source + 1 test + 1 config)

## Accomplishments

- Closed ROADMAP SC#1 (Phase 14): clobber race demonstrably eliminated by RED→GREEN spec sequence (3 failing → 6/6 passing).
- Closed ROADMAP SC#7 (partial — toast path covered).
- T-14-01-03 (DoS via unbounded queue) closed with `queue.length >= 8 → shift` cap.
- T-14-01-02 (XSS via toast body) preserved byte-identically — `<span>{msg.body}</span>` React text-node rendering unchanged.
- Caller signature stable: 12 `pushToast(...)` callsites across save-slot-dialog/resumen-board/share-entry/planner-shell-frame untouched.
- New `tests/phase-14/` glob mapped to jsdom in `vitest.config.ts` (phase-14 testing infrastructure seeded for future plans 14-02..14-06).

## Task Commits

1. **Task 1: RED — toast clobber race regression spec** — `c2bedba` (test)
2. **Task 2: GREEN — queue + MIN_VISIBLE_MS guard + DoS cap** — `59889b6` (feat)

_TDD gate sequence locked: `test(14-01)...` → `feat(14-01)...` matches plan-level type=execute with tdd="true" tasks._

## Files Created/Modified

- **created** `tests/phase-14/toast-clobber-race.spec.tsx` — 6 RTL specs (1 sentinel + 5 behavior cases A1–A5) using vi.useFakeTimers + act + createElement convention.
- **modified** `apps/planner/src/components/ui/toast.tsx` — 121 lines (was 61). Added `MIN_VISIBLE_MS` export, `queue` + `visibleSince` + `drainTimer` module-scoped state, queue-aware `pushToast` + `dismissToast`, `scheduleDrain` helper, `__resetToastForTests` test hook, T-14-01-03 DoS cap, updated docstring.
- **modified** `vitest.config.ts` — appended `['tests/phase-14/**/*.spec.tsx', 'jsdom']` to `environmentMatchGlobs`.

## Decisions Made

- **MIN_VISIBLE_MS exported (not internal):** spec can import + assert parity (`expect(MIN_VISIBLE_MS).toBe(1500)` sentinel) so a future bump cannot silently break the regression contract.
- **DoS cap at 8:** realistic chained-action ceiling is 3 (save → success → version-warn); 8 is grep-verifiable headroom without memory risk.
- **Drain via dismissToast (not duplicate logic):** the drain timer simply calls `dismissToast()`, which already shifts the queue head; this keeps the queue-advance semantics single-sourced.
- **Test-only reset hook prefixed `__`:** clear signal (plus `@internal` JSDoc) that callers other than the spec are violating the contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A4 spec restructured into two-stage `act()` advance**
- **Found during:** Task 2 GREEN verification
- **Issue:** Plan-text envisioned a single `vi.advanceTimersByTime(5000)` after pushing both messages. In practice this batches the drainTimer firing (at +1500 ms relative to `primero`) AND `primero`'s pre-existing 5000 ms auto-dismiss setTimeout in the same fake-timer tick. Because `vi.advanceTimersByTime` runs timer callbacks synchronously while React effect cleanups run on the next render flush, `primero`'s stale setTimeout fires AFTER the drain has already promoted `segundo` to current — calling `dismissToast()` again and nulling the visible message. Spec failed `expect(screen.queryByText('segundo')).not.toBeNull()` at line 145.
- **Fix:** Split A4 into two `act()` blocks: stage 1 advances `MIN_VISIBLE_MS` (drain fires → segundo surfaces → React reconciles → primero's stale 5s timer is cleared by useEffect cleanup); stage 2 advances 5000 ms more (segundo's auto-dismiss fires, queue empty → null). Same semantic as the plan's contract ("queue drain on auto-dismiss + auto-dismiss applies to current"); just re-shaped to honour React's effect cleanup contract under fake timers. Renamed test from "auto-dismiss after 5000 ms surfaces queued toast immediately" to "queue drain surfaces queued toast; subsequent 5s auto-dismiss applies to the new head" to match the new structure.
- **Files modified:** `tests/phase-14/toast-clobber-race.spec.tsx` (A4 only).
- **Verification:** All 6 specs pass under `corepack pnpm vitest run tests/phase-14/toast-clobber-race.spec.tsx`.
- **Committed in:** `59889b6` (Task 2 GREEN commit).

**2. [Rule 2 - Critical] A5 strengthened with mid-window assertions**
- **Found during:** Task 1 RED verification
- **Issue:** Original A5 (tone-preservation) only asserted post-drain state. Pre-fix toast.tsx replaces immediately, so `.toast--warn` selector matches at the end either way (replace OR drain) — RED state was 2/5 (only A1 + A4 failed) where the plan acceptance criterion required ≥3 failures with assertions tied to queueing/visibility timing.
- **Fix:** Added MID-WINDOW assertions to A5: after pushing the second `warn` message at +50 ms, assert that `.toast--info` is still present, `.toast--warn` is absent, `primero` text is visible, `segundo` text is null. This locks the queue contract on tone preservation independent of A1/A4. RED count became 3/5 — acceptance gate met.
- **Files modified:** `tests/phase-14/toast-clobber-race.spec.tsx` (A5 only, in Task 1 RED commit).
- **Verification:** A5 fails at `expect(container.querySelector('.toast--info')).not.toBeNull()` against pre-fix code (RED), passes against post-fix code (GREEN).
- **Committed in:** `c2bedba` (Task 1 RED commit).

---

**Total deviations:** 2 auto-fixed (1 Rule-3 blocking timing-contract fix, 1 Rule-2 critical assertion-strength fix)
**Impact on plan:** Both deviations preserve the plan's locked semantic (clobber race elimination + queue drain + tone preservation + DoS cap). Zero scope creep, zero new files beyond plan, zero signature changes.

## Issues Encountered

- `pnpm` is not directly on PATH for this workspace; used `corepack pnpm` (lockfile pins `packageManager: "pnpm@10.0.0"`). Vitest `--reporter=basic` failed to load (Vitest 4 + Vite 7 module-runner ERR_LOAD_URL); fell back to default reporter. Both are environment-only — no source-code impact.

## Threat Register

- **T-14-01-03** (DoS via unbounded queue) — **CLOSED**: `queue.length >= 8 → queue.shift()` before push. grep-verified: `grep -c "queue.length >= 8" apps/planner/src/components/ui/toast.tsx` → `1`.
- **T-14-01-02** (XSS via toast body) — **PRESERVED**: `<span className="toast__body">{msg.body}</span>` line in `Toast` component is byte-identical to pre-fix; React auto-escapes text-node interpolation. No `innerHTML`, no `dangerouslySetInnerHTML` introduced.
- **T-14-01-01** (concurrent-mutation tampering) — **ACCEPTED**: JS event-loop single-threaded; queue mutation is atomic per call.
- **T-14-01-04** (toast-not-retained repudiation) — **ACCEPTED**: UX surface only.

## Verification Evidence

```
Phase-14 spec:                  6/6 PASS
Phase-08 toast consumers:       17/17 PASS (save-slot-dialog 5 + resumen-board 5 + share-entry 5 + share-fallback 2)
Phase-10 load-slot regression:  2/2 PASS
typecheck:                      4 pre-existing baseline errors / 0 new
```

Grep gates (all met):

```
grep -c "MIN_VISIBLE_MS = 1500"           apps/planner/src/components/ui/toast.tsx → 1
grep -c "const queue: ToastMessage\[\]"   apps/planner/src/components/ui/toast.tsx → 1
grep -c "scheduleDrain"                   apps/planner/src/components/ui/toast.tsx → 3
grep -c "__resetToastForTests"            apps/planner/src/components/ui/toast.tsx → 1
grep -c "queue.length >= 8"               apps/planner/src/components/ui/toast.tsx → 1
grep -c "MIN_VISIBLE_MS"                  apps/planner/src/components/ui/toast.tsx → 4
grep -c "If a new toast arrives ..."      apps/planner/src/components/ui/toast.tsx → 0 (old docstring removed)
grep -cE "^\s*it\("                       tests/phase-14/toast-clobber-race.spec.tsx → 6
grep -c "tests/phase-14"                  vitest.config.ts → 1
```

## TDD Gate Compliance

- **RED gate:** `c2bedba test(14-01): add toast clobber race regression spec (RED)` — 3/5 failures (A1 + A4 + A5), 2/5 incidental passes (A2 + A3).
- **GREEN gate:** `59889b6 feat(14-01): toast queue + MIN_VISIBLE_MS guard prevents clobber race (GREEN)` — 6/6 passes (5 cases + 1 sentinel).
- **REFACTOR gate:** none required (implementation shipped clean; no follow-up cleanup commit).

## User Setup Required

None — no external service configuration required. The fix is internal to the planner SPA and ships with the next deploy.

## Next Phase Readiness

- **Phase 14-02..14-06:** the new `tests/phase-14/**/*.spec.tsx` jsdom glob is now mapped, so subsequent persistence-robustness plans can drop specs in this directory without re-touching `vitest.config.ts`.
- **Toast contract:** API surface (`pushToast(body, tone)`, `dismissToast()`, `useToast()`, `<Toast/>`) is stable; new consumers can call `pushToast` rapidly without worrying about clobbering.
- **No open blockers** for this plan.

## Self-Check: PASSED

- File `apps/planner/src/components/ui/toast.tsx` exists ✓
- File `tests/phase-14/toast-clobber-race.spec.tsx` exists ✓
- File `vitest.config.ts` exists ✓
- Commit `c2bedba` (Task 1 RED) found in `git log` ✓
- Commit `59889b6` (Task 2 GREEN) found in `git log` ✓
- 6/6 phase-14 specs PASS ✓
- 17/17 phase-08 toast-consumer specs PASS ✓
- 2/2 phase-10 load-slot regression specs PASS ✓
- 0 NEW typecheck errors (4 pre-existing baseline) ✓
- All grep gates met ✓
- No file deletions in either commit ✓

---
*Phase: 14-persistence-robustness*
*Plan: 01*
*Completed: 2026-04-25*
