// @vitest-environment jsdom

import { createElement } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { RouterProvider } from '@tanstack/react-router';
import { createPlannerRouter } from '@planner/router';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';

function primeFoundation() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
  foundationStore.setDeity('deity:none');
  foundationStore.setBaseAttribute('int', 12);
}

describe('phase 05 skill allocation flow', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    useSkillStore.getState().resetSkillAllocations();
    usePlannerShellStore.setState({
      activeSection: 'skills',
      datasetId: 'dataset:pendiente',
      mobileNavOpen: false,
      summaryPanelOpen: true,
      validationStatus: 'pending',
    });
  });

  it('renders the level rail and active sheet for the routed habilidades editor', async () => {
    primeFoundation();

    act(() => {
      const progressionStore = useLevelProgressionStore.getState();

      progressionStore.setLevelClassId(1, 'class:rogue');
      progressionStore.setLevelClassId(2, 'class:fighter');
    });

    const router = createPlannerRouter(['/skills']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    expect(screen.getAllByRole('heading', { name: 'Habilidades 1-16' })).toHaveLength(2);
    expect(
      screen.getByRole('heading', { name: 'Hoja de habilidades' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Puntos disponibles')).toHaveLength(2);
  });

  it('switches the active level from the rail and reflects class versus transclase costs', async () => {
    primeFoundation();

    act(() => {
      const progressionStore = useLevelProgressionStore.getState();

      progressionStore.setLevelClassId(1, 'class:rogue');
      progressionStore.setLevelClassId(2, 'class:fighter');
      useSkillStore.getState().setActiveLevel(1);
    });

    const router = createPlannerRouter(['/skills']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    const tumbleRow = screen.getByRole('heading', { name: 'Acrobacias' }).closest('article');
    expect(tumbleRow).not.toBeNull();
    expect(within(tumbleRow as HTMLElement).getByText('Clase')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Nivel 2 Legal/ }));

    const persuadeRow = screen.getByRole('heading', { name: 'Persuadir' }).closest('article');
    expect(persuadeRow).not.toBeNull();
    expect(within(persuadeRow as HTMLElement).getByText('Transclase')).toBeInTheDocument();
  });

  it('preserves downstream allocations when an upstream class change breaks legality', async () => {
    primeFoundation();

    act(() => {
      const progressionStore = useLevelProgressionStore.getState();
      const skillStore = useSkillStore.getState();

      progressionStore.setLevelClassId(1, 'class:rogue');
      progressionStore.setLevelClassId(2, 'class:rogue');
      skillStore.setSkillRank(1, 'skill:hide', 4);
      skillStore.setSkillRank(2, 'skill:listen', 1);
      skillStore.setActiveLevel(2);
    });

    const router = createPlannerRouter(['/skills']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    act(() => {
      useLevelProgressionStore.getState().setLevelClassId(1, 'class:fighter');
    });

    fireEvent.click(screen.getByRole('button', { name: /Nivel 2 Bloqueada/ }));

    expect(
      screen.getByText(
        'Este nivel conserva sus rangos, pero depende de corregir decisiones anteriores.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();

    const summaryPanel = screen.getByLabelText('Resumen del personaje');
    expect(within(summaryPanel).getByText('Habilidades en reparacion')).toBeInTheDocument();
  });
});
