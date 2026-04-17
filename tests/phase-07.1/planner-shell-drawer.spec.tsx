// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';

import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';

// Integration coverage (WR-03): the stepper drawer should expose
// role="dialog" only while mobileNavOpen is true, and should drop that role
// when the drawer is closed. This guards the semantic contract at the shell
// boundary independently of the toggle component wiring.
describe('PlannerShellFrame drawer semantics', () => {
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

  afterEach(() => {
    cleanup();
    usePlannerShellStore.setState({ mobileNavOpen: false });
  });

  it('does NOT carry role="dialog" when the drawer is closed', () => {
    const { container } = render(createElement(PlannerShellFrame));
    const drawer = container.querySelector('#planner-stepper-drawer');
    expect(drawer).not.toBeNull();
    expect(drawer?.getAttribute('role')).toBeNull();
  });

  it('carries role="dialog" while the drawer is open', () => {
    usePlannerShellStore.setState({ mobileNavOpen: true });
    const { container } = render(createElement(PlannerShellFrame));
    const drawer = container.querySelector('#planner-stepper-drawer');
    expect(drawer).not.toBeNull();
    expect(drawer?.getAttribute('role')).toBe('dialog');
  });

  it('does NOT assert aria-modal (WR-02: no focus trap installed)', () => {
    usePlannerShellStore.setState({ mobileNavOpen: true });
    const { container } = render(createElement(PlannerShellFrame));
    const drawer = container.querySelector('#planner-stepper-drawer');
    expect(drawer).not.toBeNull();
    expect(drawer?.getAttribute('aria-modal')).toBeNull();
  });
});
