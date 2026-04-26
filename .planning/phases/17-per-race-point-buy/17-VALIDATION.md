---
phase: 17
slug: per-race-point-buy
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-26
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source: `17-RESEARCH.md § Validation Architecture`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.16 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `corepack pnpm exec vitest run tests/phase-17/<spec> --reporter=dot` |
| **Full suite command** | `corepack pnpm exec vitest run` |
| **Estimated runtime** | ~10s for `tests/phase-17/**`; ~2 min full suite |

`tests/phase-17/**/*.spec.ts` files run in **node env** by default — no `vitest.config.ts` glob entry needed. All Phase 17 specs are pure `.spec.ts` (extractor + rules-engine + selector).

---

## Sampling Rate

- **After every task commit:** `corepack pnpm exec vitest run tests/phase-17/<changed-spec> --reporter=dot`
- **After every plan wave:** `corepack pnpm exec vitest run tests/phase-03 tests/phase-10 tests/phase-12.6 tests/phase-17 --reporter=dot` (covers all 6 affected files + new specs)
- **Before `/gsd-verify-work`:** `corepack pnpm exec vitest run` full suite green + `corepack pnpm exec tsc -p tsconfig.base.json --noEmit` exit 0
- **Max feedback latency:** ~10 seconds per task (phase-17 specs only); ~30 seconds per wave; ~120 seconds at phase gate

---

## Per-Task Verification Map

> Concrete task IDs (`17-XX-YY`) finalised by planner. Below is the requirement-to-test map the planner MUST honour.

| Map ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|--------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| V-01 | 01 | 1 | ATTR-02 (extractor surface) | — | `compiledRaceSchema` accepts `abilitiesPointBuyNumber: int \| null \| undefined`; `race-assembler.ts` emits the field for every race row | unit (extractor) | `pnpm exec vitest run tests/phase-17/per-race-point-buy-extractor.spec.ts` | ❌ W0 | ⬜ pending |
| V-02 | 02 | 2 | ATTR-02 (rules-engine helper) | — | `deriveAbilityBudgetRules` composes `{ budget, ...NWN1_POINT_BUY_COST_TABLE }`; returns `null` when input null/undefined | unit (rules-engine) | `pnpm exec vitest run tests/phase-17/derive-ability-budget-rules.spec.ts` | ❌ W0 | ⬜ pending |
| V-03 | 02 | 2 | ATTR-02 (selector rewire) | — | `selectAbilityBudgetRulesForRace(raceId)` reads `compiledRaceCatalog` + composes via helper; returns null on unknown raceId | unit (selector) | `pnpm exec vitest run tests/phase-17/per-race-point-buy-selector.spec.ts` | ❌ W0 | ⬜ pending |
| V-04 | 03 | 3 | ATTR-02 SC#1 (sourced) | — | Phase-12.6 ability-budget-per-race spec migrates to new pipeline; preserves 45-race table-driven baseline + bump-delta | unit (regression) | `pnpm exec vitest run tests/phase-12.6/ability-budget-per-race.spec.ts` | ✅ exists (migrate) | ⬜ pending |
| V-05 | 02 | 2 | ATTR-02 SC#2 (consumes catalog) | — | `calculateAbilityBudgetSnapshot` happy path through rewired selector — 30 budget, baseline {8×6} legal | unit (regression) | (covered by V-04) | ✅ exists | ⬜ pending |
| V-06 | 03 | 3 | ATTR-02 SC#3 (board reflects cost) | — | UI fail-closed callout still renders when selector returns null; seed migrated off snapshot mutation | RTL (jsdom regression) | `pnpm exec vitest run tests/phase-12.6/attributes-board-fail-closed.spec.tsx` | ✅ exists (migrate seed) | ⬜ pending |
| V-07 | 02 | 2 | ATTR-02 SC#4 (D-03 reframe) | — | ≥3 races resolve to non-null `AbilityBudgetRules` AND ≥1 case (synthetic stub) demonstrates null fail-closed branch via selector + helper | unit (Phase 17 SC#4) | `pnpm exec vitest run tests/phase-17/per-race-point-buy-selector.spec.ts` | ❌ W0 | ⬜ pending |
| V-08 | 01 | 1 | ATTR-02 SC#1 (regen) | — | `compiled-races.ts` regenerated atomically; every race ships `abilitiesPointBuyNumber` | unit (extractor coverage) | (covered by V-01) | ❌ W0 | ⬜ pending |
| V-09 | 03 | 3 | Snapshot retirement | — | `puerta-point-buy.{json,md,ts}` removed; foundation barrel cleaned; `point-buy-snapshot-coverage.spec.ts` deleted | structural | `git status` + `grep -r "puerta-point-buy\|PUERTA_POINT_BUY_SNAPSHOT" packages/ apps/ tests/` ⇒ zero matches | structural | ⬜ pending |
| V-10 | 03 | 3 | Pre-12.6 seeder migration | — | `tests/phase-03/summary-status.spec.tsx`, `tests/phase-03/attribute-budget.spec.tsx`, `tests/phase-10/attributes-advance.spec.tsx` no longer import `PUERTA_POINT_BUY_SNAPSHOT` | unit (regression) | `pnpm exec vitest run tests/phase-03 tests/phase-10` | ✅ exists (migrate seed) | ⬜ pending |
| V-11 | 03 | 3 | UAT A1 closure | — | UAT-FINDINGS-2026-04-20.md A1 carries `CLOSED-BY: Phase 17` footer with disposition note | docs | manual review | structural | ⬜ pending |
| V-12 | 01 | 1 | Atomic re-extract hygiene | — | `compiled-races.ts` is the only catalog whose `datasetId` advances; siblings reverted to baseline; `race:halfelf2` dedup decision honoured per Open Question Q1 | unit + structural | `git diff --stat apps/planner/src/data/compiled-*.ts` (only `compiled-races.ts` differs) + extractor spec assertions | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase-17/per-race-point-buy-extractor.spec.ts` — extractor RED gate for V-01 + V-08 + V-12 (covers ATTR-02 extractor surface, regen coverage, atomic-extract hygiene).
- [ ] `tests/phase-17/derive-ability-budget-rules.spec.ts` — rules-engine RED gate for V-02 (helper composition + null branch).
- [ ] `tests/phase-17/per-race-point-buy-selector.spec.ts` — selector RED gate for V-03 + V-07 (selector rewire + SC#4 reframe).
- [ ] No new framework install. No vitest.config.ts changes (phase-17/*.spec.ts inherits node env via default `tests/**/*.spec.ts` include).

*(Existing test infrastructure covers all Phase 17 requirements after the 3 new specs above land.)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| UAT A1 footer text reads naturally in Spanish + cross-links the Phase 17 closeout commit SHA | UAT-2026-04-20 §A1 closure | Editorial / cross-link integrity check, not algorithmic | Open `.planning/UAT-FINDINGS-2026-04-20.md`, locate A1, confirm `CLOSED-BY: Phase 17 (commit <sha>)` footer with disposition note copy-aligned with D-05 phrasing in CONTEXT.md |
| `puerta-point-buy.md` history accessible via git after deletion | UAT-2026-04-20 §A1 evidence pointer | Provenance audit trail integrity | `git log --follow --all -- packages/rules-engine/src/foundation/data/puerta-point-buy.md` shows commit `bf55129` and earlier 12.6 commits |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (V-01, V-02, V-03, V-07, V-08, V-12)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s per wave
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
