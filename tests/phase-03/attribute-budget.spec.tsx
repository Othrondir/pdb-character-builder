// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';

// Phase 17 (ATTR-02 D-04 migration): pre-Phase-17 this suite seeded the
// retired hand-authored snapshot module with a uniform NWN1 curve for
// `race:human` because the runtime path used the snapshot. Post-Phase-17
// the runtime path reads `compiledRaceCatalog` directly (extractor-sourced
// `abilitiesPointBuyNumber: 30`) and composes the curve via
// `deriveAbilityBudgetRules` with the canonical `NWN1_POINT_BUY_COST_TABLE`.
// The seed mechanism is no longer required — the catalog ships the
// legal-path curve natively.

function primeOrigin() {
  const foundationStore = useCharacterFoundationStore.getState();

  foundationStore.setRace('race:human');
  foundationStore.setAlignment('alignment:neutral-good');
}

function getBudgetValue(label: string) {
  const row = screen.getByText(label).closest('div');

  if (!row) {
    throw new Error(`Could not resolve budget row for ${label}`);
  }

  const value = row.querySelector('dd');

  if (!value?.textContent) {
    throw new Error(`Could not resolve budget value for ${label}`);
  }

  return value.textContent;
}

describe('phase 03 attribute budget board', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    usePlannerShellStore.setState({
      activeOriginStep: 'attributes',
      activeLevelSubStep: null,
      characterSheetTab: 'stats',
      expandedLevel: null,
      mobileNavOpen: false,
    });
  });

  it('updates spent and remaining totals when Fuerza changes', () => {
    primeOrigin();

    render(createElement(PlannerShellFrame));

    expect(screen.getByText('Puntos gastados')).toBeInTheDocument();
    expect(getBudgetValue('Puntos gastados')).toBe('0');
    expect(getBudgetValue('Puntos restantes')).toBe('30');

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar Fuerza' }));

    expect(getBudgetValue('Puntos gastados')).toBe('1');
    expect(getBudgetValue('Puntos restantes')).toBe('29');
  });

  it('surfaces inline blockedChoice text when overspent', () => {
    primeOrigin();

    render(createElement(PlannerShellFrame));

    act(() => {
      const foundationStore = useCharacterFoundationStore.getState();

      foundationStore.setBaseAttribute('str', 18);
      foundationStore.setBaseAttribute('dex', 18);
      foundationStore.setBaseAttribute('con', 18);
      foundationStore.setBaseAttribute('int', 18);
      foundationStore.setBaseAttribute('wis', 18);
      foundationStore.setBaseAttribute('cha', 18);
    });

    expect(
      screen.getByText(
        'Elección bloqueada: completa el paso anterior o cambia la opción marcada para continuar.',
      ),
    ).toBeInTheDocument();
  });
});
