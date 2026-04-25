import { describe, expect, it } from 'vitest';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import {
  determineFeatSlots,
  getEligibleFeats,
} from '@rules-engine/feats/feat-eligibility';
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
    ...overrides,
  };
}

describe('phase 06 feat slot determination', () => {
  it('grants a general feat slot at character level 1', () => {
    const slots = determineFeatSlots(
      1,
      'class:fighter',
      1,
      compiledFeatCatalog.classFeatLists,
    );

    expect(slots.generalFeatSlot).toBe(true);
  });

  it('does not grant a general feat slot at character level 2', () => {
    const slots = determineFeatSlots(
      2,
      'class:fighter',
      2,
      compiledFeatCatalog.classFeatLists,
    );

    expect(slots.generalFeatSlot).toBe(false);
  });

  it('grants a general feat slot at character level 3', () => {
    const slots = determineFeatSlots(
      3,
      'class:fighter',
      3,
      compiledFeatCatalog.classFeatLists,
    );

    expect(slots.generalFeatSlot).toBe(true);
  });

  it('grants general feat slots at levels 6, 9, 12, 15', () => {
    for (const level of [6, 9, 12, 15]) {
      const slots = determineFeatSlots(
        level,
        'class:fighter',
        level,
        compiledFeatCatalog.classFeatLists,
      );

      expect(slots.generalFeatSlot).toBe(true);
    }
  });

  it('detects auto-granted feats for barbarian at class level 1 (list=3)', () => {
    const slots = determineFeatSlots(
      1,
      'class:barbarian',
      1,
      compiledFeatCatalog.classFeatLists,
    );

    // Barbarian auto-grants several feats at class level 1 (list=3, grantedOnLevel=1)
    expect(slots.autoGrantedFeatIds.length).toBeGreaterThan(0);
    // Some known barbarian auto-grants: derribo, desarme, embestida, etc.
    expect(slots.autoGrantedFeatIds).toContain('feat:derribo');
  });

  it('returns no auto-granted feats for a null classId', () => {
    const slots = determineFeatSlots(
      1,
      null,
      0,
      compiledFeatCatalog.classFeatLists,
    );

    expect(slots.autoGrantedFeatIds).toEqual([]);
    expect(slots.classBonusFeatSlot).toBe(false);
  });

  it('does not grant Brujo class bonus feat slots for invocation unlock levels', () => {
    for (const classLevel of [1, 6, 11, 16]) {
      const slots = determineFeatSlots(
        classLevel,
        'class:warlock',
        classLevel,
        compiledFeatCatalog.classFeatLists,
      );

      expect(slots.classBonusFeatSlot).toBe(false);
    }
  });

  it('does not grant Brujo class bonus feat slots between unlock levels either', () => {
    for (const classLevel of [2, 5, 10, 15]) {
      const slots = determineFeatSlots(
        classLevel,
        'class:warlock',
        classLevel,
        compiledFeatCatalog.classFeatLists,
      );

      expect(slots.classBonusFeatSlot).toBe(false);
    }
  });
});

describe('phase 06 feat eligibility filtering', () => {
  it('includes feats with no prerequisites in eligible list', () => {
    const result = getEligibleFeats(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:fighter': 1 },
      }),
      'class:fighter',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    // feat:alertness has no real prerequisites (just preReqEpic: false)
    const alertness = result.generalFeats.find((f) => f.id === 'feat:alertness');

    expect(alertness).toBeDefined();
  });

  it('excludes feats when prerequisites are not met', () => {
    // feat:cleave requires minStr=13 and requiredFeat1=feat:ataquepoderoso
    const result = getEligibleFeats(
      createBuildState({
        abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        characterLevel: 1,
        classLevels: { 'class:fighter': 1 },
      }),
      'class:fighter',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    const cleave = result.generalFeats.find((f) => f.id === 'feat:cleave');

    expect(cleave).toBeUndefined();
  });

  it('includes feat when all prerequisites are met', () => {
    const result = getEligibleFeats(
      createBuildState({
        abilityScores: { str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        characterLevel: 1,
        classLevels: { 'class:fighter': 1 },
        selectedFeatIds: new Set(['feat:ataquepoderoso']),
      }),
      'class:fighter',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    const cleave = result.generalFeats.find((f) => f.id === 'feat:cleave');

    expect(cleave).toBeDefined();
  });

  it('excludes already-selected feats from eligible list', () => {
    const result = getEligibleFeats(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:fighter': 1 },
        selectedFeatIds: new Set(['feat:alertness']),
      }),
      'class:fighter',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    const alertness = result.generalFeats.find((f) => f.id === 'feat:alertness');

    expect(alertness).toBeUndefined();
  });

  it('excludes epic feats from eligible list', () => {
    const result = getEligibleFeats(
      createBuildState({
        characterLevel: 16,
        classLevels: { 'class:fighter': 16 },
        bab: 16,
      }),
      'class:fighter',
      16,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    const hasEpic = result.generalFeats.some(
      (f) => f.prerequisites.preReqEpic === true,
    );

    expect(hasEpic).toBe(false);
  });

  it('includes class bonus feats for fighter in classBonusFeats', () => {
    const result = getEligibleFeats(
      createBuildState({
        abilityScores: { str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        characterLevel: 1,
        classLevels: { 'class:fighter': 1 },
      }),
      'class:fighter',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    // Fighter has list=1 class bonus feats. ataquepoderoso requires only str 13.
    const powerAttack = result.classBonusFeats.find(
      (f) => f.id === 'feat:ataquepoderoso',
    );

    expect(powerAttack).toBeDefined();
  });

  it('excludes Arma de aliento from manual selectable pools', () => {
    const result = getEligibleFeats(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:fighter': 1 },
      }),
      'class:fighter',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    expect(
      result.generalFeats.some((f) => f.id === 'feat:feat-dragon-dis-breath'),
    ).toBe(false);
    expect(
      result.classBonusFeats.some((f) => f.id === 'feat:feat-dragon-dis-breath'),
    ).toBe(false);
  });

  it('excludes auto-granted fighter proficiencies from level-1 selectable pools', () => {
    const result = getEligibleFeats(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:fighter': 1 },
      }),
      'class:fighter',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    expect(
      result.generalFeats.some((f) => f.id === 'feat:competenciaarmaduraligera'),
    ).toBe(false);
    expect(
      result.generalFeats.some((f) => f.id === 'feat:competenciaarmadurapesada'),
    ).toBe(false);
    expect(
      result.generalFeats.some((f) => f.id === 'feat:competenciaconescudopaves'),
    ).toBe(false);
  });

  it('excludes auto-granted warlock proficiencies from level-1 selectable pools', () => {
    const result = getEligibleFeats(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:warlock': 1 },
      }),
      'class:warlock',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    expect(
      result.generalFeats.some((f) => f.id === 'feat:competenciaarmaduraligera'),
    ).toBe(false);
  });

  it('includes Soltura Aptitud Sortilega in Brujo selectable pools', () => {
    const result = getEligibleFeats(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:warlock': 1 },
      }),
      'class:warlock',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    expect(
      result.generalFeats.some(
        (f) => f.id === 'feat:solturaaptitud-sortilega',
      ),
    ).toBe(true);
  });

  it('does not surface Brujo invocations in general selectable pools', () => {
    const result = getEligibleFeats(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:warlock': 1 },
      }),
      'class:warlock',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    expect(
      result.generalFeats.some((f) => f.id === 'feat:inv-lanzasobrenatural'),
    ).toBe(false);
  });

  it('unlocks Fabricar varita for Brujo once the level gate is met', () => {
    const resultL1 = getEligibleFeats(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:warlock': 1 },
      }),
      'class:warlock',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    expect(
      resultL1.generalFeats.some((f) => f.id === 'feat:feat-craft-wand'),
    ).toBe(false);

    const resultL6 = getEligibleFeats(
      createBuildState({
        characterLevel: 6,
        classLevels: { 'class:warlock': 6 },
      }),
      'class:warlock',
      6,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    expect(
      resultL6.generalFeats.some((f) => f.id === 'feat:feat-craft-wand'),
    ).toBe(true);
  });
});
