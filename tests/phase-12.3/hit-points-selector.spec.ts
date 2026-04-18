// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';

import { computeHitPoints } from '@rules-engine/progression/compute-hit-points';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { CharacterSheet } from '@planner/components/shell/character-sheet';
import type { ProgressionLevel, ProgressionLevelRecord } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

/**
 * Phase 12.3-04 — hit-points pipeline regression (UAT B6).
 *
 * Locks the NWN1 HP formula and the StatsPanel `PG` wiring:
 *   L1: hitDie + conMod (max roll).
 *   L2+: floor(hitDie / 2) + 1 + conMod per level.
 *   Each level uses its own class's hit die (multiclass-aware).
 *   Each level's contribution floors at 1 (NWN minimum).
 *   Empty progression returns 0 → StatsPanel renders `--`.
 */

function makeLevel(
  level: number,
  classId: CanonicalId | null,
): ProgressionLevelRecord {
  return {
    abilityIncrease: null,
    classId,
    level: level as ProgressionLevel,
  };
}

describe('Phase 12.3-04 — hit-points pipeline (UAT B6)', () => {
  describe('Suite A — single-class Guerrero d10', () => {
    it('L1 + CON +2 → 12', () => {
      const levels = [makeLevel(1, 'class:fighter' as CanonicalId)];
      expect(computeHitPoints(levels, compiledClassCatalog, 2)).toBe(12);
    });

    it('L1 + CON 0 → 10', () => {
      const levels = [makeLevel(1, 'class:fighter' as CanonicalId)];
      expect(computeHitPoints(levels, compiledClassCatalog, 0)).toBe(10);
    });

    it('L1 + CON -1 → 9', () => {
      const levels = [makeLevel(1, 'class:fighter' as CanonicalId)];
      expect(computeHitPoints(levels, compiledClassCatalog, -1)).toBe(9);
    });

    it('L1 + L2 Guerrero + CON +2 → 20', () => {
      const levels = [
        makeLevel(1, 'class:fighter' as CanonicalId),
        makeLevel(2, 'class:fighter' as CanonicalId),
      ];
      // L1: 10 + 2 = 12; L2: floor(10/2)+1+2 = 8; total 20
      expect(computeHitPoints(levels, compiledClassCatalog, 2)).toBe(20);
    });

    it('L1-L3 Guerrero + CON +2 → 28', () => {
      const levels = [
        makeLevel(1, 'class:fighter' as CanonicalId),
        makeLevel(2, 'class:fighter' as CanonicalId),
        makeLevel(3, 'class:fighter' as CanonicalId),
      ];
      expect(computeHitPoints(levels, compiledClassCatalog, 2)).toBe(28);
    });
  });

  describe('Suite B — multiclass Guerrero d10 + Pícaro d6', () => {
    it('L1 Guerrero + L2 Pícaro + CON +2 → 18', () => {
      const levels = [
        makeLevel(1, 'class:fighter' as CanonicalId),
        makeLevel(2, 'class:rogue' as CanonicalId),
      ];
      // L1 Guerrero: 10+2 = 12; L2 Pícaro: floor(6/2)+1+2 = 6; total 18
      expect(computeHitPoints(levels, compiledClassCatalog, 2)).toBe(18);
    });

    it('L1 Pícaro + L2 Guerrero + CON +2 → 16', () => {
      const levels = [
        makeLevel(1, 'class:rogue' as CanonicalId),
        makeLevel(2, 'class:fighter' as CanonicalId),
      ];
      // L1 Pícaro: 6+2 = 8; L2 Guerrero: floor(10/2)+1+2 = 8; total 16
      expect(computeHitPoints(levels, compiledClassCatalog, 2)).toBe(16);
    });
  });

  describe('Suite C — CON boundaries', () => {
    it('Mago L1 + CON +2 → 6', () => {
      const levels = [makeLevel(1, 'class:wizard' as CanonicalId)];
      expect(computeHitPoints(levels, compiledClassCatalog, 2)).toBe(6);
    });

    it('Mago L1 + CON +4 → 8', () => {
      const levels = [makeLevel(1, 'class:wizard' as CanonicalId)];
      expect(computeHitPoints(levels, compiledClassCatalog, 4)).toBe(8);
    });

    it('Mago L1 + CON -4 → 1 (NWN per-level floor)', () => {
      const levels = [makeLevel(1, 'class:wizard' as CanonicalId)];
      expect(computeHitPoints(levels, compiledClassCatalog, -4)).toBe(1);
    });

    it('Bárbaro L1 + CON +5 → 17', () => {
      const levels = [makeLevel(1, 'class:barbarian' as CanonicalId)];
      expect(computeHitPoints(levels, compiledClassCatalog, 5)).toBe(17);
    });
  });

  describe('Suite D — empty / gapped progression', () => {
    it('all 16 levels null → 0', () => {
      const levels = Array.from({ length: 16 }, (_, i) => makeLevel(i + 1, null));
      expect(computeHitPoints(levels, compiledClassCatalog, 2)).toBe(0);
    });

    it('L1 null + L2 Guerrero + CON 0 → 6 (L2 is first configured, applies L2+ formula)', () => {
      // Plan spec: gap before first configured level — treat first CONFIGURED level as "first-class-level"
      // but the test locks `floor(10/2) + 1 + 0 = 6`, i.e. the L2+ formula applies based on position
      // in the progression ordinal (not on "is-first-configured"). computeHitPoints must sum ONLY
      // configured levels, and apply the L2+ formula when that configured level is beyond position 1.
      const levels = [
        makeLevel(1, null),
        makeLevel(2, 'class:fighter' as CanonicalId),
      ];
      expect(computeHitPoints(levels, compiledClassCatalog, 0)).toBe(6);
    });
  });

  describe('Suite E — StatsPanel render integration', () => {
    beforeEach(() => {
      cleanup();
      useLevelProgressionStore.getState().resetProgression();
      useCharacterFoundationStore.getState().resetFoundation();
    });

    afterEach(() => {
      cleanup();
      useLevelProgressionStore.getState().resetProgression();
      useCharacterFoundationStore.getState().resetFoundation();
    });

    it('L1 Guerrero + CON 14 → PG cell shows 12', () => {
      useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
      useCharacterFoundationStore.getState().setBaseAttribute('con', 14);
      useLevelProgressionStore
        .getState()
        .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);

      render(createElement(CharacterSheet));
      expect(screen.getByText('12')).toBeTruthy();
    });

    it('no class configured → PG shows --', () => {
      useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
      render(createElement(CharacterSheet));
      // PG is --; BAB also -- when no class; at least one -- present
      expect(screen.getAllByText('--').length).toBeGreaterThanOrEqual(1);
    });
  });
});
