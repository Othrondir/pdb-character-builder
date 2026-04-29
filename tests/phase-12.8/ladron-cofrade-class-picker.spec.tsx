// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import { ClassPicker } from '@planner/features/level-progression/class-picker';
import { getPhase04ClassRecord } from '@planner/features/level-progression/class-fixture';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

function level(n: number): ProgressionLevel {
  return n as ProgressionLevel;
}

function id(value: string): CanonicalId {
  return value as CanonicalId;
}

function resetStores() {
  cleanup();
  document.body.innerHTML = '';
  useCharacterFoundationStore.getState().resetFoundation();
  useFeatStore.getState().resetFeatSelections();
  useLevelProgressionStore.getState().resetProgression();
  useSkillStore.getState().resetSkillAllocations();
}

function setupRoguePriorLevelsForLadronCofrade() {
  useCharacterFoundationStore.getState().setRace(id('race:human'));
  useCharacterFoundationStore.getState().setAlignment(id('alignment:true-neutral'));

  for (let n = 1; n <= 5; n += 1) {
    useLevelProgressionStore
      .getState()
      .setLevelClassId(level(n), id('class:rogue'));
  }
  useLevelProgressionStore.getState().setActiveLevel(level(6));
}

function setupLadronCofradePartialAtLevel6() {
  setupRoguePriorLevelsForLadronCofrade();

  useFeatStore.getState().setGeneralFeat(level(1), id('feat:thug'));

  useSkillStore.getState().setSkillRank(level(1), id('skill:esconderse'), 4);
  useSkillStore.getState().setSkillRank(level(2), id('skill:esconderse'), 1);
  useSkillStore.getState().setSkillRank(level(3), id('skill:esconderse'), 1);
  useSkillStore.getState().setSkillRank(level(4), id('skill:esconderse'), 1);
  useSkillStore.getState().setSkillRank(level(5), id('skill:esconderse'), 1);
}

function setupLadronCofradeEligibleAtLevel6() {
  setupLadronCofradePartialAtLevel6();

  useSkillStore.getState().setSkillRank(level(1), id('skill:engaar'), 3);
  useSkillStore.getState().setSkillRank(level(1), id('skill:intimidar'), 3);
  useSkillStore
    .getState()
    .setSkillRank(level(1), id('skill:moversesigilosamente'), 3);
  useSkillStore
    .getState()
    .setSkillRank(level(1), id('skill:reunirinformacion'), 3);
}

function getLadronCofradeRow(): HTMLButtonElement {
  const row = document.querySelector<HTMLButtonElement>(
    '[data-class-id="class:ladron-sombras-amn"]',
  );
  if (!row) {
    throw new Error('Expected Ladrón Cofrade row to render');
  }
  return row;
}

describe('Phase 12.8 — Ladrón Cofrade prestige selection', () => {
  beforeEach(resetStores);
  afterEach(cleanup);

  it('does not keep the generic pending-requirements block for Ladrón Cofrade', () => {
    const record = getPhase04ClassRecord(id('class:ladron-sombras-amn'));

    expect(record?.label).toBe('Ladrón Cofrade');
    expect(record?.deferredRequirementLabels).toEqual([]);
  });

  it('allows Ladrón Cofrade at level 6 when prior levels meet the modeled requirements', () => {
    setupLadronCofradeEligibleAtLevel6();

    render(createElement(ClassPicker));

    const row = getLadronCofradeRow();

    expect(row.disabled).toBe(false);
    expect(row.getAttribute('aria-disabled')).toBe('false');
    expect(row.textContent).not.toContain('Pendiente de dotes o habilidades');
  });

  it('renders every modeled Ladrón Cofrade requirement with visible met/unmet states', () => {
    setupLadronCofradePartialAtLevel6();

    render(createElement(ClassPicker));

    const row = getLadronCofradeRow();
    const items = Array.from(
      row.querySelectorAll<HTMLElement>('.class-picker__requirement'),
    );
    const text = row.textContent ?? '';

    expect(items).toHaveLength(6);
    expect(text).toContain('Requiere 3 rangos de Engañar');
    expect(text).toContain('Requiere 8 rangos de Esconderse');
    expect(text).toContain('Requiere 3 rangos de Intimidar');
    expect(text).toContain('Requiere 3 rangos de Moverse sigilosamente');
    expect(text).toContain('Requiere 3 rangos de Reunir información');
    expect(text).toContain('Requiere dote: Matón');

    const esconderse = items.find((item) =>
      item.textContent?.includes('Esconderse'),
    );
    const maton = items.find((item) => item.textContent?.includes('Matón'));
    const enganar = items.find((item) => item.textContent?.includes('Engañar'));

    expect(esconderse?.dataset.requirementStatus).toBe('met');
    expect(maton?.dataset.requirementStatus).toBe('met');
    expect(enganar?.dataset.requirementStatus).toBe('unmet');
    expect(text).toContain('Cumple');
    expect(text).toContain('Falta');
  });
});
