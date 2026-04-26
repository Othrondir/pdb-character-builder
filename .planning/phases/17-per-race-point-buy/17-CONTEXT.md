# Phase 17: Per-Race Point-Buy — Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Source:** /gsd-discuss-phase 17 (interactive, 5 questions, 3 user-answered + 2 deferred to Claude's discretion)

<domain>
## Phase Boundary

Migrate the per-race point-buy cost data ownership from a hand-authored JSON snapshot in `packages/rules-engine/src/foundation/data/puerta-point-buy.json` into the extractor pipeline that emits `apps/planner/src/data/compiled-races.ts`. After Phase 17 the budget per race is sourced at extract time from `racialtypes.2da:AbilitiesPointBuyNumber`; the cost step function (NWN1 hardcoded engine table 8:0…18:16) lives as a single constant in the rules-engine; the snapshot file + its hand-authored provenance dossier are retired. Phase 12.6 already wired the consumer (`ability-budget.ts` + `selectAbilityBudgetRulesForRace`); Phase 17 only swaps the data source — no UI changes, no additional fail-closed states beyond what Phase 12.6 already ships.

**In scope:**
- Extractor reads `racialtypes.2da:AbilitiesPointBuyNumber` per race row, emits `abilitiesPointBuyNumber: number | null` on `compiledRaceSchema`.
- Regenerated `apps/planner/src/data/compiled-races.ts` ships the new field for all 45 deduped race entries.
- `rules-engine` ships `NWN1_POINT_BUY_COST_TABLE` constant (canonical 8:0..18:16 step) + `deriveAbilityBudgetRules(race, costTable)` helper.
- `selectAbilityBudgetRulesForRace` reads `compiledRaceCatalog` directly; no longer imports `PUERTA_POINT_BUY_SNAPSHOT`.
- `puerta-point-buy.json` + `puerta-point-buy.md` + `point-buy-snapshot.ts` retired (deleted, not preserved as derived re-export).
- `tests/phase-12.6/ability-budget-per-race.spec.ts` migrated atomically to consume the new pipeline (mirrors Phase 16-02's atomic phase-12.4 fixture migration pattern).
- New phase-17 spec(s) cover SC#4 reframe: ≥3 races resolve to a non-null curve via the selector + ≥1 race resolves to null (fail-closed regression).
- UAT-2026-04-20 §A1 closed in Phase 17 closeout commit with evidence pointer to puerta-point-buy.md history (preserve the markdown as audit trail until commit lands; delete in same commit).

**Out of scope:**
- Hunting Puerta NWScript server-script overrides for non-uniform per-race budgets (deferred — current snapshot is sourced-uniform per Phase 12.6 evidence).
- Hand-authoring synthetic variant curves for testing only (rejected — violates D-NO-hardcoded-data principle inherited from CLAUDE.md "verify against game files").
- UI changes to attributes-board (Phase 12.6 already renders correctly under the snapshot; new selector returns the same shape).
- Schema bumps on `raceCatalogSchema.schemaVersion` (additive optional field — same posture as Phase 16-01's `bonusFeatSchedule` — no bump).

</domain>

<decisions>
## Implementation Decisions

### Source Pipeline (D-01 — locked by user)
- **D-01:** Move snapshot into the extractor pipeline. `compiledRaceSchema` gains `abilitiesPointBuyNumber: number | null` (additive, optional, nullable). `race-assembler.ts` reads `row.AbilitiesPointBuyNumber` from `racialtypes.2da` per race. The hand-authored JSON snapshot at `packages/rules-engine/src/foundation/data/puerta-point-buy.json` and its companion `.md` provenance file are retired in the same plan that ships the extractor field.

### Cost Table Location (D-02 — Claude's discretion, "tu decides")
- **D-02:** Cost step function lives as a single `NWN1_POINT_BUY_COST_TABLE` constant in `packages/rules-engine/src/foundation/`. Shape: `{ minimum: 8, maximum: 18, costByScore: { '8': 0, '9': 1, ..., '18': 16 } }`. Rationale: the cost step function is hardcoded NWN1 engine behavior (user-confirmed 2026-04-20, see puerta-point-buy.md § "Plan 06 Source Resolution"). Embedding it per-race in compiled-races is wasteful (45× duplication) and creates ambiguity over whether per-race costByScore is intentional or extractor noise. A single rules-engine constant + race-side budget keeps source-of-truth minimal.
- **D-02a:** A new helper `deriveAbilityBudgetRules(compiledRace, costTable): AbilityBudgetRules | null` in rules-engine composes `{ budget: race.abilitiesPointBuyNumber, ...NWN1_POINT_BUY_COST_TABLE }`. Returns `null` when `abilitiesPointBuyNumber === null` (preserves Phase 12.6 D-05 fail-closed contract).

### SC#4 Reframe (D-03 — locked by user)
- **D-03:** SC#4 "specs cover ≥3 races with distinct curves" reframes to schema-shape coverage: ≥3 dedupe-canonical races resolve to a non-null `AbilityBudgetRules` via the selector (post-Phase-17 pipeline), AND ≥1 race (synthetic or naturally-null) demonstrates the null fail-closed branch. "Distinct curves" literal is dropped — it is unsatisfiable with truthful data per Phase 12.6 evidence (NWN1 engine curve is uniform; no Puerta server-script overrides observed in client extraction). Coverage spec asserts pipeline correctness, not value variance.

### Test Migration (D-04 — Claude's discretion, "tu decides")
- **D-04:** Migrate `tests/phase-12.6/ability-budget-per-race.spec.ts` atomically with the snapshot retirement (same plan, same commit). Replace `import { PUERTA_POINT_BUY_SNAPSHOT } from '@rules-engine/foundation/point-buy-snapshot'` with the new selector path. The behavior pin from Phase 12.6 (45 races have non-null curves; baseline `{8,8,8,8,8,8}` → spent 0; bump 8→14 → 6 points spent) survives the migration verbatim. Mirrors Phase 16-02's atomic phase-12.4 fixture migration. Rationale: cleaner than keeping a derived re-export of the snapshot; phase-12.6 specs become the most-canonical place to assert per-race point-buy behavior, just sourced from the new pipeline.

### UAT A1 Closure (D-05 — locked by user)
- **D-05:** UAT-2026-04-20 §A1 ("Point-buy cost varies per race") closes as resolved-by-evidence in Phase 17's closeout commit. Closeout note references the now-deleted-but-historical `puerta-point-buy.md § "Plan 06 Source Resolution"` text via git history (commit `bf55129` and earlier 12.6 commits). UAT-FINDINGS-2026-04-20.md A1 entry gets a CLOSED-BY: Phase 17 footer with disposition note: "User claim of per-race variance was contradicted by user's own 2026-04-20 in-game verification + racialtypes.2da extraction; Phase 17 ships the engineering deliverable (extractor pipeline) on the truthful uniform curve."

### Schema Posture
- **D-06:** `raceCatalogSchema.schemaVersion` stays at `'1'` — additive optional nullable field, same posture as Phase 16-01's `bonusFeatSchedule` (CONTEXT 16 D-NO-bump rule). Persistence layer + buildEncodingVersion untouched.

### Claude's Discretion
- Helper function signature and module placement (`deriveAbilityBudgetRules` in `foundation/ability-budget.ts` vs new file).
- Constant naming exact spelling (`NWN1_POINT_BUY_COST_TABLE` vs `POINT_BUY_COST_STEP_TABLE`).
- Whether the new phase-17 spec lives under `tests/phase-17/` (new dir) or appends to migrated phase-12.6 spec — planner decides per Phase 16 precedent (separate dir per phase preferred).
- Wave breakdown — likely 3 waves: (Wave 1) extractor schema + assembler + regenerated artifact, (Wave 2) rules-engine cost-table constant + helper + selector swap + retire snapshot, (Wave 3) atomic migrate phase-12.6 spec + add phase-17 SC#4 spec + close UAT A1. Planner finalises.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 12.6 (snapshot baseline being retired)
- `packages/rules-engine/src/foundation/data/puerta-point-buy.json` — current 45-entry hand-authored snapshot; retired by Phase 17.
- `packages/rules-engine/src/foundation/data/puerta-point-buy.md` — provenance dossier documenting 2026-04-20 user verification of NWN1 uniform curve + AbilitiesPointBuyNumber=30 source. Retired by Phase 17 (history accessible via git).
- `packages/rules-engine/src/foundation/point-buy-snapshot.ts` — Zod-validated module loader; retired by Phase 17.
- `tests/phase-12.6/ability-budget-per-race.spec.ts` — 45-race table-driven baseline + bump-delta spec; migrated atomically by Phase 17.
- `packages/rules-engine/src/foundation/ability-budget.ts` — null-branch fail-closed contract from Phase 12.6 D-05; preserved verbatim.

### Phase 12.6 → Phase 17 consumer chain
- `apps/planner/src/features/character-foundation/selectors.ts:64` (`selectAbilityBudgetRulesForRace`) — current snapshot read; rewires to compiledRaceCatalog + helper.
- `apps/planner/src/features/character-foundation/selectors.ts:258` (attributeRules wiring into board snapshot input) — unchanged shape, new source.

### Extractor surface
- `packages/data-extractor/src/contracts/race-catalog.ts` — `compiledRaceSchema` lines 9-17 (target of Zod field addition).
- `packages/data-extractor/src/assemblers/race-assembler.ts` — assembler that reads `racialtypes.2da` rows; adds `AbilitiesPointBuyNumber` cross-ref.
- `.planning/phases/05-skills-derived-statistics/server-extract/racialtypes.2da` — canonical 2DA evidence file showing uniform AbilitiesPointBuyNumber=30.
- `apps/planner/src/data/compiled-races.ts` — regenerated artifact target.

### Pattern precedents
- `.planning/phases/16-feat-engine-completion/16-01-PLAN.md` — additive optional nullable extractor field pattern (`bonusFeatSchedule`); Phase 17 follows the same shape.
- `.planning/phases/16-feat-engine-completion/16-01-SUMMARY.md` § "Sibling regenerated catalogs reverted to 2026-04-17 baseline" — atomic-extract scoping precedent (only the in-scope catalog gets the bumped datasetId; other regenerated catalogs revert if they introduce unrelated drift).
- `.planning/phases/16-feat-engine-completion/16-02-SUMMARY.md` § "Migrate phase-06 + phase-12 fixtures to new BuildStateAtLevel shape" — atomic-fixture-migration precedent (D-04 mirror).

### Requirements + roadmap
- `.planning/REQUIREMENTS.md` § ATTR-02 — closes via Phase 17.
- `.planning/ROADMAP.md` § "Phase 17: Per-Race Point-Buy (GAP)" — original SC; SC#1+#2+#3 satisfied as written, SC#4 reframed by D-03.
- `.planning/UAT-FINDINGS-2026-04-20.md` § A1 — closed by Phase 17 closeout commit per D-05.

### Project guardrails
- `CLAUDE.md` — Spanish-first surface; copy at `apps/planner/src/lib/copy/es.ts`; D-NO-hardcoded-data principle ("verify against game files").
- `.planning/PROJECT.md` § Constraints — Rules Fidelity (strict, not warn).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `compiledRaceSchema` (race-catalog.ts:9-17) — extend with one optional nullable field; precedent established by Phase 16-01 on `compiledClassSchema.bonusFeatSchedule`.
- `parseTwoDa` + `load2da` helpers (in `packages/data-extractor/src/parsers/two-da-parser.ts` + assembler-local copies) — reuse the same pattern Phase 16-01 PATTERNS.md S1 documented for class-assembler. race-assembler may already read `racialtypes.2da`; verify and extend.
- `calculateAbilityBudgetSnapshot` + `nextIncrementCost` + `canIncrementAttribute` (ability-budget.ts) — interface unchanged; null-branch fail-closed already wired (Phase 12.6 D-05).
- `selectAbilityBudgetRulesForRace` (selectors.ts:64) — selector already exists; rewires source from snapshot to compiledRaceCatalog.

### Established Patterns
- **Additive optional nullable field on extractor schemas** — Phase 16-01 set the precedent: `z.array(...).nullable().optional()`. Phase 17 mirrors: `z.number().int().nonnegative().nullable().optional()`. No `schemaVersion` bump.
- **Atomic re-extract with sibling-catalog reversion** — when `pnpm extract` regenerates 5 catalogs but only 1 is in scope, revert the others to baseline. Phase 16-01 SUMMARY documents this; Phase 17 likely needs the same hygiene given recent halfelf2 drift noted in Phase 16-01.
- **Atomic fixture migration alongside source-of-truth swap** — Phase 16-02 migrated 5 fixture files when `BuildStateAtLevel` shape extended. Phase 17 D-04 follows the same posture for phase-12.6 spec.
- **Pattern S7 framework-agnostic boundary** — rules-engine helpers must not import from extractor or planner. The new `deriveAbilityBudgetRules(compiledRace, costTable)` helper takes a plain object input that happens to match `compiledRaceSchema` shape, but the helper itself depends only on the `AbilityBudgetRules` shape. Selector composes the call. Mirrors Phase 16-02 B-01 architectural decision.

### Integration Points
- **Extractor → planner artifact:** `compiled-races.ts` regenerated atomically with the assembler change.
- **Rules-engine → planner selector:** new helper exported from `rules-engine/foundation`; selector imports it.
- **Snapshot → deletion:** delete `puerta-point-buy.{json,md,ts}` in same commit as new pipeline lands; phase-12.6 spec migrates simultaneously.
- **UAT log → close commit:** `UAT-FINDINGS-2026-04-20.md` § A1 gets CLOSED-BY footer in Phase 17 closeout.

</code_context>

<specifics>
## Specific Ideas

- The `racialtypes.2da` extraction baseline lives at `.planning/phases/05-skills-derived-statistics/server-extract/racialtypes.2da` (already in repo). Plan 17 does NOT need to re-extract; it reads the already-extracted 2DA via `nwsyncReader.getResource` and `parseTwoDa` per Phase 16-01 PATTERNS.md S1.
- The current snapshot has 45 entries matching `dedupeByCanonicalId(compiledRaceCatalog.races).length`. Post-Phase-17 spec must verify that the new pipeline produces ≥45 non-null races (no regression in coverage).
- Phase 16-01 found the regenerated nwsync 2026-04-26 introduced an unrelated `race:halfelf2` dup that broke phase-12.6/12.8 specs. Phase 17 will hit the same artifact when running `pnpm extract`. Mitigation: revert sibling catalogs to baseline post-extract (per Phase 16-01 § "Atomic re-extract scoping" pattern) so only `compiled-races.ts` carries Phase 17's intentional change.

</specifics>

<deferred>
## Deferred Ideas

- **Puerta NWScript server-script extraction path** — if/when Puerta ships a non-uniform `AbilitiesPointBuyNumber` override via server-side scripts, a future phase can re-open per-race variance work. Encoded as `it.todo` in Phase 12.6 spec; preserved by D-04 atomic migration. Not Phase 17 scope.
- **Synthetic variant curves for negative-path testing** — rejected by D-NO-hardcoded-data; if needed in future, would belong in a fixture-only test util, not production data.
- **Schema-version bump (`raceCatalogSchema.schemaVersion: '1' → '2'`)** — out of scope; additive optional nullable field is purely backward-compatible. If a future phase needs to break the catalog shape (e.g. remove fields, change ID regex), that phase owns the bump + migration.

</deferred>

---

*Phase: 17-per-race-point-buy*
*Context gathered: 2026-04-26 via /gsd-discuss-phase 17*
