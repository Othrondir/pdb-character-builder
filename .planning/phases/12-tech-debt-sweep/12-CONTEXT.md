# Phase 12: Tech Debt Sweep — Context

**Gathered:** 2026-04-18
**Status:** Ready for planning
**Source:** `/gsd-discuss-phase 12` (mode: `--auto` defaults after user elected C)

<domain>
## Phase Boundary

Clear documented tech debt items surfaced by `v1.0-MILESTONE-AUDIT.md` so milestone v1.0 closes without known defects leaking into v2. Scope is fixed to **4 bugs** enumerated in ROADMAP Phase 12 + MILESTONE-AUDIT §4 (Tech Debt):

1. P03 typecheck errors in `tests/phase-03/foundation-validation.spec.ts` (3 errors at lines 13/25/38/60 — `string[]` vs `CanonicalId[]`).
2. P07.2 IN-07 — `getClassLabel` bug: class-prereq labels render raw canonical IDs instead of Spanish class names (FEAT-02 quality).
3. P07.2 IN-03 — magic-flavoured feat-category labels (`'3': 'Arcana'`, `'15': 'Divina'`) linger after Phase 07.2 descope.
4. P07.2 IN-05 — extract-progress counter misaligned when `EMIT_MAGIC_CATALOGS=0` (`[N/7]` literals while only 5 catalogs actually emit).

**Not in scope:**
- Catalog roster gaps (classes/races not loading all extracted PDB entries) — moved to Phase 12.1 (Data-Wiring + UX Overflow).
- CSS overflow/scroll issues on SelectionScreen / planner-layout center — moved to Phase 12.1.
- Any v2 feature work or server-ruleset changes.

</domain>

<decisions>
## Implementation Decisions

### Bug 1 — P03 typecheck (DeityRuleRecord[] vs CanonicalId)
- **Fix strategy**: rebuilder helper that constructs `CanonicalId[]` safely at the fixture site (preserves branded-type guarantee; no `as` cast, no schema relaxation).
- **Rationale**: Keeping the branded type strict across the codebase is already a load-bearing invariant (canonicalIdRegex guard lives at contracts/canonical-id.ts:18). Casting would defeat it at the test boundary; relaxing the interface would leak nominal types into domain logic.
- **Expected touchpoints**: `tests/phase-03/foundation-validation.spec.ts` (line 13 fixture + lines 25/38/60 overrides). Helper may live inside the test file or in a shared test util.
- **Regression test posture**: N/A — fixing the typecheck IS the test. `tsc --noEmit` clean on this spec is the pass gate.

### Bug 2 — P07.2 IN-07 (getClassLabel)
- **Fix location**: Extract `getClassLabel` as a shared helper in `packages/rules-engine` (domain layer) and import from both `apps/planner/src/features/feats/selectors.ts:259` and `packages/rules-engine/src/feats/feat-prerequisite.ts:199`.
- **Rationale**: DRY — the correct implementation already exists in `selectors.ts` but is orphaned; `feat-prerequisite.ts:199` has a wrong lookup (`featCatalog.feats` instead of `compiledClassCatalog.classes`). Pulling both sides to a single rules-engine helper prevents the divergence from recurring.
- **Expected touchpoints**: new helper in `packages/rules-engine/src/feats/` + call sites in selectors.ts + feat-prerequisite.ts + removal of duplicate implementation.
- **Regression test posture**: TDD. Add a spec under `tests/phase-12/` verifying class-prereq labels render Spanish class names (not `class:*` canonical IDs) for at least one prereq-gated feat. Add to both rules-engine unit tier and planner selector integration tier.

### Bug 3 — P07.2 IN-03 (FEAT_CATEGORY_LABELS magic entries)
- **Removal scope**: Delete the entire `FEAT_CATEGORY_LABELS` literal + its consumer site at `apps/planner/src/features/feats/selectors.ts:359` if scout confirms it is dead code (categoryLabel not rendered in any current UI). If a downstream UI renders categoryLabel — fall back to deleting only `'3': 'Arcana'` and `'15': 'Divina'` keys.
- **Rationale**: Phase 07.2 descoped magic UI entirely; dead labels are a correctness trap (any future bug that re-activates the chip would surface descoped terminology). Scout report: line 359 in selectors.ts consumes via `mapToOptionView`, but `categoryLabel` is not wired to the current FeatBoard chips — high likelihood of full dead-code removal.
- **Expected touchpoints**: `apps/planner/src/features/feats/selectors.ts` (map + consumer) + any downstream type referencing `categoryLabel`.
- **Regression test posture**: Unit test — dead-code removal requires a grep-based negative assertion (no `Arcana` / `Divina` strings remain in magic-free bundle) added to the existing Phase 07.2 symbol-grep verification if present; otherwise inline in Phase 12 plan.

### Bug 4 — P07.2 IN-05 (extract progress counter)
- **Counter strategy**: Dynamic counter. Compute `TOTAL_STEPS` from the set of active catalog emitters gated by `EMIT_MAGIC_CATALOGS`. Console output becomes `[N/TOTAL]` with `TOTAL = 5` when magic off, `TOTAL = 7` when on.
- **Rationale**: Hardcoding two modes (`/5` vs `/7`) will drift the next time a catalog is added or gated. A single source-of-truth list of emitters (array of `{ name, enabled }`) makes the counter self-maintaining.
- **Expected touchpoints**: `packages/data-extractor/src/cli.ts` (lines 277–400 — replace 7 hardcoded counter strings with an iteration over the active-emitter list).
- **Regression test posture**: Snapshot-ish — add a smoke test that runs the extractor dry-run (or captures stdout) with `EMIT_MAGIC_CATALOGS=0` and asserts no `[N/7]` literal appears when magic is off. Optional if the extractor test harness is heavier than the fix — fall back to manual verify.

### Plan split
- **Plan 12-01**: Bug 1 (typecheck) + Bug 2 (getClassLabel). User-visible / CI-visible correctness fixes. Touches `tests/`, `packages/rules-engine`, `apps/planner`.
- **Plan 12-02**: Bug 3 (magic labels dead code) + Bug 4 (extract counter). Cosmetic / dead-code / UX polish. Touches `apps/planner/src/features/feats` + `packages/data-extractor`.
- **Rationale**: Roadmap-suggested split; keeps risk-grouped plans (medium-risk correctness vs low-risk cleanup) so a rollback on 12-02 doesn't affect 12-01 and vice versa.

### Regression test posture (aggregate)
- **Decision**: TDD for bugs with behavioural surface (Bugs 2 + 4). Bug 1 self-verifies via `tsc --noEmit`. Bug 3 verifies via negative grep assertion.
- **Rationale**: Proof-by-test for the two bugs with user/CLI-visible output prevents silent regressions; Bug 1 + Bug 3 are structural and their fix IS the evidence.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project / milestone
- `.planning/PROJECT.md` — Project charter, Spanish-first, strict validation, PDB + NWN1 EE scope.
- `.planning/REQUIREMENTS.md` — FEAT-02 quality target (class-prereq labels Spanish).
- `.planning/v1.0-MILESTONE-AUDIT.md` — §4 Tech Debt items IN-03/05/07 + Phase 3 typecheck lines 111–119 + 243–245.
- `.planning/ROADMAP.md` — Phase 12 scope + success criteria (lines 290–304).

### Prior phase context
- `.planning/phases/07.2-magic-ui-descope/07.2-CONTEXT.md` — magic-descope contract; what `EMIT_MAGIC_CATALOGS=0` promises.
- `.planning/phases/07.2-magic-ui-descope/07.2-VERIFICATION.md` — magic-free bundle verification (Spanish prose tolerated, symbol greps required).
- `.planning/phases/05.1-data-extractor-pipeline/` — extractor contract (SUMMARY.md + decisions on 5 vs 7 catalog emitters).
- `.planning/phases/03-character-origin-base-attributes/` — where the P03 typecheck error regression lives; original fixture shape.

### Bug 1 (P03 typecheck) — source files
- `tests/phase-03/foundation-validation.spec.ts` — lines 13, 25, 38, 60.
- `packages/rules-engine/src/foundation/origin-rules.ts:24-27` — `DeityRuleRecord` interface.
- `packages/rules-engine/src/contracts/canonical-id.ts:16-18` — `CanonicalId` branded type + `canonicalIdRegex` guard.

### Bug 2 (getClassLabel) — source files
- `apps/planner/src/features/feats/selectors.ts:259-265` — correct impl (orphaned).
- `packages/rules-engine/src/feats/feat-prerequisite.ts:199` — wrong lookup site.
- `apps/planner/src/features/feats/compiled-feat-catalog.ts:2` — `compiledClassCatalog` import origin.
- `apps/planner/src/features/feats/feat-sheet.tsx` — consumer of `prereqSummary` (user-visible surface).

### Bug 3 (FEAT_CATEGORY_LABELS) — source files
- `apps/planner/src/features/feats/selectors.ts:33-45` — map literal.
- `apps/planner/src/features/feats/selectors.ts:359` — consumer in `mapToOptionView`.

### Bug 4 (extract-progress counter) — source files
- `packages/data-extractor/src/cli.ts:232` — `EMIT_MAGIC_CATALOGS` read.
- `packages/data-extractor/src/cli.ts:277-400` — 7 hardcoded `[N/7]` literals.

</canonical_refs>

<specifics>
## Specific Ideas

- **Phase 12 is a fix-list, not a design phase.** The planner should avoid research spin — bugs are reproducible, file paths are known, fixes are mechanical. Keep the phase small and commit atomically per bug.
- **Bug 2 `feat-prerequisite.ts` shared-helper refactor** is the only decision with non-trivial blast radius. Extract into `packages/rules-engine/src/feats/get-class-label.ts` (or similar); the planner can choose the helper's home.
- **Bug 4 dynamic counter** should be a single array of emitter descriptors so future catalog gating stays self-counting. Keep the iteration logic co-located with `EMIT_MAGIC_CATALOGS` gate for readability.
- **Commit style**: mirror Phase 11's atomic-per-bug commits (one commit per task, separate summary commit).
</specifics>

<deferred>
## Deferred Ideas

Three observations surfaced during Phase 11 UAT (2026-04-18) that are NOT in Phase 12 scope. They are slotted for a new phase **Phase 12.1 (Data-Wiring + UX Overflow)** to be inserted after Phase 12 runs:

1. **Classes roster gap** — UI L1 class picker shows 7 classes (Guerrero, Pícaro, Mago, Clérigo, Paladín, Sombra danzante, Maestro de armas). Compiled class catalog holds more base classes. **User directive (2026-04-18)**: roster must equal PDB TLK extractor output — neither NWN1 base canon nor a hand-trimmed subset. Phase 12.1 must verify `compiledClassCatalog` ≡ PDB extractor emission and that `selectClassOptionsForLevel` does not filter below that set.

2. **Races roster gap** — UI race picker shows 3 parent races (Humano, Elfo, Enano) + subraces for Elfo/Enano. Compiled race catalog holds 46 entries with parent/subrace hierarchy. Root cause per triage: `phase03FoundationFixture.races` is not wired to the compiled catalog; it ships only 3 hand-authored races. Phase 12.1 wires the fixture (or replaces it) so the UI consumes the full PDB roster.

3. **CSS overflow / missing scroll** — `.selection-screen__content` and at least two sibling containers lack `overflow-y: auto`; content clips with no scroll affordance. Phase 12.1 fixes via app.css + scoped container rules. Low-risk CSS-only change.

**Why deferred**: Phase 12 is audit-scoped to 4 specific tech-debt items. The three observations above are new, user-visible, and data/UI level — merging them would blow Phase 12's scope and block its closure. Phase 12.1 is the correct home.

**Next step**: after Phase 12 plans are drafted, run `/gsd-insert-phase 12.1` to register the new phase in ROADMAP.md with scope = data wiring (classes + races) + CSS overflow fixes.

</deferred>

---

*Phase: 12-tech-debt-sweep*
*Context gathered: 2026-04-18 via discuss-phase (auto defaults + user clarifications)*
