// @vitest-environment jsdom

import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { PUERTA_POINT_BUY_SNAPSHOT } from '@rules-engine/foundation/point-buy-snapshot';

// Phase 12.6 (Rule 3 auto-fix) — runtime path uses the per-race snapshot
// instead of the uniform fixture; seed race:human with the pre-12.6
// uniform curve so this legal-path suite keeps its contract.
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
    (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'] =
      PRE_12_6_UNIFORM_CURVE;
  });

  afterEach(() => {
    delete (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'];
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
