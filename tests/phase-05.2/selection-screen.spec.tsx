// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { OptionList } from '@planner/components/ui/option-list';
import type { OptionItem } from '@planner/components/ui/option-list';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { ActionBar } from '@planner/components/ui/action-bar';

const sampleItems: OptionItem[] = [
  { id: 'race:human', label: 'Humano', selected: true },
  { id: 'race:elf', label: 'Elfo', secondary: 'ELF' },
  { id: 'race:dwarf', label: 'Enano Escudo', blocked: true },
  { id: 'race:halfling', label: 'Mediano', disabled: true },
];

describe('phase 05.2 selection screen primitives', () => {
  afterEach(() => {
    cleanup();
  });

  describe('SelectionScreen', () => {
    it('renders the title bar with the provided title in uppercase', () => {
      render(
        createElement(SelectionScreen, { title: 'Selecciona la raza' },
          createElement('div', null, 'content'),
        ),
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Selecciona la raza');
      expect(heading.closest('.selection-screen__title-bar')).toBeInTheDocument();
    });

    it('renders children inside the content area', () => {
      render(
        createElement(SelectionScreen, { title: 'Test' },
          createElement('div', { 'data-testid': 'inner' }, 'inner content'),
        ),
      );

      expect(screen.getByTestId('inner')).toBeInTheDocument();
    });

    it('renders the action bar when provided', () => {
      const actionBar = createElement(ActionBar, {
        onAccept: () => {},
        onCancel: () => {},
      });

      render(
        createElement(SelectionScreen, { title: 'Test', actionBar },
          createElement('div', null, 'content'),
        ),
      );

      expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });

    it('does not render the action bar section when not provided', () => {
      const { container } = render(
        createElement(SelectionScreen, { title: 'Test' },
          createElement('div', null, 'content'),
        ),
      );

      expect(container.querySelector('.selection-screen__action-bar')).toBeNull();
    });
  });

  describe('OptionList', () => {
    it('renders a listbox container', () => {
      const onSelect = vi.fn();
      render(createElement(OptionList, { items: sampleItems, onSelect }));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('renders option items for each OptionItem', () => {
      const onSelect = vi.fn();
      render(createElement(OptionList, { items: sampleItems, onSelect }));

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
    });

    it('triggers onSelect with the correct ID when an item is clicked', () => {
      const onSelect = vi.fn();
      render(createElement(OptionList, { items: sampleItems, onSelect }));

      fireEvent.click(screen.getByRole('option', { name: /Elfo/ }));
      expect(onSelect).toHaveBeenCalledWith('race:elf');
    });

    it('marks selected item with aria-selected and is-selected class', () => {
      const onSelect = vi.fn();
      render(createElement(OptionList, { items: sampleItems, onSelect }));

      const selectedOption = screen.getByRole('option', { name: /Humano/ });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
      expect(selectedOption).toHaveClass('is-selected');
    });

    it('marks blocked item with is-blocked class', () => {
      const onSelect = vi.fn();
      render(createElement(OptionList, { items: sampleItems, onSelect }));

      const blockedOption = screen.getByRole('option', { name: /Enano Escudo/ });
      expect(blockedOption).toHaveClass('is-blocked');
    });

    it('marks disabled item as disabled', () => {
      const onSelect = vi.fn();
      render(createElement(OptionList, { items: sampleItems, onSelect }));

      const disabledOption = screen.getByRole('option', { name: /Mediano/ });
      expect(disabledOption).toBeDisabled();
    });

    it('renders secondary text when provided', () => {
      const onSelect = vi.fn();
      render(createElement(OptionList, { items: sampleItems, onSelect }));

      expect(screen.getByText('ELF')).toBeInTheDocument();
      expect(screen.getByText('ELF')).toHaveClass('option-list__secondary');
    });
  });

  describe('DetailPanel', () => {
    it('renders the title when provided', () => {
      render(createElement(DetailPanel, { title: 'Humano' }));

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Humano');
      expect(heading).toHaveClass('detail-panel__title');
    });

    it('renders body text when provided', () => {
      render(createElement(DetailPanel, { body: 'Descripcion de la raza humana.' }));

      expect(screen.getByText('Descripcion de la raza humana.')).toBeInTheDocument();
    });

    it('renders custom children', () => {
      render(
        createElement(DetailPanel, null,
          createElement('span', { 'data-testid': 'custom' }, 'custom content'),
        ),
      );

      expect(screen.getByTestId('custom')).toBeInTheDocument();
    });
  });

  describe('SelectionScreen with OptionList + DetailPanel composition', () => {
    it('renders the full list+detail pattern inside a selection screen', () => {
      const onSelect = vi.fn();

      render(
        createElement(
          SelectionScreen,
          { title: 'Selecciona la raza de tu personaje' },
          createElement(OptionList, { items: sampleItems, onSelect }),
          createElement(DetailPanel, { title: 'Humano', body: 'Los humanos son versatiles.' }),
        ),
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Selecciona la raza de tu personaje',
      );
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(4);
      expect(screen.getByText('Los humanos son versatiles.')).toBeInTheDocument();
    });
  });
});
