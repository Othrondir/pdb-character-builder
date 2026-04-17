import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerShellStore } from '@planner/state/planner-shell';

describe('planner-shell store closeMobileNav / toggleMobileNav', () => {
  beforeEach(() => {
    usePlannerShellStore.setState({ mobileNavOpen: false });
  });

  it('toggleMobileNav flips mobileNavOpen from false to true and back', () => {
    expect(usePlannerShellStore.getState().mobileNavOpen).toBe(false);
    usePlannerShellStore.getState().toggleMobileNav();
    expect(usePlannerShellStore.getState().mobileNavOpen).toBe(true);
    usePlannerShellStore.getState().toggleMobileNav();
    expect(usePlannerShellStore.getState().mobileNavOpen).toBe(false);
  });

  it('closeMobileNav sets mobileNavOpen to false regardless of prior state', () => {
    usePlannerShellStore.setState({ mobileNavOpen: true });
    usePlannerShellStore.getState().closeMobileNav();
    expect(usePlannerShellStore.getState().mobileNavOpen).toBe(false);
    // idempotent
    usePlannerShellStore.getState().closeMobileNav();
    expect(usePlannerShellStore.getState().mobileNavOpen).toBe(false);
  });
});
