import { describe, expect, it } from 'vitest';

import {
  determineFeatSlots,
  type FeatSlotsAtLevel,
} from '@rules-engine/feats/feat-eligibility';
import type { BuildStateAtLevel } from '@rules-engine/feats/feat-prerequisite';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import type { CompiledClass } from '@data-extractor/contracts/class-catalog';

/**
 * Phase 16-02 — race-aware determineFeatSlots (FEAT-05 + FEAT-06, D-01 + D-03 + D-06).
 *
 * Locks the new signature `determineFeatSlots(buildState, classFeatLists, compiledClass?)`
 * and the new `raceBonusFeatSlot: boolean` field on FeatSlotsAtLevel. Covers:
 *  - Humano L1 Guerrero — 3 slots all true.
 *  - Mediano Fortecor L1 Guerrero — race-bonus true (D-06 expansion).
 *  - Elfo L1 Guerrero — race-bonus false (regression lock for non-allowlist races).
 *  - Humano L2 Guerrero — race-bonus false (only at characterLevel === 1).
 *  - Humano L1 Mago — 3 slots all true (Plan 16-01 wizard schedule includes 1).
 *    NOTE: extractor surfaces `[4,9,14,19]` for class:wizard (Puerta canon), so
 *    L1 wizard does NOT receive a class-bonus slot under D-01 precedence. The
 *    test asserts the actual extractor disposition, not vanilla NWN1 conjecture.
 *  - D-01 precedence: stub `compiledClass.bonusFeatSchedule = [4]` overrides
 *    LEGACY_CLASS_BONUS_FEAT_SCHEDULES['class:fighter'] at classLevelInClass=1.
 */
function buildL(
  raceId: string | null,
  classId: string,
  characterLevel: number,
): BuildStateAtLevel {
  return {
    abilityScores: { str: 14, dex: 12, con: 14, int: 10, wis: 10, cha: 10 },
    bab: 1,
    characterLevel,
    classLevels: { [classId]: characterLevel },
    fortitudeSave: 0,
    selectedFeatIds: new Set(),
    skillRanks: {},
    raceId,
    activeClassIdAtLevel: classId,
  };
}

describe('Phase 16-02 — race-aware determineFeatSlots (FEAT-05 + FEAT-06, D-01 + D-03 + D-06)', () => {
  it('Humano L1 Guerrero: classBonus=true, general=true, raceBonus=true', () => {
    const fighter = compiledClassCatalog.classes.find((c) => c.id === 'class:fighter')!;
    const slots: FeatSlotsAtLevel = determineFeatSlots(
      buildL('race:human', 'class:fighter', 1),
      compiledFeatCatalog.classFeatLists,
      fighter,
    );
    expect(slots.classBonusFeatSlot).toBe(true);
    expect(slots.generalFeatSlot).toBe(true);
    expect(slots.raceBonusFeatSlot).toBe(true);
  });

  it('Mediano Fortecor L1 Guerrero: raceBonusFeatSlot true (D-06 expansion)', () => {
    const fighter = compiledClassCatalog.classes.find((c) => c.id === 'class:fighter')!;
    const slots = determineFeatSlots(
      buildL('race:mediano-fortecor', 'class:fighter', 1),
      compiledFeatCatalog.classFeatLists,
      fighter,
    );
    expect(slots.raceBonusFeatSlot).toBe(true);
    expect(slots.classBonusFeatSlot).toBe(true);
    expect(slots.generalFeatSlot).toBe(true);
  });

  it('Elfo L1 Guerrero: raceBonusFeatSlot false (regression lock — non-allowlist race)', () => {
    const fighter = compiledClassCatalog.classes.find((c) => c.id === 'class:fighter')!;
    const slots = determineFeatSlots(
      buildL('race:elf', 'class:fighter', 1),
      compiledFeatCatalog.classFeatLists,
      fighter,
    );
    expect(slots.raceBonusFeatSlot).toBe(false);
    expect(slots.classBonusFeatSlot).toBe(true);
    expect(slots.generalFeatSlot).toBe(true);
  });

  it('Humano L2 Guerrero: raceBonusFeatSlot false (only at characterLevel === 1)', () => {
    const fighter = compiledClassCatalog.classes.find((c) => c.id === 'class:fighter')!;
    const slots = determineFeatSlots(
      buildL('race:human', 'class:fighter', 2),
      compiledFeatCatalog.classFeatLists,
      fighter,
    );
    expect(slots.raceBonusFeatSlot).toBe(false);
  });

  it('Humano L1 Mago: raceBonus + general true (extractor wizard schedule excludes L1)', () => {
    const wizard = compiledClassCatalog.classes.find((c) => c.id === 'class:wizard')!;
    const slots = determineFeatSlots(
      buildL('race:human', 'class:wizard', 1),
      compiledFeatCatalog.classFeatLists,
      wizard,
    );
    // Extractor cadence for wizard is [4,9,14,19] (Plan 16-01 PIT-01 dossier),
    // so L1 wizard does NOT receive a class-bonus slot under D-01 precedence.
    expect(slots.classBonusFeatSlot).toBe(false);
    expect(slots.generalFeatSlot).toBe(true);
    expect(slots.raceBonusFeatSlot).toBe(true);
  });

  it('D-01 precedence: compiledClass.bonusFeatSchedule wins over LEGACY map', () => {
    const fighterLegacy = compiledClassCatalog.classes.find((c) => c.id === 'class:fighter')!;
    const stubFighter: CompiledClass = {
      ...fighterLegacy,
      bonusFeatSchedule: [4], // override: only L4 grants bonus, not L1
    };
    const slots = determineFeatSlots(
      buildL('race:elf', 'class:fighter', 1), // Elfo to isolate from race-bonus
      compiledFeatCatalog.classFeatLists,
      stubFighter,
    );
    // compiled says no L1 bonus; legacy [1,2,4,...] is IGNORED.
    expect(slots.classBonusFeatSlot).toBe(false);
  });
});
