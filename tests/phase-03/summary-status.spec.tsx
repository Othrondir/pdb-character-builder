// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { selectFoundationSummary } from '@planner/features/character-foundation/selectors';
import { CURRENT_DATASET_ID } from '@planner/data/ruleset-version';
import { PUERTA_POINT_BUY_SNAPSHOT } from '@rules-engine/foundation/point-buy-snapshot';

// Phase 12.6 (Rule 3 auto-fix) — this pre-12.6 suite covers the nominal
// legal + overspent branches that the uniform fixture curve used to drive.
// Plan 02 swapped the runtime path to the per-race snapshot; seed race:human
// + race:elf with the pre-12.6 uniform curve so the test contract holds.
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
    (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'] =
      PRE_12_6_UNIFORM_CURVE;
    (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:elf'] =
      PRE_12_6_UNIFORM_CURVE;
  });

  afterEach(() => {
    delete (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'];
    delete (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:elf'];
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
