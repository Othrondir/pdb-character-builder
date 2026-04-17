// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';

import { MobileNavToggle } from '@planner/components/shell/mobile-nav-toggle';
import { usePlannerShellStore } from '@planner/state/planner-shell';

describe('MobileNavToggle render', () => {
  beforeEach(() => {
    usePlannerShellStore.setState({ mobileNavOpen: false });
  });

  afterEach(() => {
    cleanup();
    usePlannerShellStore.setState({ mobileNavOpen: false });
  });

  it('renders the open toggle with Spanish aria-label and aria-expanded=false', () => {
    render(createElement(MobileNavToggle));
    const toggle = screen.getByRole('button', { name: 'Menú' });
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe('planner-stepper-drawer');
    expect(toggle.className).toContain('planner-shell__mobile-toggle');
  });

  it('does NOT render the close button when drawer is closed', () => {
    render(createElement(MobileNavToggle));
    expect(screen.queryByRole('button', { name: 'Cerrar menú' })).toBeNull();
  });

  it('clicking the toggle flips mobileNavOpen and renders the close button', () => {
    render(createElement(MobileNavToggle));
    const toggle = screen.getByRole('button', { name: 'Menú' });
    fireEvent.click(toggle);
    expect(usePlannerShellStore.getState().mobileNavOpen).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).not.toBeNull();
  });
});
