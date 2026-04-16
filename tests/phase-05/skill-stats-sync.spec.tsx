// @vitest-environment jsdom

import { createElement } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { selectActiveSkillSheetView } from '@planner/features/skills/selectors';

function primeFoundation() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
  foundationStore.setBaseAttribute('int', 12);
}

describe('phase 05 skill stats synchronization', () => {
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

  it('keeps skill sheet synchronized with the active Habilidades snapshot', () => {
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

    const listenSkillRow = screen.getByRole('heading', { name: 'Escuchar' }).closest('article');
    expect(listenSkillRow).not.toBeNull();
    expect(
      within(listenSkillRow as HTMLElement).getByText('Tope: 5'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Este nivel conserva sus rangos, pero depende de corregir decisiones anteriores.',
      ),
    ).toBeInTheDocument();
  });

  it('projects skill repair and ready states from the shared skill selector', () => {
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

    // Verify the skill view reports repair state
    const skillView = selectActiveSkillSheetView(
      useSkillStore.getState(),
      useLevelProgressionStore.getState(),
      useCharacterFoundationStore.getState(),
    );
    expect(skillView.repairMessage).toBeTruthy();

    act(() => {
      useSkillStore.getState().setSkillRank(1, 'skill:esconderse', 2);
    });

    const repairedView = selectActiveSkillSheetView(
      useSkillStore.getState(),
      useLevelProgressionStore.getState(),
      useCharacterFoundationStore.getState(),
    );
    expect(repairedView.repairMessage).toBeFalsy();
  });
});
