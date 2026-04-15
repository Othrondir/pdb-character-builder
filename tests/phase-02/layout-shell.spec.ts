// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';

describe('planner shell layout', () => {
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

  it('renders the 3-column layout with stepper, center, and character sheet', () => {
    render(createElement(PlannerShellFrame));

    expect(
      screen.getByRole('navigation', { name: 'Creacion de personajes' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('complementary', { name: 'Hoja de personaje' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
