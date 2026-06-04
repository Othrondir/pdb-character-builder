import { beforeEach, describe, expect, it } from 'vitest';

import { selectFeatBoardView } from '@planner/features/feats/selectors';
import { useFeatStore } from '@planner/features/feats/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

function setClass(level: number, classId: CanonicalId): void {
  useLevelProgressionStore
    .getState()
    .setLevelClassId(level as ProgressionLevel, classId);
}

function activateLevel(level: number): void {
  useLevelProgressionStore.getState().setActiveLevel(level as ProgressionLevel);
  useFeatStore.getState().setActiveLevel(level as ProgressionLevel);
}

function snapshotBoardView() {
  return selectFeatBoardView(
    useFeatStore.getState(),
    useLevelProgressionStore.getState(),
    useCharacterFoundationStore.getState(),
    useSkillStore.getState(),
  );
}

describe('Phase 16 — peculiar feat schedules for MDA and Espadachín', () => {
  beforeEach(() => {
    useLevelProgressionStore.getState().resetProgression();
    useFeatStore.getState().resetFeatSelections();
    useCharacterFoundationStore.getState().resetFoundation();
    useSkillStore.getState().resetSkillAllocations();
  });

  it('MDA 1 offers the matching Arma escogida and MDA 2 does not require an empty feat slot', () => {
    for (let level = 1; level <= 6; level++) {
      setClass(level, 'class:fighter' as CanonicalId);
    }
    setClass(7, 'class:weaponmaster' as CanonicalId);
    setClass(8, 'class:weaponmaster' as CanonicalId);
    useFeatStore
      .getState()
      .setGeneralFeat(3 as ProgressionLevel, 'feat:weapfoclsw' as CanonicalId);

    activateLevel(7);
    const mda1 = snapshotBoardView();
    const longswordChoice = mda1.classBonusEntries.find(
      (entry) =>
        entry.kind === 'feat' &&
        entry.option.featId === 'feat:feat-weapon-of-choice-longsword',
    );

    expect(mda1.activeSheet.hasClassBonusSlot).toBe(true);
    expect(mda1.sequentialStep).toBe('class-bonus');
    expect(longswordChoice?.kind).toBe('feat');
    if (longswordChoice?.kind === 'feat') {
      expect(longswordChoice.option.rowState).toBe('selectable');
    }

    useFeatStore
      .getState()
      .setClassFeat(
        7 as ProgressionLevel,
        'feat:feat-weapon-of-choice-longsword' as CanonicalId,
      );
    activateLevel(8);
    const mda2 = snapshotBoardView();

    expect(mda2.activeSheet.hasClassBonusSlot).toBe(false);
    expect(mda2.counters.slots).toBe(0);
    expect(mda2.slotStatuses).toEqual([]);
    expect(mda2.activeSheet.slotPrompt).toBeNull();
  });

  it('Espadachín has no invented class picks while valid weapon focus remains a general feat', () => {
    for (let level = 1; level <= 16; level++) {
      setClass(level, 'class:swashbuckler' as CanonicalId);
    }

    for (const level of [1, 2, 5, 9, 13]) {
      activateLevel(level);
      expect(
        snapshotBoardView().activeSheet.hasClassBonusSlot,
        `Espadachín ${level}`,
      ).toBe(false);
    }

    activateLevel(1);
    const level1 = snapshotBoardView();
    const weaponFocusFamily = level1.generalEntries.find(
      (entry) =>
        entry.kind === 'family' &&
        entry.family.canonicalId === 'feat:weapon-focus',
    );

    expect(level1.activeSheet.hasGeneralSlot).toBe(true);
    expect(weaponFocusFamily?.kind).toBe('family');
    if (weaponFocusFamily?.kind === 'family') {
      expect(
        weaponFocusFamily.family.targets.find(
          (target) => target.featId === 'feat:weapfoclsw',
        )?.rowState,
      ).toBe('selectable');
    }
  });
});
