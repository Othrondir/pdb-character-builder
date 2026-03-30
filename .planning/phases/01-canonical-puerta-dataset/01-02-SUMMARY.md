---
phase: 01-canonical-puerta-dataset
plan: 02
subsystem: data-extractor
tags: [zod, dataset-manifest, overrides, vitest]
requires:
  - phase: 01-01
    provides: canonical IDs and source precedence contracts
provides:
  - public-safe dataset manifest schema with provenance and locale metadata
  - manual dataset activation catalog that requires explicit activeDatasetId promotion
  - versioned override registry seed artifacts stored as repo-relative JSON
affects: [phase-01-blocked-states, planner-dataset-loading, shared-build-versioning]
tech-stack:
  added: []
  patterns:
    - contracts-first dataset manifests and activation catalogs
    - repo-relative JSON override payloads with evidence metadata
key-files:
  created:
    - packages/data-extractor/src/contracts/dataset-manifest.ts
    - packages/data-extractor/src/contracts/dataset-catalog.ts
    - packages/data-extractor/src/contracts/override-registry.ts
    - packages/overrides/registry.json
    - packages/overrides/text/custom-domain-labels.json
    - tests/phase-01/manifest-contract.spec.ts
  modified:
    - tests/phase-01/manifest-contract.spec.ts
key-decisions:
  - "Dataset manifests reject absolute Windows paths anywhere in their public payload."
  - "Active datasets stay manual through a catalog contract that requires activeDatasetId and lastPromotedBy='manual'."
  - "Override payload files are limited to repo-relative JSON under packages/overrides/."
patterns-established:
  - "Manifest, catalog, and override registry contracts are frozen as Zod schemas before extraction code exists."
  - "Seed overrides are committed as reviewable JSON plus evidence metadata, not copied raw assets."
requirements-completed: [VALI-04]
duration: 4 min
completed: 2026-03-30
---

# Phase 01 Plan 02: Dataset Manifest and Override Registry Summary

**Public-safe dataset manifests, manual activation catalogs, and repo-scoped override registry seeds for Puerta snapshot versioning**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-30T10:56:19+02:00
- **Completed:** 2026-03-30T10:59:54+02:00
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added a dataset manifest schema that freezes versioning, provenance, locale metadata, and the blocked ambiguity policy.
- Added a manual dataset catalog contract so new datasets cannot become active without an explicit `activeDatasetId` promotion.
- Added a versioned override registry contract plus public-safe seed JSON artifacts for future text overrides.

## Task Commits

Each task was committed atomically:

1. **Task 1: Freeze the dataset manifest schema and manual activation contract** - `64ecbe5` (feat)
2. **Task 2: Define the override registry schema and commit a text-override seed artifact** - `116de27` (feat)

**Plan metadata:** Pending summary/state commit at close-out.

## Files Created/Modified

- `packages/data-extractor/src/contracts/dataset-manifest.ts` - Zod contract for public-safe manifests with path sanitization.
- `packages/data-extractor/src/contracts/dataset-catalog.ts` - Manual activation contract tying active datasets to explicit catalog updates.
- `packages/data-extractor/src/contracts/override-registry.ts` - Zod contract for evidence-backed override entries and repo-relative payloads.
- `packages/overrides/registry.json` - Seed registry with one text override entry and review metadata.
- `packages/overrides/text/custom-domain-labels.json` - Public-safe Spanish text override seed payload.
- `tests/phase-01/manifest-contract.spec.ts` - Contract coverage for manifest naming, path safety, manual activation, and override payload safety.

## Decisions Made

- Reused the canonical source precedence tuples in the manifest schema so precedence policy cannot drift from `source-precedence.ts`.
- Required `activeDatasetId` to exist inside `availableDatasetIds`, which keeps promotion explicit instead of implied by manifest generation.
- Restricted override payloads to repo-relative JSON paths, which blocks raw sqlite or machine-local file references from entering source control.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched verification commands to `corepack pnpm`**
- **Found during:** Task 1 verification
- **Issue:** `pnpm` was not available on `PATH`, so the plan's direct verification command could not run.
- **Fix:** Used `corepack pnpm` for Vitest and TypeScript verification without changing repo files.
- **Files modified:** None
- **Verification:** `corepack pnpm vitest run tests/phase-01/manifest-contract.spec.ts --reporter=dot`, `corepack pnpm exec tsc -p tsconfig.base.json --noEmit`, `corepack pnpm vitest run tests/phase-01/schema-contract.spec.ts --reporter=dot`
- **Committed in:** N/A - environment-only adjustment

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No scope creep. The deviation only changed how verification was executed in the local environment.

## Issues Encountered

- `pnpm` was not installed on `PATH`; `corepack pnpm` provided a working fallback for all required verification commands.

## Known Stubs

- `packages/overrides/registry.json:7` - `targetIds` is intentionally empty because this seed entry demonstrates text-override wiring without binding to mechanical records yet.
- `packages/overrides/text/custom-domain-labels.json:3` - `records` is intentionally empty because the seed payload reserves a public-safe Spanish text artifact for later population.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `01-03` can now define blocked and conflict semantics against stable `datasetId`, manifest provenance, and override review-state contracts.
- No blockers remain for the next plan inside the owned file set.

## Self-Check: PASSED

- Summary artifact exists on disk.
- Key contract files exist on disk.
- Task commits `64ecbe5` and `116de27` are present in git history.

---
*Phase: 01-canonical-puerta-dataset*
*Completed: 2026-03-30*
