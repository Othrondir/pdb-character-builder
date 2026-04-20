// @vitest-environment jsdom

/**
 * Phase 12.7-01 — RED regression spec locking the F7 BLOCKER repro + the
 * stable-key + testid-contract invariants.
 *
 * Current master (as of 2026-04-20 post-12.6 UAT): <LevelEditorActionBar>
 * mounts inside <LevelProgressionRow>'s {isActive && ...} expanded slot.
 * BuildProgressionBoard mounts only under the 'class' sub-step of
 * center-content.tsx; when the user navigates to 'skills' or 'feats' the
 * board unmounts and the action bar disappears. User cannot find the advance
 * affordance on Habilidades / Dotes — F7.
 *
 * This spec renders <CreationStepper /> directly — the sibling mount site
 * that the fix will hoist the bar onto — and asserts the bar is visible on
 * EACH of the three sub-steps. At RED baseline, Suites A2/A3 (Habilidades /
 * Dotes) + A5 (stable key) + A6 (testid contract under CreationStepper)
 * MUST fail because CreationStepper never mounts <LevelEditorActionBar>
 * today. A1 (class sub-step) + A4 (L20 null) are structural invariants
 * that are checked here too — under RED they may also fail (CreationStepper
 * has no bar at all) but the assertions LOCK the post-fix shape. The
 * fix (Task 2) moves the mount into CreationStepper and all 6 suites pass.
 *
 * Test isolation: mirrors tests/phase-12.6/level-progression-scan.spec.tsx
 * resetStores() pattern. Zustand stores are module-level singletons, so
 * every test calls the five resets to guarantee a clean slate.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';

import { CreationStepper } from '@planner/components/shell/creation-stepper';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';

// --------------------------------------------------------------------------
// Fixture helpers — Elfo + Guerrero L1 with enough slot-fill to enable the
// advance button (mirrors tests/phase-12.6 setupL1ElfoGuerreroFullyLegal).
// --------------------------------------------------------------------------

function setupElfoGuerreroL1() {
  // Race + alignment (alignment not strictly required for the action-bar
  // mount, but kept for realism with the 12.4/12.6 harness fixtures).
  useCharacterFoundationStore.getState().setRace('race:elf' as CanonicalId);
  useCharacterFoundationStore
    .getState()
    .setAlignment('alignment:true-neutral' as CanonicalId);
  // L1 class — activates L2 G1 gate + makes ClassPicker derive a class label.
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
  // Planner shell — expandedLevel=1, sub-step defaults to 'class' per setup
  // helper (individual suites override activeLevelSubStep as needed).
  usePlannerShellStore.setState((prev) => ({
    ...prev,
    activeOriginStep: null,
    activeLevelSubStep: 'class',
    activeView: 'creation',
    expandedLevel: 1 as ProgressionLevel,
    mobileNavOpen: false,
  }));
}

// Fill L1 Elfo+Guerrero slots so the advance button reaches enabled state —
// Suite A6 asserts the resulting testid `advance-to-level-2` exists.
function fillL1ElfoGuerreroSlots() {
  useFeatStore
    .getState()
    .setClassFeat(1 as ProgressionLevel, 'feat:carrera' as CanonicalId);
  useFeatStore
    .getState()
    .setGeneralFeat(1 as ProgressionLevel, 'feat:alertness' as CanonicalId);
  useSkillStore
    .getState()
    .setSkillRank(1 as ProgressionLevel, 'skill:trepar' as CanonicalId, 4);
}

function resetStores() {
  cleanup();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  useLevelProgressionStore.getState().resetProgression();
  useFeatStore.getState().resetFeatSelections();
  useSkillStore.getState().resetSkillAllocations();
  useCharacterFoundationStore.getState().resetFoundation();
  // Planner shell — reset to a neutral baseline so the next test is
  // independent. setExpandedLevel(null) also clears sub-step via store logic.
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

describe('Phase 12.7-01 — LevelEditorActionBar stepper-mount regression (F7 R1)', () => {
  beforeEach(resetStores);
  afterEach(cleanup);

  // A1 — baseline: bar visible on the Progresión-Clase sub-step. Under RED
  // this FAILS (bar lives in LevelProgressionRow, not CreationStepper). Under
  // GREEN the hoisted mount in creation-stepper.tsx renders the bar.
  it('Suite A1: action bar visible inside <CreationStepper /> on Progresion-Clase sub-step', () => {
    setupElfoGuerreroL1();
    usePlannerShellStore.setState((s) => ({ ...s, activeLevelSubStep: 'class' }));

    const { container } = render(createElement(CreationStepper));

    const bar = container.querySelector('[data-testid="level-editor-action-bar"]');
    expect(bar).not.toBeNull();
  });

  // A2 — F7 R1 regression repro: bar visible on the Habilidades sub-step.
  // Currently FAILS at RED (sub-step switch away from 'class' unmounts the
  // board → bar disappears from LevelProgressionRow). Under GREEN the
  // hoisted mount in creation-stepper.tsx persists across sub-step changes.
  it('Suite A2: action bar visible inside <CreationStepper /> on Progresion-Habilidades sub-step (R1 fix)', () => {
    setupElfoGuerreroL1();
    usePlannerShellStore.setState((s) => ({ ...s, activeLevelSubStep: 'skills' }));

    const { container } = render(createElement(CreationStepper));

    const bar = container.querySelector('[data-testid="level-editor-action-bar"]');
    expect(bar).not.toBeNull();
  });

  // A3 — same as A2 for Dotes sub-step.
  it('Suite A3: action bar visible inside <CreationStepper /> on Progresion-Dotes sub-step (R1 fix)', () => {
    setupElfoGuerreroL1();
    usePlannerShellStore.setState((s) => ({ ...s, activeLevelSubStep: 'feats' }));

    const { container } = render(createElement(CreationStepper));

    const bar = container.querySelector('[data-testid="level-editor-action-bar"]');
    expect(bar).not.toBeNull();
  });

  // A4 — terminal-level invariant: at L20 the action bar returns null via
  // PROGRESSION_LEVEL_CAP short-circuit. Mount site must preserve this.
  it('Suite A4: action bar returns null at L20 (PROGRESSION_LEVEL_CAP terminal)', () => {
    // Seed enough state for CreationStepper to render without crashing but
    // point planner at L20 — the bar component should short-circuit to null
    // even though expandedLevel is set.
    useCharacterFoundationStore.getState().setRace('race:elf' as CanonicalId);
    useLevelProgressionStore.getState().setActiveLevel(20 as ProgressionLevel);
    usePlannerShellStore.setState((prev) => ({
      ...prev,
      activeOriginStep: null,
      activeLevelSubStep: 'class',
      activeView: 'creation',
      expandedLevel: 20 as ProgressionLevel,
      mobileNavOpen: false,
    }));

    const { container } = render(createElement(CreationStepper));

    const bar = container.querySelector('[data-testid="level-editor-action-bar"]');
    expect(bar).toBeNull();
  });

  // A5 — STABLE KEY PROOF. Under GREEN the mount uses `key={expandedLevel}`
  // (D-02 invariant, NOT activeLevelSubStep). Transitioning sub-steps within
  // the same level MUST preserve the exact DOM node — React sees the same
  // key and reuses the subtree.
  //
  // Threat guard T-12.7-01-01: a future refactor that flips the key to
  // `activeLevelSubStep` would fail this test immediately — the node
  // identity would change because React would unmount/remount.
  it('Suite A5: sub-step transition preserves exact DOM node (stable key=expandedLevel)', () => {
    setupElfoGuerreroL1();
    usePlannerShellStore.setState((s) => ({ ...s, activeLevelSubStep: 'class' }));

    const { container, rerender } = render(createElement(CreationStepper));

    const before = container.querySelector('[data-testid="level-editor-action-bar"]');
    expect(before).not.toBeNull();

    usePlannerShellStore.setState((s) => ({ ...s, activeLevelSubStep: 'skills' }));
    rerender(createElement(CreationStepper));

    const after = container.querySelector('[data-testid="level-editor-action-bar"]');
    expect(after).not.toBeNull();
    // Literal same DOM node — React preserved the subtree because the key
    // (expandedLevel=1) did NOT change across the rerender.
    expect(after).toBe(before);
  });

  // A6 — testid contract preservation. Phase 12.4-09 E2E selects via
  // [data-testid="advance-to-level-{N+1}"]. The mount-site hoist must
  // not rename this attribute.
  it('Suite A6: advance-to-level-{N+1} testid preserved under hoisted mount (12.4-09 contract)', () => {
    setupElfoGuerreroL1();
    fillL1ElfoGuerreroSlots();
    usePlannerShellStore.setState((s) => ({ ...s, activeLevelSubStep: 'class' }));

    const { container } = render(createElement(CreationStepper));

    const bar = container.querySelector('[data-testid="level-editor-action-bar"]');
    expect(bar).not.toBeNull();

    const advanceButton = container.querySelector(
      '[data-testid="advance-to-level-2"]',
    ) as HTMLButtonElement | null;
    expect(advanceButton).not.toBeNull();
  });
});
