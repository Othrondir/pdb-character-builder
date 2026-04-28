---
phase: 17-per-race-point-buy
verified: 2026-04-28T11:00:00Z
status: passed
score: 4/4 must-haves verified (SCs); 12/12 V-ids; 1/1 requirement (ATTR-02)
overrides_applied: 0
---

# Phase 17: Per-Race Point-Buy Verification Report

**Phase Goal:** Reemplazar curva uniforme `ability-budget.ts` por curvas por raza desde extractor.
**Verified:** 2026-04-28T11:00:00Z
**Status:** passed
**Re-verification:** No — initial verification
**Requirement:** ATTR-02

## Goal Achievement

The phase goal — "replace uniform curve in `ability-budget.ts` with per-race curves sourced from the extractor" — is achieved by the rewired pipeline:

```
racialtypes.2da:AbilitiesPointBuyNumber
   → race-assembler.ts (parseInt + Number.isFinite + warnings.push)
   → compiledRaceCatalog.races[].abilitiesPointBuyNumber  (45 entries × 30)
   → selectAbilityBudgetRulesForRace(raceId)
       → compiledRaceCatalog.races.find
       → deriveAbilityBudgetRules(race, NWN1_POINT_BUY_COST_TABLE)
   → AbilityBudgetRules | null
   → calculateAbilityBudgetSnapshot
   → AttributesBoard (UI render)
```

The legacy hand-authored `PUERTA_POINT_BUY_SNAPSHOT` dictionary + `point-buy-snapshot.ts` module + JSON + provenance dossier are **fully retired** (zero grep matches across `apps/`, `packages/`, `tests/`).

### Observable Truths (Roadmap Success Criteria)

| #   | Truth (Phase 17 Success Criteria) | Status | Evidence |
| --- | --------------------------------- | ------ | -------- |
| SC#1 | Extractor surface coste point-buy por raza (Puerta snapshot override o 2DA enrichment, fail-closed si raza no enriched) | VERIFIED | `packages/data-extractor/src/contracts/race-catalog.ts:11` ships `abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional()`; `packages/data-extractor/src/assemblers/race-assembler.ts:165-184` reads `row.AbilitiesPointBuyNumber` with parseInt + Number.isFinite + warnings.push fail-soft idiom; `apps/planner/src/data/compiled-races.ts` ships `abilitiesPointBuyNumber: 30` × 45 entries (count verified). |
| SC#2 | `ability-budget.ts` consume catálogo enriquecido en lugar de curva uniforme | VERIFIED | `packages/rules-engine/src/foundation/ability-budget.ts:84-95` exports `NWN1_POINT_BUY_COST_TABLE` (canonical 8:0..18:16); `:109-124` exports `deriveAbilityBudgetRules` helper; `apps/planner/src/features/character-foundation/selectors.ts:63-70` rewires `selectAbilityBudgetRulesForRace` to read `compiledRaceCatalog.races.find` + compose via `deriveAbilityBudgetRules`; legacy `PUERTA_POINT_BUY_SNAPSHOT` import deleted. |
| SC#3 | Atributos board refleja coste correcto al subir/bajar atributo según raza activa | VERIFIED | `apps/planner/src/features/character-foundation/attributes-board.tsx:15-16,43,59` wires `selectAbilityBudgetRulesForRace` + `selectAttributeBudgetSnapshot` into the board; `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` 6/6 GREEN under jsdom; `tests/phase-12.3/attributes-budget-gate.spec.ts` covers `nextIncrementCost`/`canIncrementAttribute` increment helpers; `tests/phase-12.6/ability-budget-per-race.spec.ts` table-driven (45 races × baseline + DEX 8→14 bump-delta) GREEN against the rewired selector. |
| SC#4 | Specs cubren al menos 3 razas con curvas distintas + regression sobre razas no-enriched (curva legacy preservada) — D-03 reframe: ≥3 named races resolve to non-null `AbilityBudgetRules` through rewired selector + ≥1 fail-closed branch demonstrated | VERIFIED (per D-03 reframe locked in 17-02-PLAN must_haves + 17-CONTEXT.md) | `tests/phase-17/per-race-point-buy-selector.spec.ts` 4/4 GREEN: race:human/elf/dwarf resolve to non-null AbilityBudgetRules with `budget=30, minimum=8, maximum=18, costByScore=NWN1_POINT_BUY_COST_TABLE.costByScore`; null fail-closed branch covered by both unknown raceId (`race:does-not-exist`) and null raceId; full-catalog coverage assertion replaces deleted `point-buy-snapshot-coverage.spec.ts`. Reframe rationale: extractor emits uniform `AbilitiesPointBuyNumber=30` across 45 races (server-data-driven); per-race differentiation arrives via future enrichment, but the wiring contract is locked this phase. The original "distinct curves" expectation is preserved as `it.todo` in `tests/phase-12.6/ability-budget-per-race.spec.ts:154-156`. |

**Score:** 4/4 truths verified.

### Validation IDs (V-01 through V-12)

| V-ID | Plan/Wave | Description | Status | Evidence |
| ---- | --------- | ----------- | ------ | -------- |
| V-01 | 01 / W1 | Extractor schema accepts `abilitiesPointBuyNumber: int \| null \| undefined`; assembler emits the field | VERIFIED | Schema parse subtests in `tests/phase-17/per-race-point-buy-extractor.spec.ts` GREEN (5 schema-parse + 2 catalog-coverage) |
| V-02 | 02 / W2 | `deriveAbilityBudgetRules` composition + null fail-closed | VERIFIED | `tests/phase-17/derive-ability-budget-rules.spec.ts` 7/7 GREEN |
| V-03 | 02 / W2 | Selector reads `compiledRaceCatalog` + composes via helper | VERIFIED | `tests/phase-17/per-race-point-buy-selector.spec.ts` 4/4 GREEN |
| V-04 | 03 / W3 | Phase-12.6 ability-budget-per-race spec migrated to selector pipeline | VERIFIED | `tests/phase-12.6/ability-budget-per-race.spec.ts:3` imports `selectAbilityBudgetRulesForRace`; `it.todo` block preserved verbatim at lines 154-156 |
| V-05 | 02 / W2 | `calculateAbilityBudgetSnapshot` happy path through rewired selector | VERIFIED | Covered transitively by V-04 (45-race table-driven) + helper spec test 3 |
| V-06 | 03 / W3 | UI fail-closed callout under selector pipeline | VERIFIED | `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` 6/6 GREEN; uses `race:does-not-exist` to manufacture null branch (em-dash fallback) |
| V-07 | 02 / W2 | SC#4 D-03 reframe ≥3 races + null branch | VERIFIED | `tests/phase-17/per-race-point-buy-selector.spec.ts` 4/4 GREEN |
| V-08 | 01 / W1 | `compiled-races.ts` regen coverage | VERIFIED | `grep -c "abilitiesPointBuyNumber" apps/planner/src/data/compiled-races.ts` returns 45; `grep -c '"id": "race:'` returns 45 |
| V-09 | 03 / W3 | Snapshot retirement + barrel cleanup + grep sweep | VERIFIED | 4 files deleted (verified via `ls` non-zero); barrel ships 5 exports; full grep sweep across `apps/ packages/ tests/` returns ZERO matches |
| V-10 | 03 / W3 | Pre-12.6 seeder migrations | VERIFIED | `tests/phase-03 tests/phase-10` 20/20 GREEN; no `PUERTA_POINT_BUY_SNAPSHOT` or `PRE_12_6_UNIFORM_CURVE` references remain |
| V-11 | 03 / W3 | UAT A1 closure footer | VERIFIED | `.planning/UAT-FINDINGS-2026-04-20.md:72-76` carries `**CLOSED-BY:** Phase 17 (per-race-point-buy)` + verbatim D-05 disposition note + git-history evidence pointer |
| V-12 | 01 / W1 | Atomic re-extract hygiene + race:halfelf2 dedup | VERIFIED | `grep -c "race:halfelf2" apps/planner/src/data/compiled-races.ts` returns 0; sibling catalogs (compiled-classes/feats/skills/deities) reverted to post-Phase-16 baseline |

**12/12 V-ids GREEN.**

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `packages/data-extractor/src/contracts/race-catalog.ts` | `compiledRaceSchema` with `abilitiesPointBuyNumber` field | VERIFIED | Line 11: `abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional(),`; `schemaVersion: z.literal('1')` preserved per D-06 |
| `packages/data-extractor/src/assemblers/race-assembler.ts` | Reads `row.AbilitiesPointBuyNumber` per row + races.push field | VERIFIED | Lines 165-184: column read with parseInt + Number.isFinite + `>= 0` guard + `warnings.push` fail-soft idiom; `abilitiesPointBuyNumber,` inside races.push at line 184 |
| `apps/planner/src/data/compiled-races.ts` | 45 races × `abilitiesPointBuyNumber: 30` | VERIFIED | grep count = 45 (one per race); race:halfelf2 excised (count = 0); race:human/elf/dwarf/halfelf/halforc/halfling/gnome all confirmed |
| `packages/rules-engine/src/foundation/ability-budget.ts` | `NWN1_POINT_BUY_COST_TABLE` + `deriveAbilityBudgetRules` + exported `AbilityBudgetRules` | VERIFIED | Line 12: `export interface AbilityBudgetRules`; Line 84-95: `export const NWN1_POINT_BUY_COST_TABLE` with `as const satisfies`; Line 109-124: `export function deriveAbilityBudgetRules`; null fail-closed at line 117 |
| `packages/rules-engine/src/foundation/index.ts` | 5 exports, no `./point-buy-snapshot` | VERIFIED | 5 export lines (`ability-budget`, `ability-modifier`, `origin-rules`, `group-races-by-parent`, `apply-race-modifiers`); `point-buy-snapshot` not present |
| `apps/planner/src/features/character-foundation/selectors.ts` | `selectAbilityBudgetRulesForRace` rewired to catalog + helper | VERIFIED | Line 63-70: reads `compiledRaceCatalog.races.find((r) => r.id === raceId)` + returns `deriveAbilityBudgetRules(race)`; legacy snapshot import deleted |
| `tests/phase-17/per-race-point-buy-extractor.spec.ts` | 7-test Wave 1 RED→GREEN gate | VERIFIED | Exists, 7/7 GREEN |
| `tests/phase-17/derive-ability-budget-rules.spec.ts` | 7-test Wave 2 helper gate | VERIFIED | Exists, 7/7 GREEN |
| `tests/phase-17/per-race-point-buy-selector.spec.ts` | 4-test Wave 2 SC#4 reframe gate | VERIFIED | Exists, 4/4 GREEN |
| `.planning/UAT-FINDINGS-2026-04-20.md` §A1 | CLOSED-BY: Phase 17 footer | VERIFIED | Line 72: `**CLOSED-BY:** Phase 17 (per-race-point-buy)` + D-05 disposition + evidence pointer |
| `packages/rules-engine/src/foundation/point-buy-snapshot.ts` | DELETED | VERIFIED | `ls` returns "no such file" |
| `packages/rules-engine/src/foundation/data/puerta-point-buy.json` | DELETED | VERIFIED | `ls` returns "no such file" |
| `packages/rules-engine/src/foundation/data/puerta-point-buy.md` | DELETED | VERIFIED | `ls` returns "no such file"; `git log --follow --all` walks pre-deletion history |
| `tests/phase-12.6/point-buy-snapshot-coverage.spec.ts` | DELETED | VERIFIED | `ls` returns "no such file" |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `race-assembler.ts` | `race-catalog.ts` | `raceCatalogSchema.parse` | WIRED | Schema parse at end of `assembleRaceCatalog`; `compiled-races.ts` regen passes parse on module load |
| `compiled-races.ts` | `race-catalog.ts` | Module-load Zod parse fail-closed | WIRED | Module loads cleanly under tests; runtime parse executed |
| `selectors.ts` | `ability-budget.ts` | `import { deriveAbilityBudgetRules, type AbilityBudgetRules }` | WIRED | Import at lines 3-7; usage at line 69 |
| `selectors.ts` | `compiled-races.ts` | `compiledRaceCatalog.races.find((r) => r.id === raceId)` | WIRED | Import at line 13; usage at line 67 |
| `attributes-board.tsx` | `selectors.ts` | `selectAbilityBudgetRulesForRace` + `selectAttributeBudgetSnapshot` | WIRED | Imports at lines 15-16; usage at lines 43, 59 |
| `creation-stepper.tsx` | `selectors.ts` | `selectAttributeBudgetSnapshot(foundationState)` | WIRED | Imports at line 6; usage at lines 91, 113 |
| `character-sheet.tsx` | `selectors.ts` | `selectAttributeBudgetSnapshot(foundationState)` | WIRED | Imports at line 6; usage at line 51 |
| `ability-budget.ts` | (framework boundary) | NO `@data-extractor` / `@planner` imports (S7 invariant) | WIRED | `grep -E "from '@data-extractor\|from '@planner" packages/rules-engine/src/foundation/ability-budget.ts` returns zero matches |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `compiledRaceCatalog.races[].abilitiesPointBuyNumber` | `abilitiesPointBuyNumber: number \| null` | `racialtypes.2da:AbilitiesPointBuyNumber` parsed by `parseTwoDa` then re-validated by Zod | YES — 45/45 entries ship integer 30 (extracted from real game files) | FLOWING |
| `selectAbilityBudgetRulesForRace(raceId)` | `AbilityBudgetRules \| null` | `compiledRaceCatalog.races.find` + `deriveAbilityBudgetRules` | YES — composes `{ budget: 30, minimum: 8, maximum: 18, costByScore: {...} }` for every catalog race; null for unknown/null raceId | FLOWING |
| `selectAttributeBudgetSnapshot(state)` | `AbilityBudgetSnapshot` | `calculateAbilityBudgetSnapshot({ attributeRules: selectAbilityBudgetRulesForRace(state.raceId), ... })` | YES — null routes through fail-closed branch (rule:point-buy-missing); non-null computes spent/remaining over baseAttributes | FLOWING |
| `AttributesBoard` render | `attributeRules` (line 59) + `attributeBudget` (line 43) | Both selectors + `FAIL_CLOSED_CURVE_FALLBACK` for null branch (line 78) | YES — em-dash fallback present when raceId unmatched | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Phase 17 specs all GREEN | `corepack pnpm exec vitest run tests/phase-17 --reporter=dot` | 18/18 passed (3 test files) | PASS |
| Cross-phase regression sweep (Phase 03+10+12.6+17) | `corepack pnpm exec vitest run tests/phase-03 tests/phase-10 tests/phase-12.6 tests/phase-17 --reporter=dot` | 195 passed + 1 todo / 14 test files | PASS |
| Phase 12.6 + 12.8 dedup invariants intact | `corepack pnpm exec vitest run tests/phase-12.6 tests/phase-12.8 --reporter=dot` | 203 passed + 1 todo / 7 test files | PASS |
| Phase 03 + 10 (migrated specs) | `corepack pnpm exec vitest run tests/phase-03 tests/phase-10 --reporter=dot` | 20/20 passed / 8 test files | PASS |
| Full vitest suite (no new failures) | `corepack pnpm exec vitest run --reporter=dot` | 2280 passed + 2 skipped + 1 todo + 3 pre-existing failures (unchanged baseline) | PASS |
| Typecheck across full repo | `corepack pnpm exec tsc -p tsconfig.base.json --noEmit` | exit 0 | PASS |
| Zero-grep invariant: PUERTA_POINT_BUY_SNAPSHOT \| PointBuyCurve \| point-buy-snapshot \| puerta-point-buy across `apps/`, `packages/`, `tests/` | grep across each scoped directory | 0 matches in apps/; 0 in packages/; 0 in tests/ | PASS |
| `compiled-races.ts` ships 45 races × `abilitiesPointBuyNumber` | `grep -c "abilitiesPointBuyNumber" apps/planner/src/data/compiled-races.ts` + `grep -c '"id": "race:'` | both return 45 | PASS |
| `race:halfelf2` excised | `grep -c "race:halfelf2" apps/planner/src/data/compiled-races.ts` | returns 0 | PASS |
| Foundation barrel ships 5 exports (was 6) | `grep -c "^export \* from" packages/rules-engine/src/foundation/index.ts` | returns 5 | PASS |
| UAT A1 carries CLOSED-BY footer | grep `CLOSED-BY` in UAT-FINDINGS-2026-04-20.md | line 72: `**CLOSED-BY:** Phase 17 (per-race-point-buy)` | PASS |
| Provenance dossier git history accessible post-deletion | `git log --follow --all -- packages/rules-engine/src/foundation/data/puerta-point-buy.md` | walks back to commit `b1539fd` (deletion) and earlier 12.6 commits | PASS |
| All 12 phase commits exist | `git log --oneline -1 <sha>` × 12 | 9d393ae, ed45edf, 52739f1, b368509, f048c9f, 74e76cb, 4e24102, f89679c, bed5239, b4fdac0, b1539fd, 8734fa3 — all present | PASS |
| S7 framework-agnostic invariant on `ability-budget.ts` | `grep -E "from '@data-extractor\|from '@planner" packages/rules-engine/src/foundation/ability-budget.ts` | zero matches | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| ATTR-02 | 17-01, 17-02, 17-03 | El planner consume curvas de coste point-buy diferenciadas por raza desde el extractor (Puerta snapshot override o 2DA enrichment) en lugar de la curva uniforme actual (cierra UAT-2026-04-20 A1) | SATISFIED | All 4 SCs verified above; 12/12 V-ids GREEN; UAT A1 closed with verbatim D-05 disposition footer; legacy snapshot retired atomically (zero-grep invariant); ATTR-02 ready to be marked `[x]` in REQUIREMENTS.md after orchestrator commits |

**Note on REQUIREMENTS.md status:** ATTR-02 is still listed as `- [ ]` in `.planning/REQUIREMENTS.md:18`. Per Phase 16 precedent, orchestrator/closeout commit toggles this to `[x]` when verification passes. ROADMAP.md already shows Phase 17 as `[~]` ("EXECUTION COMPLETE; awaits `/gsd-verify-work 17`"). This verification authorizes the orchestrator to flip both markers.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| (none) | — | — | — | No blocker, warning, or info-level anti-patterns detected. The legacy `PUERTA_POINT_BUY_SNAPSHOT` placeholder pattern was the central anti-pattern this phase eliminated. |

Stub scan summary:
- No `TODO/FIXME/PLACEHOLDER` comments introduced by Phase 17 commits.
- No empty implementations (`return null` / `return {}` / `=> {}` etc.) in modified files except the deliberate `if (race.abilitiesPointBuyNumber == null) return null;` fail-closed path in `deriveAbilityBudgetRules` (which is the documented contract preserved from Phase 12.6 D-05).
- No hardcoded empty data passing to render: all components receive populated data through the live selector pipeline (`AttributesBoard` line 59, `creation-stepper.tsx` lines 91/113, `character-sheet.tsx` line 51).

### Pre-Existing Baseline Failures (NOT caused by Phase 17)

The full vitest run reports 3 failures, all confirmed unchanged from STATE.md baseline (line 6 + Wave 1/2/3 SUMMARYs):

1. `tests/phase-08/ruleset-version.spec.ts > BUILD_ENCODING_VERSION is literal 1` — Phase 08 module drift.
2. `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx > L9 con Guerrero 8 niveles: fila Caballero Arcano muestra blocker arcane-spell exacto` — Phase 13 drift.
3. `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx > L1 regresión: toda clase de prestigio sigue con copy de rama 2 (no L1)` — Phase 13 drift.

None of these failures touch any file Phase 17 modified. They are documented as long-standing baseline failures, NOT Phase 17 regressions.

### Human Verification Required

None. All Phase 17 deliverables are verifiable programmatically:
- Schema + assembler + catalog: deterministic Zod parse + count assertions.
- Helper + selector: pure unit tests (`tests/phase-17/`).
- UI fail-closed: jsdom RTL test (`tests/phase-12.6/attributes-board-fail-closed.spec.tsx`).
- Snapshot retirement: file-existence + grep sweep.
- UAT closure: doc-text grep.
- Provenance preservation: `git log --follow --all`.

The two "manual-only" items in `17-VALIDATION.md § Manual-Only Verifications` (UAT footer phrasing + git history reachability) are both satisfied by the automated checks above:
- UAT footer text was confirmed to contain the verbatim D-05 disposition phrase ("User claim of per-race variance was contradicted") via `grep`.
- `git log --follow --all -- puerta-point-buy.md` was executed and returned the pre-deletion history (commit `b1539fd` and earlier).

### Gaps Summary

No gaps. All four Roadmap Success Criteria pass; all 12 V-ids GREEN; all required artifacts exist, are substantive, and are wired through the live render path; ATTR-02 is satisfied; UAT A1 is closed with verbatim D-05 disposition; the legacy snapshot module is fully retired (zero grep matches across `apps/`, `packages/`, `tests/`); no new test failures vs. STATE.md baseline; tsc clean.

### Notes on SC#4 Reframe

SC#4 in ROADMAP.md reads "Specs cubren al menos 3 razas con curvas distintas + regression sobre razas no-enriched (curva legacy preservada)." The literal "distinct curves" expectation cannot be satisfied with truthful sourced data because:

1. `racialtypes.2da:AbilitiesPointBuyNumber` is uniform `30` across all 45 PlayerRace=1 rows in the user's nwsync dump (verified via Phase 12.6 evidence + Phase 17 Wave 1 extraction).
2. The NWN1 point-buy cost step (8:0..18:16) is hardcoded in the engine binary, not 2DA-driven.

Per CONTEXT D-03 (locked in 17-CONTEXT.md), 17-02-PLAN.md `must_haves`, and 17-RESEARCH.md, SC#4 is reframed as **schema-shape coverage**: ≥3 dedupe-canonical races resolve to non-null `AbilityBudgetRules` through the rewired selector AND ≥1 case demonstrates the null fail-closed branch. The original "distinct curves" expectation is preserved as `it.todo` in `tests/phase-12.6/ability-budget-per-race.spec.ts:154-156` to be re-opened by a future phase that captures server-script overrides (Puerta-side runtime mutations not visible in the client 2DA dump).

This reframe is documented and accepted across the planning corpus — it is not a silent scope reduction. The wiring contract (extractor → catalog → helper → selector → board) is locked this phase; the data-content contract (per-race variance) remains future work.

---

_Verified: 2026-04-28T11:00:00Z_
_Verifier: Claude (gsd-verifier)_
