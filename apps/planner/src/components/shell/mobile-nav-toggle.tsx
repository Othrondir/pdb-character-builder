import { useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { shellCopyEs } from '@planner/lib/copy/es';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useBodyScrollLock } from '@planner/lib/a11y/use-body-scroll-lock';
import { useFocusTrap } from '@planner/lib/a11y/use-focus-trap';

export function MobileNavToggle() {
  const mobileNavOpen = usePlannerShellStore((state) => state.mobileNavOpen);
  const toggleMobileNav = usePlannerShellStore((state) => state.toggleMobileNav);
  const closeMobileNav = usePlannerShellStore((state) => state.closeMobileNav);

  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Escape key handler — only attached while drawer is open (T-07.1-02: no listener leak).
  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobileNav();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen, closeMobileNav]);

  // Focus management — open moves focus to close button, close returns to toggle.
  // wasOpenRef distinguishes "drawer just closed" from "drawer default-closed on mount"
  // so initial mount does not steal focus from whatever the user had focused (WR-01).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (mobileNavOpen) {
      wasOpenRef.current = true;
      // requestAnimationFrame guards against focusing an element that has not yet
      // committed to the DOM after the render pass.
      const raf =
        typeof requestAnimationFrame === 'function'
          ? requestAnimationFrame(() => {
              closeButtonRef.current?.focus();
            })
          : null;
      return () => {
        if (raf !== null && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(raf);
        }
      };
    }
    // Only restore focus if we are transitioning open -> closed.
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      toggleButtonRef.current?.focus();
    }
    return undefined;
  }, [mobileNavOpen]);

  // Phase 15-01 D-03 — body scroll lock now extracted to
  // apps/planner/src/lib/a11y/use-body-scroll-lock.ts (stacking counter handles
  // overlap with confirm/save-slot/version-mismatch dialogs).
  useBodyScrollLock(mobileNavOpen);

  // Phase 15-01 D-01 — Tab/Shift-Tab cycle inside the drawer surface.
  // The hook is a no-op when mobileNavOpen=false. The drawer is the only
  // non-<dialog> aria-modal in the planner; the 4 native <dialog> surfaces
  // trust the browser top-layer focus contract.
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(drawerRef, mobileNavOpen);

  return (
    <>
      <button
        aria-controls="planner-stepper-drawer"
        aria-expanded={mobileNavOpen}
        aria-label={shellCopyEs.stepper.openNav}
        className="planner-shell__mobile-toggle"
        onClick={toggleMobileNav}
        ref={toggleButtonRef}
        type="button"
      >
        <Menu aria-hidden="true" size={20} />
        <span>{shellCopyEs.stepper.openNav}</span>
      </button>
      <div
        aria-hidden="true"
        className={`planner-layout__backdrop${mobileNavOpen ? ' is-open' : ''}`}
        onClick={closeMobileNav}
        role="presentation"
      />
      {mobileNavOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
        >
          {/*
            Plan 15-01 [Rule 1 fix]: Do NOT add `id="planner-stepper-drawer"` here.
            The canonical `#planner-stepper-drawer` element is the stepper sidebar
            in planner-shell-frame.tsx (which the toggle's `aria-controls` already
            points at). Adding the id here produced a duplicate-id collision that
            broke phase-07.1 selectors and HTML uniqueness; the focus-trap wrapper
            does not need the id to function.
          */}
          <button
            aria-label={shellCopyEs.stepper.closeNav}
            className="planner-shell__mobile-close"
            onClick={closeMobileNav}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={20} />
            <span>{shellCopyEs.stepper.closeNav}</span>
          </button>
        </div>
      )}
    </>
  );
}
