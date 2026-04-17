// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';

import { MobileNavToggle } from '@planner/components/shell/mobile-nav-toggle';
import { usePlannerShellStore } from '@planner/state/planner-shell';

function openDrawer() {
  const toggle = screen.getByRole('button', { name: 'Menú' });
  fireEvent.click(toggle);
  expect(usePlannerShellStore.getState().mobileNavOpen).toBe(true);
}

describe('MobileNavToggle close affordances', () => {
  beforeEach(() => {
    usePlannerShellStore.setState({ mobileNavOpen: false });
  });

  afterEach(() => {
    cleanup();
    usePlannerShellStore.setState({ mobileNavOpen: false });
  });

  it('closes via the explicit close button', () => {
    render(createElement(MobileNavToggle));
    openDrawer();
    const close = screen.getByRole('button', { name: 'Cerrar menú' });
    fireEvent.click(close);
    expect(usePlannerShellStore.getState().mobileNavOpen).toBe(false);
  });

  it('closes via backdrop click', () => {
    const { container } = render(createElement(MobileNavToggle));
    openDrawer();
    const backdrop = container.querySelector('.planner-layout__backdrop.is-open');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(usePlannerShellStore.getState().mobileNavOpen).toBe(false);
  });

  it('closes via Escape key on window', () => {
    render(createElement(MobileNavToggle));
    openDrawer();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(usePlannerShellStore.getState().mobileNavOpen).toBe(false);
  });

  it('Escape key is a no-op while drawer is already closed (no listener leak, T-07.1-02)', () => {
    render(createElement(MobileNavToggle));
    expect(usePlannerShellStore.getState().mobileNavOpen).toBe(false);
    // Should not throw; should not flip to true.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(usePlannerShellStore.getState().mobileNavOpen).toBe(false);
  });

  it('closing does NOT mutate unrelated store slices (T-07.1-03)', () => {
    usePlannerShellStore.setState({
      activeOriginStep: 'attributes',
      expandedLevel: 5,
      characterSheetTab: 'skills',
      mobileNavOpen: false,
    });
    render(createElement(MobileNavToggle));
    openDrawer();
    fireEvent.keyDown(window, { key: 'Escape' });
    const state = usePlannerShellStore.getState();
    expect(state.mobileNavOpen).toBe(false);
    expect(state.activeOriginStep).toBe('attributes');
    expect(state.expandedLevel).toBe(5);
    expect(state.characterSheetTab).toBe('skills');
  });

  it('toggle and close buttons carry the class names the desktop-hide CSS targets', () => {
    render(createElement(MobileNavToggle));
    const toggle = screen.getByRole('button', { name: 'Menú' });
    expect(toggle.className).toContain('planner-shell__mobile-toggle');
    openDrawer();
    const close = screen.getByRole('button', { name: 'Cerrar menú' });
    expect(close.className).toContain('planner-shell__mobile-close');
  });

  // A11y contract coverage (WR-03). These assertions lock the focus-management
  // promises made by the component so regressions to WR-01 or the open-focus
  // effect fail CI rather than silently shipping.
  it('moves focus to the close button when the drawer opens', async () => {
    render(createElement(MobileNavToggle));
    openDrawer();
    // Flush requestAnimationFrame before asserting focus.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    const close = screen.getByRole('button', { name: 'Cerrar menú' });
    expect(document.activeElement).toBe(close);
  });

  it('returns focus to the toggle when the drawer closes via Escape', async () => {
    render(createElement(MobileNavToggle));
    openDrawer();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    fireEvent.keyDown(window, { key: 'Escape' });
    const toggle = screen.getByRole('button', { name: 'Menú' });
    expect(document.activeElement).toBe(toggle);
  });

  it('does NOT steal focus on initial mount (WR-01)', () => {
    const outside = document.createElement('button');
    outside.textContent = 'outside';
    document.body.appendChild(outside);
    outside.focus();
    expect(document.activeElement).toBe(outside);
    render(createElement(MobileNavToggle));
    expect(document.activeElement).toBe(outside);
    document.body.removeChild(outside);
  });
});
