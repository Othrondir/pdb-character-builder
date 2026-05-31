// @vitest-environment jsdom

import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import {
  selectLevelRail,
  selectProgressionSummary,
} from '@planner/features/level-progression/selectors';

function primeFoundation() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
  foundationStore.setBaseAttribute('int', 12);
}

// Phase 12.6-05 restored: Plan 03 replaced the LevelRail with a 20-row
// scan list; Plan 04 mounted ClassPicker inside the active-row expanded
// slot; Plan 05 deleted LevelRail. Legacy queries targeting
// `screen.getByRole('radio', { name: /^2(?!0)/ })` migrate to
// `[data-level-row][data-level=\"2\"] button`. Revalidation + downstream-
// repair logic itself is framework-agnostic and continues to be locked by
// packages/rules-engine/src/progression/progression-revalidation.ts unit
// tests.
describe('phase 04 progression revalidation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    usePlannerShellStore.setState({
      activeOriginStep: null,
      activeLevelSubStep: 'class',
      characterSheetTab: 'stats',
      expandedLevel: 1,
      mobileNavOpen: false,
    });
  });

  it('preserves later levels and marks downstream repair after an earlier class change', () => {
    primeFoundation();

    act(() => {
      const progressionStore = useLevelProgressionStore.getState();

      progressionStore.setLevelClassId(1, 'class:rogue');
      progressionStore.setLevelClassId(2, 'class:rogue');
      progressionStore.setLevelClassId(3, 'class:fighter');
      progressionStore.setLevelClassId(4, 'class:fighter');
    });

    // This spec locks the rules-engine revalidation contract. The row-picker
    // interaction is covered by the 12.6 scan tests, so mutate the store
    // directly here and assert that downstream levels preserve their classes
    // while inheriting the repair state from the broken L2 transition.
    act(() => {
      useLevelProgressionStore
        .getState()
        .setLevelClassId(2, 'class:fighter');
    });

    // Verify downstream levels are marked as non-legal in the rail selector
    // (selectLevelRail is still the legality oracle; only its consumer
    // component was deleted).
    const rail = selectLevelRail(
      useLevelProgressionStore.getState(),
      useCharacterFoundationStore.getState(),
    );
    const level3Entry = rail.find((entry) => entry.level === 3);
    const level4Entry = rail.find((entry) => entry.level === 4);
    expect(rail.find((entry) => entry.level === 2)?.status).toBe('illegal');
    expect(level3Entry?.status).not.toBe('legal');
    expect(level4Entry?.status).not.toBe('legal');

    // Verify levels 3 and 4 still have their class assignments preserved (not cleared)
    const progressionLevels = useLevelProgressionStore.getState().levels;
    expect(progressionLevels.find((l) => l.level === 3)?.classId).toBe('class:fighter');
    expect(progressionLevels.find((l) => l.level === 4)?.classId).toBe('class:fighter');

    // Verify summary shows invalid/repair state
    const progressionSummary = selectProgressionSummary(
      useLevelProgressionStore.getState(),
      useCharacterFoundationStore.getState(),
    );
    expect(progressionSummary.planState).toBe('Ruta inválida');
  });
});
