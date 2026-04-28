import { describe, expect, it } from 'vitest';
import {
  deriveAbilityBudgetRules,
  NWN1_POINT_BUY_COST_TABLE,
} from '@rules-engine/foundation/ability-budget';

/**
 * Phase 17 (ATTR-02) — V-02 helper composition gate.
 *
 * Pure unit tests for the new rules-engine helper. Framework-agnostic per
 * Phase 16 S7: the helper accepts plain object inputs (not CompiledRace),
 * so these tests construct synthetic literals — legitimate test scaffolding,
 * NOT production data fabrication (RESEARCH Pitfall 4).
 */
describe('Phase 17 — deriveAbilityBudgetRules (helper composition)', () => {
  it('returns null when abilitiesPointBuyNumber is null', () => {
    expect(deriveAbilityBudgetRules({ abilitiesPointBuyNumber: null })).toBeNull();
  });

  it('returns null when abilitiesPointBuyNumber is undefined', () => {
    expect(deriveAbilityBudgetRules({ abilitiesPointBuyNumber: undefined })).toBeNull();
  });

  it('composes correctly when abilitiesPointBuyNumber is populated (default cost table)', () => {
    const result = deriveAbilityBudgetRules({ abilitiesPointBuyNumber: 30 });
    expect(result).toEqual({
      budget: 30,
      minimum: 8,
      maximum: 18,
      costByScore: NWN1_POINT_BUY_COST_TABLE.costByScore,
    });
  });

  it('composes with caller-supplied synthetic cost table (test-only scaffold)', () => {
    const synthetic = {
      minimum: 6,
      maximum: 20,
      costByScore: { '6': 0, '20': 100 },
    } as const;
    const result = deriveAbilityBudgetRules(
      { abilitiesPointBuyNumber: 50 },
      synthetic,
    );
    expect(result).toEqual({
      budget: 50,
      minimum: 6,
      maximum: 20,
      costByScore: synthetic.costByScore,
    });
  });

  it('preserves Phase 12.6 D-05 fail-closed contract: budget=0 → returns rules with budget=0 (NOT null)', () => {
    // 0 is a valid budget per Phase 17 D-02; only null/undefined trigger fail-closed.
    const result = deriveAbilityBudgetRules({ abilitiesPointBuyNumber: 0 });
    expect(result).not.toBeNull();
    expect(result!.budget).toBe(0);
  });
});

describe('Phase 17 — NWN1_POINT_BUY_COST_TABLE shape lock', () => {
  it('exports the canonical NWN1 cost step (8:0..18:16)', () => {
    expect(NWN1_POINT_BUY_COST_TABLE).toEqual({
      minimum: 8,
      maximum: 18,
      costByScore: {
        '8': 0, '9': 1, '10': 2, '11': 3, '12': 4, '13': 5,
        '14': 6, '15': 8, '16': 10, '17': 13, '18': 16,
      },
    });
  });

  it('costByScore total 8→18 sums to 16 (canonical NWN1 budget)', () => {
    const c = NWN1_POINT_BUY_COST_TABLE.costByScore;
    expect(c['18'] - c['8']).toBe(16);
  });
});
