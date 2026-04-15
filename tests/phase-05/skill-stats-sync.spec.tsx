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

async function renderRoute(path: '/skills' | '/stats') {
  const router = createPlannerRouter([path]);
  await router.load();

  return render(createElement(RouterProvider, { router }));
}

describe('phase 05 skill stats synchronization', () => {
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

  it('keeps Estadísticas synchronized with the active Habilidades snapshot', async () => {
    primeFoundation();

    act(() => {
      const progressionStore = useLevelProgressionStore.getState();
      const skillStore = useSkillStore.getState();

      progressionStore.setLevelClassId(1, 'class:rogue');
      progressionStore.setLevelClassId(2, 'class:rogue');
      skillStore.setSkillRank(1, 'skill:esconderse', 4);
      skillStore.setSkillRank(2, 'skill:escuchar', 1);
      skillStore.setActiveLevel(2);
    });

    const skillScreen = await renderRoute('/skills');

    act(() => {
      useLevelProgressionStore.getState().setLevelClassId(1, 'class:fighter');
    });

    fireEvent.click(screen.getByRole('button', { name: /Nivel 2 Bloqueada/ }));

    const listenSkillRow = screen.getByRole('heading', { name: 'Escuchar' }).closest('article');
    expect(listenSkillRow).not.toBeNull();
    expect(
      within(listenSkillRow as HTMLElement).getByText('Tope: 5'),
    ).toBeInTheDocument();
    expect(
      within(listenSkillRow as HTMLElement).getByText('1 punto'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Este nivel conserva sus rangos, pero depende de corregir decisiones anteriores.',
      ),
    ).toBeInTheDocument();

    skillScreen.unmount();

    await renderRoute('/stats');

    const listenStatsRow = screen
      .getAllByRole('heading', { name: 'Escuchar' })
      .map((heading) => heading.closest('article'))
      .find((article) => article?.textContent?.includes('Siguiente coste: 1 punto')) ?? null;
    expect(listenStatsRow).not.toBeNull();
    expect(
      within(listenStatsRow as HTMLElement).getByText('Tope: 5'),
    ).toBeInTheDocument();
    expect(
      within(listenStatsRow as HTMLElement).getByText('Siguiente coste: 1 punto'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Este nivel conserva sus rangos, pero depende de corregir decisiones anteriores.',
      ),
    ).toBeInTheDocument();
  });

  it('projects shell summary repair and ready states from the shared skill selector', async () => {
    primeFoundation();

    act(() => {
      const progressionStore = useLevelProgressionStore.getState();
      const skillStore = useSkillStore.getState();

      progressionStore.setLevelClassId(1, 'class:rogue');
      progressionStore.setLevelClassId(2, 'class:rogue');
      skillStore.setSkillRank(1, 'skill:esconderse', 4);
      skillStore.setSkillRank(2, 'skill:escuchar', 1);
      skillStore.setActiveLevel(2);
    });

    await renderRoute('/skills');

    act(() => {
      useLevelProgressionStore.getState().setLevelClassId(1, 'class:fighter');
    });

    const summaryPanel = screen.getByLabelText('Resumen del personaje');
    expect(within(summaryPanel).getByText('Habilidades en reparacion')).toBeInTheDocument();

    act(() => {
      useSkillStore.getState().setSkillRank(1, 'skill:esconderse', 2);
    });

    expect(within(summaryPanel).getByText('Habilidades listas')).toBeInTheDocument();
  });

});
