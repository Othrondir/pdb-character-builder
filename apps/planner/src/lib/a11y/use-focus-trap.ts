import { useEffect, type RefObject } from 'react';

// Phase 15-01 D-01 — focus trap for non-<dialog> aria-modal surfaces.
//
// Implements Tab/Shift-Tab cycle inside a container ref. When `enabled` is
// false the listener is not attached (no-op short-circuit). Native <dialog>
// elements opened via showModal() trust the browser's top-layer focus
// contract — this hook is for custom modal surfaces (currently the mobile
// nav drawer) that do not get top-layer treatment.
//
// Listener attaches at container scope (NOT window), bounded by `enabled`
// + container ref; cleanup removes the listener on close. T-15-01-02 mitigation.
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        container!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', onKeyDown);
    return () => container.removeEventListener('keydown', onKeyDown);
  }, [containerRef, enabled]);
}
