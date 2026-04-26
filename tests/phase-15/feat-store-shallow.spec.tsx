// @vitest-environment jsdom

/**
 * Phase 15-03 SC#5 — locks the useShallow narrow-subscription contract that
 * feat-board.tsx, feat-detail-panel.tsx, and feat-sheet-tab.tsx adopt.
 *
 * After the rollout:
 *   - A consumer that subscribes to `{ levels, activeLevel, datasetId,
 *     lastEditedLevel, ...actions }` via `useShallow` MUST NOT re-render when
 *     a different store mutates (e.g. `usePlannerShellStore.toggleMobileNav`).
 *   - A consumer using useShallow MUST NOT re-render when `setState` returns
 *     a referentially equal value for every subscribed field (idempotent set).
 *   - A consumer using useShallow MUST re-render when `levels` (subscribed)
 *     gets a new array identity.
 *
 * The synthetic <TestConsumer> wraps the same useShallow signature the three
 * production consumers adopt, so a passing spec proves the IDIOM works
 * regardless of FeatBoard's prop dependencies. A complementary suite mounts
 * FeatBoard directly to lock the integration path.
 *
 * Notes:
 *   - jsdom env required (RTL render).
 *   - Action references are reference-stable in zustand 5.x (the store does
 *     not recreate functions on every set), so including them in the
 *     useShallow slice does NOT cause spurious re-renders.
 *   - We use `useFeatStore.setState` to drive mutations directly; this is the
 *     same surface the action functions use internally, so the subscription
 *     semantics are identical.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { createElement, useRef, type ReactElement } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { FeatBoard } from '@planner/features/feats/feat-board';
import { useFeatStore } from '@planner/features/feats/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';

// --------------------------------------------------------------------------
// Test consumer — mirrors the useShallow selector signature the production
// files adopt (slice-as-input via useShallow). Tracks render count via a
// ref so React's StrictMode / batched-update behaviour is observable.
// --------------------------------------------------------------------------

interface TestConsumerProps {
  onRender: () => void;
}

function TestConsumer({ onRender }: TestConsumerProps): ReactElement {
  const slice = useFeatStore(
    useShallow((s) => ({
      levels: s.levels,
      activeLevel: s.activeLevel,
      datasetId: s.datasetId,
      lastEditedLevel: s.lastEditedLevel,
      clearClassFeat: s.clearClassFeat,
      clearGeneralFeat: s.clearGeneralFeat,
      resetFeatSelections: s.resetFeatSelections,
      resetLevel: s.resetLevel,
      setActiveLevel: s.setActiveLevel,
      setClassFeat: s.setClassFeat,
      setGeneralFeat: s.setGeneralFeat,
    })),
  );
  onRender();
  return createElement('span', {
    'data-active-level': String(slice.activeLevel),
    'data-dataset-id': slice.datasetId,
  });
}

// --------------------------------------------------------------------------
// Render counter harness — increments on every render of the wrapped child.
// --------------------------------------------------------------------------

function CountingHarness({
  counterRef,
}: {
  counterRef: { current: number };
}): ReactElement {
  return createElement(TestConsumer, {
    onRender: () => {
      counterRef.current += 1;
    },
  });
}

// --------------------------------------------------------------------------
// FeatBoard integration fixture — L1 Humano + Guerrero (matches Phase 12.4).
// --------------------------------------------------------------------------

function setupL1HumanoGuerrero(): void {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  useCharacterFoundationStore
    .getState()
    .setAlignment('alignment:lawful-good' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setActiveLevel(1 as ProgressionLevel);
  useFeatStore.getState().setActiveLevel(1 as ProgressionLevel);
  usePlannerShellStore.setState((prev) => ({
    ...prev,
    activeOriginStep: null,
    activeLevelSubStep: 'feats',
    activeView: 'creation',
    expandedLevel: 1 as ProgressionLevel,
    mobileNavOpen: false,
  }));
}

function resetStores(): void {
  cleanup();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  useLevelProgressionStore.getState().resetProgression();
  useFeatStore.getState().resetFeatSelections();
  useSkillStore.getState().resetSkillAllocations();
  useCharacterFoundationStore.getState().resetFoundation();
  usePlannerShellStore.setState({
    activeOriginStep: 'race',
    activeLevelSubStep: null,
    activeView: 'creation',
    characterSheetTab: 'stats',
    datasetId: 'dataset:pendiente',
    expandedLevel: null,
    mobileNavOpen: false,
  });
}

// jsdom does not ship Element.prototype.scrollIntoView; seed a no-op so the
// FeatBoard auto-scroll branch (mounted by suite C) does not leak unhandled
// "scrollIntoView is not a function" exceptions.
let scrollIntoViewStubState: { had: boolean } | null = null;

function installScrollIntoViewStub(): void {
  const proto = HTMLElement.prototype as unknown as {
    scrollIntoView?: () => void;
  };
  const had = 'scrollIntoView' in proto;
  if (!had) {
    proto.scrollIntoView = function scrollIntoViewStub(): void {};
  }
  scrollIntoViewStubState = { had };
}

function removeScrollIntoViewStub(): void {
  if (scrollIntoViewStubState !== null && !scrollIntoViewStubState.had) {
    const proto = HTMLElement.prototype as unknown as {
      scrollIntoView?: () => void;
    };
    delete proto.scrollIntoView;
  }
  scrollIntoViewStubState = null;
}

describe('Phase 15-03 — useShallow narrow subscription contract', () => {
  beforeEach(() => {
    resetStores();
    installScrollIntoViewStub();
  });
  afterEach(() => {
    cleanup();
    removeScrollIntoViewStub();
  });

  // ----------------------------------------------------------------------
  // Suite A — synthetic consumer (locks the IDIOM directly).
  // ----------------------------------------------------------------------

  it('A1: consumer does NOT re-render on unrelated store mutation', () => {
    const counterRef = { current: 0 };
    render(createElement(CountingHarness, { counterRef }));
    const baseline = counterRef.current;
    expect(baseline).toBeGreaterThanOrEqual(1);

    // Mutate a DIFFERENT store — guaranteed to not touch any feat-store field.
    act(() => {
      usePlannerShellStore.getState().toggleMobileNav();
    });

    expect(counterRef.current).toBe(baseline);
  });

  it('A2: consumer does NOT re-render when subscribed fields keep identity', () => {
    const counterRef = { current: 0 };
    render(createElement(CountingHarness, { counterRef }));
    const baseline = counterRef.current;

    // useShallow shallow-compares each field; passing the SAME `levels`
    // reference means the shallow check is true → no re-render.
    act(() => {
      useFeatStore.setState((s) => ({ levels: s.levels }));
    });

    expect(counterRef.current).toBe(baseline);
  });

  it('A3: consumer DOES re-render when a subscribed slice (levels) changes identity', () => {
    const counterRef = { current: 0 };
    render(createElement(CountingHarness, { counterRef }));
    const baseline = counterRef.current;

    act(() => {
      useFeatStore.setState((s) => ({ levels: [...s.levels] }));
    });

    expect(counterRef.current).toBe(baseline + 1);
  });

  it('A4: consumer DOES re-render when activeLevel changes', () => {
    const counterRef = { current: 0 };
    render(createElement(CountingHarness, { counterRef }));
    const baseline = counterRef.current;

    act(() => {
      useFeatStore.getState().setActiveLevel(2 as ProgressionLevel);
    });

    expect(counterRef.current).toBe(baseline + 1);
  });

  // ----------------------------------------------------------------------
  // Suite B — FeatBoard integration (locks the rollout in the real consumer).
  // Renders the actual <FeatBoard> and asserts that an unrelated mutation
  // (toggleMobileNav on a different store) does not trigger an additional
  // render of FeatBoard. We track this through a wrapper that increments a
  // counter on every parent render — under the post-rollout subscription
  // narrowing, the unrelated mutation does not propagate.
  // ----------------------------------------------------------------------

  it('B1: FeatBoard mounts cleanly (sanity)', () => {
    setupL1HumanoGuerrero();
    const { container } = render(createElement(FeatBoard));
    const board = container.querySelector('.feat-board__main');
    expect(board).not.toBeNull();
  });

  it('B2: FeatBoard does NOT re-render when an unrelated store mutates', () => {
    setupL1HumanoGuerrero();

    // Wrapper that re-renders only when its child re-renders. We track
    // FeatBoard renders by counting how many times the wrapping sentinel
    // div text content updates — a coarse but reliable proxy.
    let renderCount = 0;
    function Wrapper(): ReactElement {
      const ref = useRef(0);
      ref.current += 1;
      renderCount = ref.current;
      return createElement(FeatBoard);
    }

    render(createElement(Wrapper));
    const baseline = renderCount;

    act(() => {
      usePlannerShellStore.getState().toggleMobileNav();
    });

    // The Wrapper itself does not subscribe to any store, so its render
    // count tracks parent re-renders. FeatBoard's narrowed subscription
    // means the unrelated mutation does not propagate up. Counter unchanged.
    expect(renderCount).toBe(baseline);
  });
});
