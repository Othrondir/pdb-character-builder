// @vitest-environment jsdom

import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';

function primeOrigin() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
}

describe('phase 04 build progression shell', () => {
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

  it('renders the class selection screen and level rail once the origin is ready', () => {
    primeOrigin();

    render(createElement(PlannerShellFrame));

    expect(
      screen.getByRole('heading', { name: /Selecciona la clase del nivel/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'Nivel de progresion' }),
    ).toBeInTheDocument();
  });
});
