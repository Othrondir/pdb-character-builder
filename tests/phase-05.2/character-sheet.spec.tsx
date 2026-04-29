// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { CharacterSheet } from '@planner/components/shell/character-sheet';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';

describe('phase 05.2 character sheet', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    usePlannerShellStore.setState({ characterSheetTab: 'stats' });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders an aside with aria-label "Hoja de personaje"', () => {
    render(createElement(CharacterSheet));

    const aside = screen.getByRole('complementary', { name: 'Hoja de personaje' });
    expect(aside).toBeInTheDocument();
    expect(aside.tagName).toBe('ASIDE');
  });

  it('renders the title bar with "Hoja de personaje" text', () => {
    render(createElement(CharacterSheet));

    const titleBar = document.querySelector('.character-sheet__title-bar');
    expect(titleBar).toBeInTheDocument();
    expect(titleBar?.textContent).toContain('Hoja de personaje');
  });

  it('does not render the obsolete sheet tablist', () => {
    render(createElement(CharacterSheet));

    expect(
      screen.queryByRole('tablist', { name: 'Hoja de personaje' }),
    ).not.toBeInTheDocument();
  });

  it('does not render Habilidades or Dotes tabs in the right sheet', () => {
    render(createElement(CharacterSheet));

    expect(screen.queryByRole('tab', { name: 'Habilidades' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Dotes' })).not.toBeInTheDocument();
  });

  it('shows empty state when no race is selected', () => {
    render(createElement(CharacterSheet));

    expect(screen.getByText('La hoja aun esta vacia')).toBeInTheDocument();
    expect(
      screen.getByText('Empieza seleccionando una raza para definir la base de tu personaje.'),
    ).toBeInTheDocument();
  });

  it('shows attribute labels in Spanish when race is selected', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as any);

    render(createElement(CharacterSheet));

    expect(screen.getByText('Fuerza')).toBeInTheDocument();
    expect(screen.getByText('Destreza')).toBeInTheDocument();
    expect(screen.getByText('Constitucion')).toBeInTheDocument();
    expect(screen.getByText('Inteligencia')).toBeInTheDocument();
    expect(screen.getByText('Sabiduria')).toBeInTheDocument();
    expect(screen.getByText('Carisma')).toBeInTheDocument();
  });

  it('renders stat-value class for numeric attribute values', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as any);

    const { container } = render(createElement(CharacterSheet));

    const statValues = container.querySelectorAll('.stat-value');
    expect(statValues.length).toBe(6);
  });

  it('always renders stats content even if the shell has a stale sheet tab', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as any);
    usePlannerShellStore.setState({ characterSheetTab: 'skills' });

    render(createElement(CharacterSheet));

    expect(screen.getByText('Fuerza')).toBeInTheDocument();
    expect(screen.queryByText('Habilidades del personaje')).not.toBeInTheDocument();
  });

  it('applies level-up ability increases to the visible stat totals', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human' as any);
    foundation.setBaseAttribute('str', 16);
    useLevelProgressionStore.getState().setLevelAbilityIncrease(4 as any, 'str');

    render(createElement(CharacterSheet));

    const fuerzaCell = screen.getByText('Fuerza').closest('div');
    expect(fuerzaCell?.querySelector('.stat-value')?.textContent).toBe('17');
    expect(fuerzaCell?.querySelector('.stat-mod')?.textContent).toBe('(+3)');
  });

  it('shows real BAB and iterative attacks per round under BAB', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as any);
    for (let level = 1; level <= 6; level += 1) {
      useLevelProgressionStore
        .getState()
        .setLevelClassId(
          level as ProgressionLevel,
          'class:fighter' as CanonicalId,
        );
    }

    render(createElement(CharacterSheet));

    const babCell = screen.getByText('BAB').closest('div');
    const attacksCell = screen.getByText('Ataques/asalto').closest('div');

    expect(babCell?.querySelector('dd')?.textContent).toBe('+6');
    expect(attacksCell?.querySelector('dd')?.textContent).toBe('+6 / +1');
  });
});
