import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerShellStore } from '@planner/state/planner-shell';

describe('planner-shell store closeMobileNav / toggleMobileNav', () => {
  beforeEach(() => {
    usePlannerShellStore.setState({
      activeOriginStep: 'race',
      activeLevelSubStep: null,
      activeView: 'creation',
      characterSheetTab: 'stats',
      expandedLevel: null,
      mobileNavOpen: false,
    });
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

  it('setActiveView("resumen") preserves the open progression cursor', () => {
    usePlannerShellStore.setState({
      activeOriginStep: null,
      activeLevelSubStep: 'class',
      activeView: 'creation',
      expandedLevel: 1,
      mobileNavOpen: true,
    });

    usePlannerShellStore.getState().setActiveView('resumen');

    const state = usePlannerShellStore.getState();
    expect(state.activeView).toBe('resumen');
    expect(state.activeOriginStep).toBeNull();
    expect(state.activeLevelSubStep).toBe('class');
    expect(state.expandedLevel).toBe(1);
    expect(state.mobileNavOpen).toBe(false);
  });
});
