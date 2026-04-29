import { describe, expect, it } from 'vitest';

import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { determineFeatSlots } from '@rules-engine/feats/feat-eligibility';
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
import { createBaseAttributes } from '@planner/features/character-foundation/store';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';
import { createInitialFeatState } from '@planner/features/feats/store';
import type { FeatStoreState } from '@planner/features/feats/store';
import {
  PROGRESSION_LEVELS,
  type ProgressionLevel,
} from '@planner/features/level-progression/progression-fixture';
import { selectLevelCompletionState } from '@planner/features/level-progression/selectors';
import { createInitialProgressionState } from '@planner/features/level-progression/store';
import type { LevelProgressionStoreState } from '@planner/features/level-progression/store';
import { createInitialSkillState } from '@planner/features/skills/store';
import type { SkillStoreState } from '@planner/features/skills/store';

const noop = () => undefined;
const noopAny = (..._args: unknown[]) => undefined;

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

function buildSnapshotForClassRun(
  classId: CanonicalId,
  throughLevel: ProgressionLevel,
): BuildSnapshot {
  const classByLevel: Record<number, CanonicalId> = {};
  for (let level = 1; level <= throughLevel; level++) {
    classByLevel[level] = classId;
  }

  return {
    abilityScores: { int: 10 },
    chosenFeatIdsAtLevel: () => [],
    classByLevel,
    intAbilityIncreasesBeforeLevel: () => 0,
    raceId: null,
    spentSkillPointsAtLevel: () => 0,
  };
}

function progressionForClassRun(
  classId: CanonicalId,
  throughLevel: ProgressionLevel,
): LevelProgressionStoreState {
  const initial = createInitialProgressionState();

  return {
    ...initial,
    activeLevel: throughLevel,
    levels: initial.levels.map((record) => ({
      ...record,
      classId: record.level <= throughLevel ? classId : null,
    })),
    resetProgression: noop,
    setActiveLevel: noopAny,
    setLevelAbilityIncrease: noopAny,
    setLevelClassId: noopAny,
  };
}

function emptyFoundation(): CharacterFoundationStoreState {
  return {
    alignmentId: null,
    baseAttributes: createBaseAttributes(),
    buildName: null,
    datasetId: 'dataset:test',
    raceId: null,
    racialModifiers: null,
    resetFoundation: noop,
    setAlignment: noopAny,
    setBaseAttribute: noopAny,
    setBuildName: noopAny,
    setRace: noopAny,
    setSubrace: noopAny,
    subraceId: null,
  };
}

function emptyFeats(): FeatStoreState {
  return {
    ...createInitialFeatState(),
    clearClassFeat: noopAny,
    clearGeneralFeat: noopAny,
    resetFeatSelections: noop,
    resetLevel: noopAny,
    setActiveLevel: noopAny,
    setClassFeat: noopAny,
    setGeneralFeat: noopAny,
  };
}

function emptySkills(): SkillStoreState {
  return {
    ...createInitialSkillState(),
    decrementSkillRank: noopAny,
    incrementSkillRank: noopAny,
    resetSkillAllocations: noop,
    setActiveLevel: noopAny,
    setLevelSkillRank: noopAny,
    setSkillRank: noopAny,
  };
}

describe('Phase 12.4 — compiled feat schedule matrix', () => {
  it('per-level budget mirrors determineFeatSlots for every compiled class through L20', () => {
    const mismatches: Array<{
      actual: number;
      classId: string;
      expected: number;
      level: number;
    }> = [];

    for (const cls of compiledClassCatalog.classes) {
      for (const level of PROGRESSION_LEVELS) {
        const snapshot = buildSnapshotForClassRun(cls.id as CanonicalId, level);
        const budget = computePerLevelBudget(
          snapshot,
          level,
          classInput,
          featInput,
          raceInput,
        );
        const slots = determineFeatSlots(
          {
            abilityScores: {},
            activeClassIdAtLevel: cls.id as CanonicalId,
            bab: 0,
            characterLevel: level,
            classLevels: { [cls.id]: level },
            fortitudeSave: 0,
            raceId: null,
            selectedFeatIds: new Set(),
            skillRanks: {},
          },
          compiledFeatCatalog.classFeatLists,
          cls,
        );
        const expected = slots.classBonusFeatSlot ? 1 : 0;

        if (budget.featSlots.classBonus !== expected) {
          mismatches.push({
            actual: budget.featSlots.classBonus,
            classId: cls.id,
            expected,
            level,
          });
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('level completion selector uses compiled schedules for every class through L20', () => {
    const foundation = emptyFoundation();
    const feats = emptyFeats();
    const skills = emptySkills();
    const mismatches: Array<{
      actual: number;
      classId: string;
      expected: number;
      level: number;
      schedule: readonly number[] | null | undefined;
    }> = [];

    for (const cls of compiledClassCatalog.classes) {
      for (const level of PROGRESSION_LEVELS) {
        const snapshot = buildSnapshotForClassRun(cls.id as CanonicalId, level);
        const expectedBudget = computePerLevelBudget(
          snapshot,
          level,
          classInput,
          featInput,
          raceInput,
        );
        const completion = selectLevelCompletionState(
          progressionForClassRun(cls.id as CanonicalId, level),
          foundation,
          feats,
          skills,
          level,
        );

        if (completion.featSlots.total !== expectedBudget.featSlots.total) {
          mismatches.push({
            actual: completion.featSlots.total,
            classId: cls.id,
            expected: expectedBudget.featSlots.total,
            level,
            schedule: cls.bonusFeatSchedule,
          });
        }
      }
    }

    expect(mismatches).toEqual([]);
  });
});
