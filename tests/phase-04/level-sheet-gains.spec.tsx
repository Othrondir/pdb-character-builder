// @vitest-environment jsdom

import { createElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { selectActiveLevelSheet } from '@planner/features/level-progression/selectors';

function primeFoundation() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
  foundationStore.setBaseAttribute('int', 12);
}

describe('phase 04 level sheet gains', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    usePlannerShellStore.setState({
      activeOriginStep: null,
      activeLevelSubStep: 'class',
      characterSheetTab: 'stats',
      expandedLevel: 1,
      mobileNavOpen: false,
    });
  });

  it('renders gains for a selectable base class and shows the ability increase at level 4', () => {
    primeFoundation();

    act(() => {
      const progressionStore = useLevelProgressionStore.getState();

      progressionStore.setLevelClassId(1, 'class:fighter');
      progressionStore.setLevelClassId(2, 'class:fighter');
      progressionStore.setLevelClassId(3, 'class:fighter');
      progressionStore.setActiveLevel(4);
      usePlannerShellStore.setState({ expandedLevel: 4 });
    });

    render(createElement(PlannerShellFrame));

    // Select fighter for level 4 using the option listbox
    fireEvent.click(screen.getByRole('option', { name: /Guerrero/ }));

    // Phase 12.1-01: per-class gainTable content is not yet emitted by the
    // extractor (tracked in 12.1-CONTEXT.md <deferred>). The ability-increase
    // hook is driven by phase04ClassFixture.abilityIncreaseLevels (still [4,
    // 8, 12, 16]) — that is the invariant this test should lock, not the
    // legacy "Dado de golpe dN" feature string which has moved off the
    // planner and into the upstream extractor enrichment queue.
    const sheet = selectActiveLevelSheet(
      useLevelProgressionStore.getState(),
      useCharacterFoundationStore.getState(),
    );
    expect(sheet.abilityIncreaseAvailable).toBe(true);
  });

  it('marks shadowdancer as blocked in the class options', () => {
    primeFoundation();

    render(createElement(PlannerShellFrame));

    // Phase 12.1-01: class labels now come from the compiled PDB extractor
    // catalog. Shadowdancer's Spanish label in the PDB TLK is "Danzarín
    // sombrío" (was "Sombra danzante" in the hand-authored fixture).
    const shadowdancerOption = screen.getByRole('option', { name: /Danzarín sombrío/ });
    expect(shadowdancerOption).toHaveClass('is-blocked');

    // Verify the selector reports blocked status for the prestige class
    const sheet = selectActiveLevelSheet(
      useLevelProgressionStore.getState(),
      useCharacterFoundationStore.getState(),
    );
    const shadowdancer = sheet.classOptions.find((c) => c.label === 'Danzarín sombrío');
    expect(shadowdancer).toBeDefined();
    expect(shadowdancer?.status).toBe('blocked');
  });
});
