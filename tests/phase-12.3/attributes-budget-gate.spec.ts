import { describe, expect, it } from 'vitest';

import {
  calculateAbilityBudgetSnapshot,
  canIncrementAttribute,
  nextIncrementCost,
} from '@rules-engine/foundation/ability-budget';
import { phase03FoundationFixture } from '@planner/features/character-foundation/foundation-fixture';

/**
 * Phase 12.3-01 — attributes overspend gate (UAT B1 RED spec).
 *
 * Locks two new pure helpers that feed the AttributesBoard `+` button:
 *   - nextIncrementCost(current, costByScore, maximum)
 *   - canIncrementAttribute(current, remainingPoints, costByScore, maximum)
 *
 * Regression lock: after driving the 30-pt point-buy budget to 0 remaining
 * (FUE/DES/CON 14, INT/SAB/CAR 12), the `+` button MUST stay disabled for
 * every attribute — user must never be able to drive `Puntos restantes`
 * negative from the UI.
 */
describe('Phase 12.3-01 — attributes overspend gate (UAT B1)', () => {
  const { attributeRules } = phase03FoundationFixture;
  const { costByScore, maximum } = attributeRules;

  describe('nextIncrementCost — pure helper', () => {
    it('returns 1 for 8 -> 9', () => {
      expect(nextIncrementCost(8, costByScore, maximum)).toBe(1);
    });

    it('returns 1 for 13 -> 14', () => {
      expect(nextIncrementCost(13, costByScore, maximum)).toBe(1);
    });

    it('returns 2 for 14 -> 15 (UAT trigger boundary)', () => {
      expect(nextIncrementCost(14, costByScore, maximum)).toBe(2);
    });

    it('returns 2 for 15 -> 16', () => {
      expect(nextIncrementCost(15, costByScore, maximum)).toBe(2);
    });

    it('returns 3 for 16 -> 17', () => {
      expect(nextIncrementCost(16, costByScore, maximum)).toBe(3);
    });

    it('returns 3 for 17 -> 18', () => {
      expect(nextIncrementCost(17, costByScore, maximum)).toBe(3);
    });

    it('returns null at maximum (18)', () => {
      expect(nextIncrementCost(18, costByScore, maximum)).toBeNull();
    });

    it('returns null outside cost table range (defensive)', () => {
      expect(nextIncrementCost(7, costByScore, maximum)).toBeNull();
    });
  });

  describe('canIncrementAttribute — overspend + ceiling gate', () => {
    it('blocks when next cost exceeds remaining (14 @ 0 pts remaining — B1 lock)', () => {
      expect(canIncrementAttribute(14, 0, costByScore, maximum)).toBe(false);
    });

    it('allows when remaining exactly covers next cost', () => {
      expect(canIncrementAttribute(14, 2, costByScore, maximum)).toBe(true);
    });

    it('blocks when remaining is 1 short', () => {
      expect(canIncrementAttribute(14, 1, costByScore, maximum)).toBe(false);
    });

    it('blocks at maximum regardless of remaining', () => {
      expect(canIncrementAttribute(18, 100, costByScore, maximum)).toBe(false);
    });

    it('allows 8 -> 9 with exactly 1 pt remaining', () => {
      expect(canIncrementAttribute(8, 1, costByScore, maximum)).toBe(true);
    });

    it('blocks 8 -> 9 with 0 pts remaining', () => {
      expect(canIncrementAttribute(8, 0, costByScore, maximum)).toBe(false);
    });
  });

  describe('UAT B1 repro — composed snapshot + gate', () => {
    const overspentBase = {
      cha: 12,
      con: 14,
      dex: 14,
      int: 12,
      str: 14,
      wis: 12,
    };

    it('snapshot reports remaining 0 for the 30-pt-spent build', () => {
      const snapshot = calculateAbilityBudgetSnapshot({
        attributeRules,
        baseAttributes: overspentBase,
        originReady: true,
      });
      expect(snapshot.remainingPoints).toBe(0);
    });

    it('FUE 14 @ 0 remaining — canIncrementAttribute returns false (the B1 click that produced -2)', () => {
      expect(canIncrementAttribute(overspentBase.str, 0, costByScore, maximum)).toBe(false);
    });

    it('INT 12 @ 0 remaining — canIncrementAttribute returns false (12->13 costs 1)', () => {
      expect(canIncrementAttribute(overspentBase.int, 0, costByScore, maximum)).toBe(false);
    });

    it('sanity — 12 @ 1 remaining returns true (exactly-enough is allowed)', () => {
      expect(canIncrementAttribute(12, 1, costByScore, maximum)).toBe(true);
    });
  });
});
