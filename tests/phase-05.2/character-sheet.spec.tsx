// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CharacterSheet } from '@planner/components/shell/character-sheet';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';

describe('phase 05.2 character sheet', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
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

  it('renders a tablist with aria-label "Hoja de personaje"', () => {
    render(createElement(CharacterSheet));

    const tablist = screen.getByRole('tablist', { name: 'Hoja de personaje' });
    expect(tablist).toBeInTheDocument();
  });

  it('renders 4 tabs with correct labels', () => {
    render(createElement(CharacterSheet));

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveTextContent('Estadisticas');
    expect(tabs[1]).toHaveTextContent('Habilidades');
    expect(tabs[2]).toHaveTextContent('Dotes');
    expect(tabs[3]).toHaveTextContent('Conjuros');
  });

  it('marks the active tab with aria-selected="true"', () => {
    render(createElement(CharacterSheet));

    const statsTab = screen.getByRole('tab', { name: 'Estadisticas' });
    expect(statsTab).toHaveAttribute('aria-selected', 'true');

    const skillsTab = screen.getByRole('tab', { name: 'Habilidades' });
    expect(skillsTab).toHaveAttribute('aria-selected', 'false');
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

  it('switches tab content when clicking a different tab', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as any);

    render(createElement(CharacterSheet));

    // Initially shows stats panel
    expect(screen.getByText('Fuerza')).toBeInTheDocument();

    // Click skills tab
    fireEvent.click(screen.getByRole('tab', { name: 'Habilidades' }));
    expect(screen.getByText('Habilidades del personaje')).toBeInTheDocument();

    // Click feats tab
    fireEvent.click(screen.getByRole('tab', { name: 'Dotes' }));
    expect(screen.getByText('0 dotes')).toBeInTheDocument();

    // Click spells tab — Phase 07-03 replaces the SpellsPanel placeholder with
    // the live MagicSheetTab, which renders a "{N} conjuros" header via the
    // magic selector. Assert the new header content instead of the old
    // placeholder copy.
    fireEvent.click(screen.getByRole('tab', { name: 'Conjuros' }));
    expect(screen.getByText(/\d+ conjuros/)).toBeInTheDocument();
  });
});
