# Phase 15: A11y + Modal Polish (GAP) - Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 12 (5 NEW + 7 MODIFIED — note: `feat-search.tsx` from CONTEXT.md does NOT exist on disk; see No Analog Found)
**Analogs found:** 11 / 12 (one CONTEXT.md target missing on disk)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/planner/src/lib/a11y/use-focus-trap.ts` (NEW) | hook | event-driven (keydown) | `mobile-nav-toggle.tsx:14-25` (Esc handler `useEffect` shape) | role-match (no existing focus-trap) |
| `apps/planner/src/lib/a11y/use-body-scroll-lock.ts` (NEW) | hook | event-driven (mount/unmount) | `mobile-nav-toggle.tsx:59-67` (verbatim source) | exact (lift-extract) |
| `tests/phase-15/focus-return.spec.tsx` (NEW) | test | request-response (RTL) | `tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx` | exact |
| `tests/phase-15/focus-trap-drawer.spec.tsx` (NEW) | test | event-driven (keydown sim) | `tests/phase-12.8/feat-summary-card-deselect.spec.tsx` | role-match |
| `tests/phase-15/body-scroll-lock.spec.tsx` (NEW) | test | side-effect verify | `tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx` | role-match |
| `apps/planner/src/components/shell/mobile-nav-toggle.tsx` (MOD) | component | event-driven | self (lines 30-67 already canonical) | exact |
| `apps/planner/src/components/ui/confirm-dialog.tsx` (MOD) | component | request-response | `mobile-nav-toggle.tsx:59-67` (lock pattern source) | role-match |
| `apps/planner/src/components/ui/version-mismatch-dialog.tsx` (MOD) | component | request-response | `confirm-dialog.tsx:21-29` (mirror dialog wiring) | exact |
| `apps/planner/src/features/summary/save-slot-dialog.tsx` (MOD) | component | request-response | `confirm-dialog.tsx:21-29` (× 2 dialogs in file) | exact |
| `apps/planner/src/features/feats/feat-sheet.tsx` (MOD) | component | event-driven | self (lines 233-237 atomic-selector idiom) | exact |
| `apps/planner/src/features/skills/skill-sheet.tsx` (MOD) | component | event-driven | self (lines 150-157 querySelector site) | exact |
| `apps/planner/src/features/feats/feat-board.tsx` (MOD) | component | request-response | `mobile-nav-toggle.tsx:7-9` (atomic) + Zustand 5 `useShallow` doc | role-match |
| `apps/planner/src/features/feats/feat-detail-panel.tsx` (MOD) | component | request-response | same as feat-board | role-match |
| `apps/planner/src/features/feats/feat-sheet-tab.tsx` (MOD) | component | request-response | same as feat-board | role-match |
| `vitest.config.ts` (MOD) | config | n/a | self (lines 13-22 environmentMatchGlobs) | exact |

---

## Pattern Assignments

### `apps/planner/src/lib/a11y/use-body-scroll-lock.ts` (NEW hook)

**Source to lift verbatim:** `apps/planner/src/components/shell/mobile-nav-toggle.tsx:56-67`

```tsx
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
```

**Required shape (from CONTEXT D-03 — stacking counter):**

```ts
// apps/planner/src/lib/a11y/use-body-scroll-lock.ts
import { useEffect } from 'react';

// Module-level counter survives across hook instances mounted simultaneously
// (e.g. ConfirmDialog overwrite-branch atop SaveSlotDialog). Restore body
// style only when the OUTERMOST modal closes (counter returns to 0).
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
```

---

### `apps/planner/src/lib/a11y/use-focus-trap.ts` (NEW hook)

**Closest analog:** `apps/planner/src/components/shell/mobile-nav-toggle.tsx:14-25` (Esc-handler `useEffect` shape — only-attach-while-open + cleanup, T-07.1-02 "no listener leak").

```tsx
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
```

**Required shape (CONTEXT D-01 — `enabled === false` no-op, container-ref scoped):**

```ts
// apps/planner/src/lib/a11y/use-focus-trap.ts
import { useEffect, type RefObject } from 'react';

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
```

---

### `apps/planner/src/components/shell/mobile-nav-toggle.tsx` (MOD)

**Goal:** Replace inline body-scroll-lock with hook (`useBodyScrollLock(mobileNavOpen)`); wrap drawer in a container ref + apply `useFocusTrap(drawerRef, mobileNavOpen)`.

**Existing imports to preserve** (lines 1-4):

```tsx
import { useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { shellCopyEs } from '@planner/lib/copy/es';
import { usePlannerShellStore } from '@planner/state/planner-shell';
```

**Atomic-selector idiom to keep** (lines 7-9 — CONTEXT calls this out as the canonical narrow-subscription pattern):

```tsx
  const mobileNavOpen = usePlannerShellStore((state) => state.mobileNavOpen);
  const toggleMobileNav = usePlannerShellStore((state) => state.toggleMobileNav);
  const closeMobileNav = usePlannerShellStore((state) => state.closeMobileNav);
```

**Focus-return wasOpenRef pattern (KEEP unchanged)** (lines 27-54):

```tsx
  // Focus management — open moves focus to close button, close returns to toggle.
  // wasOpenRef distinguishes "drawer just closed" from "drawer default-closed on mount"
  // so initial mount does not steal focus from whatever the user had focused (WR-01).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (mobileNavOpen) {
      wasOpenRef.current = true;
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
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      toggleButtonRef.current?.focus();
    }
    return undefined;
  }, [mobileNavOpen]);
```

**Replacement diff (lines 56-67 → hook call):**

```tsx
// REMOVE lines 56-67 (the inline overflow swap useEffect).
// ADD just below the wasOpenRef effect:
useBodyScrollLock(mobileNavOpen);

// ADD a drawer container ref + focus-trap call.
// The drawer surface that should trap is the close-button (line 89-100).
// To enable trap on more focusables later, wrap the drawer JSX in a
// <div ref={drawerRef} role="dialog" aria-modal="true">. Phase 15 SC#2
// asserts cycle so at minimum drawerRef must wrap the close-button.
const drawerRef = useRef<HTMLDivElement>(null);
useFocusTrap(drawerRef, mobileNavOpen);
```

---

### `apps/planner/src/components/ui/confirm-dialog.tsx` (MOD)

**Existing pattern — KEEP** (lines 19-29) — native `<dialog>` show/close mirror:

```tsx
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);
```

**ADD ONE LINE** below the show/close effect (do NOT refactor existing pattern, per CONTEXT "stable contract, do not refactor; new hooks compose alongside it"):

```tsx
useBodyScrollLock(open);
```

**Import to add at top:**

```tsx
import { useBodyScrollLock } from '@planner/lib/a11y/use-body-scroll-lock';
```

---

### `apps/planner/src/components/ui/version-mismatch-dialog.tsx` (MOD)

**Existing pattern — KEEP** (lines 27-38) — same native dialog mirror:

```tsx
  const dialogRef = useRef<HTMLDialogElement>(null);
  const copy = shellCopyEs.persistence.versionMismatch;

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);
```

**ADD:** `useBodyScrollLock(open);` directly under the show/close effect. Same import line as confirm-dialog.

---

### `apps/planner/src/features/summary/save-slot-dialog.tsx` (MOD)

**Two dialogs in one file — apply hook to BOTH.**

`SaveSlotDialog` show/close (lines 37-42):

```tsx
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);
```

`LoadSlotDialog` show/close (lines 140-149) — note: ALSO triggers `listSlots()` async — that branch must NOT change:

```tsx
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      listSlots()
        .then(setSlots)
        .catch(() => setSlots([]));
    } else if (!open && el.open) el.close();
  }, [open]);
```

**ADD `useBodyScrollLock(open);` immediately after each show/close `useEffect` block.** `ConfirmDialog` nested at line 109-115 already gets its own lock via the dialog file MOD above — stacking counter handles the overlap.

---

### `apps/planner/src/features/feats/feat-sheet.tsx` (MOD — 15-02 ref-scope + 15-03 cast guard)

**Atomic-selector idiom currently at lines 233-237 (KEEP — D-06 explicitly excludes feat-sheet from useShallow rollout):**

```tsx
  const setClassFeat = useFeatStore((s) => s.setClassFeat);
  const setGeneralFeat = useFeatStore((s) => s.setGeneralFeat);
  const clearClassFeat = useFeatStore((s) => s.clearClassFeat);
  const clearGeneralFeat = useFeatStore((s) => s.clearGeneralFeat);
  const featLevels = useFeatStore((s) => s.levels);
```

**MOD #1 — Replace `document.querySelector` at line 274** (full effect, lines 262-285):

```tsx
  const prevClassFeatIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const prev = prevClassFeatIdRef.current;
    const next = currentRecord?.classFeatId ?? null;
    if (prev === null && next !== null) {
      const generalSection = document.querySelector<HTMLElement>(   // ← REPLACE
        '[data-slot-section="general"]',
      );
      if (generalSection !== null) {
        const firstRow =
          generalSection.querySelector<HTMLElement>('button.feat-picker__row') ??
          generalSection;
        firstRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
    prevClassFeatIdRef.current = next;
  }, [currentRecord?.classFeatId]);
```

**Replacement strategy (CONTEXT D-04 — local-tree query, NOT global):**
1. Add `scrollerRef?: RefObject<HTMLElement>` to `FeatSheetProps` (lines 14-18) — optional so existing call-sites compile.
2. Parent `FeatBoard` (in `feat-board.tsx`) creates `useRef<HTMLElement>(null)` and passes through.
3. Inside the effect, replace the `document.querySelector` line with:

```tsx
const root = scrollerRef?.current ?? null;
if (root === null) return;
const generalSection = root.querySelector<HTMLElement>(
  '[data-slot-section="general"]',
);
```

**MOD #2 — `canonicalIdRegex` guards at lines 287, 293, 296, 307** (CONTEXT D-07).

Current handlers (lines 287-308):

```tsx
  const handleSelectClassFeat = (featId: string) => {
    onFocusFeat(featId);
    if (currentRecord?.classFeatId === featId) {
      clearClassFeat(activeLevel);
      return;
    }
    setClassFeat(activeLevel, featId as CanonicalId);            // ← L293 cast
  };

  const handleSelectGeneralFeat = (featId: string) => {
    onFocusFeat(featId);
    const selectedGeneralIndex =
      boardView.activeSheet.selectedGeneralFeatIds.indexOf(featId as CanonicalId);  // ← L299 cast

    if (selectedGeneralIndex >= 0) {
      clearGeneralFeat(activeLevel, selectedGeneralIndex);
      return;
    }

    const targetSlotIndex = boardView.activeSheet.selectedGeneralFeatIds.length;
    setGeneralFeat(activeLevel, featId as CanonicalId, targetSlotIndex);  // ← L307 cast
  };
```

**Required guard pattern (silent fail-closed before the dispatch):**

```tsx
import { canonicalIdRegex, type CanonicalId } from '@rules-engine/contracts/canonical-id';

  const handleSelectClassFeat = (featId: string) => {
    onFocusFeat(featId);
    if (currentRecord?.classFeatId === featId) {
      clearClassFeat(activeLevel);
      return;
    }
    if (!canonicalIdRegex.test(featId)) return;   // ADD — silent fail-closed
    setClassFeat(activeLevel, featId as CanonicalId);
  };

  const handleSelectGeneralFeat = (featId: string) => {
    onFocusFeat(featId);
    if (!canonicalIdRegex.test(featId)) return;   // ADD — silent fail-closed
    const selectedGeneralIndex =
      boardView.activeSheet.selectedGeneralFeatIds.indexOf(featId as CanonicalId);
    if (selectedGeneralIndex >= 0) {
      clearGeneralFeat(activeLevel, selectedGeneralIndex);
      return;
    }
    const targetSlotIndex = boardView.activeSheet.selectedGeneralFeatIds.length;
    setGeneralFeat(activeLevel, featId as CanonicalId, targetSlotIndex);
  };
```

**`canonicalIdRegex` source** (`packages/rules-engine/src/contracts/canonical-id.ts:20`):

```ts
export const canonicalIdRegex = /^[a-z-]+:[A-Za-z0-9._-]+$/;
```

---

### `apps/planner/src/features/skills/skill-sheet.tsx` (MOD)

**Replace `document.querySelector` at line 151** — current effect (lines 143-157):

```tsx
  // Phase 12.8-01 (D-02, UAT-2026-04-23 F1+F2) — retarget scroll reset
  // to the real overflow owner. The `<aside className="skill-sheet">`
  // below is NOT the scroller (clientHeight===scrollHeight); the parent
  // selection-screen content element inside the skill-board is. Selector
  // binds at runtime because BuildProgressionBoard → LevelProgressionRow
  // mounts SkillSheet under SelectionScreen with className="skill-board".
  // The layout-effect fires synchronously pre-paint so no mid-list flash.
  useLayoutEffect(() => {
    const scroller = document.querySelector<HTMLElement>(
      '.skill-board .selection-screen__content',
    );
    if (scroller !== null) {
      scroller.scrollTop = 0;
    }
  }, [activeSheet.level]);
```

**Replacement (CONTEXT D-04 — prop-threaded `scrollerRef`):**

The `selection-screen__content` div is owned by `SelectionScreen` itself (`apps/planner/src/components/ui/selection-screen.tsx:17`):

```tsx
      <div className="selection-screen__content">
        {children}
      </div>
```

**Two viable threading strategies — pick ONE:**

1. **(Preferred — minimal blast radius)** Add a `scrollerRef?: RefObject<HTMLElement>` prop to `SkillSheet`. Parent (`BuildProgressionBoard` → `SelectionScreen`-wrapper) passes a ref attached to the scroll-content div. Requires `SelectionScreen` to forward a ref to its inner `selection-screen__content` div via `forwardRef` or accept a `contentRef` prop.
2. **(Alternative)** Have `SkillSheet`'s parent thread `scrollerRef` (created with `useRef`) AND attach it to the skill-board's `selection-screen__content` via `SelectionScreen` modification — see `tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx:121-127` for the existing harness pattern.

After threading:

```tsx
useLayoutEffect(() => {
  const scroller = scrollerRef?.current ?? null;
  if (scroller !== null) {
    scroller.scrollTop = 0;
  }
}, [activeSheet.level]);
```

---

### `apps/planner/src/features/feats/feat-board.tsx` (MOD — useShallow rollout)

**Current pattern (line 42 — full state subscription causing per-action re-render):**

```tsx
  const featState = useFeatStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const skillState = useSkillStore();
```

**Required pattern (CONTEXT D-06 — Zustand 5.x `useShallow` from `zustand/react/shallow`):**

```tsx
import { useShallow } from 'zustand/react/shallow';

export function FeatBoard() {
  const { levels, activeLevel, datasetId, lastEditedLevel } = useFeatStore(
    useShallow((s) => ({
      levels: s.levels,
      activeLevel: s.activeLevel,
      datasetId: s.datasetId,
      lastEditedLevel: s.lastEditedLevel,
    })),
  );
  // KEEP atomic-selector lines 48-49 (action subscriptions) UNCHANGED:
  const clearClassFeat = useFeatStore((s) => s.clearClassFeat);
  const clearGeneralFeat = useFeatStore((s) => s.clearGeneralFeat);
  // ...
}
```

**Caveat:** `selectFeatBoardView()` at lines 50-55 currently expects `featState: FeatStoreState`. The selector takes the whole state object. Either:

- Pass a synthesised partial: `selectFeatBoardView({ levels, activeLevel, datasetId, lastEditedLevel } as FeatStoreState, ...)` — works if the selector reads only those 4 fields.
- OR keep `useFeatStore.getState()` for the selector input (one-shot read on render). Decision deferred to executor; CONTEXT D-06 explicitly cites this as the cascade fix for WR-04 selectFeatBoardView thrash.

**FeatStoreState shape (`apps/planner/src/features/feats/store.ts:17-37`):**

```ts
export interface FeatStoreState {
  activeLevel: ProgressionLevel;
  datasetId: string;
  lastEditedLevel: ProgressionLevel | null;
  levels: FeatLevelRecord[];
  clearClassFeat: (...) => void;
  clearGeneralFeat: (...) => void;
  resetFeatSelections: () => void;
  resetLevel: (...) => void;
  setActiveLevel: (...) => void;
  setClassFeat: (...) => void;
  setGeneralFeat: (...) => void;
}
```

---

### `apps/planner/src/features/feats/feat-detail-panel.tsx` (MOD — useShallow)

**Current** (line 17):

```tsx
  const featState = useFeatStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const skillState = useSkillStore();
```

**Replacement:** Same pattern as feat-board.tsx — narrow to fields actually consumed by the downstream `computeBuildStateAtLevel` call (lines 42-48) and `evaluateFeatPrerequisites` (lines 50-55). Plan should grep selector signatures to determine the minimum slice.

---

### `apps/planner/src/features/feats/feat-sheet-tab.tsx` (MOD — useShallow)

**Current** (lines 14-18):

```tsx
export function FeatSheetTab() {
  const featState = useFeatStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const skillState = useSkillStore();
```

**Replacement:** Same `useShallow` pattern. Downstream call at line 20-25 is `selectFeatSheetTabView(featState, progressionState, foundationState, skillState)` — verify selector reads to choose minimum slice.

---

### `vitest.config.ts` (MOD)

**Existing pattern** (lines 12-22):

```ts
  test: {
    environmentMatchGlobs: [
      ['tests/phase-02/**/*.spec.{ts,tsx}', 'jsdom'],
      ['tests/phase-08/**/*.spec.tsx', 'jsdom'],
      ['tests/phase-12.4/**/*.spec.tsx', 'jsdom'],
      ['tests/phase-12.6/**/*.spec.tsx', 'jsdom'],
      ['tests/phase-12.7/**/*.spec.tsx', 'jsdom'],
      ['tests/phase-12.8/**/*.spec.tsx', 'jsdom'],
      ['tests/phase-12.9/**/*.spec.tsx', 'jsdom'],
      ['tests/phase-14/**/*.spec.tsx', 'jsdom'],
    ],
```

**ADD ONE LINE** (alphabetical insertion after phase-14):

```ts
      ['tests/phase-15/**/*.spec.tsx', 'jsdom'],
```

---

### `tests/phase-15/focus-return.spec.tsx` (NEW)

**Closest analog:** `tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx` (RTL + jsdom + `createElement` + store-reset pattern).

**Required spec scaffolding (excerpts to mirror):**

Header (lines 1-2 of analog):

```tsx
// @vitest-environment jsdom

/**
 * Phase 15-01 — focus-return contract for 4 native dialogs + drawer.
 * Asserts document.activeElement === opener after dialog.close().
 */
```

Imports + cleanup (lines 34-46 of analog):

```tsx
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
```

Cleanup pattern (lines 130-131 of analog) — REQUIRED per CONTEXT line 141 ("`afterEach(cleanup)` required"):

```tsx
describe('Phase 15-01 — focus-return on dialog close', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(cleanup);

  it('returns focus to opener after ConfirmDialog closes', () => {
    // 1. Render harness with an opener button + ConfirmDialog
    // 2. fireEvent.click on opener → expect dialog open
    // 3. fireEvent.click on cancel → expect activeElement === opener
  });
});
```

**JSDOM `<dialog>.showModal()` caveat (CONTEXT D-08):** jsdom 22+ supports `show/close` but DOES NOT replicate browser top-layer focus-return. First plan task: smoke-test whether `document.activeElement` updates as expected; if not, install a manual focus-restore polyfill in spec setup or fall back to verifying `dialogRef.current.open === false` + invoking `opener.focus()` in test teardown.

---

### `tests/phase-15/focus-trap-drawer.spec.tsx` (NEW)

**Goal (CONTEXT D-09):** Tab from last focusable cycles to first; Shift-Tab from first cycles to last.

**Idiom — fire keyboard events on container ref:**

```tsx
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { MobileNavToggle } from '@planner/components/shell/mobile-nav-toggle';
import { usePlannerShellStore } from '@planner/state/planner-shell';

describe('Phase 15-01 — focus-trap drawer cycle', () => {
  afterEach(cleanup);

  it('Tab from last focusable cycles to first', () => {
    usePlannerShellStore.setState({ mobileNavOpen: true });
    const { container } = render(createElement(MobileNavToggle));
    const last = container.querySelector<HTMLElement>('button.planner-shell__mobile-close');
    last?.focus();
    fireEvent.keyDown(last!, { key: 'Tab' });
    // Expect first focusable inside drawer to be active
  });
});
```

---

### `tests/phase-15/body-scroll-lock.spec.tsx` (NEW)

**Goal (CONTEXT D-10):** `document.body.style.overflow === 'hidden'` while modal active; restored on close; stacking counter releases only on outermost close.

**Required test cases:**
1. Mount component with `active=true` → assert `document.body.style.overflow === 'hidden'`.
2. Unmount → assert overflow restored to previous value.
3. Stack two locks active → unmount inner → overflow STILL `'hidden'`. Unmount outer → overflow restored.
4. SSR-safe: `typeof document === 'undefined'` early-return — covered by importing under jsdom env, no-op assertion.

**Test harness (test the hook directly via a tiny consumer):**

```tsx
import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { useBodyScrollLock } from '@planner/lib/a11y/use-body-scroll-lock';

function LockHarness({ active }: { active: boolean }): ReactElement {
  useBodyScrollLock(active);
  return createElement('div');
}

describe('Phase 15-01 — useBodyScrollLock', () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });

  it('locks body overflow while active', () => {
    render(createElement(LockHarness, { active: true }));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('stacks: inner unmount keeps lock, outer unmount releases', () => {
    const outer = render(createElement(LockHarness, { active: true }));
    const inner = render(createElement(LockHarness, { active: true }));
    inner.unmount();
    expect(document.body.style.overflow).toBe('hidden');
    outer.unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
```

---

## Shared Patterns

### Atomic per-store-action selector (single field)
**Source:** `apps/planner/src/components/shell/mobile-nav-toggle.tsx:7-9`
**Apply to:** Store-action subscriptions in any modified component (e.g. existing `clearClassFeat`/`clearGeneralFeat` lines in `feat-board.tsx:48-49` and `feat-sheet.tsx:233-237` — KEEP these as-is per CONTEXT line 127 "the cheapest narrow-subscription pattern").

```tsx
const mobileNavOpen = usePlannerShellStore((state) => state.mobileNavOpen);
const toggleMobileNav = usePlannerShellStore((state) => state.toggleMobileNav);
const closeMobileNav = usePlannerShellStore((state) => state.closeMobileNav);
```

### useShallow multi-field selector (only when >3 fields)
**Source:** Zustand 5.x docs (`zustand/react/shallow` — already in 5.0.10, no install needed)
**Apply to:** `feat-board.tsx`, `feat-detail-panel.tsx`, `feat-sheet-tab.tsx` (CONTEXT D-06).

```tsx
import { useShallow } from 'zustand/react/shallow';

const slice = useFeatStore(
  useShallow((s) => ({
    levels: s.levels,
    activeLevel: s.activeLevel,
    datasetId: s.datasetId,
    lastEditedLevel: s.lastEditedLevel,
  })),
);
```

### Native `<dialog>` show/close mirror (KEEP unchanged)
**Source:** `apps/planner/src/components/ui/confirm-dialog.tsx:21-29`
**Apply to:** All 4 dialogs — per CONTEXT line 122 "stable contract, do not refactor".

```tsx
useEffect(() => {
  const dialog = dialogRef.current;
  if (!dialog) return;
  if (open && !dialog.open) {
    dialog.showModal();
  } else if (!open && dialog.open) {
    dialog.close();
  }
}, [open]);
```

### `useEffect` open-only listener (no leak)
**Source:** `apps/planner/src/components/shell/mobile-nav-toggle.tsx:14-25`
**Apply to:** `useFocusTrap` keydown listener.

```tsx
useEffect(() => {
  if (!enabled) return;
  function onKeyDown(event: KeyboardEvent) { /* ... */ }
  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}, [enabled, /* deps */]);
```

### `wasOpenRef` open→close transition guard (KEEP unchanged in mobile-nav-toggle)
**Source:** `apps/planner/src/components/shell/mobile-nav-toggle.tsx:30-54`
**Apply to:** Any future custom-modal focus-return — distinguishes "default-closed on mount" from "just-closed transition".

```tsx
const wasOpenRef = useRef(false);
useEffect(() => {
  if (open) {
    wasOpenRef.current = true;
    // ... focus inner element
    return;
  }
  if (wasOpenRef.current) {
    wasOpenRef.current = false;
    openerRef.current?.focus();
  }
}, [open]);
```

### Vitest jsdom glob registration
**Source:** `vitest.config.ts:13-22`
**Apply to:** New phase-15 specs.

```ts
['tests/phase-15/**/*.spec.tsx', 'jsdom'],
```

### `canonicalIdRegex` runtime guard
**Source:** `packages/rules-engine/src/contracts/canonical-id.ts:20`
**Apply to:** `feat-sheet.tsx` lines 287/296 (silent fail-closed before dispatch).

```ts
import { canonicalIdRegex } from '@rules-engine/contracts/canonical-id';
if (!canonicalIdRegex.test(featId)) return;
```

### No-JSX `.spec.tsx` (createElement)
**Source:** `tests/phase-12.8/feat-summary-card-deselect.spec.tsx:1-46`
**Apply to:** ALL Phase 15 specs — Vitest default esbuild lacks React runtime auto-inject (CONTEXT line 140).

```tsx
import { createElement } from 'react';
render(createElement(MyComponent, { prop: 'value' }));
```

### `afterEach(cleanup)` requirement
**Source:** `tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx:130-131`, `tests/phase-12.8/feat-summary-card-deselect.spec.tsx:32-34`
**Apply to:** Every phase-15 suite with multiple `it` blocks.

```tsx
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);
```

### Store reset / harness pattern
**Source:** `tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx:92-127`
**Apply to:** Phase 15 specs that need a populated planner shell store (e.g. focus-trap-drawer requires `mobileNavOpen=true`).

```tsx
function resetStores() {
  cleanup();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  // ... .getState().resetXxx() calls
  usePlannerShellStore.setState({ /* defaults */ });
}
beforeEach(resetStores);
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `apps/planner/src/features/feats/feat-search.tsx` (CONTEXT decisions D-06 + canonical_refs L98 reference) | component | request-response | **File does not exist on disk.** Glob `apps/planner/src/features/feats/feat-search.{ts,tsx}` returns no matches; grep for `feat-search` in `apps/planner/src` returns no source hits. The `useFeatStore()` callsites that DO exist are `feat-board.tsx:42`, `feat-detail-panel.tsx:17`, `feat-sheet-tab.tsx:15` (3 files, not 4). **Recommend planner reconcile with user**: either drop `feat-search.tsx` from D-06 scope (file may have been renamed/removed in an earlier phase), or if a search component is planned for Phase 15, it falls under D-NO-COPY and would need separate scoping. **No useShallow rollout possible against a non-existent file.** |

---

## Metadata

**Analog search scope:**
- `apps/planner/src/lib/a11y/` (does not yet exist — confirmed)
- `apps/planner/src/components/shell/`
- `apps/planner/src/components/ui/`
- `apps/planner/src/features/feats/`
- `apps/planner/src/features/skills/`
- `apps/planner/src/features/summary/`
- `apps/planner/src/features/character-foundation/`
- `apps/planner/src/state/`
- `packages/rules-engine/src/contracts/`
- `tests/phase-12.6/`, `tests/phase-12.7/`, `tests/phase-12.8/`, `tests/phase-14/`
- `vitest.config.ts`, `tests/setup.ts`

**Files scanned:** ~25 source + ~10 test files (early-stop applied — 3-5 strong analogs each).

**Pattern extraction date:** 2026-04-25
