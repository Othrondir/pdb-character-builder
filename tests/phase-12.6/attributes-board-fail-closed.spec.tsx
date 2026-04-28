// @vitest-environment jsdom
/**
 * Phase 12.6 Plan 02 — AttributesBoard fail-closed branch (ATTR-01 R3).
 *
 * Plan 02 validated the fail-closed UI against an empty snapshot where every
 * race fell through the null branch automatically. Plan 06 populated the
 * snapshot with 45 per-race entries — so every race in the catalog has a
 * non-null curve.
 *
 * Phase 17 Wave 2 (ATTR-02) — seed migration: pre-Wave-2 the spec mutated
 * the legacy hand-authored snapshot module to manufacture the
 * no-data-entry condition. Post-Wave-2 the selector reads
 * `compiledRaceCatalog`, so that mutation became a no-op. Migration (per
 * Phase 17 PATTERNS.md): swap to an unknown raceId (`race:does-not-exist`)
 * — the rewired selector's second null branch (`if (!race) return null`)
 * covers this and routes through `calculateAbilityBudgetSnapshot`'s null
 * branch (Phase 12.6 D-05) which still emits rule:point-buy-missing. The
 * em-dash fallback in `attributes-board.tsx` raceLabel resolution preserves
 * the visible callout text (Spanish prefix + em-dash suffix). Phase 17
 * Wave 3 retired the snapshot module + JSON + provenance dossier + barrel
 * export atomically.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';

import { AttributesBoard } from '@planner/features/character-foundation/attributes-board';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

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

describe('Phase 12.6 — AttributesBoard fail-closed (SPEC R3, Plan 02 invariant preserved under Plan 06 populated snapshot, Phase 17 W2 seed migrated)', () => {
  // Phase 17 W2 — `race:does-not-exist` is not in compiledRaceCatalog, so the
  // rewired selectAbilityBudgetRulesForRace returns null via the second null
  // branch (`if (!race) return null`). This manufactures the same fail-closed
  // condition the pre-Wave-2 snapshot-key-deletion produced.
  const UNKNOWN_RACE_ID = 'race:does-not-exist' as CanonicalId;

  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    resetStores();
  });

  afterEach(() => {
    cleanup();
  });

  it('unknown race (not in catalog) renders [data-testid="point-buy-missing-callout"] with Spanish copy', () => {
    useCharacterFoundationStore.getState().setRace(UNKNOWN_RACE_ID);
    render(createElement(AttributesBoard));

    const callout = screen.getByTestId('point-buy-missing-callout');
    expect(callout).toBeDefined();
    expect(callout.textContent ?? '').toContain('Curva punto-compra no disponible');
  });

  it('all 6 [aria-label^="Aumentar"] buttons carry disabled attribute when fail-closed', () => {
    useCharacterFoundationStore.getState().setRace(UNKNOWN_RACE_ID);
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
    useCharacterFoundationStore.getState().setRace(UNKNOWN_RACE_ID);
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
    useCharacterFoundationStore.getState().setRace(UNKNOWN_RACE_ID);
    render(createElement(AttributesBoard));

    expect(document.querySelector('.attributes-editor__summary')).toBe(null);
  });

  it('callout includes the em-dash race-label fallback for unknown raceId in the Spanish template', () => {
    useCharacterFoundationStore.getState().setRace(UNKNOWN_RACE_ID);
    render(createElement(AttributesBoard));

    const callout = screen.getByTestId('point-buy-missing-callout');
    // Template: `Curva punto-compra no disponible para ${raceLabel}`.
    // For UNKNOWN_RACE_ID, compiledRaceCatalog.races.find returns undefined,
    // so the AttributesBoard raceLabel falls back to '—' (em-dash). PRE-W2
    // this asserted a non-empty real label suffix; POST-W2 it asserts the
    // em-dash fallback because the seed mechanism no longer mutates the
    // catalog (only the snapshot, which the selector no longer consults).
    const text = callout.textContent ?? '';
    expect(text.startsWith('Curva punto-compra no disponible para ')).toBe(true);
    expect(text).toContain('—');
  });

  it('null race (no race selected) still renders fail-closed callout with em-dash fallback', () => {
    // raceId stays null after resetFoundation; raceLabel falls back to '—'.
    render(createElement(AttributesBoard));

    const callout = screen.getByTestId('point-buy-missing-callout');
    expect(callout.textContent ?? '').toContain('—');
  });
});
