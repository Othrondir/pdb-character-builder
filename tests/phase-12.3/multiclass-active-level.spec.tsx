// @vitest-environment jsdom

/**
 * Phase 12.3-02 — UAT B2 (CRITICAL) + B8 + B9 regression lock.
 *
 * Root cause captured in CONTEXT.md D-02: `LevelRail` fires `setExpandedLevel`
 * on click (shell store) but never calls `setActiveLevel` on the progression
 * store. Consequences:
 *   - `progressionState.activeLevel` stays at 1 forever.
 *   - `selectActiveLevelSheet` always returns level 1's view.
 *   - Every class pick writes to `levels[0].classId` regardless of which rail
 *     button the user clicked.
 *   - `BuildProgressionBoard` header reads `NIVEL 1` forever.
 *   - `Clase` sub-step ✓ appears globally after the first pick.
 *
 * Suites:
 *   A — LevelRail click dispatch contract: BOTH stores must update.
 *   B — Per-level class persistence without L1 overwrite (B2 lock).
 *   C — Board title binds to live activeLevel (B8 ripple).
 *   D — selectActiveLevelSheet follows activeLevel (B9 contract).
 *
 * Suite A is the RED signal for Task 2 (the fix). Suites B and D pass on the
 * store layer already; they ship as forward-looking locks against future drift.
 * Suite C flips RED → GREEN in lockstep with Suite A because the title binds
 * through `activeSheet.level` (which reads `progressionState.activeLevel`).
 */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { LevelRail } from '@planner/components/shell/level-rail';
import { BuildProgressionBoard } from '@planner/features/level-progression/build-progression-board';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { selectActiveLevelSheet } from '@planner/features/level-progression/selectors';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

describe('Phase 12.3-02 — multiclass active-level switching (UAT B2 + B8 + B9)', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    useLevelProgressionStore.getState().resetProgression();
    useCharacterFoundationStore.getState().resetFoundation();
    usePlannerShellStore.setState({
      activeOriginStep: null,
      activeLevelSubStep: 'class',
      activeView: 'creation',
      characterSheetTab: 'stats',
      datasetId: 'dataset:pendiente',
      expandedLevel: null,
      mobileNavOpen: false,
    });
  });

  // UAT-2026-04-20 G1 — rail buttons require prior-level classId to unlock
  // the next. Suite A tests the dispatch contract on unlocked levels only,
  // so seed all 16 just for Suite A. Suites B/C/D retain the reset baseline
  // (Suite B explicitly asserts L3+ classId === null after an L1/L2 pick).
  function seedAllRailLevelsUnlocked() {
    const setClass = useLevelProgressionStore.getState().setLevelClassId;
    for (let l = 1; l <= 16; l++) {
      setClass(l as ProgressionLevel, 'class:fighter' as CanonicalId);
    }
  }

  // ------------------------------------------------------------------
  // Suite A — rail click dispatch contract
  // ------------------------------------------------------------------
  describe('Suite A — rail click dispatches BOTH setActiveLevel and setExpandedLevel', () => {
    beforeEach(() => {
      seedAllRailLevelsUnlocked();
    });

    it('clicking level 2 button updates progression.activeLevel AND shell.expandedLevel', () => {
      render(createElement(LevelRail));
      const level2Button = screen.getByRole('radio', { name: /^2Guerrero/ });

      act(() => {
        fireEvent.click(level2Button);
      });

      expect(useLevelProgressionStore.getState().activeLevel).toBe(2);
      expect(usePlannerShellStore.getState().expandedLevel).toBe(2);
    });

    it('clicking level 5 updates both stores to 5', () => {
      render(createElement(LevelRail));
      const level5Button = screen.getByRole('radio', { name: /^5Guerrero/ });

      act(() => {
        fireEvent.click(level5Button);
      });

      expect(useLevelProgressionStore.getState().activeLevel).toBe(5);
      expect(usePlannerShellStore.getState().expandedLevel).toBe(5);
    });

    it('successive clicks flip activeLevel independently (2 -> 7 -> 1)', () => {
      render(createElement(LevelRail));

      act(() => {
        fireEvent.click(screen.getByRole('radio', { name: /^2Guerrero/ }));
      });
      expect(useLevelProgressionStore.getState().activeLevel).toBe(2);

      act(() => {
        fireEvent.click(screen.getByRole('radio', { name: /^7Guerrero/ }));
      });
      expect(useLevelProgressionStore.getState().activeLevel).toBe(7);

      act(() => {
        fireEvent.click(screen.getByRole('radio', { name: /^1Guerrero/ }));
      });
      expect(useLevelProgressionStore.getState().activeLevel).toBe(1);
    });
  });

  // ------------------------------------------------------------------
  // Suite B — per-level class persistence without L1 overwrite (B2 lock)
  // ------------------------------------------------------------------
  describe('Suite B — per-level class persistence (B2 no-overwrite lock)', () => {
    it('picking Guerrero at L1 then Pícaro at L2 persists both, no overwrite', () => {
      const store = useLevelProgressionStore.getState();
      store.setActiveLevel(1 as ProgressionLevel);
      store.setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
      store.setActiveLevel(2 as ProgressionLevel);
      store.setLevelClassId(2 as ProgressionLevel, 'class:rogue' as CanonicalId);

      const state = useLevelProgressionStore.getState();
      expect(state.levels.find((r) => r.level === 1)?.classId).toBe('class:fighter');
      expect(state.levels.find((r) => r.level === 2)?.classId).toBe('class:rogue');
      expect(
        state.levels.filter((r) => r.level >= 3).every((r) => r.classId === null),
      ).toBe(true);
    });

    it('UAT repro: after Humano + Guerrero L1, clicking L2 and picking Pícaro keeps L1 Guerrero intact', () => {
      // Seed the foundation as a legal Humano build so class options at L1/L2 resolve.
      const foundation = useCharacterFoundationStore.getState();
      foundation.setRace('race:human' as CanonicalId);
      foundation.setAlignment('alignment:true-neutral' as CanonicalId);

      // Render the board to drive class picks through the real UI path.
      render(createElement(BuildProgressionBoard));

      // L1 Guerrero via the store's setter (the picker uses setLevelClassId under the hood).
      act(() => {
        useLevelProgressionStore
          .getState()
          .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
      });

      // Simulate the rail click effect: BOTH setActiveLevel AND setExpandedLevel.
      // (Suite A locks that the rail dispatches both; here we simulate the post-fix
      // invariant so Suite B's assertion stays focused on persistence semantics.)
      act(() => {
        useLevelProgressionStore.getState().setActiveLevel(2 as ProgressionLevel);
        usePlannerShellStore.getState().setExpandedLevel(2 as ProgressionLevel);
      });

      // L2 Pícaro.
      act(() => {
        useLevelProgressionStore
          .getState()
          .setLevelClassId(2 as ProgressionLevel, 'class:rogue' as CanonicalId);
      });

      const state = useLevelProgressionStore.getState();
      expect(state.levels.find((r) => r.level === 1)?.classId).toBe('class:fighter');
      expect(state.levels.find((r) => r.level === 2)?.classId).toBe('class:rogue');
    });
  });

  // ------------------------------------------------------------------
  // Suite C — board title binds to live activeLevel (B8 ripple)
  // ------------------------------------------------------------------
  // Phase 12.6-03 (PROG-04 R5) superseded the single-level title binding:
  // BuildProgressionBoard's <h2> now reads the Plan-01-patched
  // `shellCopyEs.progression.railHeading` ('Progresión 1-20') — a static
  // heading, not a per-level title. The per-level class heading moves into
  // the expanded-row slot in Plan 04. Active-level binding is still locked
  // by Suites B + D in this file (store semantics) and by
  // tests/phase-12.6/level-progression-scan.spec.tsx Suite C (Plan 04).
  describe.skip('Suite C — title binds to active level (B8 fold-in)', () => {
    it('title reads "nivel 1" initially', () => {
      render(createElement(BuildProgressionBoard));
      // The copy is "Selecciona la clase del nivel" + " " + level; we match case-insensitively.
      expect(screen.getByRole('heading', { name: /nivel 1\b/i })).not.toBeNull();
    });

    it('flipping activeLevel to 3 updates the rendered title to "nivel 3"', () => {
      const { rerender } = render(createElement(BuildProgressionBoard));

      act(() => {
        useLevelProgressionStore.getState().setActiveLevel(3 as ProgressionLevel);
      });
      rerender(createElement(BuildProgressionBoard));

      expect(screen.getByRole('heading', { name: /nivel 3\b/i })).not.toBeNull();
      // And the old L1 title must be gone.
      expect(screen.queryByRole('heading', { name: /nivel 1\b/i })).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // Suite D — selectActiveLevelSheet follows activeLevel (B9 contract)
  // ------------------------------------------------------------------
  describe('Suite D — selectActiveLevelSheet follows activeLevel (B9 fold-in contract)', () => {
    it('level field and classId track activeLevel', () => {
      const prog = useLevelProgressionStore.getState();
      prog.setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
      prog.setActiveLevel(2 as ProgressionLevel);
      prog.setLevelClassId(2 as ProgressionLevel, 'class:rogue' as CanonicalId);

      const foundation = useCharacterFoundationStore.getState();

      const sheetAtL2 = selectActiveLevelSheet(
        useLevelProgressionStore.getState(),
        foundation,
      );
      expect(sheetAtL2.level).toBe(2);
      expect(sheetAtL2.classId).toBe('class:rogue');

      useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
      const sheetAtL1 = selectActiveLevelSheet(
        useLevelProgressionStore.getState(),
        foundation,
      );
      expect(sheetAtL1.level).toBe(1);
      expect(sheetAtL1.classId).toBe('class:fighter');
    });
  });
});
