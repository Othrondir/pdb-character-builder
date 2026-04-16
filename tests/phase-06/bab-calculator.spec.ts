import { describe, expect, it } from 'vitest';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import {
  computeTotalBab,
  computeFortSave,
  computeRefSave,
  computeWillSave,
} from '@rules-engine/feats/bab-calculator';

describe('phase 06 BAB calculator', () => {
  it('computes BAB for a single Fighter 4 (high BAB = 4)', () => {
    const bab = computeTotalBab(
      { 'class:fighter': 4 },
      compiledClassCatalog,
    );

    expect(bab).toBe(4);
  });

  it('computes BAB for a single Wizard 4 (low BAB = 2)', () => {
    const bab = computeTotalBab(
      { 'class:wizard': 4 },
      compiledClassCatalog,
    );

    expect(bab).toBe(2);
  });

  it('computes multiclass BAB: Fighter 4 / Wizard 4 = 4 + 2 = 6 (Pitfall 3)', () => {
    const bab = computeTotalBab(
      { 'class:fighter': 4, 'class:wizard': 4 },
      compiledClassCatalog,
    );

    expect(bab).toBe(6);
  });

  it('computes multiclass BAB: Ranger 3 / Wizard 3 = 3 + 1 = 4 (Pitfall 3)', () => {
    const bab = computeTotalBab(
      { 'class:ranger': 3, 'class:wizard': 3 },
      compiledClassCatalog,
    );

    // Ranger is high BAB -> 3. Wizard is low BAB -> floor(3/2) = 1.
    expect(bab).toBe(4);
  });

  it('computes BAB with medium progression: Bard 4 = floor(4 * 3/4) = 3', () => {
    const bab = computeTotalBab(
      { 'class:bard': 4 },
      compiledClassCatalog,
    );

    expect(bab).toBe(3);
  });

  it('returns 0 for unknown class IDs', () => {
    const bab = computeTotalBab(
      { 'class:nonexistent': 10 },
      compiledClassCatalog,
    );

    expect(bab).toBe(0);
  });

  it('computes fortitude save for Fighter (high: 2 + floor(level/2))', () => {
    const fort = computeFortSave(
      { 'class:fighter': 4 },
      compiledClassCatalog,
    );

    // high fortitude: 2 + floor(4/2) = 4
    expect(fort).toBe(4);
  });

  it('computes fortitude save for Wizard (low: floor(level/3))', () => {
    const fort = computeFortSave(
      { 'class:wizard': 4 },
      compiledClassCatalog,
    );

    // low fortitude: floor(4/3) = 1
    expect(fort).toBe(1);
  });

  it('computes multiclass fortitude save', () => {
    const fort = computeFortSave(
      { 'class:fighter': 4, 'class:wizard': 3 },
      compiledClassCatalog,
    );

    // Fighter high: 2 + floor(4/2) = 4. Wizard low: floor(3/3) = 1. Total = 5.
    expect(fort).toBe(5);
  });

  it('computes reflex save correctly', () => {
    const ref = computeRefSave(
      { 'class:rogue': 4 },
      compiledClassCatalog,
    );

    // Rogue has high reflex: 2 + floor(4/2) = 4
    expect(ref).toBe(4);
  });

  it('computes will save correctly', () => {
    const will = computeWillSave(
      { 'class:wizard': 4 },
      compiledClassCatalog,
    );

    // Wizard has high will: 2 + floor(4/2) = 4
    expect(will).toBe(4);
  });
});
