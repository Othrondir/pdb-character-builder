import { describe, expect, it } from 'vitest';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import {
  revalidateFeatSnapshotAfterChange,
  type FeatLevelInput,
} from '@rules-engine/feats/feat-revalidation';
import type { BuildStateAtLevel } from '@rules-engine/feats/feat-prerequisite';

function createBuildState(
  overrides: Partial<BuildStateAtLevel> = {},
): BuildStateAtLevel {
  return {
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    bab: 0,
    characterLevel: 1,
    classLevels: {},
    fortitudeSave: 0,
    selectedFeatIds: new Set(),
    skillRanks: {},
    raceId: null,
    activeClassIdAtLevel: null,
    ...overrides,
  };
}

function createLevel(
  level: number,
  overrides: Partial<FeatLevelInput> = {},
): FeatLevelInput {
  return {
    buildState: createBuildState({ characterLevel: level }),
    classFeatIds: [],
    generalFeatIds: [],
    level,
    ...overrides,
  };
}

describe('phase 06 feat revalidation', () => {
  it('marks feat as illegal when ability scores break prerequisites', () => {
    // feat:ataquepoderoso requires minStr=13
    const revalidated = revalidateFeatSnapshotAfterChange({
      levels: [
        createLevel(1, {
          buildState: createBuildState({
            abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            characterLevel: 1,
            classLevels: { 'class:fighter': 1 },
          }),
          generalFeatIds: ['feat:ataquepoderoso'],
        }),
      ],
      featCatalog: compiledFeatCatalog,
      classCatalog: compiledClassCatalog,
    });

    expect(revalidated[0]).toMatchObject({
      level: 1,
      status: 'illegal',
      inheritedFromLevel: null,
    });
    expect(revalidated[0]?.issues.length).toBeGreaterThan(0);
  });

  it('marks feat as legal when prerequisites are met', () => {
    const revalidated = revalidateFeatSnapshotAfterChange({
      levels: [
        createLevel(1, {
          buildState: createBuildState({
            abilityScores: { str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            characterLevel: 1,
            classLevels: { 'class:fighter': 1 },
          }),
          generalFeatIds: ['feat:ataquepoderoso'],
        }),
      ],
      featCatalog: compiledFeatCatalog,
      classCatalog: compiledClassCatalog,
    });

    expect(revalidated[0]).toMatchObject({
      level: 1,
      status: 'legal',
    });
  });

  it('cascades inherited break from illegal level to later levels', () => {
    const revalidated = revalidateFeatSnapshotAfterChange({
      levels: [
        // Level 1: legal feat
        createLevel(1, {
          buildState: createBuildState({
            abilityScores: { str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            characterLevel: 1,
            classLevels: { 'class:fighter': 1 },
          }),
          generalFeatIds: ['feat:alertness'],
        }),
        // Level 3: illegal feat (ability score too low for ataquepoderoso)
        createLevel(3, {
          buildState: createBuildState({
            abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            characterLevel: 3,
            classLevels: { 'class:fighter': 3 },
          }),
          generalFeatIds: ['feat:ataquepoderoso'],
        }),
        // Level 5: a feat with no real prerequisites that should become blocked
        // by the inherited break from level 3
        createLevel(5, {
          buildState: createBuildState({
            abilityScores: { str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            characterLevel: 5,
            classLevels: { 'class:fighter': 5 },
            selectedFeatIds: new Set(['feat:alertness', 'feat:ataquepoderoso']),
          }),
          generalFeatIds: ['feat:ironwill'],
        }),
      ],
      featCatalog: compiledFeatCatalog,
      classCatalog: compiledClassCatalog,
    });

    expect(revalidated[0]).toMatchObject({
      level: 1,
      status: 'legal',
    });
    expect(revalidated[1]).toMatchObject({
      level: 3,
      status: 'illegal',
      inheritedFromLevel: null,
    });
    expect(revalidated[2]).toMatchObject({
      level: 5,
      status: 'blocked',
      inheritedFromLevel: 3,
    });
  });

  it('returns pending status for levels with no class and no selections', () => {
    const revalidated = revalidateFeatSnapshotAfterChange({
      levels: [
        createLevel(1),
        createLevel(2),
      ],
      featCatalog: compiledFeatCatalog,
      classCatalog: compiledClassCatalog,
    });

    expect(revalidated[0]).toMatchObject({
      level: 1,
      status: 'pending',
    });
    expect(revalidated[1]).toMatchObject({
      level: 2,
      status: 'pending',
    });
  });

  it('returns legal for levels with class but no feat selections', () => {
    const revalidated = revalidateFeatSnapshotAfterChange({
      levels: [
        createLevel(1, {
          buildState: createBuildState({
            characterLevel: 1,
            classLevels: { 'class:fighter': 1 },
          }),
        }),
      ],
      featCatalog: compiledFeatCatalog,
      classCatalog: compiledClassCatalog,
    });

    expect(revalidated[0]).toMatchObject({
      level: 1,
      status: 'pending',
    });
  });

  it('marks Arma de aliento as illegal when manually selected', () => {
    const revalidated = revalidateFeatSnapshotAfterChange({
      levels: [
        createLevel(1, {
          buildState: createBuildState({
            characterLevel: 1,
            classLevels: { 'class:fighter': 1 },
          }),
          generalFeatIds: ['feat:feat-dragon-dis-breath'],
        }),
      ],
      featCatalog: compiledFeatCatalog,
      classCatalog: compiledClassCatalog,
    });

    expect(revalidated[0]).toMatchObject({
      level: 1,
      status: 'illegal',
      inheritedFromLevel: null,
    });
  });
});
