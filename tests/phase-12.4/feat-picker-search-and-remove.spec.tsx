// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';

import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { FeatBoard } from '@planner/features/feats/feat-board';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

function resetStores(): void {
  cleanup();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  useLevelProgressionStore.getState().resetProgression();
  useFeatStore.getState().resetFeatSelections();
  useCharacterFoundationStore.getState().resetFoundation();
  useSkillStore.getState().resetSkillAllocations();
}

function setupL1Guerrero(): void {
  useCharacterFoundationStore.getState().setRace('race:elf' as CanonicalId);
  useCharacterFoundationStore
    .getState()
    .setAlignment('alignment:lawful-good' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
  useFeatStore.getState().setActiveLevel(1 as ProgressionLevel);
}

function setupL1HumanoGuerreroConClaseElegida(): void {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  useCharacterFoundationStore
    .getState()
    .setAlignment('alignment:lawful-good' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
  useFeatStore.getState().setActiveLevel(1 as ProgressionLevel);
  useFeatStore
    .getState()
    .setClassFeat(1 as ProgressionLevel, 'feat:carrera' as CanonicalId);
}

function getSearchInput(): HTMLInputElement {
  return screen.getByRole('searchbox', {
    name: /Buscar dotes por nombre/i,
  });
}

describe('Quick task 260604-p8q — feat picker search and remove affordances', () => {
  beforeEach(() => resetStores());
  afterEach(() => cleanup());

  it('shows a visible search box while the picker is active', () => {
    setupL1Guerrero();
    render(createElement(FeatBoard));

    expect(getSearchInput()).toBeInTheDocument();
  });

  it('keeps the full list for 0-2 character queries and filters from 3 onward', () => {
    setupL1Guerrero();
    render(createElement(FeatBoard));

    const searchInput = getSearchInput();
    expect(document.querySelector('[data-feat-id="feat:carrera"]')).not.toBeNull();

    fireEvent.change(searchInput, { target: { value: 'es' } });
    expect(document.querySelector('[data-feat-id="feat:carrera"]')).not.toBeNull();

    fireEvent.change(searchInput, { target: { value: 'esq' } });
    expect(document.querySelector('[data-feat-id="feat:dodge"]')).not.toBeNull();
    expect(document.querySelector('[data-feat-id="feat:carrera"]')).toBeNull();
  });

  it('matches search queries without case or accents and keeps families folded', () => {
    setupL1HumanoGuerreroConClaseElegida();
    render(createElement(FeatBoard));

    fireEvent.change(getSearchInput(), {
      target: { value: 'CONCENTRACION' },
    });

    expect(
      document.querySelector('[data-family-id="feat:skill-focus"]'),
    ).not.toBeNull();
    expect(document.querySelector('[data-feat-id="feat:carrera"]')).toBeNull();
  });

  it('clears the query and restores the full list', () => {
    setupL1Guerrero();
    render(createElement(FeatBoard));

    const searchInput = getSearchInput();
    fireEvent.change(searchInput, { target: { value: 'esq' } });
    fireEvent.click(
      screen.getByRole('button', { name: /Limpiar búsqueda/i }),
    );

    expect(searchInput).toHaveValue('');
    expect(document.querySelector('[data-feat-id="feat:carrera"]')).not.toBeNull();
  });

  it('shows an explicit Quitar action on selected simple rows', () => {
    setupL1Guerrero();
    useFeatStore
      .getState()
      .setClassFeat(1 as ProgressionLevel, 'feat:carrera' as CanonicalId);

    render(createElement(FeatBoard));

    const removeButton = document.querySelector<HTMLButtonElement>(
      '[data-remove-feat-id="feat:carrera"]',
    );
    expect(removeButton).not.toBeNull();
    expect(removeButton).toHaveTextContent('Quitar');

    fireEvent.click(removeButton!);

    const featRecord = useFeatStore.getState().levels.find((row) => row.level === 1);
    expect(featRecord?.classFeatId ?? null).toBeNull();
  });

  it('shows an explicit Quitar action on selected family rows', () => {
    const concentrationFeat = compiledFeatCatalog.feats.find((feat) =>
      /Soltura con una habilidad \(Concentraci[oó]n\)/i.test(feat.label),
    );
    expect(concentrationFeat).toBeDefined();

    setupL1HumanoGuerreroConClaseElegida();
    useFeatStore
      .getState()
      .setGeneralFeat(1 as ProgressionLevel, concentrationFeat!.id as CanonicalId);

    render(createElement(FeatBoard));

    expect(
      document.querySelector('[data-family-id="feat:skill-focus"]'),
    ).not.toBeNull();
    const removeButton = document.querySelector<HTMLButtonElement>(
      `[data-remove-feat-id="${concentrationFeat!.id}"]`,
    );
    expect(removeButton).not.toBeNull();
    expect(removeButton).toHaveTextContent('Quitar');

    fireEvent.click(removeButton!);

    const featRecord = useFeatStore.getState().levels.find((row) => row.level === 1);
    expect(featRecord?.generalFeatId ?? null).toBeNull();
  });
});
