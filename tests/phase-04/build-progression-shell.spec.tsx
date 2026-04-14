// @vitest-environment jsdom

import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from '@tanstack/react-router';
import { createPlannerRouter } from '@planner/router';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';

function primeOrigin() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
  foundationStore.setDeity('deity:none');
}

describe('phase 04 build progression shell', () => {
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

  it('renders the foundation strip, rail, and active level sheet together once the origin is ready', async () => {
    primeOrigin();

    const router = createPlannerRouter(['/']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    expect(
      screen.getByRole('heading', { name: 'Base del personaje' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Progresión 1-16' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Hoja del nivel' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Editar origen' }),
    ).toBeInTheDocument();
  });
});
