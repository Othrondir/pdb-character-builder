// @vitest-environment jsdom

import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { CreationStepper } from '@planner/components/shell/creation-stepper';

describe('phase 05.2 stepper navigation', () => {
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
    });
  });

  it('renders a nav landmark with aria-label "Creacion de personajes"', () => {
    render(createElement(CreationStepper));

    const nav = screen.getByRole('navigation', { name: 'Creacion de personajes' });
    expect(nav).toBeInTheDocument();
  });

  it('renders the ORIGEN heading text', () => {
    render(createElement(CreationStepper));

    expect(screen.getByText('Origen')).toBeInTheDocument();
  });

  it('renders the PROGRESION heading text', () => {
    render(createElement(CreationStepper));

    expect(screen.getByText('Progresion')).toBeInTheDocument();
  });

  it('renders 3 origin step buttons with correct labels', () => {
    render(createElement(CreationStepper));

    expect(screen.getByRole('button', { name: /Raza/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Alineamiento/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Atributos/ })).toBeInTheDocument();
  });

  it('renders an ordered list wrapping origin steps', () => {
    render(createElement(CreationStepper));

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
  });

  it('renders 16 level buttons in the level rail', () => {
    render(createElement(CreationStepper));

    const radioGroup = screen.getByRole('radiogroup', { name: 'Nivel de progresion' });
    const radios = radioGroup.querySelectorAll('[role="radio"]');
    expect(radios).toHaveLength(16);
  });

  it('updates shell store when clicking a completed Raza step button', () => {
    // Set race so Raza step is 'complete' and clickable, then switch to alignment
    useCharacterFoundationStore.getState().setRace('race:human');
    usePlannerShellStore.setState({ activeOriginStep: 'alignment' });

    render(createElement(CreationStepper));

    const razaButton = screen.getByRole('button', { name: /Raza/ });
    fireEvent.click(razaButton);

    expect(usePlannerShellStore.getState().activeOriginStep).toBe('race');
  });

  it('renders Resumen bottom button (Utilidades removed per UAT-2026-04-20 G2)', () => {
    render(createElement(CreationStepper));

    expect(screen.getByRole('button', { name: 'Resumen' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Utilidades' })).toBeNull();
  });
});
