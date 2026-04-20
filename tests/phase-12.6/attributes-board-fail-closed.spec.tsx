// @vitest-environment jsdom
/**
 * Phase 12.6 Plan 02 — AttributesBoard fail-closed branch (ATTR-01 R3).
 *
 * The Wave 0 stub from Plan 01 is activated here. Because
 * `puerta-point-buy.json` is an empty object in Wave 1, EVERY race that
 * can be selected routes through `selectAbilityBudgetRulesForRace` →
 * `null` → `calculateAbilityBudgetSnapshot` null branch → blocked with
 * `rule:point-buy-missing`. Therefore these specs all pick `race:human`
 * and assert the fail-closed UI contract.
 *
 * When Plan 06 populates per-race curves, these specs remain GREEN for
 * any race NOT covered by the snapshot (none, eventually) — the invariant
 * is "no snapshot entry ⇒ fail-closed", not "human is always fail-closed".
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

describe('Phase 12.6 — AttributesBoard fail-closed (SPEC R3, Plan 02, empty snapshot ⇒ every race fails closed)', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    resetStores();
  });

  afterEach(() => {
    cleanup();
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
