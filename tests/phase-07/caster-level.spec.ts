import { describe, expect, it } from 'vitest';
import {
  computeCasterLevelByClass,
  getMaxSpellLevelAcrossClasses,
} from '@rules-engine/magic/caster-level';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { compiledSpellCatalog } from '@planner/data/compiled-spells';

describe('phase 07 computeCasterLevelByClass', () => {
  it('returns per-class entry for a single-class wizard at level 5', () => {
    const result = computeCasterLevelByClass(
      { 'class:wizard': 5 },
      compiledClassCatalog,
    );

    expect(result).toEqual({ 'class:wizard': 5 });
  });

  it('keeps multiclass cleric 5 / wizard 5 as independent entries (no pooling)', () => {
    const result = computeCasterLevelByClass(
      { 'class:cleric': 5, 'class:wizard': 5 },
      compiledClassCatalog,
    );

    expect(result).toEqual({ 'class:cleric': 5, 'class:wizard': 5 });
    expect(Object.values(result).reduce((a, b) => a + b, 0)).toBe(10);
    expect(Object.keys(result)).toHaveLength(2);
  });

  it('returns empty object when only non-caster fighter levels present', () => {
    const result = computeCasterLevelByClass(
      { 'class:fighter': 5 },
      compiledClassCatalog,
    );

    expect(result).toEqual({});
  });

  it('tracks paladin class level verbatim for both 3 and 6', () => {
    const atThree = computeCasterLevelByClass(
      { 'class:paladin': 3 },
      compiledClassCatalog,
    );
    const atSix = computeCasterLevelByClass(
      { 'class:paladin': 6 },
      compiledClassCatalog,
    );

    expect(atThree).toEqual({ 'class:paladin': 3 });
    expect(atSix).toEqual({ 'class:paladin': 6 });
  });

  it('getMaxSpellLevelAcrossClasses returns 5 for wizard level 9 (full-caster curve)', () => {
    // NWN1 wizard spell-gain table grants level-5 slots at caster level 9.
    const casterLevelByClass = { 'class:wizard': 9 };
    const maxSpellLevel = getMaxSpellLevelAcrossClasses(
      casterLevelByClass,
      compiledSpellCatalog,
    );

    expect(maxSpellLevel).toBe(5);
  });

  it('getMaxSpellLevelAcrossClasses returns 0 for empty casterLevelByClass', () => {
    const maxSpellLevel = getMaxSpellLevelAcrossClasses(
      {},
      compiledSpellCatalog,
    );

    expect(maxSpellLevel).toBe(0);
  });
});
