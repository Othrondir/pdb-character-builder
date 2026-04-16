import { describe, expect, it } from 'vitest';
import { getEligibleSpellsAtLevel } from '@rules-engine/magic/spell-eligibility';
import { compiledSpellCatalog } from '@planner/data/compiled-spells';

describe('phase 07 getEligibleSpellsAtLevel', () => {
  it('returns only wizard-level-3 spells when wizard is at class level 5 asking for spell level 3', () => {
    const result = getEligibleSpellsAtLevel({
      classId: 'class:wizard',
      casterLevel: 5,
      spellLevel: 3,
      catalog: compiledSpellCatalog,
      alreadyKnown: new Set(),
    });

    expect(result.eligible.length).toBeGreaterThan(0);
    for (const spell of result.eligible) {
      expect(spell.classLevels['class:wizard']).toBe(3);
    }
    // No level-4 wizard spell leaks through
    for (const spell of result.eligible) {
      expect(spell.classLevels['class:wizard']).not.toBe(4);
    }
  });

  it('returns at least one cleric cantrip at cleric class level 1 spell level 0', () => {
    const result = getEligibleSpellsAtLevel({
      classId: 'class:cleric',
      casterLevel: 1,
      spellLevel: 0,
      catalog: compiledSpellCatalog,
      alreadyKnown: new Set(),
    });

    expect(result.eligible.length).toBeGreaterThan(0);
    for (const spell of result.eligible) {
      expect(spell.classLevels['class:cleric']).toBe(0);
    }
  });

  it('moves an alreadyKnown spell into ineligible with Spanish reason "Ya conocido"', () => {
    const wizardAll = getEligibleSpellsAtLevel({
      classId: 'class:wizard',
      casterLevel: 3,
      spellLevel: 1,
      catalog: compiledSpellCatalog,
      alreadyKnown: new Set(),
    });
    expect(wizardAll.eligible.length).toBeGreaterThan(0);

    const knownId = wizardAll.eligible[0].id;
    const withExclusion = getEligibleSpellsAtLevel({
      classId: 'class:wizard',
      casterLevel: 3,
      spellLevel: 1,
      catalog: compiledSpellCatalog,
      alreadyKnown: new Set([knownId]),
    });

    expect(withExclusion.eligible.some((s) => s.id === knownId)).toBe(false);
    const excluded = withExclusion.ineligible.find((e) => e.spell.id === knownId);
    expect(excluded).toBeDefined();
    expect(excluded?.reason).toBe('Ya conocido');
  });

  it('returns sorcerer-level-1 spells without wizard-only level-1 spells at sorcerer 1', () => {
    const result = getEligibleSpellsAtLevel({
      classId: 'class:sorcerer',
      casterLevel: 1,
      spellLevel: 1,
      catalog: compiledSpellCatalog,
      alreadyKnown: new Set(),
    });

    expect(result.eligible.length).toBeGreaterThan(0);
    for (const spell of result.eligible) {
      expect(spell.classLevels['class:sorcerer']).toBe(1);
    }
  });

  it('catalog contains Puerta custom content (Spanish-slug IDs) covered by MAGI-04', () => {
    // Puerta custom spells are identifiable by Spanish-language canonical slugs
    // (e.g., spell:agarreelectrizante) rather than English-origin slugs with dashes.
    // The catalog MUST surface these inside at least one eligible spell query.
    const puertaLikeIds = compiledSpellCatalog.spells.filter((s) =>
      /^spell:[a-z]+$/.test(s.id) && s.id.length > 14,
    );

    expect(puertaLikeIds.length).toBeGreaterThan(0);

    // At least one Puerta-like spell is eligible for some class/level combination.
    const sample = puertaLikeIds[0];
    const classEntries = Object.entries(sample.classLevels);
    expect(classEntries.length).toBeGreaterThan(0);

    const [classId, spellLevel] = classEntries[0];
    const result = getEligibleSpellsAtLevel({
      classId,
      casterLevel: 20,
      spellLevel,
      catalog: compiledSpellCatalog,
      alreadyKnown: new Set(),
    });

    expect(result.eligible.some((s) => s.id === sample.id)).toBe(true);
  });
});
