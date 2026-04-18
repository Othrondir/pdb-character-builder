---
phase: 12-tech-debt-sweep
plan: 01
subsystem: testing+rules-engine
tags: [typecheck, feat-prerequisite, class-catalog, canonical-id, FEAT-02, tdd]

requires:
  - phase: 06-feats-proficiencies
    provides: evaluateFeatPrerequisites, feat-revalidation, feat-eligibility
  - phase: 05.1-data-extractor-pipeline
    provides: ClassCatalog + compiledClassCatalog with Spanish class labels
  - phase: 03-character-origin-base-attributes
    provides: evaluateOriginSelection + DeityRuleRecord shape
provides:
  - Shared getClassLabel helper in packages/rules-engine/src/feats/
  - evaluateFeatPrerequisites signature gains ClassCatalog param (non-breaking grow)
  - Branded-id rebuilder pattern (asCanonicalId + buildDeityRecord) for future fixtures
  - Clean `tsc --noEmit` across the monorepo
affects: [12-02, future-tdd-phases, fixture-authoring]

tech-stack:
  added: []
  patterns:
    - "Shared domain-layer label resolvers in packages/rules-engine/src/feats/"
    - "Branded-id rebuilder (asCanonicalId + typed builder) for test fixtures"
    - "ClassCatalog threaded through feat-prerequisite call chain"

key-files:
  created:
    - packages/rules-engine/src/feats/get-class-label.ts
    - tests/phase-12/class-prereq-label.spec.ts
  modified:
    - packages/rules-engine/src/feats/feat-prerequisite.ts
    - packages/rules-engine/src/feats/feat-eligibility.ts
    - packages/rules-engine/src/feats/feat-revalidation.ts
    - packages/rules-engine/src/feats/index.ts
    - apps/planner/src/features/feats/selectors.ts
    - apps/planner/src/features/feats/feat-detail-panel.tsx
    - apps/planner/src/features/feats/feat-search.tsx
    - tests/phase-03/foundation-validation.spec.ts
    - tests/phase-06/feat-prerequisite.spec.ts
    - tests/phase-06/feat-proficiency.spec.ts
    - tests/phase-06/feat-revalidation.spec.ts

key-decisions:
  - "getClassLabel signature accepts `string | null` (not `CanonicalId | null` as drafted in the plan) because compiledClassSchema.id is zod-typed as `string` via regex guard, not as the branded CanonicalId template-literal type. Accepting `string` lets feat-prerequisite.ts pass `prereqs.minLevelClass` directly without a cast, keeping the seam cast-free."
  - "evaluateAllFeatsForSearch signature also grown with ClassCatalog — not originally enumerated in the plan, but follows the same pattern as evaluateFeatPrerequisites because it delegates to it (Rule 3 blocking-issue fix: forgetting it would break feat-search.tsx)."
  - "On missing-class-from-catalog, getClassLabel returns the raw classId string (not null) — matches the pre-existing `classDef?.label ?? classId` fallback in feat-prerequisite.ts and keeps UI chips renderable."

patterns-established:
  - "Single source of truth for class-id → Spanish label: one helper in rules-engine; planner + rules-engine both consume it."
  - "Branded-id rebuilder: when a strict branded type (CanonicalId[]) meets a loose fixture literal (string[]), wrap the brand cast inside a single runtime-guarded helper so the fixture code stays free of free-floating `as` casts."
  - "ClassCatalog parameter position: always last in rules-engine feat fns (after featCatalog), matching feat-eligibility.ts and bab-calculator.ts."

requirements-completed: [FEAT-02]

duration: 28min
completed: 2026-04-18
---

# Phase 12 Plan 01: Tech Debt Sweep (Bug 1 + Bug 2) Summary

**Shared `getClassLabel` helper extracted to rules-engine fixes FEAT-02 class-prereq Spanish labels; P03 foundation-validation.spec.ts typecheck closed via branded-id rebuilder pattern — `tsc --noEmit` now green, full 387-test suite green.**

## Performance

- **Duration:** ~28 min
- **Started:** 2026-04-18T17:39:15Z
- **Completed:** 2026-04-18T18:06:46Z
- **Tasks:** 3
- **Files modified:** 11 (+2 created)

## Accomplishments

- **Bug 2 (IN-07 / FEAT-02):** Class-level prereq chips now render `Nivel de Pícaro` instead of the raw canonical id `Nivel de class:rogue`. Single shared `getClassLabel` helper lives in `packages/rules-engine/src/feats/get-class-label.ts`; planner selectors + feat-prerequisite call site both route through it. The bugged `featCatalog.feats.find((f) => f.id === classId)` lookup at feat-prerequisite.ts:199 is gone (grep audit passes).
- **Bug 1 (MILESTONE-AUDIT §4 P03 typecheck):** `pnpm typecheck` exits 0 for the first time since Phase 08. The 3 cascading `DeityRuleRecord[]` vs `CanonicalId[]` errors at foundation-validation.spec.ts:25/38/60 are resolved by replacing the inline `{ id: 'deity:none' as const, allowedAlignmentIds: [] as string[] }` fixture with `buildDeityRecord('deity:none', [])`, which composes branded ids inside a single `asCanonicalId(raw)` guard checked against `canonicalIdRegex.test`.
- **TDD gate satisfied:** Task 1 commit is `test(12-01): …` (RED confirmed — Phase 12 spec failed with `'Nivel de class:rogue'` vs `'Nivel de Pícaro'`). Task 2 commit is `fix(12-01): …` (GREEN, spec passes).
- **Zero regressions:** full `pnpm vitest run` = 387/387 across 69 test files.

## Task Commits

Each task was committed atomically on branch `master`:

1. **Task 1: RED — class-prereq-label regression spec** — `6920be9` (test)
2. **Task 2: GREEN — extract shared getClassLabel helper + thread ClassCatalog** — `2bbc9cf` (fix)
3. **Task 3: Bug 1 — P03 foundation-validation.spec.ts branded-id rebuilder** — `43ae985` (fix)

Metadata commit for SUMMARY + state: see final commit below.

## Files Created/Modified

**Created:**
- `packages/rules-engine/src/feats/get-class-label.ts` — single-source `getClassLabel(classId, classCatalog)` helper.
- `tests/phase-12/class-prereq-label.spec.ts` — regression spec proving class-level prereq labels render Spanish + fall back to raw id safely.

**Modified:**
- `packages/rules-engine/src/feats/feat-prerequisite.ts` — signature grown by one `classCatalog: ClassCatalog` param; line 199 lookup replaced.
- `packages/rules-engine/src/feats/feat-eligibility.ts` — `getEligibleFeats` already had `classCatalog`; `evaluateAllFeatsForSearch` grown to match.
- `packages/rules-engine/src/feats/feat-revalidation.ts` — `revalidateFeatSnapshotAfterChange` input gains `classCatalog: ClassCatalog`; threads to both evaluate calls.
- `packages/rules-engine/src/feats/index.ts` — re-export `get-class-label`.
- `apps/planner/src/features/feats/selectors.ts` — local `getClassLabel(classId)` duplicate deleted; 3 `evaluateFeatPrerequisites` call sites + 2 `revalidateFeatSnapshotAfterChange` inputs threaded.
- `apps/planner/src/features/feats/feat-detail-panel.tsx` + `feat-search.tsx` — consume `compiledClassCatalog` and pass it to the rules-engine entry points.
- `tests/phase-03/foundation-validation.spec.ts` — `asCanonicalId` + `buildDeityRecord` helpers added; fixture line 13 now uses `buildDeityRecord('deity:none', [])`.
- `tests/phase-06/feat-prerequisite.spec.ts` (16 calls), `feat-proficiency.spec.ts` (1 call), `feat-revalidation.spec.ts` (5 calls) — all updated for the new ClassCatalog parameter.

## Bug Evidence

### Bug 1 — P03 typecheck before/after

**Before (baseline `pnpm typecheck`):**
```
tests/phase-03/foundation-validation.spec.ts(25,7): error TS2345: …
tests/phase-03/foundation-validation.spec.ts(38,7): error TS2345: …
tests/phase-03/foundation-validation.spec.ts(60,7): error TS2345: …
ELIFECYCLE Command failed with exit code 2.
```

**After (on `43ae985`):** exits 0 — zero TypeScript errors repo-wide. `pnpm vitest run tests/phase-03/foundation-validation.spec.ts` still 4/4 green (four original assertions unchanged).

### Bug 2 — class-prereq-label RED → GREEN

**RED (on `6920be9`, before fix):**
```
× resolves class-level prereq label via ClassCatalog (not featCatalog)
AssertionError: expected 'Nivel de class:rogue' to be 'Nivel de Pícaro'
```

**GREEN (on `2bbc9cf`, after fix):** Both `tests/phase-12/class-prereq-label.spec.ts` tests pass (2/2) and all Phase 06 specs remain GREEN (54/54).

**Grep audits (from plan verification block):**
- `grep -n "featCatalog.feats.find.*classId" packages/rules-engine/src/feats/feat-prerequisite.ts` → no matches (wrong lookup gone).
- `grep -nE "^function getClassLabel\(" apps/planner/src/features/feats/selectors.ts` → no matches (duplicate removed).
- `grep -n "getClassLabel" packages/rules-engine/src/feats/get-class-label.ts` → `export function getClassLabel(` on line 18.

## Decisions Made

See frontmatter `key-decisions`. The one worth highlighting for downstream phases: **`getClassLabel` accepts `string | null`, not `CanonicalId | null`**. The plan wording called for `CanonicalId | null`, but `compiledClassSchema.id` is zod-typed as `string` (regex-guarded) rather than as the `CanonicalId` template-literal type, so forcing the branded input would require `as CanonicalId` casts at every caller — the opposite of what the plan wanted for Bug 1 (cast-free branded boundaries). Accepting `string` at the helper's input is the cleanest seam: callers pass `prereqs.minLevelClass` (typed `string | null | undefined` from the zod schema) directly with no cast, and the lookup against `classCatalog.classes.find((c) => c.id === classId)` works because both sides are `string`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] `evaluateAllFeatsForSearch` also needs ClassCatalog**
- **Found during:** Task 2 GREEN (tsc error TS2554 on `feat-search.tsx:71`).
- **Issue:** Plan enumerated `evaluateFeatPrerequisites` callers (revalidation, selectors, feat-detail-panel) but missed that `evaluateAllFeatsForSearch` inside `feat-eligibility.ts` delegates to `evaluateFeatPrerequisites` for every feat and is consumed by the planner search box. Growing the delegate implies growing the caller.
- **Fix:** Added `classCatalog: ClassCatalog` param to `evaluateAllFeatsForSearch`, threaded it in `apps/planner/src/features/feats/feat-search.tsx` via `compiledClassCatalog` import.
- **Files modified:** `packages/rules-engine/src/feats/feat-eligibility.ts`, `apps/planner/src/features/feats/feat-search.tsx`.
- **Verification:** `pnpm typecheck` clean; full suite green.
- **Committed in:** `2bbc9cf` (Task 2 commit).

**2. [Rule 1 — Bug] Original Task 1 spec fixtures shipped wrong `datasetId` shape**
- **Found during:** Task 2 tsc pass on the newly-committed RED spec.
- **Issue:** Initial RED spec used `datasetId: { datasetVersion, rulesetId }` (object) but `datasetManifest.datasetIdSchema` is a `z.string().regex(...)` matching `puerta-ee-YYYY-MM-DD+<hash>`. The spec compiled RED-wise because vitest doesn't `schema.parse()` the fixtures, but tsc flagged it.
- **Fix:** Replaced with `'puerta-ee-2026-04-18+test0'` (valid under the regex).
- **Files modified:** `tests/phase-12/class-prereq-label.spec.ts`.
- **Verification:** `pnpm typecheck` clean; spec still asserts the same Spanish-label invariant.
- **Committed in:** `2bbc9cf` (folded into Task 2 GREEN commit — the RED already existed on disk; the typecheck fix is part of the GREEN commit's scope).

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug in own test fixture).
**Impact on plan:** Both deviations are mechanical — no scope creep, no architectural change. The `evaluateAllFeatsForSearch` grow is a faithful extension of the plan's "grow signature" decision to a caller the plan didn't enumerate.

## Issues Encountered

None beyond the deviations above. `npx pnpm` had to be used because `pnpm` isn't on the PATH in the current shell — no functional impact.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 12 Plan 02 (Bugs 3 + 4 — FEAT_CATEGORY_LABELS dead code + extract counter) is unblocked.
- Phase 12.1 (Data-Wiring + UX Overflow) still deferred per 12-CONTEXT.md.
- With `pnpm typecheck` clean, future plans can treat any new tsc error as a real regression, not legacy noise.

---
*Phase: 12-tech-debt-sweep*
*Completed: 2026-04-18*

## Self-Check: PASSED

Verified on 2026-04-18T18:06:46Z:
- FOUND: `packages/rules-engine/src/feats/get-class-label.ts`
- FOUND: `tests/phase-12/class-prereq-label.spec.ts`
- FOUND: `.planning/phases/12-tech-debt-sweep/12-01-SUMMARY.md`
- FOUND commit: `6920be9` (Task 1 RED)
- FOUND commit: `2bbc9cf` (Task 2 GREEN)
- FOUND commit: `43ae985` (Task 3 Bug 1)
