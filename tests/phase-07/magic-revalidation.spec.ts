import { describe, expect, it } from 'vitest';
import type { BuildStateAtLevel } from '@rules-engine/feats/feat-prerequisite';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
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
    classId: null,
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
        classId: null,
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
        classId: null,
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
        classId: null,
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
        classId: null,
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

  it('emits illegal outcome when a swap is applied outside SORCERER_SWAP_LEVELS', () => {
    const sorcererL1 = compiledSpellCatalog.spells.find(
      (s) => s.classLevels['class:sorcerer'] === 1,
    );
    const sorcererL1b = compiledSpellCatalog.spells.find(
      (s) =>
        s.classLevels['class:sorcerer'] === 1 && s.id !== sorcererL1?.id,
    );
    // If the sorcerer catalog is still empty (pre-07-05), fall back to wizard-level-1
    // spells — the revalidator reads classId directly and does not require the
    // swapped spells to be sorcerer-tagged.
    const forgotten =
      sorcererL1 ??
      compiledSpellCatalog.spells.find(
        (s) => s.classLevels['class:wizard'] === 1,
      );
    const learned =
      sorcererL1b ??
      compiledSpellCatalog.spells.find(
        (s) =>
          s.classLevels['class:wizard'] === 1 && s.id !== forgotten?.id,
      );
    expect(forgotten).toBeDefined();
    expect(learned).toBeDefined();

    const result = revalidateMagicSnapshotAfterChange({
      levels: [
        {
          buildState: createMagicBuildState({
            characterLevel: 3,
            classLevels: { 'class:sorcerer': 3 },
            casterLevelByClass: { 'class:sorcerer': 3 },
          }),
          classId: 'class:sorcerer' as CanonicalId,
          level: 3, // NOT in {4,8,12,16}
          domainsSelected: [],
          spellbookAdditions: {},
          knownSpells: {},
          swapsApplied: [
            {
              appliedAtLevel: 3,
              forgotten: forgotten!.id,
              learned: learned!.id,
            },
          ],
        },
      ],
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });

    expect(result[0].status).toBe('illegal');
    expect(result[0].issues.some((i) => i.status === 'illegal')).toBe(true);
  });

  it('accepts a swap at a legal SORCERER_SWAP_LEVEL (4) without emitting illegal swap issue', () => {
    const sorcererL1 = compiledSpellCatalog.spells.find(
      (s) => s.classLevels['class:sorcerer'] === 1,
    );
    const sorcererL1b = compiledSpellCatalog.spells.find(
      (s) =>
        s.classLevels['class:sorcerer'] === 1 && s.id !== sorcererL1?.id,
    );
    const forgotten =
      sorcererL1 ??
      compiledSpellCatalog.spells.find(
        (s) => s.classLevels['class:wizard'] === 1,
      );
    const learned =
      sorcererL1b ??
      compiledSpellCatalog.spells.find(
        (s) =>
          s.classLevels['class:wizard'] === 1 && s.id !== forgotten?.id,
      );
    expect(forgotten).toBeDefined();
    expect(learned).toBeDefined();

    const result = revalidateMagicSnapshotAfterChange({
      levels: [
        {
          buildState: createMagicBuildState({
            characterLevel: 4,
            classLevels: { 'class:sorcerer': 4 },
            casterLevelByClass: { 'class:sorcerer': 4 },
          }),
          classId: 'class:sorcerer' as CanonicalId,
          level: 4,
          domainsSelected: [],
          spellbookAdditions: {},
          knownSpells: {},
          swapsApplied: [
            {
              appliedAtLevel: 4,
              forgotten: forgotten!.id,
              learned: learned!.id,
            },
          ],
        },
      ],
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });

    // No illegal swap issue expected — level 4 is a legal sorcerer swap level.
    // The revalidator may still emit other issues (e.g., missing spell from catalog
    // fail-closed) but none of them should carry the swap ids as affectedIds.
    const swapRelated = result[0].issues.filter(
      (i) =>
        i.affectedIds.includes(forgotten!.id) &&
        i.affectedIds.includes(learned!.id),
    );
    expect(swapRelated.filter((i) => i.status === 'illegal')).toHaveLength(0);
  });
});
