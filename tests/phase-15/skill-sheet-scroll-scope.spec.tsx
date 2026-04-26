// @vitest-environment jsdom

/**
 * Phase 15-02 SC#4 partial — locks that the skill-sheet scroll-reset uses the
 * prop-threaded scrollerRef, not document.querySelector.
 *
 * Negative source assertion (no `document.querySelector` in skill-sheet.tsx)
 * lives in the plan acceptance-criteria grep gates; positive runtime
 * assertions live here:
 *
 *   1. After mount, `<SkillSheet scrollerRef={...} />` writes `0` into the
 *      ref'd element's scrollTop on activeSheet.level dependency change.
 *      We pre-set scrollTop=100 to prove the effect re-runs.
 *
 *   2. Rendering `<SkillSheet />` with no scrollerRef prop (or with a ref
 *      that is unattached/null) does not throw — backward-compat guard so
 *      existing call-sites that have not been threaded yet keep working.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
// Fixtures (mirror tests/phase-12.7/skill-sheet-scroll-reset.spec.tsx).
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

// Harness mirroring the production thread: SkillBoard owns the ref,
// SelectionScreen forwards it to .selection-screen__content via contentRef,
// SkillSheet consumes the same ref via its scrollerRef prop. Test injects
// a ref so the body can observe the same node the production effect mutates.
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

describe('Phase 15-02 — skill-sheet scroll scope (D-04)', () => {
  beforeEach(resetStores);
  afterEach(cleanup);

  it('resets scrollerRef.current.scrollTop to 0 on activeSheet.level dep change', () => {
    setupHumanoClerigoL1L2();

    const scrollerRef = createRef<HTMLDivElement>();
    const { rerender } = render(
      createElement(SkillSheetHarness, { scrollerRef }),
    );

    expect(scrollerRef.current).not.toBeNull();
    // Mid-list scroll position simulating user mid-page on L1.
    scrollerRef.current!.scrollTop = 100;

    // Switch active level → useLayoutEffect dep change should re-fire and
    // zero the ref'd element's scrollTop.
    useLevelProgressionStore.getState().setActiveLevel(2 as ProgressionLevel);
    useSkillStore.getState().setActiveLevel(2 as ProgressionLevel);
    rerender(createElement(SkillSheetHarness, { scrollerRef }));

    expect(scrollerRef.current!.scrollTop).toBe(0);
  });

  it('does not throw when scrollerRef is unattached / unmounted (null current)', () => {
    setupHumanoClerigoL1();

    // Pre-create a ref that we never attach; SkillSheet must tolerate the
    // null `current` and silently no-op.
    const scrollerRef = createRef<HTMLDivElement>();

    expect(() => {
      // Render SkillSheet WITHOUT wrapping it in SelectionScreen so the
      // ref's current stays null. The component should still mount cleanly.
      render(createElement(SkillSheet, { scrollerRef }));
    }).not.toThrow();
  });

  it('does not throw when no scrollerRef prop is provided (backward compat)', () => {
    setupHumanoClerigoL1();

    expect(() => {
      render(createElement(SkillSheet));
    }).not.toThrow();
  });
});
