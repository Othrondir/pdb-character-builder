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

// UAT-2026-04-20 G1 — rail buttons require prior-level classId to unlock.
// Seed all 16 levels so any rail entry under test is interactive.
function primeAllRailLevels() {
  const setClass = useLevelProgressionStore.getState().setLevelClassId;
  for (let l = 1; l <= 16; l++) {
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

  it('shows the full 1-16 rail and switches the expanded level when another entry is selected', () => {
    primeOrigin();
    primeAllRailLevels();

    render(createElement(PlannerShellFrame));

    const radioGroup = screen.getByRole('radiogroup', { name: 'Nivel de progresion' });
    const radios = radioGroup.querySelectorAll('[role="radio"]');
    expect(radios).toHaveLength(20);

    const level1Radio = screen.getByRole('radio', { name: /^1Guerrero/ });
    expect(level1Radio).toHaveAttribute('aria-checked', 'true');

    const level6Radio = screen.getByRole('radio', { name: /^6Guerrero/ });
    fireEvent.click(level6Radio);

    expect(usePlannerShellStore.getState().expandedLevel).toBe(6);
  });
});
