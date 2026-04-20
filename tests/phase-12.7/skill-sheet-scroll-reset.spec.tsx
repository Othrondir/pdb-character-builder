// @vitest-environment jsdom

/**
 * Phase 12.7-03 (F2 R3) — Habilidades sub-step scroll reset RED spec.
 *
 * UAT-2026-04-20 post-12.6 finding: Habilidades sub-step opens mid-list
 * (scrollHeight 2069 / clientHeight 748). Likely cause is an auto-focus
 * side-effect on the first interactive element (a `+` button) that browsers
 * translate into `scrollIntoView` semantics on mount.
 *
 * This spec locks the fix contract before implementation (Task 2):
 *
 * - C1: after mount, the `.skill-sheet` scroller's `scrollTop` is reset to 0
 *        even if it was dirty pre-render.
 * - C2: on `level` dependency change (useLevelProgressionStore.setActiveLevel),
 *        the scroller also resets to 0 — plan D-08/D-09 explicitly commits to
 *        level-change reset, not just mount-only.
 * - C3: no child calls `scrollIntoView` synchronously during render (auto-focus
 *        in jsdom does not emit scroll; we assert the spy stays quiet so future
 *        regressions that re-introduce scrollIntoView on the first + button
 *        still fail this suite).
 *
 * Under RED baseline (no useLayoutEffect yet): C1 and C2 fail because nothing
 * resets scrollTop. C3 currently passes because jsdom does not fire
 * scrollIntoView from focus; we include it as a forward-guard lock.
 *
 * Test isolation: mirrors tests/phase-12.7/skill-sheet-disabled-gate.spec.tsx
 * resetStores() + rerender pattern.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';

import { SkillSheet } from '@planner/features/skills/skill-sheet';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------

function setupHumanoClerigoL1() {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:cleric' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
  useSkillStore.getState().setActiveLevel(1 as ProgressionLevel);
  usePlannerShellStore.setState((prev) => ({
    ...prev,
    activeOriginStep: null,
    activeLevelSubStep: 'skills',
    activeView: 'creation',
    expandedLevel: 1 as ProgressionLevel,
    mobileNavOpen: false,
  }));
}

// Setup a second level (L2 Clérigo) so setActiveLevel(2) produces a
// well-formed ActiveSkillSheetView — selectActiveSkillSheetView requires
// the active level to have a class assigned for the groups to render.
function setupHumanoClerigoL1L2() {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:cleric' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(2 as ProgressionLevel, 'class:cleric' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
  useSkillStore.getState().setActiveLevel(1 as ProgressionLevel);
  usePlannerShellStore.setState((prev) => ({
    ...prev,
    activeOriginStep: null,
    activeLevelSubStep: 'skills',
    activeView: 'creation',
    expandedLevel: 1 as ProgressionLevel,
    mobileNavOpen: false,
  }));
}

function resetStores() {
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

// --------------------------------------------------------------------------
// Suite
// --------------------------------------------------------------------------

describe('Phase 12.7-03 — SkillSheet scroll reset (F2 R3)', () => {
  beforeEach(resetStores);
  afterEach(cleanup);

  // C1 — mount-time reset. Pre-dirty the scroller between renders, then
  // re-render and assert the useLayoutEffect pushed scrollTop back to 0.
  // RED: no effect exists, so the dirty scrollTop survives re-render → fails.
  it('Suite C1: scroller.scrollTop resets to 0 after mount / re-render', () => {
    setupHumanoClerigoL1();

    const { container, rerender } = render(createElement(SkillSheet));
    const scroller = container.querySelector('.skill-sheet') as HTMLElement | null;
    expect(scroller).not.toBeNull();

    // Simulate the UAT repro: scroller lands dirty (mid-list).
    scroller!.scrollTop = 200;
    expect(scroller!.scrollTop).toBe(200);

    // Re-render — under GREEN the useLayoutEffect fires with the same deps,
    // but only on mount OR dep change. To force a fresh effect fire we
    // toggle the `level` dependency via setActiveLevel. (This doubles as
    // Suite C2 pre-check, which is intentional — the mechanism under test
    // is "any dep-change to level zeros the scroller".)
    useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
    rerender(createElement(SkillSheet));

    // Re-query because cleanup may have swapped nodes.
    const scrollerAfter = container.querySelector(
      '.skill-sheet',
    ) as HTMLElement | null;
    expect(scrollerAfter).not.toBeNull();
    // The effect must have reset scrollTop. Under RED this fails because
    // no useLayoutEffect exists in skill-sheet.tsx yet.
    expect(scrollerAfter!.scrollTop).toBe(0);
  });

  // C2 — level-change reset. After the initial render, change activeLevel
  // 1 → 2; the effect dependency [activeSheet.level] fires, re-zeroing
  // scrollTop even if the user scrolled to a different position.
  it('Suite C2: scroller.scrollTop resets to 0 on level change (L1 → L2)', () => {
    setupHumanoClerigoL1L2();

    const { container, rerender } = render(createElement(SkillSheet));
    const scroller = container.querySelector('.skill-sheet') as HTMLElement | null;
    expect(scroller).not.toBeNull();

    // User scrolled mid-list on L1.
    scroller!.scrollTop = 350;

    // User navigates to L2 via the level-rail or advance bar.
    useLevelProgressionStore.getState().setActiveLevel(2 as ProgressionLevel);
    useSkillStore.getState().setActiveLevel(2 as ProgressionLevel);
    rerender(createElement(SkillSheet));

    const scrollerAfter = container.querySelector(
      '.skill-sheet',
    ) as HTMLElement | null;
    expect(scrollerAfter).not.toBeNull();
    // GREEN contract: the [activeSheet.level] dep change fires the effect
    // and zeros scrollTop. RED baseline: no effect → scrollTop stays 350.
    expect(scrollerAfter!.scrollTop).toBe(0);
  });

  // C3 — belt-and-braces. No scrollIntoView call should fire on mount.
  // This is a forward-looking invariant: even though jsdom's focus does
  // not translate to scrollIntoView today, a future refactor that adds
  // `inputRef.current?.scrollIntoView()` in an effect would fail this
  // suite. We keep it so the contract is documented at the test layer.
  //
  // jsdom does not ship a default scrollIntoView on HTMLElement.prototype
  // (vi.spyOn would throw "property is not defined"); seed a no-op first
  // so the spy can wrap it.
  it('Suite C3: no scrollIntoView call within mount synchronously', () => {
    setupHumanoClerigoL1();

    const proto = HTMLElement.prototype as unknown as {
      scrollIntoView?: () => void;
    };
    const hadScrollIntoView = 'scrollIntoView' in proto;
    if (!hadScrollIntoView) {
      proto.scrollIntoView = function scrollIntoViewStub() {};
    }

    const spy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    try {
      render(createElement(SkillSheet));
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      if (!hadScrollIntoView) {
        delete proto.scrollIntoView;
      }
    }
  });
});
