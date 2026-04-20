// @vitest-environment jsdom

import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';

function primeOrigin() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
}

// Phase 12.6-03 (PROG-04 R5) superseded this surface: BuildProgressionBoard
// no longer renders the legacy single-level SelectionScreen with the
// "Selecciona la clase del nivel" heading + "Nivel de progresion" radiogroup.
// It now renders a 20-row <ol.level-progression__list>. The ClassPicker will
// remount inside the expanded-row slot in Plan 12.6-04. This spec is skipped
// until Plan 04 lands that host swap; the new invariants are locked by
// tests/phase-12.6/level-progression-scan.spec.tsx (Plan 03 Suites A+B +
// Plan 04 Suite C).
describe.skip('phase 04 build progression shell', () => {
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

  it('renders the class selection screen and level rail once the origin is ready', () => {
    primeOrigin();

    render(createElement(PlannerShellFrame));

    expect(
      screen.getByRole('heading', { name: /Selecciona la clase del nivel/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'Nivel de progresion' }),
    ).toBeInTheDocument();
  });
});
