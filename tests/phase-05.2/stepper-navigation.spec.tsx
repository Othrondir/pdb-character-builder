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

    expect(screen.getByRole('button', { name: /^Raza$/ })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Alineamiento$/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Atributos$/ })).toBeInTheDocument();
  });

  it('renders an ordered list wrapping origin steps', () => {
    render(createElement(CreationStepper));

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
  });

  // Phase 12.6-05 migration: LevelRail deleted; CreationStepper no longer
  // mounts a level rail. The 20-row scan list moved into
  // BuildProgressionBoard (tests/phase-12.6/level-progression-scan.spec.tsx
  // Suite B asserts the new 20-row contract). Here we lock the invariant
  // that CreationStepper's progression section is rail-free.
  it('does NOT render a level rail inside CreationStepper (12.6-05 scrub)', () => {
    render(createElement(CreationStepper));

    expect(
      screen.queryByRole('radiogroup', { name: 'Nivel de progresion' }),
    ).toBeNull();
    expect(document.querySelector('.level-rail')).toBeNull();
    expect(document.querySelector('.level-rail__button')).toBeNull();
  });

  it('renders the progression helper warning until origin and attributes are ready', () => {
    render(createElement(CreationStepper));

    const card = screen.getByTestId('progression-unlock-card');
    expect(card).toHaveTextContent('La progresion sigue bloqueada');
    expect(card).toHaveTextContent(
      'Completa raza, alineamiento y atributos antes de abrir la progresion.',
    );
    expect(card).not.toHaveTextContent('Elige una raza en Origen para empezar.');
    expect(
      screen.getByRole('button', { name: 'Ir a Raza' }),
    ).toBeInTheDocument();
  });

  it('routes the helper CTA to the next blocked origin step', () => {
    useCharacterFoundationStore.getState().setRace('race:human');

    render(createElement(CreationStepper));

    const cta = screen.getByRole('button', { name: 'Ir a Alineamiento' });
    fireEvent.click(cta);

    expect(usePlannerShellStore.getState().activeOriginStep).toBe('alignment');
  });

  it('updates shell store when clicking a completed Raza step button', () => {
    // Set race so Raza step is 'complete' and clickable, then switch to alignment
    useCharacterFoundationStore.getState().setRace('race:human');
    usePlannerShellStore.setState({ activeOriginStep: 'alignment' });

    render(createElement(CreationStepper));

    const razaButton = screen.getByRole('button', { name: /Raza.*Humano/ });
    fireEvent.click(razaButton);

    expect(usePlannerShellStore.getState().activeOriginStep).toBe('race');
  });

  it('renders Resumen bottom button (Utilidades removed per UAT-2026-04-20 G2)', () => {
    render(createElement(CreationStepper));

    expect(screen.getByRole('button', { name: 'Resumen' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Utilidades' })).toBeNull();
  });
});
