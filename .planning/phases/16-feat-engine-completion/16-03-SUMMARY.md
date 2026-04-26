---
phase: 16-feat-engine-completion
plan: 03
subsystem: persistence + tests
tags: [persistence, share-url, regression-lock, vitest, FEAT-06, D-05, D-NO-DEPS]

# Dependency graph
requires:
  - phase: 16-02
    provides: race-aware determineFeatSlots + race-bonus chip → bonusGeneralFeatIds[0] convention + BuildStateAtLevel raceId/activeClassIdAtLevel fields
  - phase: 8
    provides: buildDocumentSchema + hydrateBuildDocument + projectBuildDocument + sampleBuildDocument factory
provides:
  - "tests/phase-16/humano-l1-build-roundtrip.spec.ts — 3 it() blocks locking D-05 backward-compat invariant"
  - "Regression lock for buildDocumentSchema.shape.schemaVersion.value === 2 (share-URL contract)"
  - "Round-trip proof for v1.0-shaped saves (bonusGeneralFeatIds: []) and v1.1-shaped saves (race-bonus pick at bonusGeneralFeatIds[0])"
affects: [feat-engine, share-url, persistence-boundary]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern S6 (PATTERNS.md) — round-trip equality via Zod parse + JSON.stringify, both required (semantic + ordering drift)"
    - "createdAt normalisation: parse Zod-first, then null out the non-deterministic stamp before equality (same workaround posture as tests/phase-08/hydrate-build-document.spec.ts)"

key-files:
  created:
    - tests/phase-16/humano-l1-build-roundtrip.spec.ts
  modified: []

key-decisions:
  - "Test-only plan: zero production code modified. The persistence layer was left intact through Plan 16-02 (D-05 baseline). This plan ships the regression coverage that LOCKS that baseline against future drift."
  - "createdAt normalisation (Rule 1 deviation): the plan-prescribed PATTERNS skeleton called for direct byte-identical equality, but projectBuildDocument() stamps a fresh new Date().toISOString() at every call (project-build-document.ts:108). The non-deterministic field is normalised on the projected doc to match original BEFORE the equality assertions. The schema-shape contract is still locked because Zod parse runs against the fresh stamp first (proves the projection emits a valid datetime). Mirrors the workaround in tests/phase-08/hydrate-build-document.spec.ts (which compares fields individually and skips createdAt)."
  - "Plan-skeleton override approach for Test 2: the PATTERNS.md skeleton hinted at either a deep factory override or a post-construct mutation. The factory only accepts top-level build.* keys (no per-level featSelections deep-merge); chose post-construct mutation of original.build.featSelections[0].bonusGeneralFeatIds. The doc is still v1.1-canonical JSON before hydrate."

patterns-established: []

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-04-26
---

# Phase 16 Plan 03: D-05 Backward-Compat Round-Trip Regression Spec Summary

**D-05 share-URL invariant locked: 3 vitest it() blocks at `tests/phase-16/humano-l1-build-roundtrip.spec.ts` prove (1) v1.0-shaped JSON builds round-trip byte-identical, (2) v1.1-shaped builds with the new race-bonus pick at `bonusGeneralFeatIds[0]` round-trip byte-identical, (3) `buildDocumentSchema.shape.schemaVersion.value === 2` standalone — closing the verification gap flagged by CONTEXT § D-05 and locking the share-URL contract against future drift. Zero production code changes.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-26T16:43:13Z
- **Completed:** 2026-04-26T16:46:32Z
- **Tasks:** 1 / 1
- **Files modified:** 1 created (test-only)
- **Spec file size:** 115 lines / 6 190 bytes

## Accomplishments

- **Spec layer:** `tests/phase-16/humano-l1-build-roundtrip.spec.ts` ships 3 it() blocks under a single describe (`Phase 16-03 — Humano L1 round-trip (FEAT-06, D-05 invariant)`):
  1. **Test 1 (v1.0 shape — `Elfo Guerrero L1 v1.0-shaped build (empty bonusGeneralFeatIds) round-trips byte-identical`):** `sampleBuildDocument({ raceId: 'race:elf' })` (factory default `bonusGeneralFeatIds: []`). Hydrate → project → schema-parse-then-normalise-createdAt → byte-identical equality (`toEqual` + `JSON.stringify`).
  2. **Test 2 (v1.1 shape — `Humano Guerrero L1 v1.1-shaped build (bonusGeneralFeatIds populated) round-trips byte-identical`):** `sampleBuildDocument({ raceId: 'race:human' })` with `original.build.featSelections[0].bonusGeneralFeatIds = ['feat:weapon-focus-longsword']`. Hydrate → in-store sanity (`useFeatStore.getState().levels[0].bonusGeneralFeatIds[0] === 'feat:weapon-focus-longsword'`) → project → schema-parse-then-normalise-createdAt → byte-identical equality.
  3. **Test 3 (schema-version regression lock — `schemaVersion stays at 2 (D-05: no share-URL bump)`):** `expect(buildDocumentSchema.shape.schemaVersion.value).toBe(2)`. Standalone — independent of hydrate/project so it stays GREEN even if Tests 1/2 ever break.
- **Pattern S6 reuse:** both equality forms (`buildDocumentSchema.parse(projected).toEqual(original)` AND `JSON.stringify(projected) === JSON.stringify(original)`) are present in Tests 1+2, per PATTERNS.md S6.
- **Zero new fixtures, zero new helpers:** the spec imports `sampleBuildDocument` from `../phase-08/setup` (which already wires `'fake-indexeddb/auto'` for Dexie compatibility) and reuses the four existing store reset selectors.
- **`schemaVersion` literal locked at `2`:** the share-URL contract introduced at Phase 14 baseline is now blast-shielded. If a future regression bumps the literal, Test 3 turns RED in isolation — every previously shared link is dead and the spec announces exactly why.

## Task Commits

Each task committed atomically:

1. **Task 16-03-01:** Author `humano-l1-build-roundtrip.spec.ts` — `0830364` (test).

## Files Created/Modified

- **Created:** `tests/phase-16/humano-l1-build-roundtrip.spec.ts` — 115 lines, 3 it() blocks under 1 describe.
- **Modified:** none.

## Spec Content Map

| Test | Build shape | Race | Race-bonus pick | Round-trip | Schema-shape lock |
|------|-------------|------|-----------------|------------|-------------------|
| 1 | v1.0 (`bonusGeneralFeatIds: []`) | `race:elf` | none | byte-identical (modulo createdAt) | via Zod parse pre-normalise |
| 2 | v1.1 (`bonusGeneralFeatIds: ['feat:weapon-focus-longsword']`) | `race:human` | `bonusGeneralFeatIds[0]` | byte-identical (modulo createdAt) | via Zod parse pre-normalise |
| 3 | n/a | n/a | n/a | n/a (standalone) | `schemaVersion === 2` literal |

## Decisions Made

1. **Test-only plan: zero production code modified.** Plan 16-02 already shipped the persistence layer's race-aware threading without bumping `schemaVersion` (D-05 honored). Plan 16-03's job is to ship the regression coverage that LOCKS that baseline. The plan's `<acceptance_criteria>` reflects this — every assertion is a *verification* of the existing behaviour, not a request for new behaviour.
2. **`createdAt` normalisation is the right boundary** for "byte-identical" in this codebase. The PATTERNS.md skeleton's prescriptive `expect(JSON.stringify(projected)).toBe(JSON.stringify(original))` cannot pass against the existing `projectBuildDocument()` which stamps `new Date().toISOString()` at projection time. The existing Phase 8 round-trip spec at `tests/phase-08/hydrate-build-document.spec.ts:52-60` solves this by comparing fields individually and skipping `createdAt`. We preserve the spec's stronger byte-identical intent (catches field-ordering drift, which the field-by-field compare misses) by normalising the single non-deterministic field on the projected doc before stringify-equality. Schema-shape contract is still locked because Zod parse runs against the fresh stamp BEFORE normalisation. Documented in spec header (lines 17-26).
3. **Test 2 override approach: post-construct mutation.** The Phase 8 factory accepts top-level `build.*` overrides via spread merge — but `featSelections[0].bonusGeneralFeatIds` is a deep nested array, not a top-level key. PATTERNS.md skeleton hinted at "the factory may take a `featSelections` override, OR the executor can spread a partial override — pick whichever the existing factory signature supports". The factory does NOT deep-merge per-level featSelections (it spreads only top-level `build.*` keys). Chose post-construct mutation of `original.build.featSelections[0].bonusGeneralFeatIds`. The doc passed to `hydrateBuildDocument` is still v1.1-canonical JSON; no factory-state mutation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `createdAt` projection stamp drift breaks byte-identical assertion as authored**

- **Found during:** Task 16-03-01 — first run of the spec after authoring per the PATTERNS.md skeleton verbatim.
- **Issue:** The PATTERNS.md skeleton (referenced verbatim by the plan's Task 1 `<action>` block) prescribes `expect(JSON.stringify(projected)).toBe(JSON.stringify(original))` and `expect(buildDocumentSchema.parse(projected)).toEqual(original)`. Both fail against the current production code: `projectBuildDocument()` at `apps/planner/src/features/persistence/project-build-document.ts:108` stamps `createdAt: new Date().toISOString()` at every call, so the projected doc's `createdAt` is "now" while `original.createdAt` is `'2026-04-17T00:00:00.000Z'` (factory-pinned). Vitest output (Test 1 + Test 2 both RED with identical diff lines `- "createdAt": "2026-04-17T00:00:00.000Z"` vs `+ "createdAt": "<NOW>"`).
- **Why this is NOT a Plan 16-02 invariant violation:** the failure surfaced inside the assertion harness, not at Zod parse time. The plan's safety stop ("If RED on Test 2, the failure must report the exact field-path drift and the executor must STOP") gates on a *Zod parse error on `projected`* indicating that Plan 16-02 left a stale field, which is what would happen if the persistence-untouched invariant had been violated. Here Zod parse on `projected` SUCCEEDS — the failure is the spec's own equality assertion against a non-deterministic field that has been non-deterministic since Phase 14 baseline. This is a spec-authoring bug (Rule 1), not a Plan 16-02 regression.
- **Fix:** Normalise `createdAt` on both `parsed` (the Zod-parsed copy of `projected`) and `projected` itself to match `original.createdAt` BEFORE the equality assertions. The Zod parse still runs against the fresh stamp (proves the projection emits a valid `datetime` string per schema). Documented inline at lines 17-26 (file header) and at each test's normalisation block (lines 60-67 for Test 1, lines 95-102 for Test 2).
- **Files modified:** `tests/phase-16/humano-l1-build-roundtrip.spec.ts` (the file under authoring; the deviation surfaced during the same task that created the file).
- **Verification:** Spec now passes 3/3 in `corepack pnpm exec vitest run tests/phase-16/humano-l1-build-roundtrip.spec.ts --reporter=dot`.
- **Committed in:** `0830364` (Task 16-03-01 — same commit as the spec authoring; the deviation surfaced and resolved before the first GREEN-gate verification).

## Verification Results

- `corepack pnpm exec vitest run tests/phase-16/humano-l1-build-roundtrip.spec.ts --reporter=dot` — **3/3 GREEN** (1.11s).
- `corepack pnpm exec vitest run tests/phase-08 tests/phase-16 --reporter=dot` — **122/123 GREEN** (1 pre-existing baseline failure: `tests/phase-08/ruleset-version.spec.ts > BUILD_ENCODING_VERSION is literal 1` — documented in 16-01-SUMMARY.md and 16-02-SUMMARY.md, unchanged from STATE.md baseline).
- `corepack pnpm exec tsc -p tsconfig.base.json --noEmit` — exit **0** (full workspace typecheck clean).
- Full vitest run (`corepack pnpm exec vitest run`) — **2268 passed / 3 failed / 2 skipped / 1 todo** (2274 total). Plan 16-02 baseline was 2265 passed / 3 failed; Plan 16-03 adds 3 GREEN tests → 2268 passed. **Zero new regressions.** The 3 failures are the documented baseline (1 phase-08 BUILD_ENCODING_VERSION literal + 2 phase-12.4 class-picker-prestige-reachability), unchanged.

## Phase 16 Phase-Gate Satisfaction

| Phase 16 success criterion | Closed by | Status |
|----------------------------|-----------|--------|
| FEAT-05 SC #1: `feat-eligibility.ts:45` schedule TODO closed | Plan 16-02 (`7475bfb`) | Done |
| FEAT-06 SC #2: `feat-eligibility.ts:49` race TODO closed | Plan 16-02 (`7475bfb`) | Done |
| FEAT-06 SC #3: Humano L1 advance bar resolves `legal` with 3 slots | Plan 16-02 (`f090ed2`) | Done |
| FEAT-05/06 SC #4: vitest coverage + regression lock | Plans 16-01 + 16-02 + **16-03** (`0830364`) | **Done — Plan 16-03 closes it** |

Phase 16 phase-gate now satisfied. The next phase per ROADMAP is **Phase 17 — Per-Race Point-Buy**.

## Threat Surface Scan

No new security-relevant surface introduced. Test-only plan; no network, file-system, schema, or auth surface added. Threat register T-16-03-01/02/03 dispositions all `accept` per PLAN — verified posture unchanged.

## Known Stubs

None. The spec is a stand-alone regression artefact; it does not depend on any deferred functionality. Test 3 (`schemaVersion === 2`) is intentionally standalone so it stays GREEN even if Tests 1/2 ever turn RED — a clean diagnostic decoupling.

## Self-Check: PASSED

**Files exist:**
- `tests/phase-16/humano-l1-build-roundtrip.spec.ts` — FOUND (115 lines)

**Commits exist:**
- `0830364` (Task 16-03-01 — `test(16-03): add D-05 backward-compat round-trip regression spec`) — FOUND

**Acceptance criteria verified:**
- File `tests/phase-16/humano-l1-build-roundtrip.spec.ts` exists — YES.
- Contains regex match for `Phase 16-03 — Humano L1 round-trip` — YES (1 occurrence).
- Contains exactly 3 `it(` blocks — YES.
- Contains regex match for `'race:elf'` AND `'race:human'` AND `'feat:weapon-focus-longsword'` — YES (4 total occurrences).
- Contains `JSON.stringify(projected)).toBe(JSON.stringify(original))` ≥ 2 occurrences — YES (2 occurrences, Tests 1+2).
- Contains `buildDocumentSchema.shape.schemaVersion.value` — YES (Test 3).
- Imports `from '../phase-08/setup'` — YES (1 occurrence).
- Spec exits 0 — YES (3/3 GREEN).
- Phase 8 + Phase 16 sweep — 122/123 (1 pre-existing baseline failure, NOT a regression).
- `tsc --noEmit` exits 0 — YES.
