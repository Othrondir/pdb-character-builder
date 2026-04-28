// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { selectFoundationSummary } from '@planner/features/character-foundation/selectors';
import { CURRENT_DATASET_ID } from '@planner/data/ruleset-version';

// Phase 17 (ATTR-02 D-04 migration): pre-Phase-17 this suite seeded the
// retired hand-authored snapshot module with a uniform NWN1 curve for
// `race:human` and `race:elf` because the runtime path used the snapshot.
// Post-Phase-17 the runtime path reads `compiledRaceCatalog` directly
// (extractor-sourced `abilitiesPointBuyNumber: 30` for every race) and
// composes the curve via `deriveAbilityBudgetRules` with the canonical
// `NWN1_POINT_BUY_COST_TABLE`. The seed mechanism is no longer required —
// the catalog ships the legal-path curve natively.

describe('phase 03 summary panel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    usePlannerShellStore.setState({
      activeOriginStep: 'race',
      activeLevelSubStep: null,
      characterSheetTab: 'stats',
      expandedLevel: null,
      mobileNavOpen: false,
    });
  });

  it('starts in a blocked foundation state', () => {
    const state = useCharacterFoundationStore.getState();
    const summary = selectFoundationSummary(state);

    expect(summary.summaryStatus).toBe('blocked');
    expect(summary.characterLabel).toBe('Sin configuración');
    expect(summary.datasetId).toBe(CURRENT_DATASET_ID);
  });

  it('shows origin identity labels once the base choices are defined', () => {
    // Phase 12.1-02: foundation-fixture projects the compiled-extractor
    // race catalog, which currently emits `subraces: []` (extractor gap
    // tracked in 12.1-CONTEXT.md deferred). Drop the subrace assertion —
    // the D-03 subrace dropdown-pair contract is covered by
    // tests/phase-12.1/race-roster-wiring.spec.ts. This spec now asserts
    // identity labels compose correctly without a subrace selection.
    const foundationStore = useCharacterFoundationStore.getState();

    foundationStore.setRace('race:elf');
    foundationStore.setAlignment('alignment:neutral-good');

    const summary = selectFoundationSummary(useCharacterFoundationStore.getState());

    expect(summary.summaryStatus).toBe('legal');
    expect(summary.characterLabel).toContain('Elfo');
    expect(summary.characterLabel).toContain('Neutral bueno');
    expect(summary.characterLabel).not.toContain('Sin deidad');

    render(createElement(PlannerShellFrame));

    expect(screen.getAllByText('Neutral bueno').length).toBeGreaterThan(0);
  });

  it('reports illegal summary status when the attribute budget is overspent', () => {
    const foundationStore = useCharacterFoundationStore.getState();

    foundationStore.setRace('race:human');
    foundationStore.setAlignment('alignment:neutral-good');

    foundationStore.setBaseAttribute('str', 18);
    foundationStore.setBaseAttribute('dex', 18);
    foundationStore.setBaseAttribute('con', 18);
    foundationStore.setBaseAttribute('int', 18);
    foundationStore.setBaseAttribute('wis', 18);
    foundationStore.setBaseAttribute('cha', 18);

    const summary = selectFoundationSummary(useCharacterFoundationStore.getState());

    expect(summary.summaryStatus).toBe('illegal');
    expect(summary.planState).toBe('Base en conflicto');
  });
});
