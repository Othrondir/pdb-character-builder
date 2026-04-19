/**
 * Phase 12.4-04 — L1 neutral sub-steps (SPEC R6 + X1 regression lock).
 *
 * SPEC R6: "L1 sub-steps render neutral until user affirms. Clase /
 * Habilidades / Dotes sub-step ✓ is earned, not default." The current
 * regression (X1) ships a pre-green Clase / Habilidades / Dotes triplet
 * on a fresh L1 mount — the user has not selected a class or spent any
 * budget, yet every sub-step chip wears the ✓. Root cause to be nailed
 * by Task 2 (plan 12.4-04).
 *
 * Contract locked by this spec (RED-first, per CONTEXT.md D-08):
 *   1. Store init: `classByLevel[1]` is `null` — no auto-seed to Explorador.
 *   2. Pure predicates: three new exports from
 *      `@planner/features/level-progression/selectors`
 *      (`isClaseLevelComplete`, `isHabilidadesLevelComplete`,
 *      `isDotesLevelComplete`) return `false` on an empty build and flip
 *      `true` only after the corresponding user action.
 *   3. UI state: rendering the shell while level 1 is expanded:
 *      - L1 rail tile label is blank (no `Explo…` abbrev).
 *      - Clase sub-step button does NOT carry `is-complete`.
 *      - Habilidades sub-step button does NOT carry `is-complete`.
 *      - Dotes sub-step button does NOT carry `is-complete`.
 *      - Buttons expose `data-substep="class|skills|feats"` so the
 *        predicate wiring is targetable from specs.
 *   4. Dispatch-flip: after `setLevelClassId(1, 'class:fighter')`,
 *      Clase flips to `is-complete` while Habilidades + Dotes stay neutral.
 *   5. Regression guard: no level ever starts with `classId === 'class:ranger'`
 *      after `resetProgression()`.
 *
 * Harness — chooses `CreationStepper` (not `BuildProgressionBoard`) because
 * the sub-step indicators live inside `<LevelSubSteps>`, which only renders
 * when `usePlannerShellStore.expandedLevel !== null`. The test seeds the
 * shell state + foundation state, then mounts `<CreationStepper>` so both
 * the level rail and the sub-step chips are present in the same tree.
 */

/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';

import { CreationStepper } from '@planner/components/shell/creation-stepper';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import {
  isClaseLevelComplete,
  isDotesLevelComplete,
  isHabilidadesLevelComplete,
} from '@planner/features/level-progression/selectors';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Drive the planner shell into the state the user lands on right after
 * completing Atributos: race + alignment picked, L1 expanded, no class
 * chosen yet, no skills or feats allocated.
 */
function setupL1ExpandedHumano(): void {
  useCharacterFoundationStore
    .getState()
    .setRace('race:human' as CanonicalId);
  useCharacterFoundationStore
    .getState()
    .setAlignment('alignment:lawful-good' as CanonicalId);
  usePlannerShellStore.setState({
    activeOriginStep: null,
    activeLevelSubStep: 'class',
    activeView: 'creation',
    characterSheetTab: 'stats',
    datasetId: 'dataset:pendiente',
    expandedLevel: 1 as ProgressionLevel,
    mobileNavOpen: false,
  });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Phase 12.4-04 — L1 neutral sub-steps (SPEC R6 + X1)', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    useLevelProgressionStore.getState().resetProgression();
    useFeatStore.getState().resetFeatSelections();
    useCharacterFoundationStore.getState().resetFoundation();
    useSkillStore.getState().resetSkillAllocations();
    usePlannerShellStore.setState({
      activeOriginStep: 'race',
      activeLevelSubStep: null,
      activeView: 'creation',
      characterSheetTab: 'stats',
      datasetId: 'dataset:pendiente',
      expandedLevel: null,
      mobileNavOpen: false,
    });
  });

  afterEach(() => cleanup());

  // ------------------------------------------------------------------
  // Suite A — store init: no auto-seed
  // ------------------------------------------------------------------
  describe('Store init — no auto-seed to Explorador', () => {
    it('A1: classByLevel[1] === null on fresh reset', () => {
      const state = useLevelProgressionStore.getState();
      const l1 = state.levels.find((r) => r.level === 1);
      expect(l1).toBeDefined();
      expect(l1?.classId).toBeNull();
    });

    it('A2: no level starts with classId === "class:ranger" after resetProgression()', () => {
      useLevelProgressionStore.getState().resetProgression();
      const state = useLevelProgressionStore.getState();
      const rangerLevels = state.levels.filter(
        (r) => r.classId === ('class:ranger' as CanonicalId),
      );
      expect(rangerLevels).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // Suite B — pure predicates
  // ------------------------------------------------------------------
  describe('Pure predicates — exported from level-progression/selectors', () => {
    it('B1: isClaseLevelComplete returns false when classId === null', () => {
      const state = useLevelProgressionStore.getState();
      expect(isClaseLevelComplete(state, 1 as ProgressionLevel)).toBe(false);
    });

    it('B2: isClaseLevelComplete returns true after setLevelClassId(1, "class:fighter")', () => {
      useLevelProgressionStore
        .getState()
        .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
      const state = useLevelProgressionStore.getState();
      expect(isClaseLevelComplete(state, 1 as ProgressionLevel)).toBe(true);
    });

    it('B3: isHabilidadesLevelComplete returns false when no class selected (budget === 0)', () => {
      const progression = useLevelProgressionStore.getState();
      const foundation = useCharacterFoundationStore.getState();
      const feats = useFeatStore.getState();
      const skills = useSkillStore.getState();
      expect(
        isHabilidadesLevelComplete(
          progression,
          foundation,
          feats,
          skills,
          1 as ProgressionLevel,
        ),
      ).toBe(false);
    });

    it('B4: isDotesLevelComplete returns false when featSlots.total === 0 (no class)', () => {
      // Edge case locked per plan 12.4-04 acceptance: "total === 0 → neutral,
      // NOT complete" — predicate short-circuits so the ✓ is earned, not
      // defaulted from an empty budget.
      const progression = useLevelProgressionStore.getState();
      const foundation = useCharacterFoundationStore.getState();
      const feats = useFeatStore.getState();
      const skills = useSkillStore.getState();
      expect(
        isDotesLevelComplete(
          progression,
          foundation,
          feats,
          skills,
          1 as ProgressionLevel,
        ),
      ).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // Suite C — UI render: neutral at mount
  // ------------------------------------------------------------------
  describe('UI render — neutral sub-steps on fresh L1 mount', () => {
    it('C1: L1 rail tile renders blank label (no abbrev span) before class selection', () => {
      setupL1ExpandedHumano();

      render(createElement(CreationStepper));

      // `.level-rail__abbrev` span is emitted only when the rail entry has
      // a class label. A blank L1 tile therefore has no abbrev span; in
      // either shape (no span OR empty-text span) `textContent ?? ''` ===
      // '' resolves the assertion consistently.
      const l1AbbrevSpans = document.querySelectorAll(
        '.level-rail__button .level-rail__abbrev',
      );
      // The first rail entry corresponds to L1 (rail renders L1..L16 in order).
      const l1Abbrev = l1AbbrevSpans[0] ?? null;
      const label = l1Abbrev?.textContent ?? '';
      expect(label).toBe('');
    });

    it('C2: Clase sub-step button does NOT carry `is-complete` before any dispatch', () => {
      setupL1ExpandedHumano();

      render(createElement(CreationStepper));

      const claseButton = document.querySelector('[data-substep="class"]');
      expect(claseButton).not.toBeNull();
      expect(claseButton?.classList.contains('is-complete')).toBe(false);
    });

    it('C3: Habilidades sub-step button does NOT carry `is-complete` before any dispatch', () => {
      setupL1ExpandedHumano();

      render(createElement(CreationStepper));

      const habilidadesButton = document.querySelector('[data-substep="skills"]');
      expect(habilidadesButton).not.toBeNull();
      expect(habilidadesButton?.classList.contains('is-complete')).toBe(false);
    });

    it('C4: Dotes sub-step button does NOT carry `is-complete` before any dispatch', () => {
      setupL1ExpandedHumano();

      render(createElement(CreationStepper));

      const dotesButton = document.querySelector('[data-substep="feats"]');
      expect(dotesButton).not.toBeNull();
      expect(dotesButton?.classList.contains('is-complete')).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // Suite D — earns ✓ on dispatch
  // ------------------------------------------------------------------
  describe('UI render — earns ✓ only on the right dispatch', () => {
    it('D1: selecting class flips Clase sub-step to `is-complete` (Habilidades + Dotes stay neutral)', () => {
      setupL1ExpandedHumano();

      const { rerender } = render(createElement(CreationStepper));

      useLevelProgressionStore
        .getState()
        .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
      rerender(createElement(CreationStepper));

      const claseButton = document.querySelector('[data-substep="class"]');
      const habilidadesButton = document.querySelector('[data-substep="skills"]');
      const dotesButton = document.querySelector('[data-substep="feats"]');

      expect(claseButton?.classList.contains('is-complete')).toBe(true);
      expect(habilidadesButton?.classList.contains('is-complete')).toBe(false);
      expect(dotesButton?.classList.contains('is-complete')).toBe(false);
    });

    it('D2: after class selection, L1 rail tile renders the class abbrev (non-empty)', () => {
      setupL1ExpandedHumano();

      const { rerender } = render(createElement(CreationStepper));

      useLevelProgressionStore
        .getState()
        .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
      rerender(createElement(CreationStepper));

      const l1Abbrev = document.querySelector(
        '.level-rail__button .level-rail__abbrev',
      );
      expect(l1Abbrev).not.toBeNull();
      expect(l1Abbrev?.textContent ?? '').not.toBe('');
    });
  });
});
