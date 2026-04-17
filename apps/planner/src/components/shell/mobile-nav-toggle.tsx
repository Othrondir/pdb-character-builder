import { useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { shellCopyEs } from '@planner/lib/copy/es';
import { usePlannerShellStore } from '@planner/state/planner-shell';

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

  // Body scroll lock — prevent background content from scrolling beneath the
  // backdrop on mobile viewports (WR-04). iOS Safari in particular will bleed
  // momentum scroll into body unless overflow:hidden is applied at document root.
  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    if (typeof document === 'undefined') return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNavOpen]);

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
      )}
    </>
  );
}
