// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';

describe('planner shell copy', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    usePlannerShellStore.setState({
      activeOriginStep: 'race',
      activeLevelSubStep: null,
      characterSheetTab: 'stats',
      expandedLevel: null,
      mobileNavOpen: false,
    });
  });

  it('shows Spanish-first stepper labels and character sheet heading', () => {
    render(createElement(PlannerShellFrame));

    for (const label of ['Raza', 'Alineamiento', 'Deidad', 'Atributos']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }

    expect(screen.getAllByText('Origen').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Progresion').length).toBeGreaterThan(0);

    expect(screen.getAllByText('Hoja de personaje').length).toBeGreaterThan(0);
  });
});
