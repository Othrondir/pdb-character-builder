// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { originSteps, levelSubSteps, sheetTabs } from '@planner/lib/sections';

describe('planner shell structure', () => {
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

  it('exposes origin steps, level sub-steps, and sheet tabs in the step registry', () => {
    expect(originSteps.map((s) => s.id)).toEqual([
      'race', 'alignment', 'attributes',
    ]);
    expect(levelSubSteps.map((s) => s.id)).toEqual([
      'class', 'skills', 'feats', 'spells',
    ]);
    expect(sheetTabs.map((s) => s.id)).toEqual([
      'stats', 'skills', 'feats', 'spells',
    ]);
  });

  it('renders the shell frame with stepper and character sheet', () => {
    render(createElement(PlannerShellFrame));

    expect(
      screen.getByRole('navigation', { name: 'Creacion de personajes' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('complementary', { name: 'Hoja de personaje' }),
    ).toBeInTheDocument();
  });
});
