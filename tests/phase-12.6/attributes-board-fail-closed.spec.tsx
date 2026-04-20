// @vitest-environment jsdom
/**
 * Phase 12.6 Plan 02 — AttributesBoard fail-closed branch (ATTR-01 R3).
 *
 * Plan 02 validated the fail-closed UI against an empty snapshot where every
 * race fell through the null branch automatically. Plan 06 populated the
 * snapshot with 45 per-race entries — so now every race in the catalog has
 * a curve and `selectAbilityBudgetRulesForRace(raceId)` returns a non-null
 * result. The invariant this spec enforces is still "no snapshot entry ⇒
 * fail-closed"; we manufacture the no-snapshot-entry condition by deleting
 * `race:human` from PUERTA_POINT_BUY_SNAPSHOT inside beforeEach and restoring
 * it after each test. This is the symmetric inverse of the Plan 02 seed
 * pattern used by three pre-12.6 suites (tests/phase-03/summary-status,
 * tests/phase-03/attribute-budget, tests/phase-10/attributes-advance) which
 * INSERT `race:human` to restore the nominal path. Vitest's default per-file
 * module isolation guarantees the mutation does not leak to sibling files.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';

import { AttributesBoard } from '@planner/features/character-foundation/attributes-board';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import {
  PUERTA_POINT_BUY_SNAPSHOT,
  type PointBuyCurve,
} from '@rules-engine/foundation/point-buy-snapshot';

function resetStores(): void {
  useCharacterFoundationStore.getState().resetFoundation();
  usePlannerShellStore.setState({
    activeOriginStep: null,
    activeLevelSubStep: null,
    activeView: 'creation',
    expandedLevel: 1 as ProgressionLevel,
    mobileNavOpen: false,
  });
}

describe('Phase 12.6 — AttributesBoard fail-closed (SPEC R3, Plan 02 invariant preserved under Plan 06 populated snapshot)', () => {
  // Capture the populated race:human entry so we can restore it after each
  // test. Deleting the key manufactures the no-snapshot-entry condition the
  // fail-closed branch needs; afterEach re-inserts it so downstream specs
  // (including coverage + per-race under the same vitest worker) see an
  // intact snapshot.
  let savedHumanCurve: PointBuyCurve | undefined;

  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    resetStores();
    savedHumanCurve = PUERTA_POINT_BUY_SNAPSHOT['race:human' as CanonicalId];
    delete (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'];
  });

  afterEach(() => {
    cleanup();
    if (savedHumanCurve !== undefined) {
      (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'] =
        savedHumanCurve;
    }
  });

  it('race with no snapshot entry renders [data-testid="point-buy-missing-callout"] with Spanish copy', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
    render(createElement(AttributesBoard));

    const callout = screen.getByTestId('point-buy-missing-callout');
    expect(callout).toBeDefined();
    expect(callout.textContent ?? '').toContain('Curva punto-compra no disponible');
  });

  it('all 6 [aria-label^="Aumentar"] buttons carry disabled attribute when fail-closed', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
    render(createElement(AttributesBoard));

    const incrementButtons = document.querySelectorAll(
      '[aria-label^="Aumentar"]',
    );
    expect(incrementButtons.length).toBe(6);
    incrementButtons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it('all 6 [aria-label^="Reducir"] buttons carry disabled attribute when fail-closed (Pitfall 7)', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
    render(createElement(AttributesBoard));

    const decrementButtons = document.querySelectorAll(
      '[aria-label^="Reducir"]',
    );
    expect(decrementButtons.length).toBe(6);
    decrementButtons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it('.attributes-editor__summary (budget dl) is not rendered when fail-closed', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
    render(createElement(AttributesBoard));

    expect(document.querySelector('.attributes-editor__summary')).toBe(null);
  });

  it('callout includes the race label in the Spanish template', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
    render(createElement(AttributesBoard));

    const callout = screen.getByTestId('point-buy-missing-callout');
    // Template: `Curva punto-compra no disponible para ${raceLabel}`
    // raceLabel resolves through compiledRaceCatalog.races.find(...).label
    // so we assert the PREFIX + the PRESENCE of a label suffix (≥ 1 char).
    const text = callout.textContent ?? '';
    expect(text.startsWith('Curva punto-compra no disponible para ')).toBe(true);
    expect(text.length).toBeGreaterThan('Curva punto-compra no disponible para '.length);
  });

  it('null race (no race selected) still renders fail-closed callout with em-dash fallback', () => {
    // raceId stays null after resetFoundation; raceLabel falls back to '—'.
    render(createElement(AttributesBoard));

    const callout = screen.getByTestId('point-buy-missing-callout');
    expect(callout.textContent ?? '').toContain('—');
  });
});
