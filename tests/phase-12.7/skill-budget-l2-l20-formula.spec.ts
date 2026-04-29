import { describe, expect, it } from 'vitest';

import { computePerLevelBudget, type BuildSnapshot, type ClassCatalogInput, type FeatCatalogInput, type RaceCatalogInput } from '@rules-engine/progression/per-level-budget';
import { abilityModifier } from '@rules-engine/foundation';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { compiledRaceCatalog } from '@planner/data/compiled-races';

/**
 * Phase 12.7-04 — R6 verify-only spike (D-14).
 *
 * Locks the D&D 3.5e L2..L20 per-level skill-point formula against
 * `computePerLevelBudget` for all 11 base classes × 6 INT scores
 * × 19 levels (2..20) = 1,254 non-skipped assertions.
 *
 * Expected formula at L > 1, non-human race:
 *     skillPoints.budget === max(1, classBase + intMod)
 *
 * Derivation from `packages/rules-engine/src/progression/per-level-budget.ts`
 * L204-L212:
 *   intMod        = floor((abilityScores.int + intIncreasesBeforeLevel(L) - 10) / 2)
 *   classSkillBase = classRow?.skillPointsPerLevel ?? 2
 *   base           = max(1, classSkillBase + intMod)
 *   skillBudget    = (L === 1 ? base×4 : base) + humanSkillBonus × (L === 1 ? 4 : 1)
 *
 * By using `raceId: null` and no INT bumps, the expression collapses to
 * `skillBudget === base === max(1, classBase + intMod)` for L ≥ 2 —
 * exactly the R6 verification target. Humano +1/level canon (A2) is
 * already locked by `tests/phase-12.4/per-level-budget.fixture.spec.ts`
 * and is deliberately NOT in scope here.
 *
 * VERIFY-ONLY INVARIANT (D-14):
 *   This spec triggers zero production-code changes. If a (class × INT × level)
 *   triple diverges from the formula, the divergence is documented in
 *   `12.7-04-SUMMARY.md` and the FIX is deferred to Phase 12.8 (alongside
 *   F5 SKILL-CARRYOVER, which will likely touch `computePerLevelBudget`
 *   anyway). DO NOT widen 12.7 scope mid-execution.
 *
 * Framework purity: spec reads `skillPointsPerLevel` from the catalog — no
 * hardcoded base values. If Puerta server customization ever changes a
 * class's skill budget, the formula assertion still holds (the value it
 * expects is derived from the same source the implementation reads).
 */

const BASE_CLASSES = [
  'class:barbarian',
  'class:bard',
  'class:cleric',
  'class:druid',
  'class:fighter',
  'class:monk',
  'class:paladin',
  'class:ranger',
  'class:rogue',
  'class:sorcerer',
  'class:wizard',
] as const;

const INT_SCORES = [8, 10, 12, 14, 16, 18] as const;

const LEVELS = Array.from({ length: 19 }, (_, i) => i + 2); // 2..20

describe('Phase 12.7-04 — L2..L20 skill budget formula verification (R6 verify-only)', () => {
  const classInput: ClassCatalogInput = {
    classes: compiledClassCatalog.classes.map((c) => ({
      bonusFeatSchedule: c.bonusFeatSchedule,
      id: c.id,
      skillPointsPerLevel: c.skillPointsPerLevel,
    })),
  };
  const featInput: FeatCatalogInput = {
    classFeatLists: compiledFeatCatalog.classFeatLists,
  };
  const raceInput: RaceCatalogInput = {
    races: compiledRaceCatalog.races.map((r) => ({ id: r.id })),
  };

  function sameClassRun(classId: string, through: number): Record<number, string> {
    const levels: Record<number, string> = {};
    for (let l = 1; l <= through; l++) levels[l] = classId;
    return levels;
  }

  for (const classId of BASE_CLASSES) {
    const classRow = compiledClassCatalog.classes.find((c) => c.id === classId);

    if (!classRow) {
      // Roster presence is a Phase 12.1 / 12.2 concern, not R6 scope.
      // Skip loudly rather than silently so future class-catalog edits
      // surface the gap instead of silently zeroing coverage.
      it.skip(`${classId} missing from compiled-classes catalog — roster issue, out of R6 scope`, () => {});
      continue;
    }

    const classBase = classRow.skillPointsPerLevel;

    describe(`${classId} (classBase=${classBase}) — L2..L20 × INT ∈ {8,10,12,14,16,18}`, () => {
      for (const intScore of INT_SCORES) {
        for (const level of LEVELS) {
          // Phase 14-05 — divergent fixture removed; this spec now uses
          // the same canonical helper the production sites consume so
          // the L2..L20 formula assertion stays in lock-step with any
          // future change to `abilityModifier`.
          const intMod = abilityModifier(intScore);
          const expected = Math.max(1, classBase + intMod);

          it(`L${level} INT=${intScore} → skillPoints.budget === max(1, ${classBase} + ${intMod}) === ${expected}`, () => {
            const build: BuildSnapshot = {
              // raceId null so humano +1/level canon (A2) does NOT contaminate
              // the pure `max(1, classBase + intMod)` assertion. Humano +1 is
              // locked separately in tests/phase-12.4/per-level-budget.fixture.spec.ts.
              raceId: null,
              classByLevel: sameClassRun(classId, level),
              abilityScores: { int: intScore },
              // No level-up INT bumps: the spec explicitly isolates the
              // base-INT contribution. Mid-level INT bumps are locked by
              // the Pícaro L12 case in the Phase 12.4-03 fixture.
              intAbilityIncreasesBeforeLevel: () => 0,
              chosenFeatIdsAtLevel: () => [],
              spentSkillPointsAtLevel: () => 0,
            };

            const budget = computePerLevelBudget(
              build,
              level,
              classInput,
              featInput,
              raceInput,
            );

            expect(budget.skillPoints.budget).toBe(expected);
          });
        }
      }
    });
  }
});
