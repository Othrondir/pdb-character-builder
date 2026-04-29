import { describe, expect, it } from 'vitest';

import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import {
  revalidateFeatSnapshotAfterChange,
  type FeatLevelInput,
} from '@rules-engine/feats/feat-revalidation';
import type { BuildStateAtLevel } from '@rules-engine/feats/feat-prerequisite';

function buildState(
  overrides: Partial<BuildStateAtLevel> = {},
): BuildStateAtLevel {
  return {
    abilityScores: { str: 16, dex: 14, con: 12, int: 12, wis: 8, cha: 14 },
    bab: 8,
    characterLevel: 1,
    classLevels: {},
    fortitudeSave: 4,
    selectedFeatIds: new Set(),
    skillRanks: {},
    raceId: null,
    activeClassIdAtLevel: null,
    ...overrides,
  };
}

function level(
  levelNumber: number,
  overrides: Partial<FeatLevelInput> = {},
): FeatLevelInput {
  return {
    buildState: buildState({ characterLevel: levelNumber }),
    classFeatIds: [],
    generalFeatIds: [],
    level: levelNumber,
    ...overrides,
  };
}

describe('Phase 16 — feat slot revalidation', () => {
  it('Brujo 12 -> Barbaro 1 keeps the N12 general feat legal and rejects a manual N13 class feat', () => {
    const revalidated = revalidateFeatSnapshotAfterChange({
      classCatalog: compiledClassCatalog,
      featCatalog: compiledFeatCatalog,
      levels: [
        level(12, {
          buildState: buildState({
            activeClassIdAtLevel: 'class:warlock',
            characterLevel: 12,
            classLevels: { 'class:warlock': 12 },
            skillRanks: { 'skill:montar': 1 },
          }),
          generalFeatIds: ['feat:feat-mounted-combat'],
        }),
        level(13, {
          buildState: buildState({
            activeClassIdAtLevel: 'class:barbarian',
            characterLevel: 13,
            classLevels: { 'class:warlock': 12, 'class:barbarian': 1 },
            selectedFeatIds: new Set(['feat:feat-mounted-combat']),
            skillRanks: { 'skill:montar': 9 },
          }),
          classFeatIds: ['feat:ataquepoderoso'],
        }),
      ],
    });

    expect(revalidated[0]).toMatchObject({ level: 12, status: 'legal' });
    expect(revalidated[1]).toMatchObject({
      inheritedFromLevel: null,
      level: 13,
      status: 'illegal',
    });
  });

  it('does not flag Humano L1 class + general + race-bonus picks as over slot budget', () => {
    const revalidated = revalidateFeatSnapshotAfterChange({
      classCatalog: compiledClassCatalog,
      featCatalog: compiledFeatCatalog,
      levels: [
        level(1, {
          buildState: buildState({
            activeClassIdAtLevel: 'class:fighter',
            characterLevel: 1,
            classLevels: { 'class:fighter': 1 },
            raceId: 'race:human',
          }),
          classFeatIds: ['feat:carrera'],
          generalFeatIds: ['feat:alertness', 'feat:ironwill'],
        }),
      ],
    });

    expect(revalidated[0]).toMatchObject({ level: 1, status: 'legal' });
  });
});
