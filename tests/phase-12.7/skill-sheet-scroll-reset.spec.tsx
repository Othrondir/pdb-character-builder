// @vitest-environment jsdom

/**
 * Phase 12.7-03 (F2 R3) — Habilidades sub-step scroll reset spec.
 *
 * UAT-2026-04-20 post-12.6 finding: Habilidades sub-step opens mid-list
 * (scrollHeight 2069 / clientHeight 748). Likely cause is an auto-focus
 * side-effect on the first interactive element (a `+` button) that browsers
 * translate into `scrollIntoView` semantics on mount.
 *
 * Phase 12.8-01 update (D-02): the 12.7-03 fix attached the reset to the
 * wrong element (`.skill-sheet`, which has clientHeight===scrollHeight and
 * is not the real scroller). The real overflow owner is
 * `.skill-board .selection-screen__content`. This spec now harnesses
 * <SkillSheet /> inside a <SelectionScreen className="skill-board">
 * wrapper so the runtime selector that the effect uses resolves, and
 * asserts scroll reset on the correct element. The authoritative
 * regression guard for F1+F2 lives in
 * tests/phase-12.8/skill-scroll-snap.e2e.spec.ts (Playwright — real
 * layout engine), because jsdom has no layout and cannot observe the
 * `scroll-snap-type` class of defect.
 *
 * - C1: after mount, the `.skill-board .selection-screen__content`
 *        scroller is at `scrollTop === 0` (jsdom default; forward guard).
 * - C2: on `level` dependency change
 *        (useLevelProgressionStore.setActiveLevel), the same scroller
 *        resets to 0.
 * - C3: no child calls `scrollIntoView` synchronously during render.
 *
 * Test isolation: mirrors tests/phase-12.7/skill-sheet-disabled-gate.spec.tsx
 * resetStores() + rerender pattern.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement, createRef, type RefObject } from 'react';

import { SelectionScreen } from '@planner/components/ui/selection-screen';
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

// Phase 12.8-01 harness: wrap <SkillSheet /> in a <SelectionScreen
// className="skill-board"> so the runtime selector used by the scroll-
// reset useLayoutEffect ('.skill-board .selection-screen__content')
// resolves in jsdom. Production mount path is equivalent
// (BuildProgressionBoard → SelectionScreen className="skill-board" →
// SkillSheet).
//
// Phase 15-02 D-04 (fixture-only update): SkillSheet's scroll-reset effect
// now consumes a parent-owned `scrollerRef` prop instead of doing
// `document.querySelector('.skill-board .selection-screen__content')`. The
// production owner (SkillBoard) creates the ref and forwards it to both
// SelectionScreen.contentRef and SkillSheet.scrollerRef; this harness
// mirrors that wiring so C1/C2 assertions about the scroller's scrollTop
// continue to exercise the same DOM node the effect mutates.
function SkillSheetHarness({
  scrollerRef,
}: {
  scrollerRef: RefObject<HTMLDivElement | null>;
}) {
  return createElement(
    SelectionScreen,
    { title: 'Habilidades', className: 'skill-board', contentRef: scrollerRef },
    createElement(SkillSheet, { scrollerRef }),
  );
}

describe('Phase 12.7-03 — SkillSheet scroll reset (F2 R3)', () => {
  beforeEach(resetStores);
  afterEach(cleanup);

  // C1 — mount-time reset on the REAL scroller. Phase 12.8-01 retargeted
  // the reset to `.skill-board .selection-screen__content`. jsdom default
  // scrollTop is 0; this assertion is a forward-guard (real layout
  // regression coverage lives in the Phase 12.8 Playwright spec).
  it('Suite C1: fresh mount leaves .skill-board .selection-screen__content at scrollTop=0', () => {
    setupHumanoClerigoL1();

    const scrollerRef = createRef<HTMLDivElement>();
    const { container } = render(
      createElement(SkillSheetHarness, { scrollerRef }),
    );
    const scroller = container.querySelector(
      '.skill-board .selection-screen__content',
    ) as HTMLElement | null;
    expect(scroller).not.toBeNull();
    expect(scroller!.scrollTop).toBe(0);
  });

  // C2 — level-change reset. After the initial render, change activeLevel
  // 1 → 2; the effect dependency [activeSheet.level] fires and zeros
  // scrollTop on the real overflow owner.
  it('Suite C2: scroller.scrollTop resets to 0 on level change (L1 → L2)', () => {
    setupHumanoClerigoL1L2();

    const scrollerRef = createRef<HTMLDivElement>();
    const { container, rerender } = render(
      createElement(SkillSheetHarness, { scrollerRef }),
    );
    const scroller = container.querySelector(
      '.skill-board .selection-screen__content',
    ) as HTMLElement | null;
    expect(scroller).not.toBeNull();

    // User scrolled mid-list on L1.
    scroller!.scrollTop = 350;

    // User navigates to L2 via the level-rail or advance bar.
    useLevelProgressionStore.getState().setActiveLevel(2 as ProgressionLevel);
    useSkillStore.getState().setActiveLevel(2 as ProgressionLevel);
    rerender(createElement(SkillSheetHarness, { scrollerRef }));

    const scrollerAfter = container.querySelector(
      '.skill-board .selection-screen__content',
    ) as HTMLElement | null;
    expect(scrollerAfter).not.toBeNull();
    // GREEN contract (Phase 12.8-01 D-02): the [activeSheet.level] dep
    // change fires the effect and zeros scrollTop on the real scroller.
    expect(scrollerAfter!.scrollTop).toBe(0);
  });

  // C3 — belt-and-braces. No scrollIntoView call should fire on mount.
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
      const scrollerRef = createRef<HTMLDivElement>();
      render(createElement(SkillSheetHarness, { scrollerRef }));
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      if (!hadScrollIntoView) {
        delete proto.scrollIntoView;
      }
    }
  });
});
