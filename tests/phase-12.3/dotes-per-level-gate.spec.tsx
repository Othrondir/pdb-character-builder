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

function setupGoliatBarbaroGuerreroSplit(): void {
  const foundation = useCharacterFoundationStore.getState();
  foundation.setRace('race:goliat' as CanonicalId);
  foundation.setAlignment('alignment:chaotic-good' as CanonicalId);

  const progression = useLevelProgressionStore.getState();
  const classesByLevel: Record<number, CanonicalId> = {
    1: 'class:barbarian' as CanonicalId,
    2: 'class:fighter' as CanonicalId,
    3: 'class:fighter' as CanonicalId,
    4: 'class:barbarian' as CanonicalId,
    5: 'class:barbarian' as CanonicalId,
    7: 'class:barbarian' as CanonicalId,
    8: 'class:fighter' as CanonicalId,
    9: 'class:barbarian' as CanonicalId,
    10: 'class:fighter' as CanonicalId,
  };

  for (const [level, classId] of Object.entries(classesByLevel)) {
    progression.setLevelClassId(Number(level) as ProgressionLevel, classId);
  }
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
    it('L1 Guerrero empty → slotPrompt mentions class and the pending general slot (singular under Plan 16-02)', () => {
      // Plan 16-02 (D-04): race-bonus is its own card, no longer folded into
      // the general slot count. Humano L1 Guerrero now has generalSlotCount=1
      // → slotPrompt uses the singular "dote general disponible" template.
      setupL1Guerrero();
      activateLevel(1 as ProgressionLevel);

      const view = snapshotBoardView();

      expect(view.activeSheet.slotPrompt).not.toBeNull();
      expect(view.activeSheet.slotPrompt).toMatch(/dote de clase/i);
      expect(view.activeSheet.slotPrompt).toMatch(/dote general disponible/i);
    });

    it('L1 Guerrero with class-bonus feat picked → slotPrompt drops class portion but keeps the pending general slot', () => {
      // Plan 16-02 (D-04): same singular-prompt change as above.
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

    it('L1 Guerrero with class slot + general slot filled → slotPrompt is null (race-bonus tracked separately)', () => {
      // Plan 16-02 (D-04): race-bonus is its own slot card, not part of the
      // slotPrompt aggregate. With the single general slot filled at Humano
      // L1, slotPrompt no longer reports a pending bonus general slot — the
      // race-bonus slot strip card surfaces its own status instead.
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

      // Class slot filled + 1/1 general slot filled → no remaining slots
      // tracked by slotPrompt. (Race-bonus slot card carries its own state.)
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

    it('Goliat Bárbaro/Guerrero import: L10 Guerrero 4 does not invent a Puerta-invalid bonus feat slot', () => {
      setupGoliatBarbaroGuerreroSplit();
      activateLevel(10 as ProgressionLevel);

      const view = snapshotBoardView();

      expect(view.activeSheet.level).toBe(10);
      expect(view.activeSheet.classId).toBe('class:fighter');
      expect(view.activeSheet.hasClassBonusSlot).toBe(false);
      expect(view.activeSheet.hasGeneralSlot).toBe(false);
      expect(view.activeSheet.slotPrompt).toBeNull();
      expect(view.counters.slots).toBe(0);
      expect(view.slotStatuses).toEqual([]);
    });

    it('Goliat Bárbaro/Guerrero import: L8 Guerrero 3 keeps the valid Puerta bonus feat slot', () => {
      setupGoliatBarbaroGuerreroSplit();
      activateLevel(8 as ProgressionLevel);

      const view = snapshotBoardView();

      expect(view.activeSheet.level).toBe(8);
      expect(view.activeSheet.classId).toBe('class:fighter');
      expect(view.activeSheet.hasClassBonusSlot).toBe(true);
      expect(view.counters.slots).toBe(1);
      expect(view.slotStatuses).toHaveLength(1);
      expect(view.slotStatuses[0]?.slot).toBe('class-bonus');
    });
  });

  // ------------------------------------------------------------------
  // Suite D — FeatBoard render
  // ------------------------------------------------------------------
  describe('Suite D — FeatBoard render shows slot prompt + new per-level copy', () => {
    it('renders slotPrompt text for L1 Guerrero empty', () => {
      // Plan 16-02 (D-04): under Humano L1 the singular "dote general
      // disponible" template fires (race-bonus is now its own card so the
      // general slot count is 1, not 2). The class-bonus prompt and the
      // singular general-slot prompt both render.
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
