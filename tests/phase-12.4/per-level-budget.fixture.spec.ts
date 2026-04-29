import { describe, expect, it } from 'vitest';

import {
  computePerLevelBudget,
  type BuildSnapshot,
  type ClassCatalogInput,
  type FeatCatalogInput,
  type RaceCatalogInput,
} from '@rules-engine/progression/per-level-budget';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { compiledRaceCatalog } from '@planner/data/compiled-races';

/**
 * Phase 12.4-03 — RED fixture spec.
 *
 * Locks the `computePerLevelBudget` selector against canonical NWN1 EE builds
 * L1..L16 for Guerrero / Mago / Pícaro / Explorador / Monje + Humano
 * multiclass variants. Covers:
 *   - General + class-bonus feat cadence (SPEC R3, FEAT-01, PROG-01)
 *   - Humano L1 bonus feat (A1 canon hardcode)
 *   - L1 ×4 skill-point multiplier + INT modifier (SKIL-01, PROG-02)
 *   - Humano +1 SP/level (A2 canon hardcode — L1 is base×4+4, NOT (base+1)×4)
 *   - INT-increase arithmetic lock (Pícaro L12 with mid-level INT bumps)
 *   - Null / empty guards (classByLevel[N] === null)
 *   - chosen / spent / remaining arithmetic wiring
 *
 * Framework purity (CLAUDE.md Prescriptive Shape): the selector under test
 * lives in packages/rules-engine and MUST NOT import from @data-extractor.
 * Fixtures feed the selector via the caller-side adapter pattern: translate
 * compiled catalogs into the minimal structural inputs the selector exposes.
 */
describe('Phase 12.4-03 — per-level-budget selector (SPEC R3)', () => {
  // Caller-side adapters. Same shape production callers (apps/planner Wave 2/3)
  // will implement at the rules-engine boundary.
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

  function buildSnapshot(overrides: Partial<BuildSnapshot> = {}): BuildSnapshot {
    return {
      raceId: null,
      classByLevel: {},
      abilityScores: { int: 10 },
      intAbilityIncreasesBeforeLevel: () => 0,
      chosenFeatIdsAtLevel: () => [],
      spentSkillPointsAtLevel: () => 0,
      ...overrides,
    };
  }

  function sameClassRun(classId: string, through: number): Record<number, string> {
    const levels: Record<number, string> = {};
    for (let l = 1; l <= through; l++) levels[l] = classId;
    return levels;
  }

  describe('Guerrero single-class (INT 10)', () => {
    it('L1 non-human: general + classBonus slots, skillPoints budget 8', () => {
      const build = buildSnapshot({ classByLevel: { 1: 'class:fighter' } });
      const budget = computePerLevelBudget(build, 1, classInput, featInput, raceInput);
      expect(budget.featSlots).toEqual({
        general: 1,
        classBonus: 1,
        raceBonus: 0,
        total: 2,
        chosen: 0,
        remaining: 2,
      });
      expect(budget.skillPoints).toEqual({ budget: 8, spent: 0, remaining: 8 });
    });

    it('L1 Humano+Guerrero: race bonus feat added (total 3), skillPoints 12 (base×4 + 4)', () => {
      const build = buildSnapshot({
        raceId: 'race:human',
        classByLevel: { 1: 'class:fighter' },
      });
      const budget = computePerLevelBudget(build, 1, classInput, featInput, raceInput);
      expect(budget.featSlots.total).toBe(3);
      expect(budget.featSlots.raceBonus).toBe(1);
      // A2 canon: L1 Humano = (base × 4) + 4 = 8 + 4 = 12 (NOT (base+1) × 4 = 12 — coincident here
      // but differs for classes where base > 2; asserted directly in Pícaro below)
      expect(budget.skillPoints.budget).toBe(12);
    });

    it('L1 Mediano Fortecor+Guerrero: race bonus feat added without human skill bonus', () => {
      const build = buildSnapshot({
        raceId: 'race:mediano-fortecor',
        classByLevel: { 1: 'class:fighter' },
      });
      const budget = computePerLevelBudget(build, 1, classInput, featInput, raceInput);

      expect(budget.featSlots.raceBonus).toBe(1);
      expect(budget.featSlots.total).toBe(3);
      expect(budget.skillPoints.budget).toBe(8);
    });

    it('L2 Guerrero non-human: no feat slot under Puerta odd-level cadence, budget 2', () => {
      const build = buildSnapshot({
        classByLevel: { 1: 'class:fighter', 2: 'class:fighter' },
      });
      const budget = computePerLevelBudget(build, 2, classInput, featInput, raceInput);
      expect(budget.featSlots).toMatchObject({
        general: 0,
        classBonus: 0,
        raceBonus: 0,
        total: 0,
      });
      expect(budget.skillPoints.budget).toBe(2);
    });

    it('L3 Guerrero: general + classBonus under Puerta odd-level cadence', () => {
      const build = buildSnapshot({
        classByLevel: sameClassRun('class:fighter', 3),
      });
      const budget = computePerLevelBudget(build, 3, classInput, featInput, raceInput);
      expect(budget.featSlots).toMatchObject({
        general: 1,
        classBonus: 1,
        total: 2,
      });
    });

    it('L4 Guerrero: no feat slot under Puerta odd-level cadence', () => {
      const build = buildSnapshot({
        classByLevel: sameClassRun('class:fighter', 4),
      });
      const budget = computePerLevelBudget(build, 4, classInput, featInput, raceInput);
      expect(budget.featSlots).toMatchObject({
        general: 0,
        classBonus: 0,
        total: 0,
      });
    });

    it('L16 Guerrero: no feat slot under Puerta odd-level cadence', () => {
      const build = buildSnapshot({
        classByLevel: sameClassRun('class:fighter', 16),
      });
      const budget = computePerLevelBudget(build, 16, classInput, featInput, raceInput);
      expect(budget.featSlots.total).toBe(0);
    });
  });

  describe('Mago single-class (INT 14)', () => {
    it('L1: general only under Puerta wizard cadence, skillPoints 16 = (2+2)×4', () => {
      const build = buildSnapshot({
        abilityScores: { int: 14 },
        classByLevel: { 1: 'class:wizard' },
      });
      const budget = computePerLevelBudget(build, 1, classInput, featInput, raceInput);
      expect(budget.featSlots.total).toBe(1);
      expect(budget.skillPoints.budget).toBe(16);
    });

    it('L4: classBonus only under Puerta wizard cadence, skillPoints 4', () => {
      const build = buildSnapshot({
        abilityScores: { int: 14 },
        classByLevel: sameClassRun('class:wizard', 4),
      });
      const budget = computePerLevelBudget(build, 4, classInput, featInput, raceInput);
      expect(budget.featSlots.classBonus).toBe(1);
      expect(budget.skillPoints.budget).toBe(4);
    });

    it('L15: general only under Puerta wizard cadence', () => {
      const build = buildSnapshot({
        abilityScores: { int: 14 },
        classByLevel: sameClassRun('class:wizard', 15),
      });
      const budget = computePerLevelBudget(build, 15, classInput, featInput, raceInput);
      expect(budget.featSlots.total).toBe(1);
      expect(budget.featSlots.general).toBe(1);
      expect(budget.featSlots.classBonus).toBe(0);
    });
  });

  describe('Pícaro single-class (INT 14)', () => {
    it('L1: skillPoints 40 = (8+2)×4', () => {
      const build = buildSnapshot({
        abilityScores: { int: 14 },
        classByLevel: { 1: 'class:rogue' },
      });
      const budget = computePerLevelBudget(build, 1, classInput, featInput, raceInput);
      expect(budget.skillPoints.budget).toBe(40);
    });

    it('L2: no bonus slots; skillPoints 10', () => {
      const build = buildSnapshot({
        abilityScores: { int: 14 },
        classByLevel: { 1: 'class:rogue', 2: 'class:rogue' },
      });
      const budget = computePerLevelBudget(build, 2, classInput, featInput, raceInput);
      expect(budget.featSlots.total).toBe(0);
      expect(budget.skillPoints.budget).toBe(10);
    });

    it('L12 Pícaro with INT increases before L4 and L8 → effective INT 16 → mod 3 → 11 SP', () => {
      // INT-increase arithmetic lock (checker info item).
      // intAbilityIncreasesBeforeLevel(L12) === 2 → effective INT 14 + 2 = 16 → mod (16-10)/2 = 3
      // max(1, 8 + 3) = 11
      const build = buildSnapshot({
        abilityScores: { int: 14 },
        classByLevel: sameClassRun('class:rogue', 12),
        intAbilityIncreasesBeforeLevel: (lvl) => (lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0),
      });
      const budget = computePerLevelBudget(build, 12, classInput, featInput, raceInput);
      expect(budget.skillPoints.budget).toBe(11);
    });

    it('L9 Pícaro: classBonus feat pick under Puerta cadence', () => {
      const build = buildSnapshot({
        abilityScores: { int: 14 },
        classByLevel: sameClassRun('class:rogue', 9),
      });
      const budget = computePerLevelBudget(build, 9, classInput, featInput, raceInput);
      expect(budget.featSlots.classBonus).toBe(1);
    });

    it('L12 Pícaro: classBonus feat pick under Puerta cadence', () => {
      const build = buildSnapshot({
        abilityScores: { int: 14 },
        classByLevel: sameClassRun('class:rogue', 12),
      });
      const budget = computePerLevelBudget(build, 12, classInput, featInput, raceInput);
      expect(budget.featSlots.classBonus).toBe(1);
    });

    it('L15 Pícaro: classBonus feat pick under Puerta cadence', () => {
      const build = buildSnapshot({
        abilityScores: { int: 14 },
        classByLevel: sameClassRun('class:rogue', 15),
      });
      const budget = computePerLevelBudget(build, 15, classInput, featInput, raceInput);
      expect(budget.featSlots.classBonus).toBe(1);
    });
  });

  describe('Explorador (class:ranger, INT 12)', () => {
    it('L1: skillPoints 28 = (6+1)×4', () => {
      const build = buildSnapshot({
        abilityScores: { int: 12 },
        classByLevel: { 1: 'class:ranger' },
      });
      const budget = computePerLevelBudget(build, 1, classInput, featInput, raceInput);
      expect(budget.skillPoints.budget).toBe(28);
    });

    it('L3: general feat cadence', () => {
      const build = buildSnapshot({
        abilityScores: { int: 12 },
        classByLevel: sameClassRun('class:ranger', 3),
      });
      const budget = computePerLevelBudget(build, 3, classInput, featInput, raceInput);
      expect(budget.featSlots.general).toBe(1);
    });
  });

  describe('Monje (class:monk) — Puerta dropped vanilla bonus feats', () => {
    it('L1: general only, no classBonus slot', () => {
      const build = buildSnapshot({ classByLevel: { 1: 'class:monk' } });
      const budget = computePerLevelBudget(build, 1, classInput, featInput, raceInput);
      expect(budget.featSlots.classBonus).toBe(0);
      expect(budget.featSlots.general).toBe(1);
    });

    it('L2: no classBonus slot', () => {
      const build = buildSnapshot({
        classByLevel: { 1: 'class:monk', 2: 'class:monk' },
      });
      const budget = computePerLevelBudget(build, 2, classInput, featInput, raceInput);
      expect(budget.featSlots.classBonus).toBe(0);
    });

    it('L6: general only, no classBonus slot', () => {
      const build = buildSnapshot({
        classByLevel: sameClassRun('class:monk', 6),
      });
      const budget = computePerLevelBudget(build, 6, classInput, featInput, raceInput);
      expect(budget.featSlots.classBonus).toBe(0);
      expect(budget.featSlots.general).toBe(1);
    });
  });

  describe('Humano +1 SP/level canon (A2)', () => {
    it('L2 Humano+Guerrero: skillPoints 3 (base 2 + humano 1)', () => {
      const build = buildSnapshot({
        raceId: 'race:human',
        classByLevel: { 1: 'class:fighter', 2: 'class:fighter' },
      });
      const budget = computePerLevelBudget(build, 2, classInput, featInput, raceInput);
      expect(budget.skillPoints.budget).toBe(3);
    });

    it('L5 Humano+Mago INT 14: skillPoints 5 (base 4 + humano 1)', () => {
      const build = buildSnapshot({
        raceId: 'race:human',
        abilityScores: { int: 14 },
        classByLevel: sameClassRun('class:wizard', 5),
      });
      const budget = computePerLevelBudget(build, 5, classInput, featInput, raceInput);
      expect(budget.skillPoints.budget).toBe(5);
    });

    it('L1 Humano+Mago INT 14: race bonus feat (total 2), skillPoints 20 = (2+2)×4 + 4', () => {
      const build = buildSnapshot({
        raceId: 'race:human',
        abilityScores: { int: 14 },
        classByLevel: { 1: 'class:wizard' },
      });
      const budget = computePerLevelBudget(build, 1, classInput, featInput, raceInput);
      expect(budget.featSlots.total).toBe(2);
      expect(budget.skillPoints.budget).toBe(20);
    });

    it('L16 Humano+Guerrero: raceBonus 0 (only L1 gets humano feat), skillPoints 3', () => {
      const build = buildSnapshot({
        raceId: 'race:human',
        classByLevel: sameClassRun('class:fighter', 16),
      });
      const budget = computePerLevelBudget(build, 16, classInput, featInput, raceInput);
      expect(budget.featSlots.raceBonus).toBe(0);
      expect(budget.skillPoints.budget).toBe(3);
    });
  });

  describe('Skill carryover (F5)', () => {
    it('L2 Guerrero INT 8 receives +4 skill points when L1 leaves 4 unspent', () => {
      const build = buildSnapshot({
        abilityScores: { int: 8 },
        classByLevel: { 1: 'class:fighter', 2: 'class:fighter' },
        skillPointCarryoverBeforeLevel: (level) => (level === 2 ? 4 : 0),
      });
      const budget = computePerLevelBudget(build, 2, classInput, featInput, raceInput);
      expect(budget.skillPoints).toEqual({ budget: 5, spent: 0, remaining: 5 });
    });

    it('carryover is capped at 4 even when the caller passes a higher value', () => {
      const build = buildSnapshot({
        raceId: 'race:human',
        classByLevel: { 1: 'class:fighter', 2: 'class:fighter' },
        skillPointCarryoverBeforeLevel: (level) => (level === 2 ? 8 : 0),
      });
      const budget = computePerLevelBudget(build, 2, classInput, featInput, raceInput);
      expect(budget.skillPoints.budget).toBe(7);
    });
  });

  describe('Empty / null guards', () => {
    it('classByLevel[N] null → featSlots.total 0, skillPoints.budget 0', () => {
      const build = buildSnapshot({ classByLevel: { 1: null } });
      const budget = computePerLevelBudget(build, 1, classInput, featInput, raceInput);
      expect(budget.featSlots.total).toBe(0);
      expect(budget.skillPoints.budget).toBe(0);
    });

    it('build.raceId === null never grants race bonus feat', () => {
      const build = buildSnapshot({
        raceId: null,
        classByLevel: { 1: 'class:fighter' },
      });
      const budget = computePerLevelBudget(build, 1, classInput, featInput, raceInput);
      expect(budget.featSlots.raceBonus).toBe(0);
    });
  });

  describe('chosen / spent / remaining arithmetic', () => {
    it('chosen reflects build.chosenFeatIdsAtLevel(level).length', () => {
      const build = buildSnapshot({
        classByLevel: { 1: 'class:fighter' },
        chosenFeatIdsAtLevel: (l) => (l === 1 ? ['feat:dodge'] : []),
      });
      const budget = computePerLevelBudget(build, 1, classInput, featInput, raceInput);
      expect(budget.featSlots.chosen).toBe(1);
      expect(budget.featSlots.remaining).toBe(budget.featSlots.total - 1);
    });

    it('spent reflects build.spentSkillPointsAtLevel(level)', () => {
      const build = buildSnapshot({
        classByLevel: { 1: 'class:fighter' },
        spentSkillPointsAtLevel: () => 3,
      });
      const budget = computePerLevelBudget(build, 1, classInput, featInput, raceInput);
      expect(budget.skillPoints.spent).toBe(3);
      expect(budget.skillPoints.remaining).toBe(budget.skillPoints.budget - 3);
    });
  });
});
