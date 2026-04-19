// @vitest-environment jsdom

/**
 * Phase 12.3-03 — UAT B3 (CRITICAL) + B4 (HIGH) regression lock.
 *
 * Root cause captured in CONTEXT.md D-03: `selectFeatBoardView`'s empty-state
 * branch reads `progressionHasClass = progressionState.levels.some(l => l.classId !== null)`,
 * a GLOBAL check. Consequences:
 *   - Confusing empty-state messaging when a subset of levels has classes.
 *   - No per-level signal when the active level itself has no class.
 *   - No slot count prompt to tell the user how many feats they can pick
 *     at the active level ("Dote de clase disponible", "Dote general
 *     disponible").
 *
 * The fix scopes the empty-state gate to the ACTIVE level's `classId` and
 * adds a new `slotPrompt` field on `ActiveFeatSheetView` that FeatBoard
 * renders above the sheet/detail-panel pair when non-null.
 *
 * Suites:
 *   A — empty-state scope (selector unit tests).
 *   B — slotPrompt shape (selector unit tests).
 *   C — multiclass no-regression (selector unit test).
 *   D — FeatBoard render (RTL integration).
 *
 * Suites A, B, and D are RED signals for Task 2 (the fix). Suite C is a
 * forward-looking lock.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { FeatBoard } from '@planner/features/feats/feat-board';
import { selectFeatBoardView } from '@planner/features/feats/selectors';
import { useFeatStore } from '@planner/features/feats/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useSkillStore } from '@planner/features/skills/store';
import { shellCopyEs } from '@planner/lib/copy/es';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function setupL1Guerrero(): void {
  useCharacterFoundationStore
    .getState()
    .setRace('race:human' as CanonicalId);
  useCharacterFoundationStore
    .getState()
    .setAlignment('alignment:lawful-good' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
}

function snapshotBoardView() {
  return selectFeatBoardView(
    useFeatStore.getState(),
    useLevelProgressionStore.getState(),
    useCharacterFoundationStore.getState(),
    useSkillStore.getState(),
  );
}

function activateLevel(level: ProgressionLevel): void {
  useLevelProgressionStore.getState().setActiveLevel(level);
  useFeatStore.getState().setActiveLevel(level);
}

// --------------------------------------------------------------------------
// Suite setup
// --------------------------------------------------------------------------

describe('Phase 12.3-03 — per-level Dotes gate + slot prompt (UAT B3 + B4)', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    useLevelProgressionStore.getState().resetProgression();
    useFeatStore.getState().resetFeatSelections();
    useCharacterFoundationStore.getState().resetFoundation();
    useSkillStore.getState().resetSkillAllocations();
  });

  // ------------------------------------------------------------------
  // Suite A — empty-state scope (B3 lock)
  // ------------------------------------------------------------------
  describe('Suite A — empty-state scope (B3 lock)', () => {
    it('A1: L1 Guerrero + activeLevel=1 → board renders (emptyStateBody === null)', () => {
      setupL1Guerrero();
      activateLevel(1 as ProgressionLevel);

      const view = snapshotBoardView();

      expect(view.emptyStateBody).toBeNull();
      expect(view.activeSheet.level).toBe(1);
      expect(view.activeSheet.classId).toBe('class:fighter');
    });

    it('A2: L1 Guerrero + activeLevel=2 (L2 empty) → per-level empty message', () => {
      setupL1Guerrero();
      activateLevel(2 as ProgressionLevel);

      const view = snapshotBoardView();

      // New per-level copy key — RED when missing from es.ts.
      expect(view.emptyStateBody).toBe(
        shellCopyEs.feats.emptyStateBodyPerLevel,
      );
      // Must NOT still surface the old global-gate copy when scoped per-level.
      expect(view.emptyStateBody).not.toBe(
        shellCopyEs.feats.emptyStateBody,
      );
    });

    it('A3: L1 Guerrero + L2 Pícaro + activeLevel=2 → board renders for L2', () => {
      setupL1Guerrero();
      useLevelProgressionStore
        .getState()
        .setLevelClassId(2 as ProgressionLevel, 'class:rogue' as CanonicalId);
      activateLevel(2 as ProgressionLevel);

      const view = snapshotBoardView();

      expect(view.emptyStateBody).toBeNull();
      expect(view.activeSheet.level).toBe(2);
      expect(view.activeSheet.classId).toBe('class:rogue');
    });
  });

  // ------------------------------------------------------------------
  // Suite B — slotPrompt shape (B4 lock)
  // ------------------------------------------------------------------
  describe('Suite B — slotPrompt shape (B4 lock)', () => {
    it('L1 Guerrero empty → slotPrompt mentions class and general slots', () => {
      setupL1Guerrero();
      activateLevel(1 as ProgressionLevel);

      const view = snapshotBoardView();

      expect(view.activeSheet.slotPrompt).not.toBeNull();
      expect(view.activeSheet.slotPrompt).toMatch(/dote de clase/i);
      expect(view.activeSheet.slotPrompt).toMatch(/dote general/i);
    });

    it('L1 Guerrero with class-bonus feat picked → slotPrompt drops class portion but keeps general', () => {
      setupL1Guerrero();
      activateLevel(1 as ProgressionLevel);

      // Derribo is a legal L1 Guerrero class-bonus feat (no prereqs).
      useFeatStore
        .getState()
        .setClassFeat(
          1 as ProgressionLevel,
          'feat:derribo' as CanonicalId,
        );

      const view = snapshotBoardView();

      expect(view.activeSheet.slotPrompt).not.toBeNull();
      expect(view.activeSheet.slotPrompt).not.toMatch(/dote de clase disponible/i);
      expect(view.activeSheet.slotPrompt).toMatch(/dote general disponible/i);
    });

    it('L1 Guerrero with BOTH slots filled → slotPrompt === null', () => {
      setupL1Guerrero();
      activateLevel(1 as ProgressionLevel);

      useFeatStore
        .getState()
        .setClassFeat(
          1 as ProgressionLevel,
          'feat:derribo' as CanonicalId,
        );
      useFeatStore
        .getState()
        .setGeneralFeat(
          1 as ProgressionLevel,
          'feat:alertness' as CanonicalId,
        );

      const view = snapshotBoardView();

      expect(view.activeSheet.slotPrompt).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // Suite C — multiclass no-regression
  // ------------------------------------------------------------------
  describe('Suite C — multiclass no-regression', () => {
    it('L1 Guerrero + L2 Pícaro + activeLevel=2: slotPrompt reflects determineFeatSlots output', () => {
      setupL1Guerrero();
      useLevelProgressionStore
        .getState()
        .setLevelClassId(2 as ProgressionLevel, 'class:rogue' as CanonicalId);
      activateLevel(2 as ProgressionLevel);

      const view = snapshotBoardView();

      // Sheet follows activeLevel + its class.
      expect(view.activeSheet.level).toBe(2);
      expect(view.activeSheet.classId).toBe('class:rogue');

      // Contract: slotPrompt is null iff both booleans from
      // determineFeatSlots are false OR both slots are filled. With
      // no feats picked at L2, the prompt must mirror the slot booleans.
      const hasAnySlot =
        view.activeSheet.hasClassBonusSlot || view.activeSheet.hasGeneralSlot;

      if (hasAnySlot) {
        expect(view.activeSheet.slotPrompt).not.toBeNull();
      } else {
        expect(view.activeSheet.slotPrompt).toBeNull();
      }
    });
  });

  // ------------------------------------------------------------------
  // Suite D — FeatBoard render
  // ------------------------------------------------------------------
  describe('Suite D — FeatBoard render shows slot prompt + new per-level copy', () => {
    it('renders slotPrompt text for L1 Guerrero empty', () => {
      setupL1Guerrero();
      activateLevel(1 as ProgressionLevel);

      render(createElement(FeatBoard));

      expect(screen.getByText(/dote de clase disponible/i)).toBeTruthy();
      expect(screen.getByText(/dote general disponible/i)).toBeTruthy();
    });

    it('renders per-level empty message at activeLevel=2 with no class', () => {
      setupL1Guerrero();
      activateLevel(2 as ProgressionLevel);

      render(createElement(FeatBoard));

      expect(
        screen.getByText(shellCopyEs.feats.emptyStateBodyPerLevel),
      ).toBeTruthy();
      // Old global copy must NOT be what we render in this per-level branch.
      expect(
        screen.queryByText(
          /Completa una progresion valida en Construccion para seleccionar dotes por nivel\./i,
        ),
      ).toBeNull();
    });
  });
});
