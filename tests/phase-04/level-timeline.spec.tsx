// @vitest-environment jsdom

import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

describe('phase 04 level timeline', () => {
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

  it('shows the full 1-16 rail and switches the active level when another entry is selected', async () => {
    primeOrigin();

    const router = createPlannerRouter(['/']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    expect(
      screen.getByRole('button', { name: /^Nivel 1\b/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Nivel 16\b/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Nivel 1').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /^Nivel 6\b/i }));

    expect(screen.getAllByText('Nivel 6').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /^Nivel 6\b/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
