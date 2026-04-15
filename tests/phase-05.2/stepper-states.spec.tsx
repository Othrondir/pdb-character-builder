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
      characterSheetTab: 'stats',
      datasetId: 'dataset:pendiente',
      expandedLevel: null,
      mobileNavOpen: false,
      validationStatus: 'pending',
    });
  });

  it('shows alignment step as pending and disabled when race is not selected', () => {
    render(createElement(CreationStepper));

    const alignmentButton = screen.getByRole('button', { name: /Alineamiento/ });
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

    const raceButton = screen.getByRole('button', { name: /Raza/ });
    expect(raceButton).toHaveAttribute('aria-current', 'step');
  });

  it('does not show aria-current on non-active steps', () => {
    usePlannerShellStore.setState({ activeOriginStep: 'race' });

    render(createElement(CreationStepper));

    const alignmentButton = screen.getByRole('button', { name: /Alineamiento/ });
    expect(alignmentButton).not.toHaveAttribute('aria-current');
  });

  it('shows deity step as pending when alignment is not set', () => {
    useCharacterFoundationStore.getState().setRace('race:human');
    usePlannerShellStore.setState({ activeOriginStep: 'alignment' });

    render(createElement(CreationStepper));

    const deityButton = screen.getByRole('button', { name: /Deidad/ });
    expect(deityButton).toHaveClass('is-pending');
    expect(deityButton).toBeDisabled();
  });
});
