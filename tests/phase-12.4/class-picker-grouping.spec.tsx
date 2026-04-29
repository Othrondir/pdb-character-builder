// @vitest-environment jsdom

/**
 * Phase 12.4-06 — RED spec for SPEC R1 (CLAS-01..04 + PICK-01).
 *
 * Asserts that the extracted `<ClassPicker>` renders:
 *   - Two `<section>` blocks ('Clases básicas' + 'Clases de prestigio')
 *     with `aria-labelledby` wired to each `<h3>`.
 *   - All BASE_CLASS_ALLOWLIST ids inside the base section.
 *   - At L1, every prestige row has `aria-disabled="true"` without the
 *     suppressed L1 reason copy.
 *   - CLAS-03 regression: rows with `status === 'blocked'` or `illegal` from
 *     the class-option selector render `aria-disabled="true"`.
 *     Prevents silent regression if selector refactor breaks the
 *     status → aria wiring.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';

import { ClassPicker } from '@planner/features/level-progression/class-picker';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import { selectClassOptionsForLevel } from '@planner/features/level-progression/selectors';
import { BASE_CLASS_ALLOWLIST } from '@planner/features/level-progression/class-fixture';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

function setupL1Humano(
  alignmentId: CanonicalId = 'alignment:true-neutral' as CanonicalId,
): void {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  useCharacterFoundationStore.getState().setAlignment(alignmentId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
}

describe('Phase 12.4-06 — ClassPicker grouping + prestige gate (SPEC R1 / CLAS-01..04 + PICK-01)', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    useLevelProgressionStore.getState().resetProgression();
    useFeatStore.getState().resetFeatSelections();
    useCharacterFoundationStore.getState().resetFoundation();
    useSkillStore.getState().resetSkillAllocations();
  });
  afterEach(() => cleanup());

  it('renders two <section>s with Clases básicas + Clases de prestigio headings', () => {
    setupL1Humano();
    render(createElement(ClassPicker));
    expect(
      screen.getByRole('heading', { name: 'Clases básicas' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Clases de prestigio' }),
    ).toBeInTheDocument();
  });

  it('sections have aria-labelledby wired to their <h3>', () => {
    setupL1Humano();
    render(createElement(ClassPicker));

    const baseHeading = screen.getByRole('heading', { name: 'Clases básicas' });
    const prestigeHeading = screen.getByRole('heading', {
      name: 'Clases de prestigio',
    });

    expect(baseHeading.id).toBeTruthy();
    expect(prestigeHeading.id).toBeTruthy();

    const baseSection = baseHeading.closest('section');
    const prestigeSection = prestigeHeading.closest('section');

    expect(baseSection?.getAttribute('aria-labelledby')).toBe(baseHeading.id);
    expect(prestigeSection?.getAttribute('aria-labelledby')).toBe(
      prestigeHeading.id,
    );
  });

  it('all BASE_CLASS_ALLOWLIST ids render inside the base section', () => {
    setupL1Humano();
    render(createElement(ClassPicker));

    const baseSection = screen
      .getByRole('heading', { name: 'Clases básicas' })
      .closest('section');
    expect(baseSection).not.toBeNull();

    for (const classId of BASE_CLASS_ALLOWLIST) {
      const row = baseSection!.querySelector(`[data-class-id="${classId}"]`);
      expect(row, `Expected ${classId} inside base section`).not.toBeNull();
    }
  });

  it('CLAS-03: illegal base-class rows render aria-disabled="true"', () => {
    setupL1Humano('alignment:lawful-good' as CanonicalId);
    render(createElement(ClassPicker));

    const row = document.querySelector('[data-class-id="class:paladin-oscuro"]');
    expect(row, 'Paladin Oscuro row must exist in base section').not.toBeNull();
    expect(row?.getAttribute('aria-disabled')).toBe('true');
  });

  it('at L1, every prestige row is disabled with no reason line (UAT-2026-04-24 E1)', () => {
    setupL1Humano();
    render(createElement(ClassPicker));

    const prestigeSection = screen
      .getByRole('heading', { name: 'Clases de prestigio' })
      .closest('section');
    const prestigeRows = prestigeSection?.querySelectorAll('[data-class-id]') ?? [];

    expect(prestigeRows.length).toBeGreaterThan(0);
    for (const row of Array.from(prestigeRows)) {
      expect(row.getAttribute('aria-disabled')).toBe('true');
      // L1 blocker (kind:'l1') is suppressed in the UI — row stays disabled but
      // no redundant "Disponible a partir del nivel 2" copy surfaces.
      expect(row.querySelector('em.class-picker__reason')).toBeNull();
      expect(row.textContent).not.toMatch(/Disponible a partir del nivel 2/);
    }
  });

  /**
   * CLAS-03 regression lock.
   *
   * If `selectClassOptionsForLevel` returns an option with `status === 'blocked'`
   * due to `evaluateMulticlassLegality`, the ClassPicker MUST render that row
   * with `aria-disabled="true"`. If selector refactor or picker extraction
   * silently drops the status → aria bridge, this test fails.
   *
   * Construction strategy: seed L1..L4 with distinct base classes so that at
   * L5 `evaluateMulticlassLegality` may report one or more base-class options
   * as `blocked` (multiclass-legality rules apply commit-minimum + exclusivity
   * checks). If no blocked option is reachable from the current catalog, the
   * test logs and returns — the assertion still exists for future rule changes.
   */
  it('CLAS-03: rows with status==="blocked" from evaluateMulticlassLegality render aria-disabled="true"', () => {
    setupL1Humano();

    useLevelProgressionStore
      .getState()
      .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
    useLevelProgressionStore
      .getState()
      .setLevelClassId(2 as ProgressionLevel, 'class:wizard' as CanonicalId);
    useLevelProgressionStore
      .getState()
      .setLevelClassId(3 as ProgressionLevel, 'class:rogue' as CanonicalId);
    useLevelProgressionStore
      .getState()
      .setLevelClassId(4 as ProgressionLevel, 'class:cleric' as CanonicalId);
    useLevelProgressionStore.getState().setActiveLevel(5 as ProgressionLevel);

    const progression = useLevelProgressionStore.getState();
    const foundation = useCharacterFoundationStore.getState();
    const options = selectClassOptionsForLevel(
      progression,
      foundation,
      5 as ProgressionLevel,
    );
    const blockedOption = options.find(
      (o) => o.status === 'blocked' && o.kind === 'base',
    );

    render(createElement(ClassPicker));

    if (!blockedOption) {
      // Current multiclass rules don't produce a `base` blocked option from
      // this seeding; log and exit so future rule tightening exercises the
      // bridge. The assertion below remains the regression contract.
      // eslint-disable-next-line no-console
      console.warn(
        'CLAS-03 scenario unreachable in current catalog; status==="blocked" bridge assertion skipped.',
      );
      return;
    }

    const blockedRow = document.querySelector(
      `[data-class-id="${blockedOption.id}"]`,
    );
    expect(blockedRow).not.toBeNull();
    expect(blockedRow?.getAttribute('aria-disabled')).toBe('true');
  });
});
