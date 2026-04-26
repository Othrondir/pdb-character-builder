# Phase 17: Per-Race Point-Buy — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `17-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 17-per-race-point-buy
**Areas discussed:** Source pipeline, SC#4 variance, UAT A1 disposition, Cost table location, Test migration

---

## Source Pipeline

| Option | Description | Selected |
|--------|-------------|----------|
| Move snapshot into extractor pipeline | Add `abilitiesPointBuyNumber` field to compiled-races schema. Extractor reads `racialtypes.2da` column `AbilitiesPointBuyNumber` per race. `ability-budget.ts` consumes compiled-races directly. Retire hand-authored `puerta-point-buy.json`. Closes ATTR-02 "desde el extractor" literally. | ✓ |
| Keep snapshot, add Puerta override loader | Snapshot stays in rules-engine but extractor emits a `point-buy-overrides.json` file from a Puerta server-script source. Snapshot becomes derived artifact, not hand-authored. | |
| Close ATTR-02 as already-shipped (Phase 12.6) | Phase 12.6 D-01/D-03 already satisfied SC#1 + SC#2 + SC#3 functionally. Phase 17 reduces to retroactive validation + SC#4 spec coverage closure. | |

**User's choice:** Move snapshot into extractor pipeline.
**Notes:** Locked as D-01 in CONTEXT.md.

---

## SC#4 Variance Reframe

| Option | Description | Selected |
|--------|-------------|----------|
| Reframe SC#4 to schema-shape coverage | Drop "distinct curves" literal. Assert: ≥3 races resolve to a non-null curve via selector + 1 race resolves to null (fail-closed). Table-driven shape-conformance, not value-variance. Honors Phase 12.6 sourced-uniformity finding. | ✓ |
| Spike Puerta server-script extraction first | Defer Phase 17 plans until research confirms whether Puerta NWScript overrides `AbilitiesPointBuyNumber` per race. If found, encode 2-3 distinct curves; if not, SC#4 reframes. Adds research subphase. | |
| Hand-author 1–2 hypothetical variant curves for tests | Add 2 fake-but-shape-valid curves to a separate fixture file. Production snapshot stays uniform. Rejected by D-NO-hardcoded-data principle but testable. | |

**User's choice:** Reframe SC#4 to schema-shape coverage.
**Notes:** Locked as D-03 in CONTEXT.md. Truthful-data-over-artificial-variance posture preserved.

---

## UAT A1 Disposition

| Option | Description | Selected |
|--------|-------------|----------|
| Close A1 as resolved-by-evidence | Phase 17 closeout commit references `puerta-point-buy.md § "Plan 06 Source Resolution"` showing user-verified uniformity. UAT log entry marked CLOSED with evidence pointer. Honest: data was wrong-claim, evidence overrode. | ✓ |
| Keep A1 open pending Puerta server-script discovery | Phase 17 closes the engineering deliverable but A1 stays in OPEN bucket until a Puerta server-script ext path lands. Phase 17 does NOT promise to resolve A1. | |
| Rewrite A1 contract | Update UAT-2026-04-20 § A1 contract to: "engine MUST respect per-race curve as resolved by extractor pipeline, even when current curves happen to be uniform". A1 then closes on Phase 17 completion regardless of variance. | |

**User's choice:** Close A1 as resolved-by-evidence.
**Notes:** Locked as D-05 in CONTEXT.md. Closeout commit references commit `bf55129` and earlier 12.6 commits via git history (since `puerta-point-buy.md` is deleted in same plan).

---

## Cost Table Location

| Option | Description | Selected |
|--------|-------------|----------|
| Constant in rules-engine, budget-only on race | `compiled-races` schema gets `abilitiesPointBuyNumber: number \| null`. rules-engine ships `NWN1_POINT_BUY_COST_TABLE` constant. Selector composes `{ budget: race.abilitiesPointBuyNumber, ...NWN1_POINT_BUY_COST_TABLE }`. Compact, sourced, single-cost-table. | ✓ (Claude's discretion) |
| Full curve per race on compiled-races | Extractor synthesizes the full struct per race row. Current snapshot shape preserved 1:1. | |
| Puerta-overrides.json sidecar | compiled-races stays untouched; extractor reads racialtypes.2da + Puerta-supplied overrides JSON, emits a single point-buy.json artifact. | |

**User's choice:** "tu decides" — Claude locked option 1.
**Rationale:** NWN1 cost step function is hardcoded engine behavior (user-confirmed 2026-04-20), not a per-race attribute. Embedding it 45× is wasteful and creates ambiguity about whether per-race costByScore is intentional. Single rules-engine constant + race-side budget is the minimal-surface representation of truthful data.

---

## Test Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate phase-12.6 tests atomically with Phase 17 plan | Same plan that retires snapshot updates phase-12.6 specs to consume compiled-races + new selector. No test churn; behavior pin survives. Mirrors Phase 16-02's atomic 12.4 fixture migration pattern. | ✓ (Claude's discretion) |
| Keep PUERTA_POINT_BUY_SNAPSHOT as derived re-export | Snapshot constant stays exported but body becomes derived from compiledRaceCatalog. Phase 12.6 tests untouched; extra indirection. | |
| Delete phase-12.6 spec, write fresh phase-17 spec | Remove phase-12.6 spec + replace with phase-17 spec. Cleaner phase boundaries; loses Plan 06 cadence dossier history. | |

**User's choice:** "tu decides" — Claude locked option 1.
**Rationale:** Atomic-fixture-migration mirrors Phase 16-02 D-04 precedent. The phase-12.6 specs are the canonical place to assert per-race point-buy behavior; rewiring them to the new source preserves history without indirection layers. Option 2 (re-export) creates a dead abstraction. Option 3 (delete + replace) loses the explicit `it.todo` Puerta-server-script-future-work pin.

---

## Claude's Discretion

- Helper function signature and module placement (`deriveAbilityBudgetRules` in `foundation/ability-budget.ts` vs new file).
- Constant naming exact spelling (`NWN1_POINT_BUY_COST_TABLE` vs `POINT_BUY_COST_STEP_TABLE`).
- New phase-17 spec directory structure (`tests/phase-17/` vs appending to phase-12.6).
- Wave breakdown — likely 3 waves (extractor schema + assembler + regen, rules-engine helper + retire snapshot, atomic fixture migrate + phase-17 spec + UAT closeout). Planner finalises.

## Deferred Ideas

- **Puerta NWScript server-script extraction path** — future phase, not Phase 17 scope. Existing `it.todo` in phase-12.6 spec preserved by D-04 atomic migration.
- **Synthetic variant curves for negative-path testing** — rejected by D-NO-hardcoded-data principle.
- **Schema-version bump on raceCatalogSchema** — out of scope; additive optional nullable field is backward-compatible.
