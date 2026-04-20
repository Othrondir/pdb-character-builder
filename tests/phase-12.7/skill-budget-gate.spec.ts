import { describe, expect, it } from 'vitest';

import {
  canIncrementSkill,
  nextIncrementCost,
  type SkillBudgetSnapshot,
} from '@rules-engine/skills/skill-budget';

/**
 * Phase 12.7-02 — skill over-allocation gate (UAT F4 R2 RED spec).
 *
 * Locks two new pure helpers that feed the SkillRankRow `+` button:
 *   - nextIncrementCost(skillId, level, snapshot) → number | null
 *   - canIncrementSkill(skillId, level, snapshot) → boolean
 *
 * Mirrors Phase 12.3-01 `canIncrementAttribute` + `nextIncrementCost` pattern
 * in `packages/rules-engine/src/foundation/ability-budget.ts`. Framework-
 * agnostic: no React, no zustand, no @data-extractor imports (12.4-03
 * invariant; acceptance grep returns 0 for these imports).
 *
 * Regression lock: Humano + Clérigo L1 has a 4-pt budget. After the user
 * spends all 4 ranks on class-cost skills (1 pt / rank), EVERY remaining
 * `+` button MUST stay disabled — user must never be able to drive
 * `Puntos restantes` negative from the UI (UAT DOM evidence: 5/4 spent,
 * "Puntos restantes: -1" only reachable when the gate is absent).
 */
describe('Phase 12.7-02 — skill over-allocation gate (UAT F4 R2)', () => {
  // Minimal inline fixtures — mirrors 12.3-01 style where each assertion
  // constructs the smallest snapshot the predicate needs.
  const freshSnapshot: SkillBudgetSnapshot = {
    pointsAvailable: 4,
    pointsSpent: 0,
    skills: {
      'skill:hide': { costPerRank: 1, currentRank: 0, maxAssignableRank: 4 },
      'skill:appraise': { costPerRank: 2, currentRank: 0, maxAssignableRank: 4 },
      'skill:capped': { costPerRank: 1, currentRank: 4, maxAssignableRank: 4 },
    },
  };

  describe('nextIncrementCost — pure helper', () => {
    it('returns 1 for class skill (costPerRank=1) when under cap', () => {
      expect(nextIncrementCost('skill:hide', 1, freshSnapshot)).toBe(1);
    });

    it('returns 2 for cross-class skill (costPerRank=2) when under cap', () => {
      expect(nextIncrementCost('skill:appraise', 1, freshSnapshot)).toBe(2);
    });

    it('returns null when currentRank >= maxAssignableRank (per-rank cap)', () => {
      expect(nextIncrementCost('skill:capped', 1, freshSnapshot)).toBeNull();
    });

    it('returns null when skillId missing from snapshot.skills (defensive fail-closed)', () => {
      expect(nextIncrementCost('skill:does-not-exist', 1, freshSnapshot)).toBeNull();
    });
  });

  describe('canIncrementSkill — overspend + cap gate', () => {
    const atCapSnapshot: SkillBudgetSnapshot = {
      pointsAvailable: 4,
      pointsSpent: 4,
      skills: {
        'skill:hide': { costPerRank: 1, currentRank: 0, maxAssignableRank: 4 },
        'skill:appraise': { costPerRank: 2, currentRank: 0, maxAssignableRank: 4 },
      },
    };

    it('blocks when pointsSpent + nextCost > pointsAvailable (4/4 spent, class skill — F4 lock)', () => {
      expect(canIncrementSkill('skill:hide', 1, atCapSnapshot)).toBe(false);
    });

    it('blocks when pointsSpent + nextCost > pointsAvailable (4/4 spent, cross-class skill)', () => {
      expect(canIncrementSkill('skill:appraise', 1, atCapSnapshot)).toBe(false);
    });

    it('allows when pointsSpent + nextCost == pointsAvailable (exactly-enough permitted)', () => {
      const exactSnapshot: SkillBudgetSnapshot = {
        pointsAvailable: 4,
        pointsSpent: 3,
        skills: {
          'skill:hide': { costPerRank: 1, currentRank: 0, maxAssignableRank: 4 },
        },
      };
      expect(canIncrementSkill('skill:hide', 1, exactSnapshot)).toBe(true);
    });

    it('blocks when pointsSpent + nextCost > pointsAvailable (3/4 spent + cross-class cost=2 would push to 5)', () => {
      const nearCapSnapshot: SkillBudgetSnapshot = {
        pointsAvailable: 4,
        pointsSpent: 3,
        skills: {
          'skill:appraise': { costPerRank: 2, currentRank: 0, maxAssignableRank: 4 },
        },
      };
      expect(canIncrementSkill('skill:appraise', 1, nearCapSnapshot)).toBe(false);
    });

    it('blocks at maxAssignableRank regardless of remaining points (per-rank cap preserved)', () => {
      const cappedSnapshot: SkillBudgetSnapshot = {
        pointsAvailable: 10,
        pointsSpent: 0,
        skills: {
          'skill:hide': { costPerRank: 1, currentRank: 4, maxAssignableRank: 4 },
        },
      };
      expect(canIncrementSkill('skill:hide', 1, cappedSnapshot)).toBe(false);
    });

    it('blocks when skillId missing from snapshot.skills (defensive fail-closed)', () => {
      expect(canIncrementSkill('skill:does-not-exist', 1, atCapSnapshot)).toBe(false);
    });
  });

  describe('UAT F4 repro — Humano + Clérigo L1 at 4/4 spent', () => {
    // Humano + Clérigo L1 budget = (class-base 2 + INT mod 0 + Humano +1) × 4 = 12
    // The simpler UAT repro is Clérigo L1 no-humano = (2 + 0) × 4 = 8; Humano doubles
    // that impact. For the gate test we use a synthetic 4-pt budget with 4 spent —
    // the algebra is identical (gate fires when spent + cost > available).
    const humanoClerigoAtCap: SkillBudgetSnapshot = {
      pointsAvailable: 4,
      pointsSpent: 4,
      skills: {
        // Cleric class skills (1 pt / rank) — from compiled-skills.ts
        'skill:concentracion': { costPerRank: 1, currentRank: 4, maxAssignableRank: 4 },
        'skill:sanar': { costPerRank: 1, currentRank: 0, maxAssignableRank: 4 },
        'skill:saber-religion': { costPerRank: 1, currentRank: 0, maxAssignableRank: 4 },
        'skill:crear-pocion': { costPerRank: 1, currentRank: 0, maxAssignableRank: 4 },
        // Cross-class representative (2 pts / rank)
        'skill:esconderse': { costPerRank: 2, currentRank: 0, maxAssignableRank: 2 },
      },
    };

    it('after 4/4 spent, canIncrementSkill returns false for every skill in the snapshot', () => {
      for (const skillId of Object.keys(humanoClerigoAtCap.skills)) {
        expect(canIncrementSkill(skillId, 1, humanoClerigoAtCap)).toBe(false);
      }
    });

    it('at 3/4 spent, canIncrementSkill returns true for class skills (cost=1 exactly fits)', () => {
      const nearCap: SkillBudgetSnapshot = {
        pointsAvailable: 4,
        pointsSpent: 3,
        skills: {
          'skill:sanar': { costPerRank: 1, currentRank: 0, maxAssignableRank: 4 },
          'skill:esconderse': { costPerRank: 2, currentRank: 0, maxAssignableRank: 2 },
        },
      };
      expect(canIncrementSkill('skill:sanar', 1, nearCap)).toBe(true);
    });

    it('at 3/4 spent, canIncrementSkill returns false for cross-class skills (cost=2 would push to 5)', () => {
      const nearCap: SkillBudgetSnapshot = {
        pointsAvailable: 4,
        pointsSpent: 3,
        skills: {
          'skill:esconderse': { costPerRank: 2, currentRank: 0, maxAssignableRank: 2 },
        },
      };
      expect(canIncrementSkill('skill:esconderse', 1, nearCap)).toBe(false);
    });
  });
});
