// @vitest-environment jsdom

import { createElement } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
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

describe('phase 04 progression revalidation', () => {
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

  it('preserves later levels and marks downstream repair after an earlier class change', async () => {
    primeFoundation();

    act(() => {
      const progressionStore = useLevelProgressionStore.getState();

      progressionStore.setLevelClassId(1, 'class:rogue');
      progressionStore.setLevelClassId(2, 'class:rogue');
      progressionStore.setLevelClassId(3, 'class:fighter');
      progressionStore.setLevelClassId(4, 'class:fighter');
      progressionStore.setActiveLevel(3);
    });

    const router = createPlannerRouter(['/']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    fireEvent.click(screen.getByRole('button', { name: /Nivel 2 Legal/ }));
    fireEvent.click(screen.getByRole('button', { name: /Guerrero/ }));
    fireEvent.click(screen.getByRole('button', { name: /Nivel 3 Bloqueada/ }));

    expect(screen.getByRole('button', { name: /Nivel 3 Bloqueada/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nivel 4 Bloqueada/ })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Este nivel se conserva, pero depende de corregir decisiones anteriores.',
      ),
    ).toBeInTheDocument();

    const summaryPanel = screen.getByLabelText('Resumen del personaje');

    expect(within(summaryPanel).getByText('Inválida')).toBeInTheDocument();
    expect(within(summaryPanel).getByText('Ruta inválida')).toBeInTheDocument();
  });
});
