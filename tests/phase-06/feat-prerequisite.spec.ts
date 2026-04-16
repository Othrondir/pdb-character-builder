import { describe, expect, it } from 'vitest';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import {
  evaluateFeatPrerequisites,
  type BuildStateAtLevel,
} from '@rules-engine/feats/feat-prerequisite';

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
    casterLevelByClass: {},
    ...overrides,
  };
}

function findFeat(id: string) {
  const feat = compiledFeatCatalog.feats.find((f) => f.id === id);

  if (!feat) {
    throw new Error(`Feat not found: ${id}`);
  }

  return feat;
}

describe('phase 06 feat prerequisite evaluator', () => {
  it('passes ability score check when score meets minimum', () => {
    // feat:ataquepoderoso requires minStr=13
    const feat = findFeat('feat:ataquepoderoso');
    const result = evaluateFeatPrerequisites(
      feat,
      createBuildState({ abilityScores: { str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } }),
      compiledFeatCatalog,
    );

    expect(result.met).toBe(true);

    const strCheck = result.checks.find((c) => c.label === 'Fuerza');

    expect(strCheck).toMatchObject({ met: true, required: '13', current: '13' });
  });

  it('fails ability score check when score is below minimum', () => {
    const feat = findFeat('feat:ataquepoderoso');
    const result = evaluateFeatPrerequisites(
      feat,
      createBuildState({ abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } }),
      compiledFeatCatalog,
    );

    expect(result.met).toBe(false);

    const strCheck = result.checks.find((c) => c.label === 'Fuerza');

    expect(strCheck).toMatchObject({ met: false, required: '13', current: '10' });
  });

  it('passes BAB check when BAB meets minimum', () => {
    // feat:greatcleave requires minBab=4
    const feat = findFeat('feat:greatcleave');
    const result = evaluateFeatPrerequisites(
      feat,
      createBuildState({
        abilityScores: { str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        bab: 4,
        selectedFeatIds: new Set(['feat:ataquepoderoso', 'feat:cleave']),
      }),
      compiledFeatCatalog,
    );

    const babCheck = result.checks.find((c) => c.type === 'bab');

    expect(babCheck).toMatchObject({ met: true, required: '+4', current: '+4' });
  });

  it('fails BAB check when BAB is below minimum', () => {
    const feat = findFeat('feat:greatcleave');
    const result = evaluateFeatPrerequisites(
      feat,
      createBuildState({
        abilityScores: { str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        bab: 3,
        selectedFeatIds: new Set(['feat:ataquepoderoso', 'feat:cleave']),
      }),
      compiledFeatCatalog,
    );

    const babCheck = result.checks.find((c) => c.type === 'bab');

    expect(babCheck).toMatchObject({ met: false, required: '+4', current: '+3' });
    expect(result.met).toBe(false);
  });

  it('passes required feat check when feat is selected', () => {
    // feat:cleave requires requiredFeat1=feat:ataquepoderoso
    const feat = findFeat('feat:cleave');
    const result = evaluateFeatPrerequisites(
      feat,
      createBuildState({
        abilityScores: { str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        selectedFeatIds: new Set(['feat:ataquepoderoso']),
      }),
      compiledFeatCatalog,
    );

    const featCheck = result.checks.find((c) => c.type === 'feat');

    expect(featCheck).toMatchObject({
      met: true,
      current: '(tomada)',
    });
    expect(result.met).toBe(true);
  });

  it('fails required feat check when feat is not selected', () => {
    const feat = findFeat('feat:cleave');
    const result = evaluateFeatPrerequisites(
      feat,
      createBuildState({
        abilityScores: { str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      }),
      compiledFeatCatalog,
    );

    const featCheck = result.checks.find((c) => c.type === 'feat');

    expect(featCheck).toMatchObject({
      met: false,
      current: '(no tomada)',
    });
    expect(result.met).toBe(false);
  });

  it('passes orReqFeats check when at least one feat is met', () => {
    // feat:impcritclub has orReqFeats with weapon proficiency options
    const feat = findFeat('feat:impcritclub');
    const result = evaluateFeatPrerequisites(
      feat,
      createBuildState({
        bab: 8,
        selectedFeatIds: new Set(['feat:competenciaarmassimples']),
      }),
      compiledFeatCatalog,
    );

    const orCheck = result.checks.find((c) => c.type === 'or-feats');

    expect(orCheck).toMatchObject({
      met: true,
      current: '(cumplido)',
    });
  });

  it('fails orReqFeats check when none met', () => {
    const feat = findFeat('feat:impcritclub');
    const result = evaluateFeatPrerequisites(
      feat,
      createBuildState({
        bab: 8,
      }),
      compiledFeatCatalog,
    );

    const orCheck = result.checks.find((c) => c.type === 'or-feats');

    expect(orCheck).toMatchObject({
      met: false,
      current: '(ninguna tomada)',
    });
  });

  it('evaluates combined prerequisites: all met', () => {
    // feat:greatcleave requires minStr=13, minBab=4, requiredFeat1=feat:ataquepoderoso, requiredFeat2=feat:cleave
    const feat = findFeat('feat:greatcleave');
    const result = evaluateFeatPrerequisites(
      feat,
      createBuildState({
        abilityScores: { str: 15, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        bab: 5,
        selectedFeatIds: new Set(['feat:ataquepoderoso', 'feat:cleave']),
      }),
      compiledFeatCatalog,
    );

    expect(result.met).toBe(true);
    expect(result.checks.every((c) => c.met)).toBe(true);
  });

  it('evaluates combined prerequisites: one fails', () => {
    const feat = findFeat('feat:greatcleave');
    const result = evaluateFeatPrerequisites(
      feat,
      createBuildState({
        abilityScores: { str: 15, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        bab: 5,
        selectedFeatIds: new Set(['feat:ataquepoderoso']),
        // Missing feat:cleave
      }),
      compiledFeatCatalog,
    );

    expect(result.met).toBe(false);

    const failedChecks = result.checks.filter((c) => !c.met);

    expect(failedChecks.length).toBe(1);
    expect(failedChecks[0]?.type).toBe('feat');
  });

  it('returns empty checks for a feat with no prerequisites', () => {
    const feat = findFeat('feat:alertness');
    const result = evaluateFeatPrerequisites(
      feat,
      createBuildState(),
      compiledFeatCatalog,
    );

    // Only preReqEpic: false -> no check generated (epic=false is not a requirement)
    expect(result.met).toBe(true);
    expect(result.checks.length).toBe(0);
  });

  it('marks epic feats as unmet at level 1-16', () => {
    // Find any feat with preReqEpic=true
    const epicFeat = compiledFeatCatalog.feats.find(
      (f) => f.prerequisites.preReqEpic === true,
    );

    expect(epicFeat).toBeDefined();

    if (epicFeat) {
      const result = evaluateFeatPrerequisites(
        epicFeat,
        createBuildState({ characterLevel: 16 }),
        compiledFeatCatalog,
      );

      const epicCheck = result.checks.find((c) => c.type === 'epic');

      expect(epicCheck).toMatchObject({ met: false, required: 'Nivel 21+' });
      expect(result.met).toBe(false);
    }
  });

  it('evaluates max level check correctly', () => {
    // feat:strongsoul has maxLevel=1
    const feat = findFeat('feat:strongsoul');
    const resultL1 = evaluateFeatPrerequisites(
      feat,
      createBuildState({ characterLevel: 1 }),
      compiledFeatCatalog,
    );

    const maxCheckL1 = resultL1.checks.find((c) => c.type === 'max-level');

    expect(maxCheckL1).toMatchObject({ met: true, required: '<= 1' });

    const resultL2 = evaluateFeatPrerequisites(
      feat,
      createBuildState({ characterLevel: 2 }),
      compiledFeatCatalog,
    );

    const maxCheckL2 = resultL2.checks.find((c) => c.type === 'max-level');

    expect(maxCheckL2).toMatchObject({ met: false, required: '<= 1' });
  });

  it('evaluates dexterity prerequisite', () => {
    // feat:dodge requires minDex=13
    const feat = findFeat('feat:dodge');
    const resultPass = evaluateFeatPrerequisites(
      feat,
      createBuildState({
        abilityScores: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
      }),
      compiledFeatCatalog,
    );

    expect(resultPass.met).toBe(true);

    const resultFail = evaluateFeatPrerequisites(
      feat,
      createBuildState({
        abilityScores: { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 10 },
      }),
      compiledFeatCatalog,
    );

    expect(resultFail.met).toBe(false);
  });
});
