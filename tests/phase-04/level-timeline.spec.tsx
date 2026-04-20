// @vitest-environment jsdom

import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

function primeOrigin() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
}

// UAT-2026-04-20 G1 — row buttons require prior-level classId to unlock.
// Seed all 20 levels so any row under test is interactive (UAT P6 extended 1..16 → 1..20).
function primeAllRailLevels() {
  const setClass = useLevelProgressionStore.getState().setLevelClassId;
  for (let l = 1; l <= 20; l++) {
    setClass(l as ProgressionLevel, 'class:fighter' as CanonicalId);
  }
}

describe('phase 04 level timeline', () => {
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

  // Phase 12.6-05 migration: LevelRail deleted. The 20-row scan list in
  // BuildProgressionBoard (mounted by PlannerShellFrame when activeLevelSubStep
  // === 'class') replaces the radiogroup; legality selection is driven by
  // [data-level-row][data-level] buttons with aria-expanded on the active row.
  it('shows the full 1-20 scan list and switches the expanded level when another row is selected', () => {
    primeOrigin();
    primeAllRailLevels();

    render(createElement(PlannerShellFrame));

    const rows = document.querySelectorAll('[data-level-row]');
    expect(rows).toHaveLength(20);

    const level1Row = document.querySelector('[data-level-row][data-level="1"] button') as HTMLButtonElement | null;
    expect(level1Row).not.toBeNull();
    expect(level1Row?.getAttribute('aria-expanded')).toBe('true');

    const level6Row = document.querySelector('[data-level-row][data-level="6"] button') as HTMLButtonElement | null;
    expect(level6Row).not.toBeNull();
    fireEvent.click(level6Row as HTMLButtonElement);

    expect(usePlannerShellStore.getState().expandedLevel).toBe(6);
  });
});
