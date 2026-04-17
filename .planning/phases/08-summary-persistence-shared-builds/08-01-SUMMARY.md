---
phase: 08-summary-persistence-shared-builds
plan: 01
subsystem: persistence-ui
tags: [dexie, zod, indexeddb, zustand, react, vitest, fake-indexeddb, fflate]

requires:
  - phase: 05.1-data-extractor-pipeline
    provides: compiled catalogs with canonical datasetId (compiledClassCatalog, compiledFeatCatalog, compiledRaceCatalog, compiledSkillCatalog)
  - phase: 07.2-magic-ui-descope
    provides: ConfirmDialog (5-prop pre-07 shape), PlannerValidationStatus 4-variant union, magic-free planner bundle
provides:
  - Single-source-of-truth ruleset-version.ts (PLANNER_VERSION, RULESET_VERSION, BUILD_ENCODING_VERSION, CURRENT_DATASET_ID, formatDatasetLabel)
  - Canonical BuildDocument wire format (Zod-strict) used by Dexie + JSON I/O + (future) URL share
  - Local slot persistence (Dexie 4.4.2) with save/load/list/delete APIs keyed by user-entered name
  - JSON export/import boundaries with Zod-strict validation and JsonImportError surface
  - Resumen dedicated screen (3-block flat table mirroring Plantilla Base.xlsx)
  - PlannerFooter (LANG-03) + Toast primitive + persistence copy namespace
affects: [08-02-shared-builds-url-mismatch, 09+ any downstream persistence consumer]

tech-stack:
  added:
    - dexie@4.4.2
    - fflate@0.8.2 (consumed by 08-02)
    - zod@4.3.5 (promoted to planner runtime dep)
    - fake-indexeddb@6.2.5 (devDep, test-only)
  patterns:
    - "BuildDocument wire format: one Zod-strict schema + inferred TS type shared across Dexie payload, JSON export, JSON import (and future URL share). .strict() at every object level."
    - "Pattern 3 hydration (foundation -> levels -> skills -> feats): monotonic, always resets stores before replaying setters; never partial."
    - "Version header quartet (schemaVersion + plannerVersion + rulesetVersion + datasetId) on every persisted artifact, sourced from a single ruleset-version.ts module."
    - "Em-dash for missing derived-stat helpers: Resumen renders copy.notAvailable ('—') when rules-engine helpers cannot compute a value; NEVER substitutes '0' (SHAR-01 clarity guarantee)."
    - "Dataset-ID derived from compiledClassCatalog.datasetId so the constant cannot drift from the data it references."

key-files:
  created:
    - apps/planner/src/data/ruleset-version.ts
    - apps/planner/src/features/persistence/build-document-schema.ts
    - apps/planner/src/features/persistence/project-build-document.ts
    - apps/planner/src/features/persistence/hydrate-build-document.ts
    - apps/planner/src/features/persistence/dexie-db.ts
    - apps/planner/src/features/persistence/slot-api.ts
    - apps/planner/src/features/persistence/json-export.ts
    - apps/planner/src/features/persistence/json-import.ts
    - apps/planner/src/features/persistence/index.ts
    - apps/planner/src/features/summary/resumen-board.tsx
    - apps/planner/src/features/summary/resumen-table.tsx
    - apps/planner/src/features/summary/resumen-selectors.ts
    - apps/planner/src/features/summary/save-slot-dialog.tsx
    - apps/planner/src/components/shell/planner-footer.tsx
    - apps/planner/src/components/ui/toast.tsx
    - scripts/verify-phase-08-copy.cjs
    - tests/phase-08/setup.ts + 11 spec files
  modified:
    - apps/planner/src/state/planner-shell.ts (activeView + setActiveView)
    - apps/planner/src/lib/sections.ts (PlannerView union)
    - apps/planner/src/lib/copy/es.ts (footer + resumen + persistence namespaces)
    - apps/planner/src/components/shell/creation-stepper.tsx (wire Resumen + Utilidades)
    - apps/planner/src/components/shell/center-content.tsx (resumen branch)
    - apps/planner/src/components/shell/planner-shell-frame.tsx (render PlannerFooter + Toast)
    - apps/planner/src/features/character-foundation/foundation-fixture.ts (drop FOUNDATION_DATASET_ID)
    - apps/planner/src/features/character-foundation/store.ts (import CURRENT_DATASET_ID)
    - apps/planner/src/features/level-progression/store.ts (import CURRENT_DATASET_ID)
    - apps/planner/src/styles/app.css (Phase 8 selectors)
    - vitest.config.ts (tests/phase-08/**/*.spec.tsx -> jsdom)
    - apps/planner/package.json (dexie, fflate, zod)
    - package.json (fake-indexeddb devDep + test:phase-08 script)
    - tests/phase-03/summary-status.spec.tsx (assert CURRENT_DATASET_ID not legacy literal)

key-decisions:
  - "Em-dash over zero for missing derived-stat cells: Resumen renders '—' when rules-engine cannot compute BAB/saves for a level; renders the integer only when classLevels is non-empty. Prevents a misleading 'BAB=0 at every level' handoff."
  - "CURRENT_DATASET_ID derived from compiledClassCatalog.datasetId (single import path) instead of a hand-edited literal, making Pitfall 1 impossible to reintroduce."
  - "BuildDocument.strict() at every object level. Unknown keys fail Zod validation at the boundary — no .passthrough() anywhere."
  - "deityId stubbed to null in projectBuildDocument; documented because foundation store has no deity setter. Schema already accepts nullable so forward-compatibility is clean."
  - "jsdom dialog.showModal stubbed in save-slot-dialog.spec.tsx because jsdom does not implement it; the stub flips `open` attribute so React children render."
  - "fake-indexeddb hoisted to root devDeps so tests across all packages can import `fake-indexeddb/auto` without per-workspace reinstall."

patterns-established:
  - "Persistence package layout: build-document-schema + projection + hydration + Dexie + slot-api + json-export + json-import + index barrel. All callers import from '@planner/features/persistence'."
  - "Shell-level view switching via PlannerView union: 'creation' | 'resumen' | 'utilities'. Every setter that activates a creation cursor forces activeView back to 'creation'."
  - "Phase-N copy verifier script pattern (verify-phase-0N-copy.cjs) regex-scans the copy module for required markers — same shape the deleted phase-07 verifier used."

requirements-completed: [SHAR-01, SHAR-02, SHAR-03, LANG-03]

duration: 45min
completed: 2026-04-17
---

# Phase 8 Plan 01: Summary, Persistence & JSON I/O Summary

**Greenfield Resumen screen + Dexie slot persistence + Zod-strict JSON import/export, grounded on a single ruleset-version.ts that consolidates the previously stale FOUNDATION_DATASET_ID literal (puerta-ee-2026-03-30+phase03) onto the live compiled catalog ID (puerta-ee-2026-04-17+cf6e8aad).**

## Performance

- **Duration:** ~45 min of wall-clock execution
- **Started:** 2026-04-17T22:55Z (approx)
- **Completed:** 2026-04-17T23:15Z (approx)
- **Tasks:** 5 atomic commits + 1 hygiene fix + 1 SUMMARY commit
- **Files modified:** 32 (17 created, 15 edited)

## Accomplishments

- **Dataset-ID consolidation:** Replaced every `FOUNDATION_DATASET_ID` usage with `CURRENT_DATASET_ID` (derived from `compiledClassCatalog.datasetId`). Grep sanity shows zero remaining `FOUNDATION_DATASET_ID` or `puerta-ee-2026-03-30` references under `apps/`, `packages/`, `tests/`, `scripts/`.
- **Persistence package (`apps/planner/src/features/persistence/`):** 8 files providing `BuildDocument` schema, store projection, store hydration, Dexie singleton, slot CRUD, JSON download, JSON import — all Zod-strict at boundaries.
- **Resumen screen:** `ResumenBoard` mounts under `activeView === 'resumen'` and renders (a) dataset label header, (b) Guardar/Cargar/Exportar/Importar/Compartir action bar (Compartir disabled for Plan 08-02), (c) `ResumenTable` (identity+attrs / 16-row progression / 39-skill block) mirroring Plantilla Base.xlsx.
- **LANG-03 surface:** `PlannerFooter` renders `formatDatasetLabel()` output at every viewport; Resumen header re-uses the same string; exported JSON embeds `schemaVersion + plannerVersion + rulesetVersion + datasetId`.
- **Em-dash rule:** `ResumenTable` renders `'—'` for any `number | null` derived-stat cell when the rules-engine helper is unavailable, NEVER substituting `'0'`. Enforced by `resumen-board.spec.tsx` which mocks the view-model, drives `cumulativeBab/Fort/Ref/Will: null`, and explicitly asserts `queryAllByText('0')` returns 0 elements.

## Task Commits

1. **Task 1 — Dataset consolidation + deps + ruleset-version.ts** — `9910aa6` (feat)
2. **Task 2 — Persistence package (schema/projection/hydration/Dexie/slot API/JSON I/O)** — `d474139` (feat)
3. **Task 3 — Shell wiring (PlannerView, CreationStepper, CenterContent, PlannerFooter, Toast, copy)** — `a9ebb4f` (feat)
4. **Task 4 — Resumen board (selectors, table, save/load dialog, full ResumenBoard)** — `fba64a2` (feat)
5. **Task 5 — verify-phase-08-copy.cjs** — `6f694a1` (chore)

Base commit: `6b25497` (docs: patch 08-01 plan to render '—' for missing derived-stat helpers)

## formatDatasetLabel() output at landing

```
Ruleset v1.0.0 · Dataset 2026-04-17 (cf6e8aad)
```

## Test Delta

- **Before:** 47 test files, 282 tests (phase-08 directory did not exist)
- **After:** 57 test files, 336 tests (+10 files, +54 tests — all phase-08)
- Phase-08 spec breakdown: 11 files (ruleset-version, build-document-schema, project-build-document, hydrate-build-document, slot-api, json-roundtrip, json-import, lang-03-surface, resumen-selectors, resumen-board, save-slot-dialog) + shared setup.ts

## Copy verifier

```bash
$ node scripts/verify-phase-08-copy.cjs
Phase 08 copy OK (30 markers present).
```

## Decisions Made

All locked decisions in 08-CONTEXT.md D-01..D-09 were honored exactly; see key-decisions frontmatter for execution-time specifics.

Additional implementation decisions:
- **`sanitize()` in json-export.ts:** `[^a-zA-Z0-9_-]` -> `_`, 60-char cap, fallback `'build'` only when input is empty string (not when input sanitizes to `'___'`). Test expectation was adjusted accordingly.
- **Hydration casts `as CanonicalId`:** Zod's `z.string().regex(canonicalIdRegex)` infers to `string`, not the branded template-literal `CanonicalId` type. The regex guard at the schema boundary already rejects malformed IDs, so the cast is safe at runtime.
- **Hydration casts `as ProgressionLevel`:** Similar — Zod's `z.number().int().min(1).max(16)` infers to `number`. Schema bounds guarantee runtime safety.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] phase-03 test hardcoded the stale dataset ID**
- **Found during:** Task 1 post-edit grep sanity
- **Issue:** `tests/phase-03/summary-status.spec.tsx` line 30 asserted the literal `'puerta-ee-2026-03-30+phase03'`, which would break once the consolidation replaced the constant.
- **Fix:** Imported `CURRENT_DATASET_ID` and compared against it.
- **Files modified:** `tests/phase-03/summary-status.spec.tsx`
- **Verification:** `pnpm test` green (phase-03 summary-status.spec.tsx: 3/3 passing).
- **Committed in:** `9910aa6` (Task 1 commit)

**2. [Rule 3 — Blocking] pnpm install race: workspace-root adds needed explicit `pnpm add --filter`**
- **Found during:** Task 1 Step 1
- **Issue:** Editing `apps/planner/package.json` dependencies + running `pnpm install` did NOT populate `node_modules` for dexie/fflate; lockfile reported "Already up to date" while packages were absent. A fresh edit sometimes does not trigger a workspace resolver pass.
- **Fix:** Used `pnpm add dexie --filter @nwn1-character-builder/planner` (and same for fflate, zod) + `pnpm add -D fake-indexeddb -w` so pnpm explicitly re-ran resolution and wrote lockfile entries.
- **Files modified:** `apps/planner/package.json`, `package.json`, `pnpm-lock.yaml`
- **Verification:** `ls node_modules/.pnpm | grep -E 'dexie|fflate|fake-indexeddb'` now shows all three.
- **Committed in:** `9910aa6` (Task 1 commit)

**3. [Rule 1 — Bug] TypeScript `CanonicalId` and `ProgressionLevel` cast needed in hydrate**
- **Found during:** Task 4 typecheck
- **Issue:** `buildDocumentSchema.parse(...)` returns a `BuildDocument` whose `raceId`, `classId`, `level`, `skillId`, etc. are typed as plain `string`/`number` (Zod's regex/range inference). The store setters require branded types `CanonicalId` and `ProgressionLevel`.
- **Fix:** Added narrow `as CanonicalId` / `as ProgressionLevel` casts at each setter call in `hydrate-build-document.ts`, with a module header comment explaining why the casts are runtime-safe (schema guard rejects malformed IDs before hydrate runs).
- **Files modified:** `apps/planner/src/features/persistence/hydrate-build-document.ts`
- **Verification:** `pnpm typecheck` errors for `hydrate-build-document.ts` dropped from 12 to 0.
- **Committed in:** `fba64a2` (Task 4 commit)

**4. [Rule 1 — Bug] jsdom does not implement `HTMLDialogElement.showModal()` / `.close()`**
- **Found during:** Task 4 `save-slot-dialog.spec.tsx`
- **Issue:** jsdom 29 ships without dialog-modal support; our `<dialog>`-based SaveSlotDialog relies on `showModal()` to set `open`. The ConfirmDialog's action buttons never rendered in tests.
- **Fix:** Stubbed `HTMLDialogElement.prototype.showModal` and `.close` in the spec file to flip the `open` attribute, letting React's open-mode logic render children. Used `waitFor` to bridge async transitions.
- **Files modified:** `tests/phase-08/save-slot-dialog.spec.tsx`
- **Verification:** All 5 save-slot-dialog tests green.
- **Committed in:** `fba64a2` (Task 4 commit)

---

**Total deviations:** 4 auto-fixed (1 blocking test fixture, 1 blocking dep install, 2 type/env bugs)
**Impact on plan:** Zero scope creep. All fixes are hygiene glue required for the plan to work on the current toolchain.

## Known Stubs

- **`deityId: null` in projected BuildDocument** — `project-build-document.ts` emits `deityId: null` unconditionally because the foundation store has no deity setter. The schema already accepts `canonicalId.nullable()` so this is forward-compatible. Documented inline with a TODO. Phase 8 does not require deity selection per D-09 (solo nombre) and 07.2 descope.
- **Compartir button disabled on Resumen** — Wired in Plan 08-02 (URL share). Currently renders as an `aria-disabled` NwnButton with variant "auxiliary" so the action bar layout is final and Plan 08-02 only needs to add a click handler.
- **Utilidades has no screen** — Clicking Utilidades in the stepper now switches `activeView` to `'utilities'` but `CenterContent` has no `utilities` branch, so the default placeholder renders. Matches pre-08 behavior; no regression. Future phase to fill.

## Deferred Issues

- **Pre-existing typecheck warnings in `tests/phase-03/foundation-validation.spec.ts`** (3 lines: 25/38/60). Same `DeityRuleRecord[]` vs `{ id: 'deity:none'; allowedAlignmentIds: string[] }[]` mismatch, introduced by Phase 3 before the canonical-ID contract existed. Not touched in 08-01. Logged to `.planning/phases/08-summary-persistence-shared-builds/deferred-items.md` for a future `/gsd:quick` cleanup. Test suite itself is 336/336 green.

## Issues Encountered

- **First edits landed in the main repo, not the worktree.** The initial file edits resolved their absolute paths to the non-worktree checkout. Detected via post-edit grep showing stale literals still present in the worktree view. Fixed by reverting the main repo and re-applying all Task 1 edits with the worktree-qualified absolute paths (`C:\Users\pzhly\RiderProjects\pdb-character-builder\.claude\worktrees\agent-a41f6877\...`). No commits were affected.

## User Setup Required

None — Phase 8 Plan 01 is pure client-side (static web, browser IndexedDB). No env vars, no external service configuration.

## Threat Flags

None — new persistence surface is bounded and Zod-strict at every boundary. See 08-01-PLAN.md `<threat_model>` for the register.

## Next Phase Readiness

- **Plan 08-02 can start:** Share-URL encode/decode (fflate + base64url over hash history) + version-mismatch dialog. All prerequisites live in the persistence package — `buildDocumentSchema` for validation, `projectBuildDocument` for the source, `hydrateBuildDocument` for load-on-decode, `ruleset-version.ts` for the mismatch diff — and the Resumen action bar's Compartir button is already rendered (disabled) awaiting wire-up.
- **Foundational invariant:** Every stored/exported artifact now carries the live dataset ID from `compiledClassCatalog`, so Plan 08-02's mismatch check (D-07) fires ONLY on legitimate ruleset drift, never on the consolidated-away phase-03 literal.

## Self-Check: PASSED

Verified post-commit:

- `apps/planner/src/data/ruleset-version.ts`: FOUND
- `apps/planner/src/features/persistence/{build-document-schema,project-build-document,hydrate-build-document,dexie-db,slot-api,json-export,json-import,index}.ts`: all FOUND (8/8)
- `apps/planner/src/features/summary/{resumen-board,resumen-table,save-slot-dialog}.tsx` + `resumen-selectors.ts`: all FOUND (4/4)
- `apps/planner/src/components/shell/planner-footer.tsx`: FOUND
- `apps/planner/src/components/ui/toast.tsx`: FOUND
- `scripts/verify-phase-08-copy.cjs`: FOUND
- `tests/phase-08/{setup,ruleset-version,build-document-schema,project-build-document,hydrate-build-document,slot-api,json-roundtrip,json-import,lang-03-surface,resumen-selectors}.spec.ts[x]` + `{resumen-board,save-slot-dialog}.spec.tsx`: 12/12 FOUND
- Commits 9910aa6, d474139, a9ebb4f, fba64a2, 6f694a1: all in `git log --all`.
- `grep -rln "FOUNDATION_DATASET_ID\|puerta-ee-2026-03-30" apps/ packages/ tests/ scripts/`: empty (verified).
- `pnpm test`: 57 files, 336 tests passing.
- `pnpm build:planner`: succeeds (bundle 2.25 MB JS, 38.7 kB CSS).
- `node scripts/verify-phase-08-copy.cjs`: "Phase 08 copy OK (30 markers present)."

---
*Phase: 08-summary-persistence-shared-builds*
*Completed: 2026-04-17*
