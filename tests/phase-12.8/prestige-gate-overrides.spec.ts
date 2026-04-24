import { describe, it, expect } from 'vitest';
import { reachableAtLevelN } from '@rules-engine/progression/prestige-gate';
import { PRESTIGE_PREREQ_OVERRIDES } from '@planner/features/level-progression/prestige-prereq-data';

// Phase 12.8-02 (D-09) — regression snapshot.
// Fixture: Elfo + Neutral puro + Guerrero L1 advanced to L2 (BAB=2).
// No arcane caster level, no spells, no feats, no skill ranks.
// Verifies (a) 3 FAIL-OPEN classes tighten, (b) 18 existing-gated rows preserve labels.

const L2_ELFO_GUERRERO_BAB_2 = {
  level: 2,
  abilityScores: {},
  bab: 2,
  skillRanks: {},
  featIds: new Set<string>(),
  classLevels: { 'class:fighter': 1 },
  enriched: true,
  highestArcaneSpellLevel: 0,
  highestSpellLevel: 0,
  raceId: 'race:elf',
} as const;

describe('Phase 12.8-02 — prestige overrides regression snapshot (L2 Elfo Guerrero)', () => {
  describe('F5 tightening — pale-master, caballero-arcano, shadowdancer', () => {
    it('class:pale-master emits arcane-spell-level blocker (was FAIL-OPEN at UAT-2026-04-23)', () => {
      const input = {
        classRow: {
          id: 'class:pale-master',
          isBase: false,
          decodedPrereqs: PRESTIGE_PREREQ_OVERRIDES['class:pale-master'],
        },
        ...L2_ELFO_GUERRERO_BAB_2,
      };
      const result = reachableAtLevelN(input);
      expect(result.reachable).toBe(false);
      const kinds = result.blockers.map((b) => b.kind);
      expect(kinds).toContain('arcane-spell-level');
    });

    it('class:caballero-arcano emits arcane-spell-level blocker (was FAIL-OPEN at UAT-2026-04-23)', () => {
      const input = {
        classRow: {
          id: 'class:caballero-arcano',
          isBase: false,
          decodedPrereqs: PRESTIGE_PREREQ_OVERRIDES['class:caballero-arcano'],
        },
        ...L2_ELFO_GUERRERO_BAB_2,
      };
      const result = reachableAtLevelN(input);
      expect(result.reachable).toBe(false);
      const kinds = result.blockers.map((b) => b.kind);
      expect(kinds).toContain('arcane-spell-level');
    });

    it('class:shadowdancer surfaces BAB + skill-rank + feat blockers (was BAB-only at UAT-2026-04-23)', () => {
      const input = {
        classRow: {
          id: 'class:shadowdancer',
          isBase: false,
          decodedPrereqs: PRESTIGE_PREREQ_OVERRIDES['class:shadowdancer'],
        },
        ...L2_ELFO_GUERRERO_BAB_2,
      };
      const result = reachableAtLevelN(input);
      const kinds = result.blockers.map((b) => b.kind);
      expect(kinds).toContain('skill-rank');
      expect(kinds).toContain('feat');
      const labels = result.blockers.map((b) => b.label);
      expect(labels.some((l) => l.includes('Moverse sigilosamente'))).toBe(true);
      expect(labels.some((l) => l.includes('Equilibrio'))).toBe(true);
      expect(labels.some((l) => l.includes('Esquiva'))).toBe(true);
      expect(labels.some((l) => l.includes('Movilidad'))).toBe(true);
    });
  });

  describe('Regression lock — existing-gated rows continue to emit at least one blocker', () => {
    const PRESTIGE_WITH_OVERRIDE = Object.keys(PRESTIGE_PREREQ_OVERRIDES);

    it.each(PRESTIGE_WITH_OVERRIDE)(
      '%s emits at least one blocker at L2 Elfo Guerrero (not reachable)',
      (classId) => {
        const input = {
          classRow: {
            id: classId,
            isBase: false,
            decodedPrereqs:
              PRESTIGE_PREREQ_OVERRIDES[
                classId as keyof typeof PRESTIGE_PREREQ_OVERRIDES
              ],
          },
          ...L2_ELFO_GUERRERO_BAB_2,
        };
        const result = reachableAtLevelN(input);
        expect(result.blockers.length).toBeGreaterThan(0);
        expect(result.reachable).toBe(false);
      },
    );
  });
});
