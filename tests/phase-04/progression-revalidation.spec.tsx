// @vitest-environment jsdom

import { createElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
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

// Phase 12.6-03 (PROG-04 R5) — this spec drives an L2 class change via the
// legacy level-rail <radio name="^2(?!0)"> DOM AND the pre-swap ClassPicker
// mount inside BuildProgressionBoard. Plan 12.6-03 replaces the root with a
// 20-row <ol>; Plan 12.6-04 remounts ClassPicker inside the expanded slot;
// Plan 12.6-05 deletes level-rail. Skipped until Plan 04 rebuilds the DOM
// path. Revalidation + downstream-repair logic itself is locked by
// packages/rules-engine/src/progression/progression-revalidation.ts unit
// tests, which still pass.
describe.skip('phase 04 progression revalidation', () => {
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

    render(createElement(PlannerShellFrame));

    // Change level 2 from rogue to fighter via the rail and class selection.
    // Phase 12.4-06 migrated the class-picker DOM from <OptionList role="option">
    // to <ClassPicker> scoped buttons with data-class-id. Target the row via
    // its ClassPicker DOM contract instead of the legacy option role.
    const level2Radio = screen.getByRole('radio', { name: /^2(?!0)/ });
    fireEvent.click(level2Radio);
    const guerreroRow = document.querySelector(
      '[data-class-id="class:fighter"]',
    ) as HTMLButtonElement | null;
    expect(guerreroRow).not.toBeNull();
    fireEvent.click(guerreroRow!);

    // Verify downstream levels are marked as blocked in the rail
    const rail = selectLevelRail(
      useLevelProgressionStore.getState(),
      useCharacterFoundationStore.getState(),
    );
    const level3Entry = rail.find((entry) => entry.level === 3);
    const level4Entry = rail.find((entry) => entry.level === 4);
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
