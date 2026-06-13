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
    raceId: null,
    activeClassIdAtLevel: null,
    ...overrides,
  };
}

describe('phase 06 feat slot determination', () => {
  it('grants a general feat slot at character level 1', () => {
    const slots = determineFeatSlots(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:fighter': 1 },
        activeClassIdAtLevel: 'class:fighter',
      }),
      compiledFeatCatalog.classFeatLists,
    );

    expect(slots.generalFeatSlot).toBe(true);
  });

  it('does not grant a general feat slot at character level 2', () => {
    const slots = determineFeatSlots(
      createBuildState({
        characterLevel: 2,
        classLevels: { 'class:fighter': 2 },
        activeClassIdAtLevel: 'class:fighter',
      }),
      compiledFeatCatalog.classFeatLists,
    );

    expect(slots.generalFeatSlot).toBe(false);
  });

  it('grants a general feat slot at character level 3', () => {
    const slots = determineFeatSlots(
      createBuildState({
        characterLevel: 3,
        classLevels: { 'class:fighter': 3 },
        activeClassIdAtLevel: 'class:fighter',
      }),
      compiledFeatCatalog.classFeatLists,
    );

    expect(slots.generalFeatSlot).toBe(true);
  });

  it('grants general feat slots at levels 6, 9, 12, 15', () => {
    for (const level of [6, 9, 12, 15]) {
      const slots = determineFeatSlots(
        createBuildState({
          characterLevel: level,
          classLevels: { 'class:fighter': level },
          activeClassIdAtLevel: 'class:fighter',
        }),
        compiledFeatCatalog.classFeatLists,
      );

      expect(slots.generalFeatSlot).toBe(true);
    }
  });

  it('detects auto-granted feats for barbarian at class level 1 (list=3)', () => {
    const slots = determineFeatSlots(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:barbarian': 1 },
        activeClassIdAtLevel: 'class:barbarian',
      }),
      compiledFeatCatalog.classFeatLists,
    );

    // Barbarian auto-grants several feats at class level 1 (list=3, grantedOnLevel=1)
    expect(slots.autoGrantedFeatIds.length).toBeGreaterThan(0);
    // Some known barbarian auto-grants: derribo, desarme, embestida, etc.
    expect(slots.autoGrantedFeatIds).toContain('feat:derribo');
  });

  it('returns no auto-granted feats for a null classId', () => {
    const slots = determineFeatSlots(
      createBuildState({
        characterLevel: 1,
        classLevels: {},
        activeClassIdAtLevel: null,
      }),
      compiledFeatCatalog.classFeatLists,
    );

    expect(slots.autoGrantedFeatIds).toEqual([]);
    expect(slots.classBonusFeatSlot).toBe(false);
  });

  it('does not grant Brujo class bonus feat slots for invocation unlock levels', () => {
    for (const classLevel of [1, 6, 11, 16]) {
      const slots = determineFeatSlots(
        createBuildState({
          characterLevel: classLevel,
          classLevels: { 'class:warlock': classLevel },
          activeClassIdAtLevel: 'class:warlock',
        }),
        compiledFeatCatalog.classFeatLists,
      );

      expect(slots.classBonusFeatSlot).toBe(false);
    }
  });

  it('does not grant Brujo class bonus feat slots between unlock levels either', () => {
    for (const classLevel of [2, 5, 10, 15]) {
      const slots = determineFeatSlots(
        createBuildState({
          characterLevel: classLevel,
          classLevels: { 'class:warlock': classLevel },
          activeClassIdAtLevel: 'class:warlock',
        }),
        compiledFeatCatalog.classFeatLists,
      );

      expect(slots.classBonusFeatSlot).toBe(false);
    }
  });

  it('treats list=2 OnMenu=false rows as manual class choices, not auto-grants', () => {
    const slots = determineFeatSlots(
      createBuildState({
        characterLevel: 8,
        classLevels: { 'class:weaponmaster': 1 },
        activeClassIdAtLevel: 'class:weaponmaster',
      }),
      compiledFeatCatalog.classFeatLists,
    );

    expect(slots.classBonusFeatSlot).toBe(true);
    expect(slots.autoGrantedFeatIds).not.toContain(
      'feat:feat-weapon-of-choice-longsword',
    );
  });

  it('grants MDA its weapon choice at class level 1 but no empty class slot at class level 2', () => {
    const weaponMaster = compiledClassCatalog.classes.find(
      (c) => c.id === 'class:weaponmaster',
    )!;
    const level1 = determineFeatSlots(
      createBuildState({
        characterLevel: 7,
        classLevels: { 'class:weaponmaster': 1 },
        activeClassIdAtLevel: 'class:weaponmaster',
      }),
      compiledFeatCatalog.classFeatLists,
      weaponMaster,
    );
    const level2 = determineFeatSlots(
      createBuildState({
        characterLevel: 8,
        classLevels: { 'class:weaponmaster': 2 },
        activeClassIdAtLevel: 'class:weaponmaster',
      }),
      compiledFeatCatalog.classFeatLists,
      weaponMaster,
    );

    expect(level1.classBonusFeatSlot).toBe(true);
    expect(level1.autoGrantedFeatIds).toContain('feat:feat-ki-damage');
    expect(level2.classBonusFeatSlot).toBe(false);
  });

  it('does not invent pre-epic class bonus feat slots for Espadachín', () => {
    const swashbuckler = compiledClassCatalog.classes.find(
      (c) => c.id === 'class:swashbuckler',
    )!;

    for (let classLevel = 1; classLevel <= 16; classLevel++) {
      const slots = determineFeatSlots(
        createBuildState({
          characterLevel: classLevel,
          classLevels: { 'class:swashbuckler': classLevel },
          activeClassIdAtLevel: 'class:swashbuckler',
        }),
        compiledFeatCatalog.classFeatLists,
        swashbuckler,
      );

      expect(slots.classBonusFeatSlot, `Espadachín ${classLevel}`).toBe(false);
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

  it('includes Combate con dos armas in level-1 general feats despite passive list=0/list=1 source rows', () => {
    for (const classId of ['class:barbarian', 'class:warlock'] as const) {
      const result = getEligibleFeats(
        createBuildState({
          characterLevel: 1,
          classLevels: { [classId]: 1 },
          activeClassIdAtLevel: classId,
        }),
        classId,
        1,
        compiledFeatCatalog,
        compiledClassCatalog,
      );

      expect(
        result.generalFeats.some((f) => f.id === 'feat:twoweap'),
        classId,
      ).toBe(true);
    }
  });

  it('includes bard-specific song feats as Bardo general feat choices', () => {
    const result = getEligibleFeats(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:bard': 1 },
        activeClassIdAtLevel: 'class:bard',
      }),
      'class:bard',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );
    const generalFeatIds = new Set(result.generalFeats.map((f) => f.id));

    expect(generalFeatIds.has('feat:extramusic')).toBe(true);
    expect(generalFeatIds.has('feat:lingeringsong')).toBe(true);
    expect(generalFeatIds.has('feat:feat-curse-song')).toBe(true);
  });

  it('gates custom Bardo song feats by Bardo level and Interpretar ranks', () => {
    const locked = getEligibleFeats(
      createBuildState({
        characterLevel: 10,
        classLevels: { 'class:bard': 10 },
        activeClassIdAtLevel: 'class:bard',
      }),
      'class:bard',
      10,
      compiledFeatCatalog,
      compiledClassCatalog,
    );
    const unlocked = getEligibleFeats(
      createBuildState({
        characterLevel: 10,
        classLevels: { 'class:bard': 10 },
        activeClassIdAtLevel: 'class:bard',
        skillRanks: { 'skill:interpretar': 13 },
      }),
      'class:bard',
      10,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    expect(
      locked.generalFeats.some((f) => f.id === 'feat:bardo-cancionjebkiah'),
    ).toBe(false);
    expect(
      unlocked.generalFeats.some((f) => f.id === 'feat:bardo-cancionjebkiah'),
    ).toBe(true);
    expect(
      unlocked.generalFeats.some((f) => f.id === 'feat:bardo-cancionmilcantes'),
    ).toBe(true);
    expect(
      unlocked.generalFeats.some((f) => f.id === 'feat:bardo-cancionmirlac'),
    ).toBe(true);
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

  it('offers the matching MDA weapon choice when the corresponding weapon focus is owned', () => {
    const result = getEligibleFeats(
      createBuildState({
        bab: 6,
        characterLevel: 7,
        classLevels: { 'class:fighter': 6, 'class:weaponmaster': 1 },
        selectedFeatIds: new Set(['feat:weapfoclsw']),
        activeClassIdAtLevel: 'class:weaponmaster',
      }),
      'class:weaponmaster',
      1,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    expect(
      result.classBonusFeats.some(
        (feat) => feat.id === 'feat:feat-weapon-of-choice-longsword',
      ),
    ).toBe(true);
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

  it('includes fighter weapon specialization class feats even when source OnMenu is false', () => {
    const result = getEligibleFeats(
      createBuildState({
        abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        bab: 4,
        characterLevel: 4,
        classLevels: { 'class:fighter': 4 },
        selectedFeatIds: new Set(['feat:weapfoclsw']),
        activeClassIdAtLevel: 'class:fighter',
      }),
      'class:fighter',
      4,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    expect(
      result.classBonusFeats.some((f) => f.id === 'feat:weapspelsw'),
    ).toBe(true);
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

  it('includes basic spell focus variants in Sorcerer level-3 general feats', () => {
    const result = getEligibleFeats(
      createBuildState({
        abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 11 },
        characterLevel: 3,
        classLevels: { 'class:sorcerer': 3 },
        activeClassIdAtLevel: 'class:sorcerer',
      }),
      'class:sorcerer',
      3,
      compiledFeatCatalog,
      compiledClassCatalog,
    );

    expect(
      result.generalFeats.some((f) => f.id === 'feat:spellfocusabj'),
    ).toBe(true);
  });
});
