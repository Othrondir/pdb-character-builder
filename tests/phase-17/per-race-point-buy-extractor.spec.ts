import { describe, expect, it } from 'vitest';
import { compiledRaceCatalog } from '@planner/data/compiled-races';
import { compiledRaceSchema } from '@data-extractor/contracts/race-catalog';

/**
 * Phase 17 (ATTR-02) — V-01 / V-08 / V-12 extractor surface gate.
 *
 * Locks: (a) every race in compiledRaceCatalog has abilitiesPointBuyNumber
 * populated (non-undefined); (b) the schema rejects malformed values and
 * accepts null + undefined per CONTEXT D-01 (additive optional nullable);
 * (c) Wave 1 RED gate before Wave 2 selector rewire lands.
 *
 * Per D-03 reframe (Q2 resolution): assert structural shape ONLY.
 * Do NOT lock uniform-30 here — variance is surfaced by the spec, not hidden.
 */
describe('Phase 17 — extractor surfaces abilitiesPointBuyNumber on CompiledRace', () => {
  it('every race in compiledRaceCatalog ships abilitiesPointBuyNumber (non-undefined)', () => {
    for (const race of compiledRaceCatalog.races) {
      expect(race.abilitiesPointBuyNumber).not.toBeUndefined();
    }
  });

  it('every race ships either null OR a non-negative integer (Phase 17 schema contract)', () => {
    for (const race of compiledRaceCatalog.races) {
      const v = race.abilitiesPointBuyNumber;
      expect(
        v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 0),
      ).toBe(true);
    }
  });

  it('compiledRaceSchema rejects malformed abilitiesPointBuyNumber (string)', () => {
    expect(() =>
      compiledRaceSchema.parse({
        abilityAdjustments: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        abilitiesPointBuyNumber: 'not-a-number',
        description: '',
        favoredClass: null,
        id: 'race:test',
        label: 'Test',
        size: 'medium',
        sourceRow: 0,
      }),
    ).toThrow();
  });

  it('compiledRaceSchema rejects negative abilitiesPointBuyNumber (.nonnegative() bound)', () => {
    expect(() =>
      compiledRaceSchema.parse({
        abilityAdjustments: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        abilitiesPointBuyNumber: -1,
        description: '',
        favoredClass: null,
        id: 'race:test',
        label: 'Test',
        size: 'medium',
        sourceRow: 0,
      }),
    ).toThrow();
  });

  it('compiledRaceSchema accepts null abilitiesPointBuyNumber', () => {
    expect(() =>
      compiledRaceSchema.parse({
        abilityAdjustments: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        abilitiesPointBuyNumber: null,
        description: '',
        favoredClass: null,
        id: 'race:test',
        label: 'Test',
        size: 'medium',
        sourceRow: 0,
      }),
    ).not.toThrow();
  });

  it('compiledRaceSchema accepts zero abilitiesPointBuyNumber (.nonnegative() includes 0)', () => {
    expect(() =>
      compiledRaceSchema.parse({
        abilityAdjustments: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        abilitiesPointBuyNumber: 0,
        description: '',
        favoredClass: null,
        id: 'race:test',
        label: 'Test',
        size: 'medium',
        sourceRow: 0,
      }),
    ).not.toThrow();
  });

  it('compiledRaceSchema accepts omitted abilitiesPointBuyNumber (.optional())', () => {
    expect(() =>
      compiledRaceSchema.parse({
        abilityAdjustments: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        description: '',
        favoredClass: null,
        id: 'race:test',
        label: 'Test',
        size: 'medium',
        sourceRow: 0,
      }),
    ).not.toThrow();
  });
});
