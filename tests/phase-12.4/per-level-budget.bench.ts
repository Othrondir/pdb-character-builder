import { bench, describe } from 'vitest';

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
 * Phase 12.4-03 perf gate — p95 < 1ms at L16.
 *
 * SPEC R3 constraint: `@rules-engine/progression/per-level-budget` must stay
 * memoizable / fast. This bench runs the L16 computation of a full Humano+
 * Guerrero build and surfaces a p95 figure the plan's verification step can
 * inspect. If the gate fails, add internal memoization inside
 * per-level-budget.ts before merging.
 */
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

const l16Build: BuildSnapshot = {
  raceId: 'race:human',
  classByLevel: Object.fromEntries(
    Array.from({ length: 16 }, (_, i) => [i + 1, 'class:fighter']),
  ),
  abilityScores: { int: 14 },
  intAbilityIncreasesBeforeLevel: () => 0,
  chosenFeatIdsAtLevel: () => [],
  spentSkillPointsAtLevel: () => 0,
};

describe('Phase 12.4-03 bench — per-level-budget perf gate', () => {
  bench(
    'L16 Humano+Guerrero full build',
    () => {
      computePerLevelBudget(l16Build, 16, classInput, featInput, raceInput);
    },
    { time: 500, iterations: 100 },
  );
});
