import { describe, expect, it } from 'vitest';

import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { classCatalogSchema } from '@data-extractor/contracts/class-catalog';

describe('Phase 16-01 — extractor surfaces bonusFeatSchedule on CompiledClass (FEAT-05, D-01, PIT-03)', () => {
  it('class:fighter ships a non-null schedule containing canonical Guerrero cadence', () => {
    const fighter = compiledClassCatalog.classes.find((c) => c.id === 'class:fighter');
    expect(fighter).toBeDefined();
    expect(fighter!.bonusFeatSchedule).not.toBeNull();
    expect(fighter!.bonusFeatSchedule).not.toBeUndefined();
    expect(fighter!.bonusFeatSchedule).toEqual(
      expect.arrayContaining([1, 2, 4, 6, 8, 10, 12, 14, 16]),
    );
  });

  it('at least one class in the catalog has bonusFeatSchedule === null (BonusFeatsTable=****)', () => {
    const someClassWithNullSchedule = compiledClassCatalog.classes.some(
      (c) => c.bonusFeatSchedule === null,
    );
    expect(someClassWithNullSchedule).toBe(true);
  });

  it('every non-null bonusFeatSchedule is sorted ascending and entries fall in [1, 20] (PIT-02 row-0 guard)', () => {
    for (const cls of compiledClassCatalog.classes) {
      if (cls.bonusFeatSchedule === null || cls.bonusFeatSchedule === undefined) continue;
      for (const lvl of cls.bonusFeatSchedule) {
        expect(lvl).toBeGreaterThanOrEqual(1);
        expect(lvl).toBeLessThanOrEqual(20);
      }
      const sorted = [...cls.bonusFeatSchedule].sort((a, b) => a - b);
      expect(cls.bonusFeatSchedule).toEqual(sorted);
    }
  });

  it('classCatalogSchema.schemaVersion stays at "1" (D-NO schema-version bump)', () => {
    expect(classCatalogSchema.shape.schemaVersion.value).toBe('1');
  });
});
