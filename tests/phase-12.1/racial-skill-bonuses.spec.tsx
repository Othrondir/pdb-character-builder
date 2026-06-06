// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { SkillSheet } from '@planner/features/skills/skill-sheet';
import { selectActiveSkillSheetView } from '@planner/features/skills/selectors';
import { useSkillStore } from '@planner/features/skills/store';
import { useResumenViewModel } from '@planner/features/summary/resumen-selectors';

function setupL1Rogue(raceId: CanonicalId, subraceId: CanonicalId | null = null) {
  const foundation = useCharacterFoundationStore.getState();
  foundation.setRace(raceId);
  if (subraceId) {
    foundation.setSubrace(subraceId);
  }

  useLevelProgressionStore
    .getState()
    .setLevelClassId(1, 'class:rogue' as CanonicalId);
  useSkillStore.getState().setActiveLevel(1);
}

function getSkillRow(skillId: string) {
  const sheet = selectActiveSkillSheetView(
    useSkillStore.getState(),
    useLevelProgressionStore.getState(),
    useCharacterFoundationStore.getState(),
  );

  return sheet.groups.flatMap((group) => group.rows).find((row) => row.skillId === skillId);
}

describe('quick 260606-i9j — racial and subrace skill bonuses', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    useSkillStore.getState().resetSkillAllocations();
  });

  afterEach(() => cleanup());

  it('adds Liche skill bonuses to the active skill sheet without spending ranks', () => {
    setupL1Rogue('race:human' as CanonicalId, 'subrace:liche' as CanonicalId);

    const search = getSkillRow('skill:buscar');

    expect(search).toMatchObject({
      currentRank: 0,
      currentTotal: 8,
      maxAssignableRank: 4,
      racialBonus: 8,
    });
  });

  it('stacks base race and subrace skill bonuses', () => {
    setupL1Rogue('race:elf' as CanonicalId, 'subrace:elf-liche' as CanonicalId);

    const search = getSkillRow('skill:buscar');
    const listen = getSkillRow('skill:escuchar');

    expect(search?.racialBonus).toBe(10);
    expect(search?.currentTotal).toBe(10);
    expect(listen?.racialBonus).toBe(10);
    expect(listen?.currentTotal).toBe(10);
  });

  it('renders the racial bonus in the total without adding an inline marker', () => {
    setupL1Rogue('race:human' as CanonicalId, 'subrace:engendro-vampirico' as CanonicalId);

    const { container } = render(createElement(SkillSheet));
    const bluffRow = Array.from(
      container.querySelectorAll<HTMLElement>('.skill-sheet__row'),
    ).find((entry) => entry.textContent?.includes('Engañar'));

    expect(bluffRow).toBeDefined();
    expect(
      bluffRow!.querySelector<HTMLInputElement>('input[type="number"]')?.value,
    ).toBe('0');
    expect(
      bluffRow!.querySelector<HTMLElement>('.skill-sheet__total-value')
        ?.textContent,
    ).toBe('2');
    expect(bluffRow?.textContent).not.toContain('racial');
  });

  it('includes racial and subrace skill bonuses in the summary totals', () => {
    setupL1Rogue('race:human' as CanonicalId, 'subrace:liche' as CanonicalId);

    const { result } = renderHook(() => useResumenViewModel());
    const search = result.current.skills.find((row) => row.skillId === 'skill:buscar');

    expect(search).toMatchObject({
      abilityMod: 0,
      ranks: 0,
      total: 8,
    });
  });
});
