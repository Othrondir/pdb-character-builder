---
phase: 14-persistence-robustness
plan: 06
subsystem: testing
tags: [docs, persistence, version-header, sentinel, vitest, parity-invariant, roadmap-sc6, roadmap-sc7, audit]

requires:
  - phase: 14-01
    provides: tests/phase-14/ jsdom glob mapping (this plan adds a node-env spec; jsdom map is irrelevant here but the glob-based discovery works)
  - phase: 14-02
    provides: slot-api.ts top docstring (verified Class C — exempt; describes saveSlot semantics, no version-field mention)
  - phase: 14-03
    provides: project-build-document.ts + hydrate-build-document.ts top docstrings (verified Class C — exempt)
  - phase: 14-04
    provides: url-budget.ts top docstring (verified Class C — exempt; describes budget math)
  - phase: 14-05
    provides: ability-modifier consolidation; no persistence docstring touched, parity surface unchanged
provides:
  - Sentinel spec locking the {schemaVersion, plannerVersion, rulesetVersion, datasetId} parity invariant for top-of-file JSDoc blocks across apps/planner/src/features/persistence/*.ts(x)
  - plannerVersion-aware top docstring on version-mismatch.ts (single Class B fix)
  - z.literal(2) docstring correction (was z.literal(1) — pre-existing doc bug, Rule 1)
affects:
  - Future persistence file authoring — sentinel now blocks regression at CI time
  - Phase 8 hardening trail (closes documentation-drift item flagged 2026-04-24)

tech-stack:
  added: []
  patterns:
    - "Hermetic top-of-file JSDoc parity sentinel via fs.readFileSync + first /** */ block regex"
    - "Three-class taxonomy (A/B/C) for version-aware docstrings: A=lists all 4, B=lists 1-3 (drift), C=mentions none (exempt)"

key-files:
  created:
    - tests/phase-14/persistence-docstring-parity.spec.ts
  modified:
    - apps/planner/src/features/persistence/version-mismatch.ts

key-decisions:
  - "Treat the first /** */ block as the canonical 'top docstring' — matches what every existing file in the directory uses, avoids author-local conventions"
  - "Three-class A/B/C exemption — only files that mention ANY of the 4 fields are policed; pure logic-description docstrings stay exempt to avoid forcing irrelevant boilerplate"
  - "Append a one-line parity clause + a plannerVersion-clarification paragraph to version-mismatch.ts rather than rewriting the existing prose; keeps git blame stable for the surrounding semantics"
  - "Correct `z.literal(1)` -> `z.literal(2)` in the same docstring as a pure documentation Rule-1 fix; the actual schema is z.literal(2) per build-document-schema.ts:30"
  - "Use line-comment header (//) for the spec file's preamble instead of /** */ — embedding `*/` inside an outer JSDoc broke esbuild parsing on first attempt; line comments avoid the nested-terminator hazard entirely"

patterns-established:
  - "Pattern (sentinel): persistence docstring parity — readTopDocstring(path) returns the FIRST /** */ block, count VERSION_FIELDS (4) inclusion, fail when 1-3 are present"
  - "Pattern (deviation): worktree-vs-parent-repo verification — when worktree node_modules is empty (dexie unresolvable), copy authoritative files into parent transiently, run full sweep, revert; commits stay in worktree"

requirements-completed:
  - SHAR-02
  - SHAR-03
  - SHAR-05

duration: 39min
completed: 2026-04-25
---

# Phase 14 Plan 06: Persistence Docstring Parity Summary

**Sentinel spec + 1 docstring fix locks the {schemaVersion, plannerVersion, rulesetVersion, datasetId} parity invariant across apps/planner/src/features/persistence; closes ROADMAP SC#6/SC#7 documentation drift flagged in v1.0-MILESTONE-AUDIT.md (Phase 08 line 68).**

## Performance

- **Duration:** ~39 min
- **Started:** 2026-04-25T17:43:00Z
- **Completed:** 2026-04-25T16:22:30Z (UTC)
- **Tasks:** 2 (sentinel + Class-B fix)
- **Files modified:** 1 (version-mismatch.ts)
- **Files created:** 1 (persistence-docstring-parity.spec.ts)

## Accomplishments

- Audited all 12 non-canonical persistence files' top JSDoc blocks; classified per the A/B/C taxonomy.
- Authored a hermetic Vitest sentinel spec (`tests/phase-14/persistence-docstring-parity.spec.ts`) that fails when any version-aware top docstring lists 1-3 of the 4 canonical fields.
- Fixed the single Class B file (`version-mismatch.ts`) by adding `plannerVersion` to the top JSDoc + a parity-anchor sentence linking to `build-document-schema.ts:30-33`.
- Caught and fixed an unrelated documentation bug in the same docstring (`z.literal(1)` -> `z.literal(2)`; the schema bumped to literal 2 long ago without this comment being updated).

## Task Commits

Each task committed atomically:

1. **Task 1: Audit + write sentinel spec** — `ed6a439` (test)
2. **Task 2: Update Class B docstrings** — `6519879` (docs)

**Plan metadata commit:** to be created with this SUMMARY (final commit step).

## Per-File Classification (Audit Output)

| # | File | Top JSDoc lines | Classification | Reasoning |
|---|------|-----------------|----------------|-----------|
| 1 | `build-document-schema.ts` | 1-18 | **A** (canonical) | Lists schemaVersion + plannerVersion + rulesetVersion + datasetId at line 12; serves as the source of truth |
| 2 | `project-build-document.ts` | 13-19 | **C** (exempt) | Top doc describes IncompleteBuildField type; no version field mentioned (the names appear deeper at code line 92+) |
| 3 | `hydrate-build-document.ts` | 10-31 | **C** (exempt) | Top doc describes Pattern-3 ordered hydration + Phase 14-03 buildName integration; no version-field mention |
| 4 | `json-export.ts` | 3-14 | **C** (exempt) | Top doc describes filename sanitize + T-08.1-03 mitigation; no version-field mention |
| 5 | `json-import.ts` | 12-18 | **C** (exempt) | Top doc describes JsonImportError + Spanish copy hook; no version-field mention |
| 6 | `share-url.ts` | 4-14 | **C** (exempt) | Top doc describes encode pipeline (deflate -> base64url) + zip-bomb mitigation; no version-field mention |
| 7 | `share-entry.tsx` | 26-34 | **C** (exempt) | Top JSDoc describes the /share route DecodeResult state machine; no version-field mention |
| 8 | `slot-api.ts` | 4-7 | **C** (exempt) | Top doc describes saveSlot createdAt/updatedAt preservation; no version-field mention |
| 9 | `url-budget.ts` | 1-20 | **C** (exempt) | Top doc describes URL-length budget math; no version-field mention |
| 10 | `version-mismatch.ts` | 12-19 (before) | **B** (drift -> fixed) | Top doc mentioned schemaVersion + rulesetVersion + datasetId, omitted plannerVersion. Task 2 added it + a parity clause |
| 11 | `dexie-db.ts` | 4-15 | **C** (exempt) | Top doc describes upgrade discipline; no version-field mention |
| 12 | `index.ts` | (none) | **C** (exempt — empty) | Barrel file with no JSDoc block at all |

**Outcome counts:** 1 Class A + 1 Class B + 10 Class C. Task 2 turned the lone Class B into Class A.

## Files Created/Modified

### Created

- **`tests/phase-14/persistence-docstring-parity.spec.ts`** (142 lines) — Hermetic sentinel:
  - 2 `it()` blocks: (1) drift sweep across all 12 files; (2) source-of-truth lock on `build-document-schema.ts`.
  - Reads via `node:fs.readFileSync` from `process.cwd()`-anchored paths; no jsdom needed.
  - Header preamble (lines 1-39) records the A/B/C audit table inline so the spec is self-describing.
  - Uses `//` line comments instead of `/** */` block comment to avoid nested-`*/`-terminator hazard with esbuild (Rule 3 deviation, see below).

### Modified

- **`apps/planner/src/features/persistence/version-mismatch.ts`** (top JSDoc only, lines 12-29):
  - **Before** (lines 12-19, 7 lines):
    ```
    /**
     * D-07 fail-closed version check.
     * Returns null when incoming matches current on BOTH rulesetVersion AND datasetId.
     * Returns structured diff when EITHER differs. Caller must NOT hydrate on non-null.
     *
     * schemaVersion is validated separately by Zod (`z.literal(1)` in buildDocumentSchema).
     * If schema shape ever diverges across versions, the Zod parse fails before this function runs.
     */
    ```
  - **After** (lines 12-29, 17 lines):
    ```
    /**
     * D-07 fail-closed version check.
     * Returns null when incoming matches current on BOTH rulesetVersion AND datasetId.
     * Returns structured diff when EITHER differs. Caller must NOT hydrate on non-null.
     *
     * schemaVersion is validated separately by Zod (`z.literal(2)` in buildDocumentSchema).
     * If schema shape ever diverges across versions, the Zod parse fails before this function runs.
     *
     * plannerVersion is informational metadata stamped at projection time; it is NOT compared
     * by this helper because the runtime fail-closed gate only blocks ruleset/dataset drift
     * (skill rules, feat tables, class progressions). Surfacing plannerVersion drift to the
     * user is a UX concern, not a correctness one.
     *
     * Version header parity (Phase 14-06 audit): the canonical 4-field set is
     * `schemaVersion`, `plannerVersion`, `rulesetVersion`, `datasetId`. See
     * `build-document-schema.ts:30-33`. ALL four are stamped at projection time and
     * round-tripped through every persistence path (Dexie, JSON export/import, share URL).
     */
    ```
  - Production code (lines 1-10 + 30-49) byte-identical pre/post.

## Decisions Made

- **First-`/** */`-block as canonical "top docstring":** matches every persistence file's existing convention; alternative heuristics (e.g., "first comment block at file head") would change semantics and cause false drift in barrels with `// Barrel for ...` line headers.
- **Three-class taxonomy (A/B/C):** keeps the rule narrowly scoped to files that genuinely talk about version invariants. Files like `url-budget.ts` (URL math) or `json-export.ts` (filename sanitize) shouldn't be forced to recite the 4-field litany — that would create more noise than signal.
- **Append-don't-rewrite for Class B fix:** preserves git blame on the original "schemaVersion validated separately by Zod" sentence; the new paragraphs land below it.
- **Use line comments (`//`) for spec preamble:** discovered the hard way during Task 1 that the spec's outer `/** */` block could not contain `/** */` literally without breaking esbuild's TypeScript parser (the inner `*/` closes the outer block). Switching the preamble to `//` lines avoided the issue cleanly.
- **Embed audit table inline in the spec:** future readers see the classification rationale next to the assertion; SUMMARY.md becomes a redundant copy, not the only place the data lives.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected `z.literal(1)` -> `z.literal(2)` in version-mismatch.ts top JSDoc**

- **Found during:** Task 2, while editing the docstring to add plannerVersion.
- **Issue:** Line 17 of the original docstring claimed `schemaVersion is validated separately by Zod (\`z.literal(1)\`...)` but build-document-schema.ts:30 declares `schemaVersion: z.literal(2)`. The schema was bumped to 2 in a prior phase without this comment being updated. False documentation about runtime behavior.
- **Fix:** Changed `z.literal(1)` to `z.literal(2)` in the same docstring edit that added plannerVersion. Pure documentation correction; no production logic touched.
- **Files modified:** `apps/planner/src/features/persistence/version-mismatch.ts`
- **Verification:** Sentinel spec still green (it does not parse the parenthetical literal); grep audit clean.
- **Committed in:** `6519879` (Task 2 commit).

**2. [Rule 3 - Blocking] Used `//` line comments instead of `/** */` for the spec's preamble**

- **Found during:** Task 1, first vitest run failed with esbuild parse error.
- **Issue:** Initial draft had a `/** */` JSDoc block as the spec's file header that contained the literal string `/** */` inline (describing the rule). The inner `*/` closed the outer block prematurely; esbuild then saw the rest of the prose as code and choked at the first identifier (`build`).
- **Fix:** Rewrote the entire preamble (lines 1-39) using `//` line comments. Functionally equivalent for IDE tooltips on imports; preserves all the audit-table content; eliminates the nested-terminator hazard.
- **Files modified:** `tests/phase-14/persistence-docstring-parity.spec.ts` (during Task 1, before its commit).
- **Verification:** vitest parse + run succeeds; sentinel went RED (as designed) on first run.
- **Committed in:** `ed6a439` (Task 1 commit; the failing version was never committed).

---

**Total deviations:** 2 auto-fixed (1 Rule 1 doc bug, 1 Rule 3 blocking).

**Impact on plan:** Both deviations were inline corrections during Task execution; neither expanded scope. The `z.literal` correction (Rule 1) is incidental but ROADMAP-aligned (the audit was specifically about persistence docstring accuracy). The line-comment swap (Rule 3) is purely a parser-compatibility tactic.

## Verification Evidence

### Sentinel spec (the new artifact)

Run from worktree against parent's `node_modules/.bin/vitest`:

```
$ vitest run tests/phase-14/persistence-docstring-parity.spec.ts --reporter=verbose
 ✓ tests/phase-14/persistence-docstring-parity.spec.ts > Phase 14-06 — persistence docstring version-field parity (ROADMAP SC#6/SC#7) > every persistence file with a version-aware top docstring lists all 4 canonical fields  2ms
 ✓ tests/phase-14/persistence-docstring-parity.spec.ts > Phase 14-06 — persistence docstring version-field parity (ROADMAP SC#6/SC#7) > build-document-schema.ts top docstring always lists all 4 canonical fields (source of truth)  0ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
```

RED state at end of Task 1 (pre-Task-2 fix) reported the expected drift:

```
Persistence files with version-aware top docstrings MUST list all 4 canonical
fields (schemaVersion, plannerVersion, rulesetVersion, datasetId). Drifters:
  - apps/planner/src/features/persistence/version-mismatch.ts
      present: [schemaVersion, rulesetVersion, datasetId]
      missing: [plannerVersion]
```

### Grep audit (plan's verification block)

```
$ for f in apps/planner/src/features/persistence/*.ts apps/planner/src/features/persistence/*.tsx; do
    has_any=$(head -40 "$f" | grep -E "schemaVersion|rulesetVersion|datasetId" | wc -l)
    has_planner=$(head -40 "$f" | grep -c "plannerVersion")
    if [ "$has_any" -gt 0 ] && [ "$has_planner" -eq 0 ]; then echo "DRIFT: $f"; fi
  done
[no output → zero DRIFT lines = pass]
```

### Broader test sweep (parent repo, full node_modules)

Phase 8 + 10 + 14 vitest results, before vs after Phase 14-06:

| State | Test files | Tests passed | Tests failed |
|-------|-----------:|-------------:|-------------:|
| Baseline (no Phase 14-06) | 28 | 152 | 1 (`BUILD_ENCODING_VERSION is literal 1` — pre-existing baseline; schema bumped to 2 long ago) |
| With Phase 14-06 changes | 29 | **154** | 1 (same pre-existing baseline) |
| **Delta** | **+1 file** | **+2 tests** | **0 new failures** |

### TypeScript typecheck (parent repo)

| State | TS errors |
|-------|----------:|
| Baseline | 2 (both in `selectors.ts`, branded-string assignability — STATE.md baseline) |
| With Phase 14-06 changes | 2 (identical) |
| **Delta** | **0 new errors** |

(Worktree-local `tsc` reports 8 errors, but the additional 6 are derivative of the deferred dexie-resolution baseline documented in `.planning/phases/14-persistence-robustness/deferred-items.md` — unrelated to this plan.)

## Issues Encountered

- **Worktree node_modules empty.** The parallel-executor worktree has no installed dependencies; `vitest` cannot resolve `dexie` from `dexie-db.ts`, blocking 2 of 7 phase-14 specs from loading at all. This is a pre-existing environmental baseline already logged in `.planning/phases/14-persistence-robustness/deferred-items.md` (entry "14-03 + 14-05 — `dexie` module-resolution failure (worktree env)"). Phase 14-06 is unaffected because the new sentinel imports only `node:fs` and `node:path` — no persistence-module imports. To run the broader sweep authoritatively, the same workaround used in Phase 14-04 was applied: copy the modified `version-mismatch.ts` + new spec into the parent repo, run full vitest there, capture results, revert the parent. Worktree retains the authoritative commits.
- **esbuild rejects nested `*/` in `/** */` headers.** Documented in deviation #2.

## User Setup Required

None — pure docs sweep + spec. No external service configuration, no env vars, no infrastructure.

## Threat Register

| Threat ID | Status | Notes |
|-----------|--------|-------|
| T-14-06-01 | **mitigated** | Sentinel spec locks the parity invariant. Any future PR that adds a new persistence file mentioning some-but-not-all-4 version fields, or that removes `plannerVersion` from an existing version-aware docstring, fails CI immediately at `tests/phase-14/persistence-docstring-parity.spec.ts`. |
| T-14-06-02 | **n/a** | Pure docs sweep + sentinel spec; no runtime/data/security surface change. |

## Next Phase Readiness

- ROADMAP SC#6 (Phase 14) closed: every version-aware persistence top docstring lists all 4 canonical fields.
- ROADMAP SC#7 (Phase 14) final piece in place: a Vitest sentinel locks the parity invariant.
- Phase 14 wave 2 fully landed when this plan merges.
- No follow-up plans required for the SC#6/SC#7 surface.

## Self-Check: PASSED

- File `tests/phase-14/persistence-docstring-parity.spec.ts` exists ✓
- File `apps/planner/src/features/persistence/version-mismatch.ts` exists and contains `plannerVersion` in its top JSDoc ✓
- Commit `ed6a439` exists in worktree branch ✓
- Commit `6519879` exists in worktree branch ✓
- Sentinel spec runs green (2/2) ✓
- Grep audit emits zero DRIFT lines ✓
- Zero new TS errors over baseline ✓
- Zero new test failures over baseline ✓
- No production logic modified — diffs live entirely inside `/** */` blocks ✓

---
*Phase: 14-persistence-robustness*
*Plan: 06*
*Completed: 2026-04-25*
