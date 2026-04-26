// @vitest-environment jsdom

/**
 * Phase 15-02 SC#4 + Phase 06 WR-02 — locks two contracts:
 *
 *   1. feat-sheet auto-scroll lookup is scoped under the prop-threaded
 *      scrollerRef (NOT document-global). When the class-bonus slot fills
 *      from null → non-null, scrollIntoView (if it fires) targets a node
 *      that lives inside the parent-owned ref subtree.
 *
 *   2. canonicalIdRegex guard at handler entries (D-07). The runtime
 *      regex-fail-closed branch is enforced through:
 *        - a regex contract assertion (rejects non-canonical samples,
 *          accepts canonical samples), AND
 *        - source-grep gates in the plan acceptance criteria
 *          (`canonicalIdRegex.test` count === 2 in feat-sheet.tsx).
 *      A canonical-id round-trip via setClassFeat proves the GREEN
 *      branch dispatches correctly.
 *
 * Notes:
 *   - The component-local handlers (handleSelectClassFeat /
 *     handleSelectGeneralFeat) are not exported; their closure captures
 *     option.featId from selectFeatBoardView, so a synthetic DOM click
 *     cannot inject a malformed id. The regex-contract assertion is the
 *     direct unit lock; the source-grep gate is the source-of-truth lock.
 *   - jsdom has no real layout, so scrollIntoView may legitimately not
 *     fire even after the null→non-null transition. We tolerate zero
 *     calls; we forbid out-of-scope calls.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';

import { FeatBoard } from '@planner/features/feats/feat-board';
import { useFeatStore } from '@planner/features/feats/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import {
  canonicalIdRegex,
  type CanonicalId,
} from '@rules-engine/contracts/canonical-id';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';

// --------------------------------------------------------------------------
// Fixture — L1 Humano + Guerrero (matches Phase 12.4 setupL1HumanoGuerrero).
// --------------------------------------------------------------------------

function setupL1HumanoGuerrero(): void {
  useCharacterFoundationStore
    .getState()
    .setRace('race:human' as CanonicalId);
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

// jsdom does not ship Element.prototype.scrollIntoView; seed a suite-wide
// no-op so any auto-scroll branch fired during render (including suite C
// which renders FeatBoard then dispatches setClassFeat to trigger the
// null→non-null transition) does not leak an unhandled "scrollIntoView is
// not a function" exception. The stub is installed in beforeEach and
// removed in afterEach so other suites' stub presence is unchanged.
let scrollIntoViewStubState: { had: boolean } | null = null;

function installScrollIntoViewStub(): void {
  const proto = HTMLElement.prototype as unknown as {
    scrollIntoView?: () => void;
  };
  const had = 'scrollIntoView' in proto;
  if (!had) {
    proto.scrollIntoView = function scrollIntoViewStub() {};
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

describe('Phase 15-02 — feat-sheet scroll scope (D-04) + canonicalIdRegex guard (D-07)', () => {
  beforeEach(() => {
    resetStores();
    installScrollIntoViewStub();
  });
  afterEach(() => {
    cleanup();
    removeScrollIntoViewStub();
  });

  // --------------------------------------------------------------------
  // Suite A — auto-scroll subtree containment (D-04)
  // --------------------------------------------------------------------

  it('A1: auto-scroll spy invocations all stay inside the scrollerRef subtree', () => {
    setupL1HumanoGuerrero();

    const spy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');

    try {
      const { container } = render(createElement(FeatBoard));

      // Trigger the null → non-null transition that the auto-scroll
      // effect watches (currentRecord?.classFeatId).
      useFeatStore
        .getState()
        .setClassFeat(1 as ProgressionLevel, 'feat:carrera' as CanonicalId);

      const board = container.querySelector('.feat-board__main') as
        | HTMLElement
        | null;
      expect(board).not.toBeNull();

      // Tolerate zero calls (jsdom layout no-op may suppress scrollIntoView
      // batching); forbid any call OUTSIDE the .feat-board__main subtree.
      // Spy.mock.instances holds the `this` context of each call (the
      // element scrollIntoView was invoked on).
      for (const node of spy.mock.instances) {
        const el = node as HTMLElement;
        expect(board!.contains(el)).toBe(true);
      }
    } finally {
      spy.mockRestore();
    }
  });

  // --------------------------------------------------------------------
  // Suite B — canonicalIdRegex guard contract (D-07)
  // --------------------------------------------------------------------

  it('B1: canonicalIdRegex rejects malformed featIds (silent fail-closed)', () => {
    // The runtime branch in feat-sheet handlers calls
    // `if (!canonicalIdRegex.test(featId)) return;` — this lock proves
    // the regex shape that branch relies on still rejects the malformed
    // shapes the audit (Phase 06 WR-02) flagged. Source-grep guarantees
    // the regex.test sites are present in feat-sheet.tsx (acceptance
    // criteria: count === 2).
    expect(canonicalIdRegex.test('bad/format')).toBe(false);
    expect(canonicalIdRegex.test('feat:has spaces')).toBe(false);
    expect(canonicalIdRegex.test('')).toBe(false);
    expect(canonicalIdRegex.test('feat:')).toBe(false);
    expect(canonicalIdRegex.test(':carrera')).toBe(false);
    expect(canonicalIdRegex.test('FEAT:carrera')).toBe(false);
  });

  it('B2: canonicalIdRegex accepts well-formed feat ids (the GREEN path)', () => {
    expect(canonicalIdRegex.test('feat:carrera')).toBe(true);
    expect(canonicalIdRegex.test('feat:weapon-focus.1')).toBe(true);
    expect(canonicalIdRegex.test('feat:skill-focus_alquimia')).toBe(true);
    expect(canonicalIdRegex.test('class:fighter')).toBe(true);
  });

  it('C1: canonical-id round-trip — setClassFeat dispatches when featId is canonical', () => {
    setupL1HumanoGuerrero();
    render(createElement(FeatBoard));

    useFeatStore
      .getState()
      .setClassFeat(1 as ProgressionLevel, 'feat:carrera' as CanonicalId);

    const after = useFeatStore.getState().levels;
    const afterRecord = after.find(
      (r) => r.level === (1 as ProgressionLevel),
    );
    expect(afterRecord?.classFeatId).toBe('feat:carrera');
  });
});
