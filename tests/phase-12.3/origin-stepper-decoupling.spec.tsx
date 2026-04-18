// @vitest-environment jsdom

import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import { CreationStepper } from '@planner/components/shell/creation-stepper';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import {
  ATTRIBUTE_KEYS,
  type AttributeKey,
} from '@planner/features/character-foundation/foundation-fixture';
import { usePlannerShellStore } from '@planner/state/planner-shell';

/**
 * Phase 12.3-05 — UAT B7 regression lock.
 *
 * CONTEXT.md D-05: origin-step "complete" status must depend on
 *   - Raza: `raceId` alone,
 *   - Alineamiento: `raceId` AND `alignmentId` (race precondition),
 *   - Atributos: alignment precondition + legal point-buy snapshot (unchanged).
 *
 * The UAT report showed that overspending the point-buy budget in
 * `Atributos` caused the rail to lose its ✓ and selected-value summary on
 * both Raza and Alineamiento rows. This spec reproduces the UAT scenario:
 *   - setRace('race:human') + setAlignment('alignment:chaotic-neutral')
 *   - drive baseAttributes into overspend (all six scores at 14 → 36 pts
 *     spent, budget 30 → remainingPoints = -6).
 * and asserts that the Raza + Alineamiento stepper buttons remain in the
 * `is-complete` state with their selected label rendered. Atributos stays
 * non-complete under overspend — that part of the predicate is correct.
 *
 * If this spec passes on the first run (before any fix lands), the bug was
 * incidentally repaired during Phase 12.2 selector refactors; the spec
 * ships as a forward-looking LOCK to prevent any future predicate coupling
 * that would reintroduce the regression.
 */
describe('Phase 12.3-05 — origin stepper decoupled from atributos validity (UAT B7)', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    // Land `activeOriginStep` OFF the rows under inspection so their status
    // resolves to `complete`, not `active` (the hook short-circuits to
    // `active` for whichever step is currently selected).
    usePlannerShellStore.setState({
      activeOriginStep: null,
      activeLevelSubStep: null,
      activeView: 'creation',
      characterSheetTab: 'stats',
      datasetId: 'dataset:pendiente',
      expandedLevel: null,
      mobileNavOpen: false,
    });
  });

  function setupOverspentFoundation() {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human' as CanonicalId);
    foundation.setAlignment('alignment:chaotic-neutral' as CanonicalId);
    // All six attrs at 14 → each costs 6 pts (per the 12.3-01 cost table),
    // 6 × 6 = 36 pts spent on a 30-pt budget → remainingPoints = -6.
    ATTRIBUTE_KEYS.forEach((key: AttributeKey) => {
      foundation.setBaseAttribute(key, 14);
    });
  }

  it('Raza row stays `is-complete` and shows `Humano` under overspent atributos', () => {
    setupOverspentFoundation();

    render(createElement(CreationStepper));

    const raceButton = screen.getByRole('button', { name: /Raza.*Humano/ });
    expect(raceButton).toHaveClass('is-complete');
    expect(raceButton).toHaveTextContent(/Humano/);
  });

  it('Alineamiento row stays `is-complete` and shows `Caótico neutral` under overspent atributos', () => {
    setupOverspentFoundation();

    render(createElement(CreationStepper));

    const alignmentButton = screen.getByRole('button', {
      name: /Alineamiento.*Ca[oó]tico neutral/,
    });
    expect(alignmentButton).toHaveClass('is-complete');
    expect(alignmentButton).toHaveTextContent(/Ca[oó]tico neutral/);
  });

  it('Atributos row stays non-complete under overspend (unchanged behavior)', () => {
    setupOverspentFoundation();

    render(createElement(CreationStepper));

    const atributosButton = screen.getByRole('button', { name: /Atributos/ });
    expect(atributosButton).not.toHaveClass('is-complete');
  });

  it('clearing raceId drops both Raza and Alineamiento from complete (negative control)', () => {
    setupOverspentFoundation();
    useCharacterFoundationStore.getState().setRace(null);

    render(createElement(CreationStepper));

    const raceButton = screen.getByRole('button', { name: /Raza/ });
    const alignmentButton = screen.getByRole('button', { name: /Alineamiento/ });
    expect(raceButton).not.toHaveClass('is-complete');
    expect(alignmentButton).not.toHaveClass('is-complete');
  });
});
