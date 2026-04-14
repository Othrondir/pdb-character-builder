// @vitest-environment jsdom

import { createElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { RouterProvider } from '@tanstack/react-router';
import { createPlannerRouter } from '@planner/router';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';

function primeFoundation() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
  foundationStore.setDeity('deity:none');
  foundationStore.setBaseAttribute('int', 12);
}

describe('phase 04 level sheet gains', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    usePlannerShellStore.setState({
      activeSection: 'build',
      datasetId: 'dataset:pendiente',
      mobileNavOpen: false,
      summaryPanelOpen: true,
      validationStatus: 'pending',
    });
  });

  it('renders gains for a selectable base class and shows the ability helper at level 4', async () => {
    primeFoundation();

    act(() => {
      const progressionStore = useLevelProgressionStore.getState();

      progressionStore.setLevelClassId(1, 'class:fighter');
      progressionStore.setLevelClassId(2, 'class:fighter');
      progressionStore.setLevelClassId(3, 'class:fighter');
      progressionStore.setActiveLevel(4);
    });

    const router = createPlannerRouter(['/']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    fireEvent.click(screen.getByRole('button', { name: /Guerrero/ }));

    expect(
      screen.getByRole('heading', { name: 'Ganancias del nivel' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Dado de golpe d10')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Este nivel concede un aumento de característica que se reflejará en Atributos.',
      ),
    ).toBeInTheDocument();
  });

  it('shows blocked prestige copy inline when shadowdancer is selected', async () => {
    primeFoundation();

    const router = createPlannerRouter(['/']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    fireEvent.click(screen.getByRole('button', { name: /Sombra danzante/ }));

    expect(
      screen.getByText('Pendiente de dotes o habilidades de fases posteriores.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Sombra danzante Bloqueada/ }),
    ).toBeInTheDocument();
  });
});
