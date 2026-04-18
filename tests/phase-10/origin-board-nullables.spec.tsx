// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { OriginBoard } from '@planner/features/character-foundation/origin-board';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

// VALI-01 regression (Phase 10 integration fix): pins that OriginBoard's
// Cancelar action dispatches `null` through the foundation setters instead
// of the previous `'' as CanonicalId` sentinel. The schema regex would have
// rejected '' at the persistence boundary; this fix stops the hostile value
// from ever entering the store in the first place.
//
// Uses createElement(Component, props) instead of JSX because vitest.config.ts
// does not wire @vitejs/plugin-react — matches the phase-08/phase-10 tsx
// conventions in this workspace.
describe('origin-board Cancelar dispatches null (Phase 10 integration fix)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    usePlannerShellStore.setState({ activeOriginStep: 'race' });
  });

  afterEach(() => {
    cleanup();
  });

  it('sets raceId to null (not empty string) when Cancelar is clicked on Raza', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
    expect(useCharacterFoundationStore.getState().raceId).toBe('race:human');

    render(createElement(OriginBoard, { activeStep: 'race' }));
    fireEvent.click(screen.getByRole('button', { name: /^Cancelar$/ }));

    expect(useCharacterFoundationStore.getState().raceId).toBeNull();
  });

  it('sets alignmentId to null (not empty string) when Cancelar is clicked on Alineamiento', () => {
    useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
    useCharacterFoundationStore
      .getState()
      .setAlignment('alignment:lawful-good' as CanonicalId);
    expect(useCharacterFoundationStore.getState().alignmentId).toBe(
      'alignment:lawful-good',
    );

    render(createElement(OriginBoard, { activeStep: 'alignment' }));
    fireEvent.click(screen.getByRole('button', { name: /^Cancelar$/ }));

    expect(useCharacterFoundationStore.getState().alignmentId).toBeNull();
  });
});
