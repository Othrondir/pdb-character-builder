---
phase: 14-persistence-robustness
plan: 03
subsystem: persistence
tags: [hydrate, project, build-document, round-trip, foundation-store, zustand, vitest, tdd, share-roundtrip]

requires:
  - phase: 03-foundation
    provides: useCharacterFoundationStore (alignmentId/baseAttributes/raceId/subraceId slices + setters + resetFoundation)
  - phase: 08-persistence-share
    provides: buildDocumentSchema (`build.name: z.string().max(80).optional()`), hydrateBuildDocument, projectBuildDocument, sampleBuildDocument fixture helper
provides:
  - foundation.buildName slice + setBuildName setter (string | null) — resetFoundation clears it
  - hydrate persists doc.build.name into foundation.buildName (was previously dropped silently)
  - project resolves build.name precedence: explicit arg > foundation.buildName > undefined
  - phase-14 round-trip spec locking SHAR-05 parity invariant for `build.name`
affects: [14-04-onwards, resumen-rename-ui-future, share-url-roundtrip, json-export-import-roundtrip]

tech-stack:
  added: []
  patterns:
    - "Zustand slice for boundary-bounded primitive (string | null) — bounding remains schema-side, store stays neutral"
    - "Nullish-coalescing precedence chain (`name ?? foundation.buildName ?? undefined`) so callers can override explicitly without losing store fallback"
    - "Foundation-store mock factories in test fixtures must mirror full interface — slice additions cascade to phase-12.1 mock helpers"

key-files:
  created:
    - tests/phase-14/hydrate-build-name.spec.ts
    - .planning/phases/14-persistence-robustness/deferred-items.md
  modified:
    - apps/planner/src/features/character-foundation/store.ts
    - apps/planner/src/features/persistence/hydrate-build-document.ts
    - apps/planner/src/features/persistence/project-build-document.ts
    - tests/phase-08/hydrate-build-document.spec.ts
    - tests/phase-12.1/class-roster-wiring.spec.ts
    - tests/phase-12.1/race-roster-wiring.spec.ts

key-decisions:
  - "buildName lives on the foundation store (not a new module-scoped persistence slice) so it shares lifecycle with raceId/alignmentId — single resetFoundation call is enough"
  - "Bounding stays at the schema boundary (z.string().max(80).optional()) — the setter accepts any string at runtime; A5 spec documents this contract explicitly"
  - "Precedence: explicit arg > store > undefined (instead of: store > arg, or: arg replaces store). Save-dialog override stays additive, no destructive store-mutation on save"
  - "B4: when both arg and store are absent, the field is OMITTED from the projected document (preserves existing `(name ? { name } : {})` semantics; schema marks optional)"
  - "Phase-12.1 mock factories: extend in lockstep with the interface (Rule-1 fix) — they spread typed full state, so any new field forces an update"

patterns-established:
  - "Zustand store slice for round-trip identity: hydrate writes, project reads — same slice mediates both directions"
  - "Test-fixture override pattern for sampleBuildDocument: spread base + override `build.name` (`{...base, build: {...base.build, name: '...'}}`) is robust whether or not the helper ships the field"

requirements-completed:
  - SHAR-02
  - SHAR-03
  - SHAR-05

duration: ~5min
completed: 2026-04-25
---

# Phase 14-03: Hydrate `build.name` Round-Trip Summary

**`build.name` now round-trips through hydrate→project: foundation store gains a `buildName: string | null` slice with `setBuildName` setter, `hydrateBuildDocument` calls `foundation.setBuildName(doc.build.name ?? null)`, and `projectBuildDocument(name?)` resolves emitted name via `name ?? foundation.buildName ?? undefined`. Closes the silent-drop bug surfaced by the 2026-04-24 v1.0 re-audit.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-25T15:55Z (worktree branch base verified at 3053dcf)
- **Completed:** 2026-04-25T16:04Z
- **Tasks:** 2 (both `tdd="true"`)
- **Files modified:** 6 (1 store + 2 persistence + 3 tests) + 1 created (deferred-items.md)

## Accomplishments

- Closed ROADMAP SC#3 (Phase 14): `hydrateBuildDocument` no longer silently drops `doc.build.name`. Confirmed by Vitest spec `tests/phase-14/hydrate-build-name.spec.ts` B7 (round-trip parity case).
- Closed ROADMAP SC#7 (partial — covers `build.name` round-trip identity).
- Foundation store gains a normalized `buildName` slice reusable by future Resumen rename UI (out of scope for Phase 14).
- Existing Phase 8 round-trip invariant spec (`tests/phase-08/hydrate-build-document.spec.ts:52`) strengthened: `expect(projected.build.name).toEqual(original.build.name)` now asserted (description updated from "ignoring timestamps and name" to "ignoring timestamps; name persisted via Phase 14-03").
- Schema unchanged (`z.string().max(80).optional()` at `build-document-schema.ts:38`) — no SHAR-05 surface drift.
- Zero NEW typecheck errors over 12-error baseline.

## Task Commits

1. **Task 1: foundation store buildName slice (TDD test+impl)** — `91319a5` (feat)
2. **Task 2: wire hydrate + project + phase-08 round-trip parity** — `7a0c15d` (feat)

_Both tasks `tdd="true"`; spec was authored RED first, then implementation flipped GREEN before committing._

## Files Created/Modified

- **created** `tests/phase-14/hydrate-build-name.spec.ts` — 12 specs total (5 store-slice cases A1–A5 + 7 hydrate/project round-trip cases B1–B7).
- **created** `.planning/phases/14-persistence-robustness/deferred-items.md` — logs pre-existing `dexie` package-resolution failure in `tests/phase-08/share-url.spec.ts` (out-of-scope baseline; verified pre-existing by reproducing on `3053dcf` HEAD with no local changes).
- **modified** `apps/planner/src/features/character-foundation/store.ts` — interface gains `buildName: string | null` + `setBuildName: (name: string | null) => void`; `createInitialFoundationState()` gains `buildName: null`; create-body gains `setBuildName: (buildName) => set({ buildName })`. Comment annotates that bounding lives at the persistence boundary, not the store.
- **modified** `apps/planner/src/features/persistence/hydrate-build-document.ts` — adds `foundation.setBuildName(doc.build.name ?? null)` immediately after `resetFoundation()`. Docstring extended with Phase 14-03 note.
- **modified** `apps/planner/src/features/persistence/project-build-document.ts` — adds `const resolvedName = name ?? foundation.buildName ?? undefined;` at function head; replaces `(name ? { name } : {})` with `(resolvedName ? { name: resolvedName } : {})`. JSDoc `@param name` extended to document precedence chain.
- **modified** `tests/phase-08/hydrate-build-document.spec.ts` — round-trip case description updated; new assertion `expect(projected.build.name).toEqual(original.build.name);` appended.
- **modified** `tests/phase-12.1/class-roster-wiring.spec.ts` — `createEmptyFoundationState()` mock factory updated with `buildName: null` + `setBuildName: () => undefined` (Rule 1 deviation — see below).
- **modified** `tests/phase-12.1/race-roster-wiring.spec.ts` — same mock-factory update (Rule 1 deviation).

## Decisions Made

- **Slice lives on the foundation store, not a new persistence-only module:** the foundation store already owns the values that round-trip with the build document (race, alignment, attributes); attaching `buildName` here means a single `resetFoundation()` clears all four together, and a single store handle suffices for both hydrate and project.
- **Schema, not store, owns the 80-char cap:** Test A5 explicitly stores a 200-char string and asserts the setter accepts it. Documented inline in store.ts. The persistence boundary (`build-document-schema.ts:38`) is where Zod rejects over-length inputs BEFORE the setter is reached via hydrate.
- **Precedence: explicit arg > store > undefined:** lets the Dexie save dialog override on the fly without ever mutating the store, while still echoing the round-tripped name on every Guardar/Compartir/Exportar from a hydrated build. Avoids surprise where projecting after hydrate would silently lose the doc's name.
- **`projectBuildDocument(undefined)` falls through to store:** locked by B6 spec — keeps `name?: string` signature ergonomic while making the "no caller intent" semantic match the no-arg case.
- **Mock-factory cascade is a Rule-1 fix, not a refactor:** when an interface gains a member, the explicit-construction `CharacterFoundationStoreState` mocks in `phase-12.1` immediately fail compilation; updating them inline keeps the typecheck baseline green.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Phase-12.1 mock factories needed `buildName` + `setBuildName` to match new interface**
- **Found during:** Task 1 GREEN typecheck verification (`pnpm typecheck`)
- **Issue:** Two test files (`tests/phase-12.1/class-roster-wiring.spec.ts:40` and `tests/phase-12.1/race-roster-wiring.spec.ts:28`) construct a fully-typed `CharacterFoundationStoreState` literal via `createEmptyFoundationState()`. Adding `buildName` + `setBuildName` to the interface caused two new TS2739 "missing properties" errors at the mock callsites.
- **Fix:** Added `buildName: null` and `setBuildName: () => undefined` to both mock factories. Same trivial extension applied per interface alphabetical-key convention.
- **Files modified:** `tests/phase-12.1/class-roster-wiring.spec.ts`, `tests/phase-12.1/race-roster-wiring.spec.ts`
- **Verification:** Post-fix `pnpm typecheck` reports 12 errors — exactly matches the pre-fix baseline. Zero NEW errors introduced.
- **Committed in:** `91319a5` (Task 1 commit, bundled with the interface change to keep the diff atomic).

---

**Total deviations:** 1 auto-fixed (Rule-1 cascade fix; non-architectural).
**Impact on plan:** Plan executed as written. The mock-factory cascade was the only non-plan touchpoint and stayed inside the type-cohesion contract.

## Issues Encountered

- `pnpm` is not directly on PATH; used `corepack pnpm` (per `package.json` `packageManager: "pnpm@10.0.0"`).
- Vitest 4.x rejects `--reporter=basic` (ERR_LOAD_URL on the basic reporter module under Vite 7). Used default reporter; no spec-level impact.
- `tests/phase-08/share-url.spec.ts` fails with `Cannot find package 'dexie'` — verified pre-existing baseline by stashing local changes and re-running (same failure on `3053dcf`). Logged to `deferred-items.md` and OUT-OF-SCOPE per scope-boundary rule. Round-trip identity for `build.name` is fully covered by `hydrate-build-name.spec.ts` B7 + `hydrate-build-document.spec.ts` round-trip case (both passing).
- The Write tool's first attempt resolved `tests/phase-14/hydrate-build-name.spec.ts` against the main worktree path (not the agent worktree). Detected via `ls` mismatch, removed misplaced file from main tree, re-wrote at the agent-worktree absolute path. No git impact (file never staged from main tree).

## Test-Fixture Notes

- `sampleBuildDocument()` in `tests/phase-08/setup.ts` does NOT ship a `name` field by default (verified by reading the helper). The B-series fixture uses the `{ ...base, build: { ...base.build, name: 'Mi Paladín Test' } }` spread-then-override pattern — robust whether the helper later starts shipping a default name.

## Threat Register

- **T-14-03-04** (Repudiation — name silently dropped on load → re-save) — **CLOSED**: round-trip parity locked by B7 spec + phase-08 hydrate spec assertion. `tests/phase-14/hydrate-build-name.spec.ts:108-113` and `tests/phase-08/hydrate-build-document.spec.ts:73`.
- **T-14-03-01** (Tampering — malicious BuildDocument with name > 80 chars) — **PRESERVED**: schema gate `z.string().max(80)` in `build-document-schema.ts:38` rejects at boundary BEFORE hydrate sees the doc. No schema change in this plan.
- **T-14-03-02** (Information Disclosure — XSS via build name in UI) — **PRESERVED**: this plan only adds a setter that stores the value. No new render path. React auto-escaping unchanged in existing summary surfaces.
- **T-14-03-03** (Tampering — JSON download filename injection via name) — **PRESERVED**: pre-existing `sanitize()` in `apps/planner/src/features/persistence/json-export.ts:11-15` still intercepts. No change.

## Threat Flags

None — no new security-relevant surface introduced. The setter mediates a value that already passes the schema gate; render paths and download paths are unchanged.

## Verification Evidence

```
tests/phase-14/hydrate-build-name.spec.ts:        12/12 PASS (5 store-slice + 7 round-trip)
tests/phase-08/hydrate-build-document.spec.ts:    4/4 PASS (with new name assertion)
tests/phase-08/project-build-document.spec.ts:    5/5 PASS (no regression)
tests/phase-08/json-roundtrip.spec.ts:            4/4 PASS (no regression)
tests/phase-08/save-slot-dialog.spec.tsx:         5/5 PASS (no regression)
tests/phase-14/toast-clobber-race.spec.tsx:       6/6 PASS (no regression — adjacent)
typecheck:                                        12 pre-existing baseline / 0 new
```

`tests/phase-08/share-url.spec.ts` excluded — pre-existing dexie module-resolution baseline failure (deferred to deferred-items.md).

Grep gates (all met):

```
grep -c "buildName: string | null"        apps/planner/src/features/character-foundation/store.ts → 1
grep -c "setBuildName"                    apps/planner/src/features/character-foundation/store.ts → 2 (interface + setter body)
grep -c "buildName: null"                 apps/planner/src/features/character-foundation/store.ts → 1 (initial-state default)
grep -c "buildName"                       apps/planner/src/features/character-foundation/store.ts → 4 (interface field + comment + initial state + setter destructure) ≥ 4

grep -c "foundation.setBuildName"         apps/planner/src/features/persistence/hydrate-build-document.ts → 1
grep -c "doc.build.name ?? null"          apps/planner/src/features/persistence/hydrate-build-document.ts → 1
grep -c "Phase 14-03"                     apps/planner/src/features/persistence/hydrate-build-document.ts → 1
grep -c "Phase 14-03"                     apps/planner/src/features/persistence/project-build-document.ts → 2
grep -c "resolvedName"                    apps/planner/src/features/persistence/project-build-document.ts → 2 (declaration + use)
grep -c "foundation.buildName"            apps/planner/src/features/persistence/project-build-document.ts → 3 (JSDoc + comment + initializer)

grep -c "expect(projected.build.name)"    tests/phase-08/hydrate-build-document.spec.ts → 1
grep -c "ignoring timestamps and name"    tests/phase-08/hydrate-build-document.spec.ts → 0 (old description removed)
```

## TDD Gate Compliance

- **RED gate (Task 1):** Spec authored first; `pnpm vitest run tests/phase-14/hydrate-build-name.spec.ts` reported 5/5 fail (TypeError: `setBuildName is not a function`). Confirmed before edit-store-impl step.
- **GREEN gate (Task 1):** After store edit, same command 5/5 PASS. Captured in `91319a5`.
- **RED gate (Task 2):** Implicit — Task 2 added 7 new B-series specs that exercised the not-yet-wired hydrate/project paths. The wire-up was applied alongside the spec extension because Task 2 is multi-edit; the hydrate/project edits land in the same commit as the new B-series so the GREEN→GREEN transition is single-commit.
- **GREEN gate (Task 2):** 12/12 phase-14 + 4/4 phase-08 hydrate + adjacent suites all PASS. Captured in `7a0c15d`.

Per plan structure (`type=execute` with two `tdd="true"` tasks), the test-first-then-impl rhythm was preserved at the task granularity. Plan-level TDD gate audit: `test(...)` not used as a separate commit because each task bundled its test+impl atomically per plan instructions ("Step 5: Commit `feat(14-03): foundation store buildName slice (test+impl)`"). This matches the plan's explicit commit message format.

## User Setup Required

None — no external service or configuration. The fix is internal to the planner SPA and ships with the next deploy.

## Next Phase Readiness

- **Resumen rename UI (future plan):** `foundation.buildName` is now a typed slice; a Resumen-side rename input can wire directly into `setBuildName` without touching hydrate/project.
- **14-04..14-06:** no dependency surface from this plan; round-trip identity for `build.name` is locked.
- **Pre-existing dexie module-resolution issue:** logged to `deferred-items.md` for triage. Suggests a missing `pnpm install` after dependency drift; verify next time someone runs the share-url spec.

## Self-Check: PASSED

- File `apps/planner/src/features/character-foundation/store.ts` exists and contains `buildName: string | null` + `setBuildName` ✓
- File `apps/planner/src/features/persistence/hydrate-build-document.ts` exists and contains `foundation.setBuildName(doc.build.name ?? null)` ✓
- File `apps/planner/src/features/persistence/project-build-document.ts` exists and contains `resolvedName = name ?? foundation.buildName ?? undefined` ✓
- File `tests/phase-14/hydrate-build-name.spec.ts` exists with 12 specs ✓
- File `tests/phase-08/hydrate-build-document.spec.ts` exists with new `expect(projected.build.name).toEqual(original.build.name)` assertion ✓
- Commit `91319a5` (Task 1) found in `git log` ✓
- Commit `7a0c15d` (Task 2) found in `git log` ✓
- 12/12 phase-14 specs PASS ✓
- 4/4 phase-08 hydrate specs PASS ✓
- Adjacent suites (project, json-roundtrip, save-slot-dialog) PASS — no regression ✓
- 0 NEW typecheck errors (12 pre-existing baseline matches Task-1 baseline matches Task-2 baseline) ✓
- All grep gates met ✓
- No file deletions in either commit ✓
- STATE.md / ROADMAP.md NOT modified by this plan (per parallel_execution rules) ✓

---
*Phase: 14-persistence-robustness*
*Plan: 03*
*Completed: 2026-04-25*
