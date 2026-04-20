// @vitest-environment jsdom

import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';

function primeOrigin() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
}

// Phase 12.6-05 restored: Plan 03 replaced the legacy single-level
// SelectionScreen with a 20-row <ol.level-progression__list>; Plan 04
// remounted ClassPicker inside the expanded-row slot of the active level;
// Plan 05 deleted LevelRail. This spec is restored to lock the shell
// integration: when origin is ready + activeLevelSubStep === 'class' +
// expandedLevel !== null, PlannerShellFrame mounts BuildProgressionBoard
// which renders the 20-row scan list with the active row's expanded slot
// hosting ClassPicker. The legacy heading + radiogroup assertions are
// obsolete; post-12.6 equivalents are asserted below.
describe('phase 04 build progression shell', () => {
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

  it('renders the 20-row scan list and an expanded L1 slot once the origin is ready', () => {
    primeOrigin();

    render(createElement(PlannerShellFrame));

    // 20-row scan surface (PROG-04 R5 — replaces the legacy radiogroup).
    const rows = document.querySelectorAll('[data-level-row]');
    expect(rows).toHaveLength(20);

    // Active row (L1) expanded — hosts ClassPicker (PROG-04 R6 — Plan 04
    // migrated the ClassPicker mount into the expanded-row slot).
    const l1Expanded = document.querySelector(
      '[data-testid="level-row-1-expanded"]',
    );
    expect(l1Expanded).not.toBeNull();
    expect(l1Expanded?.querySelector('.class-picker__list')).not.toBeNull();
  });
});
