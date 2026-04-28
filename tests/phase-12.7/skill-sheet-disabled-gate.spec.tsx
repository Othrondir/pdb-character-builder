// @vitest-environment jsdom

/**
 * Phase 12.7-02 — skill `+` disabled-gate integration spec (UAT F4 R2).
 *
 * Task 3 of plan 12.7-02. Renders <SkillSheet /> under jsdom with a
 * Humano+Clérigo L1 fixture. Asserts that after spending the full per-level
 * skill-point budget on class skills (1 pt / rank), EVERY `+` button in
 * the skill list is disabled — no way for the user to reach the old
 * "Puntos restantes: -1" overspend state via UI clicks.
 *
 * Zustand stores are module-level singletons, so each test calls resetStores
 * to guarantee a clean slate (mirrors tests/phase-12.6/level-progression-scan
 * + tests/phase-12.7/level-editor-action-bar-stepper-mount).
 *
 * This spec is GREEN from the first run: Task 2 already shipped the
 * production wire (canIncrementSkill + buildSkillBudgetSnapshotFromSheet +
 * disabled expression extension). Purpose here is to lock the UI-integration
 * behavior so future refactors (threat T-12.7-02-01 / T-12.7-02-05) fail
 * a test instead of a manual UAT.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

/**
 * Humano + Clérigo L1 setup. With Cleric skillPointsPerLevel=2 +
 * Humano skill bonus +1 + INT mod at baseScore=8 (→ -1), the resulting
 * per-level budget is: max(1, (2+1) + (-1)) × 4 = 8 pts.
 *
 * Plan refers to this fixture as "Humano + Clérigo L1 (4 pts budget)";
 * the live runtime budget is actually 8 pts with default INT baseScore=8
 * (documented in SUMMARY — gate logic is independent of specific budget
 * size; what matters is "spend N ranks where N = budget, then assert all
 * + buttons disabled").
 */
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

function setupElfoGuerreroL2WithCarryover() {
  useCharacterFoundationStore.getState().setRace('race:elf' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(2 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(2 as ProgressionLevel);
  useSkillStore.getState().setActiveLevel(2 as ProgressionLevel);
  usePlannerShellStore.setState((prev) => ({
    ...prev,
    activeOriginStep: null,
    activeLevelSubStep: 'skills',
    activeView: 'creation',
    expandedLevel: 2 as ProgressionLevel,
    mobileNavOpen: false,
  }));
}

/**
 * Spend N ranks on Clérigo class skills (costPerRank=1). Cleric class
 * skills from compiled-skills.ts include skill:concentracion,
 * skill:sanar, skill:saber-religion, skill:crear-pocion. Spread the
 * spend across skills so we test the "some skills have rank > 0, but all
 * + buttons are still disabled once the budget is full" invariant.
 */
function spendClassSkillRanks(totalRanks: number) {
  const classSkills: CanonicalId[] = [
    'skill:concentracion' as CanonicalId,
    'skill:sanar' as CanonicalId,
  ];
  // Spend roughly half on each skill; any remaining odd rank goes to the
  // first. Cap per skill is L1 class cap = L+3 = 4.
  const perSkill = Math.floor(totalRanks / classSkills.length);
  const remainder = totalRanks - perSkill * classSkills.length;
  useSkillStore
    .getState()
    .setSkillRank(1 as ProgressionLevel, classSkills[0], perSkill + remainder);
  if (classSkills.length > 1) {
    useSkillStore
      .getState()
      .setSkillRank(1 as ProgressionLevel, classSkills[1], perSkill);
  }
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

describe('Phase 12.7-02 — skill + button disabled gate integration (F4 R2)', () => {
  beforeEach(resetStores);
  afterEach(cleanup);

  // Helper: get all `+` (Aumentar) stepper buttons from the rendered sheet.
  function getPlusButtons(container: HTMLElement): HTMLButtonElement[] {
    return Array.from(
      container.querySelectorAll<HTMLButtonElement>('button.skill-sheet__stepper'),
    ).filter((btn) => btn.getAttribute('aria-label')?.startsWith('Aumentar'));
  }

  // B1 — after spending the full L1 budget on class skills, every remaining
  // `+` button MUST be disabled. UAT F4 repro: before Task 2, the user could
  // drive `Puntos restantes: -1`; after Task 2, the gate blocks every click.
  it('Suite B1: after spending full L1 budget, every + button is disabled', () => {
    setupHumanoClerigoL1();

    const { container, rerender } = render(createElement(SkillSheet));

    // Read the live budget from the DOM (robust to fixture arithmetic
    // differences — Humano+Clérigo+INT=8 = 8 pts; plan's "4 pts" was the
    // UAT screenshot from a different INT setting).
    const availablePointsDd = container.querySelector(
      'dl dd',
    ) as HTMLElement | null;
    expect(availablePointsDd).not.toBeNull();
    const budget = Number(availablePointsDd!.textContent ?? '0');
    expect(budget).toBeGreaterThan(0);

    // Spend the full budget on class skills (cost=1/rank). Then rerender so
    // the selector picks up the updated state.
    spendClassSkillRanks(budget);
    rerender(createElement(SkillSheet));

    const plusButtons = getPlusButtons(container);
    expect(plusButtons.length).toBeGreaterThan(0);

    const notDisabled = plusButtons.filter((btn) => !btn.disabled);
    expect(notDisabled.length).toBe(0);
  });

  // B2 — sanity check: before spending the full budget, at least SOME
  // class-skill `+` buttons are enabled. Prevents the gate from regressing
  // to "always disabled" (false positive on B1 that would mask a logic bug).
  it('Suite B2: before spending full budget, at least one + button is enabled', () => {
    setupHumanoClerigoL1();

    const { container, rerender } = render(createElement(SkillSheet));

    const availablePointsDd = container.querySelector(
      'dl dd',
    ) as HTMLElement | null;
    const budget = Number(availablePointsDd!.textContent ?? '0');
    expect(budget).toBeGreaterThan(1);

    // Spend budget - 1 ranks so at least 1 pt remains — class skills
    // (cost=1) should still allow 1 more rank.
    spendClassSkillRanks(budget - 1);
    rerender(createElement(SkillSheet));

    const plusButtons = getPlusButtons(container);
    const notDisabled = plusButtons.filter((btn) => !btn.disabled);
    expect(notDisabled.length).toBeGreaterThan(0);
  });

  // B3 — belt-and-braces. The post-hoc error callout "El reparto de este
  // nivel supera los límites permitidos" must NEVER appear when the gate
  // is active — there is no UI path to overspend after Task 2 wires
  // canIncrementSkill. If this text leaks, the gate is not blocking the
  // click; it means the helper returned true when it should have returned
  // false (T-12.7-02-05 skill-id keying mismatch).
  it('Suite B3: overspend error text is never reachable via UI clicks (gate prevents it)', () => {
    setupHumanoClerigoL1();

    const { container, rerender } = render(createElement(SkillSheet));

    const availablePointsDd = container.querySelector(
      'dl dd',
    ) as HTMLElement | null;
    const budget = Number(availablePointsDd!.textContent ?? '0');
    expect(budget).toBeGreaterThan(0);

    spendClassSkillRanks(budget);
    rerender(createElement(SkillSheet));

    expect(container.textContent).not.toContain('supera los límites permitidos');
  });

  it('Suite B4: level 2 summary shows carried points from the previous legal level', () => {
    setupElfoGuerreroL2WithCarryover();

    const { container } = render(createElement(SkillSheet));

    const summaryValues = Array.from(
      container.querySelectorAll<HTMLDivElement>('.skill-sheet__summary-grid > div'),
    ).map((entry) => entry.textContent?.replace(/\s+/g, ' ').trim() ?? '');

    expect(summaryValues[0]).toContain('Puntos disponibles');
    expect(summaryValues[0]).toContain('5');
    expect(summaryValues[1]).toContain('Puntos guardados');
    expect(summaryValues[1]).toContain('4');
  });
});
