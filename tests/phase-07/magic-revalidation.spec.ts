import { describe, expect, it } from 'vitest';
import type { BuildStateAtLevel } from '@rules-engine/feats/feat-prerequisite';
import {
  revalidateMagicSnapshotAfterChange,
  type MagicLevelInput,
} from '@rules-engine/magic/magic-revalidation';
import { compiledSpellCatalog } from '@planner/data/compiled-spells';
import { compiledDomainCatalog } from '@planner/data/compiled-domains';

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

function emptyMagicLevelInput(level: number): MagicLevelInput {
  return {
    buildState: createMagicBuildState({ characterLevel: level }),
    level,
    domainsSelected: [],
    spellbookAdditions: {},
    knownSpells: {},
    swapsApplied: [],
  };
}

describe('phase 07 revalidateMagicSnapshotAfterChange', () => {
  it('returns pending status for 16 empty levels with no selections', () => {
    const levels = Array.from({ length: 16 }, (_, i) =>
      emptyMagicLevelInput(i + 1),
    );

    const result = revalidateMagicSnapshotAfterChange({
      levels,
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });

    expect(result).toHaveLength(16);
    for (const r of result) {
      expect(r.status).toBe('pending');
      expect(r.inheritedFromLevel).toBe(null);
    }
  });

  it('marks level 3 with illegal spell selection as illegal and level 5 as blocked inheriting from 3', () => {
    const levels: MagicLevelInput[] = [
      emptyMagicLevelInput(1),
      emptyMagicLevelInput(2),
      {
        // Level 3: a fighter (non-caster) tries to learn a wizard spell — illegal
        buildState: createMagicBuildState({
          characterLevel: 3,
          classLevels: { 'class:fighter': 3 },
          casterLevelByClass: {},
        }),
        level: 3,
        domainsSelected: [],
        // Pick any wizard spell id from the catalog
        spellbookAdditions: (() => {
          const wizardSpell = compiledSpellCatalog.spells.find(
            (s) => s.classLevels['class:wizard'] === 1,
          );
          if (!wizardSpell) throw new Error('no wizard level-1 spell found');
          return { 1: [wizardSpell.id] };
        })(),
        knownSpells: {},
        swapsApplied: [],
      },
      emptyMagicLevelInput(4),
      {
        // Level 5: another wizard spell attempt, should be BLOCKED (inherited)
        buildState: createMagicBuildState({
          characterLevel: 5,
          classLevels: { 'class:fighter': 5 },
          casterLevelByClass: {},
        }),
        level: 5,
        domainsSelected: [],
        spellbookAdditions: (() => {
          const wizardSpell = compiledSpellCatalog.spells.find(
            (s) => s.classLevels['class:wizard'] === 1,
          );
          if (!wizardSpell) throw new Error('no wizard level-1 spell found');
          return { 1: [wizardSpell.id] };
        })(),
        knownSpells: {},
        swapsApplied: [],
      },
    ];

    const result = revalidateMagicSnapshotAfterChange({
      levels,
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });

    const level3 = result.find((r) => r.level === 3);
    expect(level3?.status).toBe('illegal');
    expect(level3?.inheritedFromLevel).toBe(null);

    const level5 = result.find((r) => r.level === 5);
    expect(level5?.status).toBe('blocked');
    expect(level5?.inheritedFromLevel).toBe(3);
  });

  it('emits non-empty issues array on illegal levels with illegal or blocked status entries', () => {
    const wizardSpell = compiledSpellCatalog.spells.find(
      (s) => s.classLevels['class:wizard'] === 1,
    );
    if (!wizardSpell) throw new Error('no wizard level-1 spell found');

    const levels: MagicLevelInput[] = [
      {
        buildState: createMagicBuildState({
          classLevels: { 'class:fighter': 1 },
          casterLevelByClass: {},
        }),
        level: 1,
        domainsSelected: [],
        spellbookAdditions: { 1: [wizardSpell.id] },
        knownSpells: {},
        swapsApplied: [],
      },
    ];

    const result = revalidateMagicSnapshotAfterChange({
      levels,
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });

    expect(result[0].issues.length).toBeGreaterThan(0);
    for (const issue of result[0].issues) {
      expect(issue.status === 'illegal' || issue.status === 'blocked').toBe(true);
    }
  });

  it('dedupes duplicate (status, code, affectedIds) issue triples', () => {
    // Force duplicate by selecting the same illegal wizard spell in two
    // spell-level slots at the same character level.
    const wizardSpell = compiledSpellCatalog.spells.find(
      (s) => s.classLevels['class:wizard'] === 1,
    );
    if (!wizardSpell) throw new Error('no wizard level-1 spell found');

    const levels: MagicLevelInput[] = [
      {
        buildState: createMagicBuildState({
          classLevels: { 'class:fighter': 1 },
          casterLevelByClass: {},
        }),
        level: 1,
        domainsSelected: [],
        spellbookAdditions: { 1: [wizardSpell.id, wizardSpell.id] },
        knownSpells: {},
        swapsApplied: [],
      },
    ];

    const result = revalidateMagicSnapshotAfterChange({
      levels,
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });

    const keys = result[0].issues.map((issue) =>
      JSON.stringify([
        issue.status,
        issue.code,
        [...issue.affectedIds].sort(),
        'blockKind' in issue ? issue.blockKind : null,
      ]),
    );
    const uniqueKeys = new Set(keys);
    expect(keys).toHaveLength(uniqueKeys.size);
  });
});
