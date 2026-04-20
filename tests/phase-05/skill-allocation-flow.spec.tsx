// @vitest-environment jsdom

import { createElement } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';

function primeFoundation() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
  foundationStore.setBaseAttribute('int', 12);
}

describe('phase 05 skill allocation flow', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    useSkillStore.getState().resetSkillAllocations();
    usePlannerShellStore.setState({
      activeOriginStep: null,
      activeLevelSubStep: 'skills',
      characterSheetTab: 'stats',
      expandedLevel: 1,
      mobileNavOpen: false,
    });
  });

  it('renders the skill sheet for the stepper-based habilidades editor', () => {
    primeFoundation();

    act(() => {
      const progressionStore = useLevelProgressionStore.getState();

      progressionStore.setLevelClassId(1, 'class:rogue');
      progressionStore.setLevelClassId(2, 'class:fighter');
    });

    render(createElement(PlannerShellFrame));

    expect(
      screen.getByRole('heading', { name: /Distribuir puntos de habilidad/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Hoja de habilidades' }),
    ).toBeInTheDocument();
  });

  it('switches the active level from the rail and reflects class versus transclase costs', () => {
    primeFoundation();

    act(() => {
      const progressionStore = useLevelProgressionStore.getState();

      progressionStore.setLevelClassId(1, 'class:rogue');
      progressionStore.setLevelClassId(2, 'class:fighter');
      useSkillStore.getState().setActiveLevel(1);
    });

    render(createElement(PlannerShellFrame));

    // After Phase 05.1 extraction, skill labels come from the Puerta 2DA:
    //   "Acrobacias" is now "Piruetas" (Tumble)
    //   "Persuadir" is now "Diplomacia" (Persuade)
    // After Phase 12.7-03 R4: per-row "Clase"/"Transclase" labels removed;
    // category is encoded by the parent section heading instead.
    const classSection = screen.getByRole('heading', {
      name: /Habilidades de clase/i,
    }).closest('section');
    expect(classSection).not.toBeNull();
    expect(
      within(classSection as HTMLElement).getByRole('heading', { name: 'Piruetas' }),
    ).toBeInTheDocument();

    // Switch to level 2 via the skill store and re-render
    act(() => {
      useSkillStore.getState().setActiveLevel(2);
      usePlannerShellStore.setState({ expandedLevel: 2 });
    });

    const transclassSection = screen.getByRole('heading', {
      name: /Habilidades transclase/i,
    }).closest('section');
    expect(transclassSection).not.toBeNull();
    expect(
      within(transclassSection as HTMLElement).getByRole('heading', { name: 'Diplomacia' }),
    ).toBeInTheDocument();
  });

  it('preserves downstream allocations when an upstream class change breaks legality', () => {
    primeFoundation();

    act(() => {
      const progressionStore = useLevelProgressionStore.getState();
      const skillStore = useSkillStore.getState();

      progressionStore.setLevelClassId(1, 'class:rogue');
      progressionStore.setLevelClassId(2, 'class:rogue');
      skillStore.setSkillRank(1, 'skill:esconderse', 4);
      skillStore.setSkillRank(2, 'skill:escuchar', 1);
      skillStore.setActiveLevel(2);
      usePlannerShellStore.setState({ expandedLevel: 2 });
    });

    render(createElement(PlannerShellFrame));

    act(() => {
      useLevelProgressionStore.getState().setLevelClassId(1, 'class:fighter');
    });

    expect(
      screen.getByText(
        'Este nivel conserva sus rangos, pero depende de corregir decisiones anteriores.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });
});
