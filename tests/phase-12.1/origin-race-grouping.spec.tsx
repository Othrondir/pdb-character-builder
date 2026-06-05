// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { createElement } from 'react';

import { OriginBoard } from '@planner/features/character-foundation/origin-board';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

describe('quick 260606-e5f / 260606-f6g — grouped origin race picker', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
  });

  afterEach(() => cleanup());

  it('separates Raza into basic, minor, intermediate, and major sections', () => {
    render(createElement(OriginBoard, { activeStep: 'race' }));

    const basic = screen.getByRole('group', { name: 'Razas básicas' });
    const minor = screen.getByRole('group', { name: 'Subrazas menores' });
    const intermediate = screen.getByRole('group', {
      name: 'Subrazas intermedias',
    });
    const major = screen.getByRole('group', { name: 'Subrazas mayores' });

    expect(
      within(basic).getByRole('option', { name: 'Humano' }),
    ).toBeInTheDocument();
    expect(
      within(minor).getByRole('option', { name: 'Mediano Fortecor' }),
    ).toBeInTheDocument();
    expect(
      within(intermediate).getByRole('option', { name: 'Tanarukk' }),
    ).toBeInTheDocument();
    expect(
      within(major).getByRole('option', { name: 'Ogro hechicero' }),
    ).toBeInTheDocument();
  });

  it('keeps race selection wired to the original race id', () => {
    render(createElement(OriginBoard, { activeStep: 'race' }));

    fireEvent.click(screen.getByRole('option', { name: 'Ogro hechicero' }));

    expect(useCharacterFoundationStore.getState().raceId).toBe(
      'race:ogro-hechicero' as CanonicalId,
    );
  });

  it('shows the selected subrace mechanical description in the detail panel', () => {
    render(createElement(OriginBoard, { activeStep: 'race' }));

    fireEvent.click(screen.getByRole('option', { name: 'Humano' }));
    fireEvent.click(screen.getByRole('option', { name: 'Liche' }));

    expect(
      screen.getByRole('heading', { name: 'Humano · Liche' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/CA natural: \+5/)).toBeInTheDocument();
    expect(screen.getByText(/\+2 Inteligencia/)).toBeInTheDocument();
  });
});
