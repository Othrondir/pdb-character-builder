// @vitest-environment jsdom

import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';

function primeOrigin() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
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

    render(createElement(PlannerShellFrame));

    const radioGroup = screen.getByRole('radiogroup', { name: 'Nivel de progresion' });
    const radios = radioGroup.querySelectorAll('[role="radio"]');
    expect(radios).toHaveLength(16);

    const level1Radio = screen.getByRole('radio', { name: /^1$/ });
    expect(level1Radio).toHaveAttribute('aria-checked', 'true');

    const level6Radio = screen.getByRole('radio', { name: /^6$/ });
    fireEvent.click(level6Radio);

    expect(usePlannerShellStore.getState().expandedLevel).toBe(6);
  });
});
