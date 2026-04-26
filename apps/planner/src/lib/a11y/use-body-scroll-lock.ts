import { useEffect } from 'react';

// Phase 15-01 D-03 — body scroll lock with stacking counter.
//
// Module-level counter survives across hook instances mounted simultaneously
// (e.g. ConfirmDialog overwrite-branch atop SaveSlotDialog). Restore body
// style only when the OUTERMOST modal closes (counter returns to 0).
//
// Lifted from apps/planner/src/components/shell/mobile-nav-toggle.tsx:56-67
// and generalised so the four native <dialog> surfaces and any future
// non-<dialog> aria-modal can compose without prematurely releasing the lock.
let activeLocks = 0;
let savedOverflow: string | null = null;

export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;
    if (typeof document === 'undefined') return undefined;

    if (activeLocks === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    activeLocks += 1;

    return () => {
      activeLocks -= 1;
      if (activeLocks === 0 && savedOverflow !== null) {
        document.body.style.overflow = savedOverflow;
        savedOverflow = null;
      }
    };
  }, [active]);
}
