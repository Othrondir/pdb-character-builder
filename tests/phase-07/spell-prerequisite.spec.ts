import { describe, expect, it } from 'vitest';
import type { BuildStateAtLevel } from '@rules-engine/feats/feat-prerequisite';
import { evaluateSpellPrerequisites } from '@rules-engine/magic/spell-prerequisite';
import { compiledSpellCatalog } from '@planner/data/compiled-spells';

function createMagicBuildState(
  overrides: Partial<BuildStateAtLevel> = {},
): BuildStateAtLevel {
  return {
    abilityScores: { str: 10, dex: 10, con: 10, int: 14, wis: 10, cha: 10 },
    bab: 0,
    characterLevel: 1,
    classLevels: {},
    fortitudeSave: 0,
    selectedFeatIds: new Set<string>(),
    skillRanks: {},
    casterLevelByClass: {},
    ...overrides,
  };
}

function findSpellForClass(classId: string, spellLevel: number) {
  const spell = compiledSpellCatalog.spells.find(
    (s) => s.classLevels[classId] === spellLevel,
  );
  if (!spell) {
    throw new Error(`No spell found for ${classId} at level ${spellLevel}`);
  }
  return spell;
}

function findWizardOnlySpell(spellLevel: number) {
  const spell = compiledSpellCatalog.spells.find(
    (s) =>
      s.classLevels['class:wizard'] === spellLevel &&
      s.classLevels['class:cleric'] === undefined,
  );
  if (!spell) {
    throw new Error(`No wizard-only level-${spellLevel} spell found`);
  }
  return spell;
}

describe('phase 07 evaluateSpellPrerequisites', () => {
  it('returns met=false for a wizard spell evaluated against a cleric-only build', () => {
    const spell = findWizardOnlySpell(3);
    const buildState = createMagicBuildState({
      classLevels: { 'class:cleric': 5 },
      casterLevelByClass: { 'class:cleric': 5 },
    });

    const result = evaluateSpellPrerequisites(
      spell,
      buildState,
      compiledSpellCatalog,
    );

    expect(result.met).toBe(false);
    expect(result.checks.length).toBeGreaterThan(0);

    const classCheck = result.checks.find((c) => c.type === 'class-level');
    expect(classCheck).toBeDefined();
    expect(classCheck?.met).toBe(false);
  });

  it('returns met=true for a wizard-level-3 spell with wizard caster level 5', () => {
    const spell = findSpellForClass('class:wizard', 3);
    const buildState = createMagicBuildState({
      classLevels: { 'class:wizard': 5 },
      casterLevelByClass: { 'class:wizard': 5 },
    });

    const result = evaluateSpellPrerequisites(
      spell,
      buildState,
      compiledSpellCatalog,
    );

    expect(result.met).toBe(true);
  });

  it('surfaces Spanish class labels in checks (Mago/Clerigo/Hechicero)', () => {
    const spell = findSpellForClass('class:wizard', 2);
    const buildState = createMagicBuildState({
      classLevels: { 'class:wizard': 5 },
      casterLevelByClass: { 'class:wizard': 5 },
    });

    const result = evaluateSpellPrerequisites(
      spell,
      buildState,
      compiledSpellCatalog,
    );

    expect(result.checks.length).toBeGreaterThan(0);

    for (const check of result.checks) {
      expect(check.label).toBeTruthy();
      expect(check.required).toBeTruthy();
      expect(check.current).toBeTruthy();
      expect(typeof check.met).toBe('boolean');
    }

    // At least one check uses a Spanish class label
    const hasSpanishLabel = result.checks.some((c) =>
      /Mago|Cl[eé]rigo|Hechicero|Druida|Bardo|Palad[ií]n|Explorador/.test(c.label),
    );
    expect(hasSpanishLabel).toBe(true);
  });
});
