import { beforeEach, describe, expect, it } from 'vitest';

import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { selectFeatBoardView } from '@planner/features/feats/selectors';
import { useFeatStore } from '@planner/features/feats/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { expandFeatIdsWithImplications } from '@rules-engine/feats/feat-implications';

function setClassPath(classId: CanonicalId, maxLevel: number): void {
  for (let level = 1; level <= maxLevel; level++) {
    useLevelProgressionStore
      .getState()
      .setLevelClassId(level as ProgressionLevel, classId);
  }
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

function findOption(
  entries: ReturnType<typeof snapshotBoardView>['generalEntries'],
  featId: string,
) {
  for (const entry of entries) {
    if (entry.kind === 'feat' && entry.option.featId === featId) {
      return entry.option;
    }
    if (entry.kind === 'family') {
      const target = entry.family.targets.find(
        (option) => option.featId === featId,
      );
      if (target) return target;
    }
  }
  return null;
}

describe('Phase 16 — class feature feats count for later prerequisites', () => {
  beforeEach(() => {
    useLevelProgressionStore.getState().resetProgression();
    useFeatStore.getState().resetFeatSelections();
    useCharacterFoundationStore.getState().resetFoundation();
    useSkillStore.getState().resetSkillAllocations();
    useCharacterFoundationStore.getState().setRace('race:elf' as CanonicalId);
  });

  it('Combate con dos armas grants Ambidextrismo for later prerequisites', () => {
    const featIds = expandFeatIdsWithImplications(['feat:twoweap']);

    expect(featIds.has('feat:twoweap')).toBe(true);
    expect(featIds.has('feat:ambidex')).toBe(true);
  });

  it('Explorador combat style two-weapon variant unlocks later two-weapon feats', () => {
    setClassPath('class:ranger' as CanonicalId, 3);
    useCharacterFoundationStore.getState().setBaseAttribute('dex', 15);
    useFeatStore
      .getState()
      .setClassFeat(
        2 as ProgressionLevel,
        'feat:estilodecombatedosarmas' as CanonicalId,
      );

    activateLevel(3);
    const board = snapshotBoardView();
    const twoWeaponDefense = findOption(
      board.generalEntries,
      'feat:defensacondosarmas',
    );

    expect(twoWeaponDefense?.rowState).toBe('selectable');

    const buildStateFeatIds = expandFeatIdsWithImplications([
      'feat:estilodecombatedosarmas',
    ]);
    expect(buildStateFeatIds.has('feat:twoweap')).toBe(true);
    expect(buildStateFeatIds.has('feat:ambidex')).toBe(true);
  });

  it('Alma Predilecta level 3 offers simple-weapon focus choices as class feats', () => {
    setClassPath('class:almapredilecta' as CanonicalId, 3);

    activateLevel(3);
    const board = snapshotBoardView();
    const clubFocus = findOption(
      board.classBonusEntries,
      'feat:weapfocclub',
    );

    expect(board.activeSheet.hasClassBonusSlot).toBe(true);
    expect(clubFocus?.rowState).toBe('selectable');
  });
});
