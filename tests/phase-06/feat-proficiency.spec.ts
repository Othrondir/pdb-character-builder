import { describe, expect, it } from 'vitest';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import {
  evaluateFeatPrerequisites,
  type BuildStateAtLevel,
} from '@rules-engine/feats/feat-prerequisite';
import { determineFeatSlots } from '@rules-engine/feats/feat-eligibility';

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

describe('phase 06 proficiency feats (FEAT-03)', () => {
  // Proficiency feats in the Puerta catalog are identified by their ID pattern
  // "feat:competencia*". They are under category "general" in the compiled data,
  // not under separate proficiency categories.

  it('has proficiency feats in the compiled catalog matching "competencia" pattern', () => {
    const proficiencyFeats = compiledFeatCatalog.feats.filter((f) =>
      f.id.includes('competencia'),
    );

    // 57 proficiency feats extracted from the Puerta server data
    expect(proficiencyFeats.length).toBeGreaterThanOrEqual(50);
  });

  it('includes armor proficiency feats (competenciaarmadura*)', () => {
    const armorProfs = compiledFeatCatalog.feats.filter((f) =>
      f.id.startsWith('feat:competenciaarmadura'),
    );

    // Light, medium, heavy armor proficiencies
    expect(armorProfs.length).toBeGreaterThanOrEqual(3);

    const ids = armorProfs.map((f) => f.id);

    expect(ids).toContain('feat:competenciaarmaduraligera');
    expect(ids).toContain('feat:competenciaarmaduraintermedia');
  });

  it('includes shield proficiency feats (competenciaconescudo)', () => {
    const shieldProf = compiledFeatCatalog.feats.find(
      (f) => f.id === 'feat:competenciaconescudo',
    );

    expect(shieldProf).toBeDefined();
    expect(shieldProf?.label).toContain('escudo');
  });

  it('includes weapon proficiency feats (competenciaarma*)', () => {
    const weaponProfs = compiledFeatCatalog.feats.filter(
      (f) =>
        f.id.startsWith('feat:competenciaarma') &&
        !f.id.startsWith('feat:competenciaarmadura'),
    );

    // Simple weapons, martial weapons, exotic weapons
    expect(weaponProfs.length).toBeGreaterThanOrEqual(5);
  });

  it('proficiency feats pass through evaluateFeatPrerequisites like any other feat', () => {
    const lightArmor = compiledFeatCatalog.feats.find(
      (f) => f.id === 'feat:competenciaarmaduraligera',
    );

    expect(lightArmor).toBeDefined();

    if (lightArmor) {
      const result = evaluateFeatPrerequisites(
        lightArmor,
        createBuildState(),
        compiledFeatCatalog,
        compiledClassCatalog,
      );

      // Light armor has no prerequisites (empty prerequisites object)
      expect(result.met).toBe(true);
    }
  });

  it('auto-granted proficiency feats appear via determineFeatSlots for barbarian', () => {
    // Barbarian auto-grants proficiency feats at class level 1 (list=3)
    const slots = determineFeatSlots(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:barbarian': 1 },
        activeClassIdAtLevel: 'class:barbarian',
      }),
      compiledFeatCatalog.classFeatLists,
    );

    // Barbarian should auto-grant some proficiency feats
    const proficiencyAutoGrants = slots.autoGrantedFeatIds.filter((id) =>
      id.includes('competencia'),
    );

    expect(proficiencyAutoGrants.length).toBeGreaterThan(0);
  });

  it('auto-granted proficiency feats for fighter include weapon and armor competencies', () => {
    const slots = determineFeatSlots(
      createBuildState({
        characterLevel: 1,
        classLevels: { 'class:fighter': 1 },
        activeClassIdAtLevel: 'class:fighter',
      }),
      compiledFeatCatalog.classFeatLists,
    );

    // Fighter should auto-grant armor and weapon proficiencies at class level 1
    const proficiencyAutoGrants = slots.autoGrantedFeatIds.filter((id) =>
      id.includes('competencia'),
    );

    // Fighters get simple + martial weapons, all armors, shields
    expect(proficiencyAutoGrants.length).toBeGreaterThan(0);
  });
});
