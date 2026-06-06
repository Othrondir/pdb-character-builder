// @vitest-environment jsdom

import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { CreationStepper } from '@planner/components/shell/creation-stepper';

describe('phase 05.2 stepper states', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    usePlannerShellStore.setState({
      activeOriginStep: 'race',
      activeLevelSubStep: null,
      activeView: 'creation',
      characterSheetTab: 'stats',
      datasetId: 'dataset:pendiente',
      expandedLevel: null,
      mobileNavOpen: false,
    });
  });

  it('shows alignment step as pending and disabled when race is not selected', () => {
    render(createElement(CreationStepper));

    const alignmentButton = screen.getByRole('button', { name: /^Alineamiento$/ });
    expect(alignmentButton).toHaveClass('is-pending');
    expect(alignmentButton).toBeDisabled();
  });

  it('shows race step as complete with summary text when race is selected', () => {
    useCharacterFoundationStore.getState().setRace('race:human');
    usePlannerShellStore.setState({ activeOriginStep: 'alignment' });

    render(createElement(CreationStepper));

    const raceButton = screen.getByRole('button', { name: /Raza.*Humano/ });
    expect(raceButton).toHaveClass('is-complete');
  });

  it('shows active step with aria-current="step"', () => {
    usePlannerShellStore.setState({ activeOriginStep: 'race' });

    render(createElement(CreationStepper));

    const raceButton = screen.getByRole('button', { name: /^Raza$/ });
    expect(raceButton).toHaveAttribute('aria-current', 'step');
  });

  it('does not show aria-current on non-active steps', () => {
    usePlannerShellStore.setState({ activeOriginStep: 'race' });

    render(createElement(CreationStepper));

    const alignmentButton = screen.getByRole('button', { name: /^Alineamiento$/ });
    expect(alignmentButton).not.toHaveAttribute('aria-current');
  });

  it('keeps level sub-steps visible while Resumen is active', () => {
    usePlannerShellStore.setState({
      activeOriginStep: null,
      activeLevelSubStep: 'class',
      activeView: 'resumen',
      expandedLevel: 1,
    });

    render(createElement(CreationStepper));

    expect(screen.getByRole('button', { name: 'Clase' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Habilidades' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dotes' })).toBeInTheDocument();
  });
});
