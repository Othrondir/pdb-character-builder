// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { CharacterSheet } from '@planner/components/shell/character-sheet';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { compiledSkillCatalog } from '@planner/data/compiled-skills';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';

const ATTRIBUTE_LABELS = [
  'Fuerza',
  'Destreza',
  'Constitucion',
  'Inteligencia',
  'Sabiduria',
  'Carisma',
] as const;

function getArmorClassValue(): string | null | undefined {
  return screen.getByText('CA').closest('div')?.querySelector('dd')?.textContent;
}

function getArmorClassNumber(): number {
  const value = getArmorClassValue();
  if (value == null) {
    throw new Error('Missing visible armor class value');
  }
  return Number(value);
}

function getAttacksValue(): string | null | undefined {
  return screen
    .getByText('Ataques/asalto')
    .closest('div')
    ?.querySelector('dd')
    ?.textContent;
}

function getAttributeNumber(label: (typeof ATTRIBUTE_LABELS)[number]): number {
  const value = screen
    .getByText(label)
    .closest('div')
    ?.querySelector('.stat-value')
    ?.textContent;
  if (value == null) {
    throw new Error(`Missing visible attribute value for ${label}`);
  }
  return Number(value);
}

function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function getClassPortraitSrc(): string | null {
  return screen
    .getByTestId('character-class-portrait')
    .getAttribute('src');
}

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

  it('always shows the fallback class portrait when no class is selected', () => {
    render(createElement(CharacterSheet));

    expect(
      screen.getByRole('img', { name: 'Sin clase seleccionada' }),
    ).toBeInTheDocument();
    expect(getClassPortraitSrc()).toContain('no-class');
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

  it('adds the simulated equipment attack bonus and toggles presets off', () => {
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

    expect(getAttacksValue()).toBe('+6 / +1');

    const level12Button = screen.getByRole('button', {
      name: 'Simular Equipo nivel 12',
    });
    fireEvent.click(level12Button);
    expect(getAttacksValue()).toBe('+11 / +6');
    expect(level12Button).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(level12Button);
    expect(getAttacksValue()).toBe('+6 / +1');
    expect(level12Button).toHaveAttribute('aria-pressed', 'false');

    const level16Button = screen.getByRole('button', {
      name: 'Simular Equipo nivel 16',
    });
    fireEvent.click(level16Button);
    expect(getAttacksValue()).toBe('+11 / +6');
    expect(level16Button).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(level16Button);
    expect(getAttacksValue()).toBe('+6 / +1');
    expect(level16Button).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the portrait for the class with the most selected levels', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as any);
    useLevelProgressionStore
      .getState()
      .setLevelClassId(1 as ProgressionLevel, 'class:wizard' as CanonicalId);
    useLevelProgressionStore
      .getState()
      .setLevelClassId(2 as ProgressionLevel, 'class:fighter' as CanonicalId);
    useLevelProgressionStore
      .getState()
      .setLevelClassId(3 as ProgressionLevel, 'class:fighter' as CanonicalId);

    render(createElement(CharacterSheet));

    expect(getClassPortraitSrc()).toContain('fighter');
  });

  it('breaks class portrait ties with the most recent class selection', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as any);
    useLevelProgressionStore
      .getState()
      .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
    useLevelProgressionStore
      .getState()
      .setLevelClassId(2 as ProgressionLevel, 'class:wizard' as CanonicalId);

    render(createElement(CharacterSheet));

    expect(getClassPortraitSrc()).toContain('wizard');
  });

  it('falls back to the default portrait for classes without an icon', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as any);
    useLevelProgressionStore
      .getState()
      .setLevelClassId(
        1 as ProgressionLevel,
        'class:shadowdancer' as CanonicalId,
      );

    render(createElement(CharacterSheet));

    expect(getClassPortraitSrc()).toContain('no-class');
  });

  it('adds simulated equipment, armor, and shield bonuses to the visible AC', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as any);

    render(createElement(CharacterSheet));

    const baseArmorClass = getArmorClassNumber();
    const baseDexterity = getAttributeNumber('Destreza');
    const level12DexterityModifierDelta =
      getAbilityModifier(baseDexterity + 4) - getAbilityModifier(baseDexterity);
    const level16DexterityModifierDelta =
      getAbilityModifier(baseDexterity + 6) - getAbilityModifier(baseDexterity);

    fireEvent.click(
      screen.getByRole('button', { name: 'Simular Equipo nivel 12' }),
    );
    expect(getArmorClassNumber()).toBe(
      baseArmorClass + 15 + level12DexterityModifierDelta,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tipo de Armadura' }));
    expect(
      screen.getByRole('dialog', { name: 'Tipo de Armadura' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'CA 8' }));
    expect(getArmorClassNumber()).toBe(
      baseArmorClass + 15 + level12DexterityModifierDelta + 8,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tipo de Escudo' }));
    expect(
      screen.getByRole('dialog', { name: 'Tipo de Escudo' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Escudo Pavés' }));
    expect(getArmorClassNumber()).toBe(
      baseArmorClass + 15 + level12DexterityModifierDelta + 8 + 3,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Simular Equipo nivel 16' }),
    );
    expect(getArmorClassNumber()).toBe(
      baseArmorClass + 19 + level16DexterityModifierDelta + 8 + 3,
    );
  });

  it('toggles selected armor and shield bonuses off from their dialogs', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as any);

    render(createElement(CharacterSheet));

    const baseArmorClass = getArmorClassNumber();

    fireEvent.click(screen.getByRole('button', { name: 'Tipo de Armadura' }));
    fireEvent.click(screen.getByRole('button', { name: 'CA 8' }));
    expect(getArmorClassNumber()).toBe(baseArmorClass + 8);

    fireEvent.click(screen.getByRole('button', { name: 'Tipo de Armadura' }));
    fireEvent.click(screen.getByRole('button', { name: 'CA 8' }));
    expect(getArmorClassNumber()).toBe(baseArmorClass);

    fireEvent.click(screen.getByRole('button', { name: 'Tipo de Escudo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Escudo Pavés' }));
    expect(getArmorClassNumber()).toBe(baseArmorClass + 3);

    fireEvent.click(screen.getByRole('button', { name: 'Tipo de Escudo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Escudo Pavés' }));
    expect(getArmorClassNumber()).toBe(baseArmorClass);
  });

  it('adds simulated equipment bonuses to every visible attribute', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as any);

    render(createElement(CharacterSheet));

    const baseAttributes = new Map(
      ATTRIBUTE_LABELS.map((label) => [label, getAttributeNumber(label)]),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Simular Equipo nivel 12' }),
    );
    for (const label of ATTRIBUTE_LABELS) {
      expect(getAttributeNumber(label)).toBe((baseAttributes.get(label) ?? 0) + 4);
    }

    fireEvent.click(
      screen.getByRole('button', { name: 'Simular Equipo nivel 16' }),
    );
    for (const label of ATTRIBUTE_LABELS) {
      expect(getAttributeNumber(label)).toBe((baseAttributes.get(label) ?? 0) + 6);
    }
  });

  it('lists every skill in the skill bonus dialog and toggles +7 bonuses', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as any);
    const firstSkill = [...compiledSkillCatalog.skills].sort((left, right) =>
      left.label.localeCompare(right.label, 'es'),
    )[0];

    render(createElement(CharacterSheet));

    fireEvent.click(screen.getByRole('button', { name: 'Bono de Habilidad' }));
    const dialog = screen.getByRole('dialog', { name: 'Bono de Habilidad' });
    expect(
      dialog.querySelectorAll('.character-sheet-skill-bonus-dialog__option'),
    ).toHaveLength(compiledSkillCatalog.skills.length);

    const skillButton = within(dialog).getByRole('button', {
      name: new RegExp(firstSkill.label),
    });
    expect(skillButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(skillButton);
    expect(skillButton).toHaveAttribute('aria-pressed', 'true');
    expect(within(skillButton).getByText('+7')).toBeInTheDocument();

    fireEvent.click(skillButton);
    expect(skillButton).toHaveAttribute('aria-pressed', 'false');
  });
});
