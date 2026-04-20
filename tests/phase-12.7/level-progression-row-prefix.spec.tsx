// @vitest-environment jsdom

/**
 * Phase 12.7-03 (F1 R5) — "Nivel N" row-pill prefix RED spec.
 *
 * UAT-2026-04-20 post-12.6 finding: row pill on the 20-row scan surface
 * renders `1Clérigo0/1 dotes5/4 pts⚠` — pills jam without visual separators
 * and the bare level digit confuses scanning.
 *
 * R5 prefixes the level number with "Nivel" via a new copy template
 * `shellCopyEs.progression.rowLevelPrefix(level)` that returns
 * `Nivel ${level}`. The `.level-progression-row__header` grid
 * (app.css:2183-2197) already has `gap: var(--space-sm)` which renders as
 * whitespace inside the button's `textContent` — the regex
 * `/Nivel N.+\w+.+\d+\/\d+ dotes.+\d+\/\d+ pts.+[⚠✓✗🔒]/` allows that
 * whitespace as the `.+` match, so R5 is a text-prefix-only change with
 * zero new CSS (D-13 invariant).
 *
 * This spec locks four invariants:
 *
 * - E1: L1 Humano + Clérigo row header textContent matches the prefix regex.
 * - E2: L8 (locked — L7 has no class) header textContent matches with
 *        "Nivel 8" prefix.
 * - E3: L16 (Humano + Clérigo L1..L16 all filled) header matches with
 *        "Nivel 16" prefix.
 * - E4: pure unit — `shellCopyEs.progression.rowLevelPrefix(5) === 'Nivel 5'`.
 *
 * Under RED baseline:
 * - E1/E2/E3 fail because the header renders bare `{level}` → textContent
 *   starts with a digit, not "Nivel".
 * - E4 fails because `rowLevelPrefix` is not yet defined (TS + runtime).
 *
 * Test isolation: mirrors tests/phase-12.6/level-progression-scan.spec.tsx
 * (store reset + LevelProgressionRow render inside a <ul> wrapper).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';

import { LevelProgressionRow } from '@planner/features/level-progression/level-progression-row';
import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';

// --------------------------------------------------------------------------
// Fixture helpers — mirror tests/phase-12.6/level-progression-scan helpers.
// LevelProgressionRow expects a <li> wrapper; we render into a throw-away
// <ul> to satisfy the HTML semantic tree (silences jsdom warnings without
// altering textContent assertions).
// --------------------------------------------------------------------------

function setupL1HumanoClerigo() {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:cleric' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
  usePlannerShellStore.setState((prev) => ({
    ...prev,
    activeOriginStep: null,
    activeLevelSubStep: 'class',
    activeView: 'creation',
    expandedLevel: 1 as ProgressionLevel,
    mobileNavOpen: false,
  }));
}

// L8 locked: L7 has no class → G1 sequential gate locks L8.
function setupL8Locked() {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  // Fill L1..L6 but skip L7 so L8 sees prev-with-no-class → locked.
  for (let lvl = 1; lvl <= 6; lvl++) {
    useLevelProgressionStore
      .getState()
      .setLevelClassId(lvl as ProgressionLevel, 'class:cleric' as CanonicalId);
  }
  useLevelProgressionStore.getState().setActiveLevel(6 as ProgressionLevel);
  usePlannerShellStore.setState((prev) => ({
    ...prev,
    activeOriginStep: null,
    activeLevelSubStep: 'class',
    activeView: 'creation',
    expandedLevel: 6 as ProgressionLevel,
    mobileNavOpen: false,
  }));
}

// L16 terminal: all L1..L16 have a class so L16's row renders legally.
function setupL16Legal() {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  for (let lvl = 1; lvl <= 16; lvl++) {
    useLevelProgressionStore
      .getState()
      .setLevelClassId(lvl as ProgressionLevel, 'class:cleric' as CanonicalId);
  }
  useLevelProgressionStore.getState().setActiveLevel(16 as ProgressionLevel);
  usePlannerShellStore.setState((prev) => ({
    ...prev,
    activeOriginStep: null,
    activeLevelSubStep: 'class',
    activeView: 'creation',
    expandedLevel: 16 as ProgressionLevel,
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

// Wrap <LevelProgressionRow level={N} /> in a <ul> so the <li> has a valid
// parent. Returns the row's header button for textContent assertions.
function renderRowHeader(level: ProgressionLevel): HTMLButtonElement {
  const { container } = render(
    createElement(
      'ul',
      null,
      createElement(LevelProgressionRow, { level }),
    ),
  );
  const header = container.querySelector<HTMLButtonElement>(
    `[data-level-row][data-level="${level}"] button.level-progression-row__header`,
  );
  if (header === null) {
    throw new Error(
      `Row header not found for level ${level} — check fixture + selector`,
    );
  }
  return header;
}

// --------------------------------------------------------------------------
// Suite
// --------------------------------------------------------------------------

describe('Phase 12.7-03 — LevelProgressionRow "Nivel N" prefix (F1 R5)', () => {
  beforeEach(resetStores);
  afterEach(cleanup);

  // Regex from SPEC Acceptance: `/Nivel N.+\w+.+\d+\/\d+ dotes.+\d+\/\d+ pts.+[⚠✓✗🔒]/`
  // Notes:
  //  - \w+ matches the class label token (Clérigo → 'Cl' + rest via unicode).
  //    Under jsdom, textContent returns unicode chars literally. \w in JS
  //    regex does NOT match non-ASCII letters; we use `.+` throughout to stay
  //    robust to accented labels.
  //  - `.+` greedy match covers both the CSS `gap` whitespace and any
  //    intermediate pill text.
  const PREFIX_REGEX = (level: number) =>
    new RegExp(
      `Nivel ${level}.+\\S+.+\\d+\\/\\d+ dotes.+\\d+\\/\\d+ pts.+[⚠✓✗🔒]`,
      'u',
    );

  // E1 — L1 Humano + Clérigo. Expected textContent (post-GREEN) includes
  // "Nivel 1", class label "Clérigo", feats "0/1 dotes", skills "N/M pts",
  // legality glyph "⚠" (incomplete — no feats/skills filled).
  it('Suite E1: L1 header textContent matches /Nivel 1.+/ regex', () => {
    setupL1HumanoClerigo();

    const header = renderRowHeader(1 as ProgressionLevel);
    const textContent = header.textContent ?? '';
    expect(textContent).toMatch(PREFIX_REGEX(1));
  });

  // E2 — L8 locked (no class at L7). Header still renders; textContent
  // begins with the level prefix even when the row is disabled.
  it('Suite E2: L8 (locked) header textContent matches /Nivel 8.+/ regex', () => {
    setupL8Locked();

    const header = renderRowHeader(8 as ProgressionLevel);
    const textContent = header.textContent ?? '';
    expect(textContent).toMatch(PREFIX_REGEX(8));
  });

  // E3 — L16 terminal legality with all levels classed. Row renders as
  // active/legal and header textContent carries the "Nivel 16" prefix.
  it('Suite E3: L16 (terminal) header textContent matches /Nivel 16.+/ regex', () => {
    setupL16Legal();

    const header = renderRowHeader(16 as ProgressionLevel);
    const textContent = header.textContent ?? '';
    expect(textContent).toMatch(PREFIX_REGEX(16));
  });

  // E4 — pure unit. rowLevelPrefix(level) must return `Nivel ${level}`.
  // RED: rowLevelPrefix is not defined on shellCopyEs.progression yet.
  // GREEN: after Task 2 adds the template fn, this passes.
  it('Suite E4: shellCopyEs.progression.rowLevelPrefix(5) === "Nivel 5"', () => {
    // Access via dynamic property lookup so TS does not fail the import
    // at RED baseline (the property does not yet exist on the type).
    // Once GREEN lands and the property is typed, remove the cast.
    const progression = shellCopyEs.progression as unknown as Record<
      string,
      (level: number) => string
    >;
    expect(typeof progression.rowLevelPrefix).toBe('function');
    expect(progression.rowLevelPrefix(5)).toBe('Nivel 5');
  });
});
