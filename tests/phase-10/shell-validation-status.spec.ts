import { describe, expect, it } from 'vitest';
import { usePlannerShellStore } from '@planner/state/planner-shell';

// VALI-01 regression (Phase 10 integration fix): pins that PlannerShellState
// no longer carries the orphan `validationStatus` field. The audit confirmed
// zero readers across apps/planner/src; this test prevents a silent revert.
describe('VALI-01 planner-shell validationStatus cleanup (Phase 10)', () => {
  it('does not expose a validationStatus field on the shell state', () => {
    const state = usePlannerShellStore.getState();
    expect('validationStatus' in state).toBe(false);
  });

  it('preserves the other shell fields + setters', () => {
    const state = usePlannerShellStore.getState();
    expect(state).toHaveProperty('activeOriginStep');
    expect(state).toHaveProperty('activeLevelSubStep');
    expect(state).toHaveProperty('activeView');
    expect(state).toHaveProperty('expandedLevel');
    expect(state).toHaveProperty('mobileNavOpen');
    expect(typeof state.setExpandedLevel).toBe('function');
    expect(typeof state.setActiveLevelSubStep).toBe('function');
    expect(typeof state.toggleMobileNav).toBe('function');
    expect(typeof state.closeMobileNav).toBe('function');
  });
});
