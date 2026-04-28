// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { AttributesBoard } from '@planner/features/character-foundation/attributes-board';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

// Phase 17 (ATTR-02 D-04 migration): pre-Phase-17 this suite seeded the
// retired hand-authored snapshot module with a uniform NWN1 curve for
// `race:human` because the runtime path used the snapshot. Post-Phase-17
// the runtime path reads `compiledRaceCatalog` directly (extractor-sourced
// `abilitiesPointBuyNumber: 30`) and composes the curve via
// `deriveAbilityBudgetRules` with the canonical `NWN1_POINT_BUY_COST_TABLE`.
// The seed mechanism is no longer required — the catalog ships the
// legal-path curve natively.

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
    useLevelProgressionStore.getState().resetProgression();
    usePlannerShellStore.setState({
      activeOriginStep: 'attributes',
      activeLevelSubStep: null,
      expandedLevel: null,
    });
  });

  afterEach(() => {
    cleanup();
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

  it('shows progression ability increases in the visible attribute total', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human' as CanonicalId);
    foundation.setAlignment('alignment:lawful-good' as CanonicalId);
    foundation.setBaseAttribute('str', 16);
    useLevelProgressionStore.getState().setLevelAbilityIncrease(4 as any, 'str');

    render(createElement(AttributesBoard));

    expect(screen.getByLabelText('Total de Fuerza')).toHaveTextContent('17');
  });
});
