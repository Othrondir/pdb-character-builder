// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { AttributesBoard } from '@planner/features/character-foundation/attributes-board';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { PUERTA_POINT_BUY_SNAPSHOT } from '@rules-engine/foundation/point-buy-snapshot';

// Phase 12.6 (Rule 3 auto-fix) — Plan 02 swaps the runtime path from the
// uniform foundation-fixture curve to the per-race snapshot
// (PUERTA_POINT_BUY_SNAPSHOT). The snapshot is intentionally empty in
// Wave 1 to exercise fail-closed. This pre-12.6 suite tests the LEGAL
// path, so we seed the `race:human` entry with the pre-12.6 uniform curve
// (preserving the contract the test was written to cover) and clean up
// in afterEach so neighbouring suites see an untouched snapshot.
const PRE_12_6_UNIFORM_CURVE = {
  budget: 30,
  minimum: 8,
  maximum: 18,
  costByScore: {
    '8': 0,
    '9': 1,
    '10': 2,
    '11': 3,
    '12': 4,
    '13': 5,
    '14': 6,
    '15': 8,
    '16': 10,
    '17': 13,
    '18': 16,
  },
} as const;

// Phase 10 FLOW-01 regression: pins that AttributesBoard exposes an in-pane
// "Aceptar" affordance wired to setExpandedLevel(1) + setActiveLevelSubStep('class')
// so the wizard can always advance past Atributos, even if the creation-stepper
// nav renders 0x0 (the recurring blocker flagged by the user). Uses
// createElement(Component) instead of JSX to match the phase-08 tsx test
// pattern (vitest.config.ts does not wire @vitejs/plugin-react).
describe('FLOW-01 attributes->level1 advance (Phase 10 regression)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    usePlannerShellStore.setState({
      activeOriginStep: 'attributes',
      activeLevelSubStep: null,
      expandedLevel: null,
    });
    // Seed the snapshot so race:human has a curve for this legal-path suite.
    (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'] =
      PRE_12_6_UNIFORM_CURVE;
  });

  afterEach(() => {
    cleanup();
    delete (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'];
  });

  it('renders an "Aceptar" button', () => {
    render(createElement(AttributesBoard));
    expect(
      screen.getByRole('button', { name: /^Aceptar$/ }),
    ).toBeInTheDocument();
  });

  it('disables "Aceptar" while the attribute budget is not legal', () => {
    // Default state: origin unset -> originReady=false -> budget status != 'legal'.
    render(createElement(AttributesBoard));
    expect(screen.getByRole('button', { name: /^Aceptar$/ })).toBeDisabled();
  });

  it('advances shell to expandedLevel=1 + activeLevelSubStep="class" when budget is legal', () => {
    // Arrange a legal origin: Humano + Legal bueno. Human allows all alignments,
    // deityPolicy='optional' so deity:none satisfies requiredDeityResolved.
    // Default baseAttributes at score 8 each cost 0 -> remainingPoints=30, no
    // overspend issues -> budget snapshot status === 'legal'.
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human' as CanonicalId);
    foundation.setAlignment('alignment:lawful-good' as CanonicalId);

    render(createElement(AttributesBoard));
    const aceptar = screen.getByRole('button', { name: /^Aceptar$/ });
    expect(aceptar).toBeEnabled();

    // Use fireEvent.click: @testing-library/user-event is not installed in
    // this workspace; @testing-library/react provides fireEvent.
    fireEvent.click(aceptar);

    const shell = usePlannerShellStore.getState();
    expect(shell.expandedLevel).toBe(1);
    expect(shell.activeLevelSubStep).toBe('class');
  });
});
