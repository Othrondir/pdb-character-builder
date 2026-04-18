import { describe, expect, it } from 'vitest';
import {
  evaluateFeatPrerequisites,
  type BuildStateAtLevel,
} from '@rules-engine/feats/feat-prerequisite';
import type {
  CompiledFeat,
  FeatCatalog,
} from '@data-extractor/contracts/feat-catalog';
import type { ClassCatalog } from '@data-extractor/contracts/class-catalog';

/**
 * Phase 12 IN-07 regression — class-prereq labels must render Spanish class
 * names resolved from ClassCatalog.classes, not raw `class:*` canonical IDs
 * (which was the pre-fix leak caused by feat-prerequisite.ts looking the class
 * ID up inside featCatalog.feats).
 */

function createBuildState(
  overrides: Partial<BuildStateAtLevel> = {},
): BuildStateAtLevel {
  return {
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    bab: 0,
    characterLevel: 1,
    classLevels: {},
    fortitudeSave: 0,
    selectedFeatIds: new Set<string>(),
    skillRanks: {},
    ...overrides,
  };
}

/** Inline minimal feat with a `minLevelClass: 'class:rogue'` requirement. */
const rogueGatedFeat: CompiledFeat = {
  allClassesCanUse: false,
  category: '0',
  description: 'Test-only feat that requires Nivel 3 de Pícaro.',
  id: 'feat:test-rogue-gated',
  label: 'Filo furtivo de prueba',
  prerequisites: {
    minLevelClass: 'class:rogue',
    minLevel: 3,
  },
  sourceRow: 999,
};

/** Inline minimal FeatCatalog carrying only the gated feat. */
const featCatalogFixture: FeatCatalog = {
  classFeatLists: {},
  datasetId: 'puerta-ee-2026-04-18+test0',
  feats: [rogueGatedFeat],
  schemaVersion: '1',
};

/** Inline minimal ClassCatalog carrying `class:rogue` with Spanish label 'Pícaro'. */
const classCatalogFixture: ClassCatalog = {
  classes: [
    {
      attackBonusProgression: 'medium',
      description: 'Test rogue class for prereq-label regression.',
      featTableRef: null,
      hitDie: 6,
      id: 'class:rogue',
      isBase: true,
      label: 'Pícaro',
      prerequisiteColumns: {},
      primaryAbility: 'dex',
      savingThrows: { fortitude: 'low', reflex: 'high', will: 'low' },
      skillPointsPerLevel: 8,
      skillTableRef: null,
      sourceRow: 0,
      spellCaster: false,
      spellGainTableRef: null,
      spellKnownTableRef: null,
    },
  ],
  datasetId: 'puerta-ee-2026-04-18+test0',
  schemaVersion: '1',
};

describe('phase 12 IN-07 — class-prereq label regression', () => {
  it('resolves class-level prereq label via ClassCatalog (not featCatalog)', () => {
    const buildState = createBuildState({ classLevels: { 'class:rogue': 3 } });

    const result = evaluateFeatPrerequisites(
      rogueGatedFeat,
      buildState,
      featCatalogFixture,
      classCatalogFixture,
    );

    const classLevelCheck = result.checks.find(
      (c) => c.type === 'class-level',
    );

    expect(classLevelCheck).toBeDefined();
    // Must be the Spanish label from ClassCatalog, not the raw canonical ID.
    expect(classLevelCheck?.label).toBe('Nivel de Pícaro');
    expect(classLevelCheck?.label).not.toContain('class:');
  });

  it('falls back to raw class id when class is missing from catalog', () => {
    const emptyClassCatalog: ClassCatalog = {
      ...classCatalogFixture,
      classes: [
        {
          ...classCatalogFixture.classes[0]!,
          id: 'class:other',
          label: 'Otro',
        },
      ],
    };
    const buildState = createBuildState({ classLevels: { 'class:rogue': 0 } });

    const result = evaluateFeatPrerequisites(
      rogueGatedFeat,
      buildState,
      featCatalogFixture,
      emptyClassCatalog,
    );

    const classLevelCheck = result.checks.find(
      (c) => c.type === 'class-level',
    );

    // Fallback preserves the raw id — no crash, but surfaces the missing-data
    // case for the user rather than rendering 'undefined'.
    expect(classLevelCheck?.label).toBe('Nivel de class:rogue');
  });
});
