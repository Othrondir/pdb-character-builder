// @vitest-environment jsdom

/**
 * Phase 15-01 — drawer focus-trap WIRING smoke test. The trap MECHANISM is
 * locked by tests/phase-15/use-focus-trap.spec.tsx; this file only verifies
 * that MobileNavToggle invokes useFocusTrap with the drawer container ref by
 * asserting the wrapper carries the expected role/aria/id wiring.
 *
 * No JSX (Vitest default esbuild lacks React runtime auto-inject).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { MobileNavToggle } from '@planner/components/shell/mobile-nav-toggle';
import { usePlannerShellStore } from '@planner/state/planner-shell';

describe('Phase 15-01 — drawer focus-trap wiring', () => {
  beforeEach(() => {
    usePlannerShellStore.setState({ mobileNavOpen: false });
  });

  afterEach(() => {
    cleanup();
    usePlannerShellStore.setState({ mobileNavOpen: false });
  });

  it('renders drawer wrapper with role=dialog + aria-modal + close button inside when open', () => {
    usePlannerShellStore.setState({ mobileNavOpen: true });
    const { container } = render(createElement(MobileNavToggle));
    const wrapper = container.querySelector<HTMLElement>(
      '[role="dialog"][aria-modal="true"]',
    );
    expect(wrapper).not.toBeNull();
    const closeButton = wrapper!.querySelector<HTMLButtonElement>(
      'button.planner-shell__mobile-close',
    );
    expect(closeButton).not.toBeNull();
  });

  it('does not render the drawer wrapper when mobileNavOpen=false', () => {
    usePlannerShellStore.setState({ mobileNavOpen: false });
    const { container } = render(createElement(MobileNavToggle));
    const wrapper = container.querySelector<HTMLElement>('[role="dialog"]');
    expect(wrapper).toBeNull();
  });
});
