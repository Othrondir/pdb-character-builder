// @vitest-environment jsdom

/**
 * Phase 12.6 (PROG-04 R5+R6) — 20-row level progression scan surface.
 *
 * Plan 03 Suites A + B — CSS contract + DOM structure.
 * Plan 04 Suite C — expansion mechanics + legality transitions (it.todo).
 * Plan 05 Suite D — level-rail deletion invariant (it.todo).
 *
 * Hybrid jsdom pattern (Pitfall 3 — NEVER assert
 * `container.scrollHeight === container.clientHeight` under jsdom because
 * jsdom does not lay out and both return 0). Source of truth is the CSS
 * TEXT read from app.css on disk, plus DOM structural assertions that do
 * not depend on layout. When we need a computed-style probe we inject the
 * CSS via a <style> tag first — precedent
 * tests/phase-12.4/feat-picker-scroll.spec.tsx L24-35.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';

import { BuildProgressionBoard } from '@planner/features/level-progression/build-progression-board';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';

// --------------------------------------------------------------------------
// Source-of-truth: app.css as text (theme-contract pattern). Under
// `@vitest-environment jsdom`, `import.meta.url` resolves to `http://localhost`
// which `new URL + fs.readFile` rejects. Vitest runs from repo root, so use
// `process.cwd()` (same idiom as feat-picker-scroll.spec.tsx L39-47).
// --------------------------------------------------------------------------
const appCssPath = resolve(process.cwd(), 'apps/planner/src/styles/app.css');
const appCss = readFileSync(appCssPath, 'utf8');

function injectAppCss() {
  const style = document.createElement('style');
  style.setAttribute('data-test-id', 'phase-12.6-app-css');
  style.textContent = appCss;
  document.head.appendChild(style);
}

function setupElfoL1() {
  // Minimum state to give BuildProgressionBoard something to render. The
  // race alone is enough: selectLevelLegality reads foundation + progression
  // stores; stable empty progression renders "locked" on L2..L20 with L1 as
  // "incomplete" (no class picked).
  useCharacterFoundationStore.getState().setRace('race:elf' as CanonicalId);
  usePlannerShellStore.setState((prev) => ({
    ...prev,
    activeLevelSubStep: 'class',
    expandedLevel: 1 as ProgressionLevel,
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
}

describe('Phase 12.6 P5 — 20-row scan surface (Plan 03 Suites A+B)', () => {
  beforeEach(resetStores);
  afterEach(cleanup);

  // ----------------------------------------------------------------
  // Suite A — CSS-text contract (Pitfall 3: we read the .css file on
  // disk instead of trusting jsdom layout).
  // ----------------------------------------------------------------

  it('A1: app.css declares .level-progression__list with grid-template-rows: repeat(20, auto)', () => {
    expect(appCss).toMatch(
      /\.level-progression__list\s*\{[^}]*grid-template-rows\s*:\s*repeat\(\s*20\s*,\s*auto/,
    );
  });

  it('A2: app.css declares overscroll-behavior: contain on .level-progression__list (Pitfall 8)', () => {
    expect(appCss).toMatch(
      /\.level-progression__list\s*\{[^}]*overscroll-behavior\s*:\s*contain/,
    );
  });

  // ----------------------------------------------------------------
  // Suite B — DOM structure (20 rows + 4 pills each).
  // ----------------------------------------------------------------

  it('B1: renders 20 [data-level-row] elements with data-level 1..20', () => {
    setupElfoL1();
    render(createElement(BuildProgressionBoard));
    const rows = document.querySelectorAll('[data-level-row]');
    expect(rows.length).toBe(20);
    rows.forEach((row, i) => {
      expect(row.getAttribute('data-level')).toBe(String(i + 1));
    });
  });

  it('B2: every row has 4 pills — class, feats, skills, legality', () => {
    setupElfoL1();
    render(createElement(BuildProgressionBoard));
    const rows = document.querySelectorAll('[data-level-row]');
    expect(rows.length).toBe(20);
    rows.forEach((row) => {
      expect(row.querySelector('[data-pill="class"]')).not.toBeNull();
      expect(row.querySelector('[data-pill="feats"]')).not.toBeNull();
      expect(row.querySelector('[data-pill="skills"]')).not.toBeNull();
      expect(row.querySelector('[data-pill="legality"]')).not.toBeNull();
    });
  });

  it('B3: every row carries data-legality attribute with one of legal|incomplete|invalid|locked', () => {
    setupElfoL1();
    render(createElement(BuildProgressionBoard));
    const validValues = new Set(['legal', 'incomplete', 'invalid', 'locked']);
    const rows = document.querySelectorAll('[data-level-row]');
    expect(rows.length).toBe(20);
    rows.forEach((row) => {
      const legality = row.getAttribute('data-legality');
      expect(validValues.has(legality ?? '')).toBe(true);
    });
  });

  it('B4: computed gridTemplateRows covers 20 rows after injecting app.css', () => {
    setupElfoL1();
    render(createElement(BuildProgressionBoard));
    injectAppCss();
    const list = document.querySelector('.level-progression__list') as HTMLElement | null;
    expect(list).not.toBeNull();
    // jsdom returns the unresolved grid-template-rows value. Either the
    // raw `repeat(20, ...)` token survives, OR the implementation has
    // resolved it into 20 explicit track tokens. Both are acceptable
    // because the CSS-text assertion A1 already locks the source form.
    const cs = getComputedStyle(list as HTMLElement).gridTemplateRows;
    const tokens = cs.trim().split(/\s+/).filter(Boolean).length;
    expect(cs.includes('repeat(20') || tokens === 20).toBe(true);
  });

  // ----------------------------------------------------------------
  // Suite C — expansion mechanics (Plan 04 owns — it.todo placeholders).
  // ----------------------------------------------------------------

  it.todo(
    'C1: clicking [data-level-row][data-level="5"] mounts ClassPicker + LevelEditorActionBar inside [data-testid="level-row-5-expanded"] (Plan 04)',
  );
  it.todo(
    'C2: non-active rows contain no .class-picker__list DOM (perf contract T-12.6-03-03) (Plan 04)',
  );
  it.todo(
    'C3: L5 legality flips incomplete → legal in same render cycle when class is picked (Plan 04)',
  );
  it.todo(
    'C4: L8 while L7 empty → data-legality="locked" + aria-disabled="true" on header button (Plan 04)',
  );

  // ----------------------------------------------------------------
  // Suite D — level-rail deletion invariant (Plan 05 owns — it.todo).
  // ----------------------------------------------------------------

  it.todo(
    'D1: [data-testid="advance-to-level-{N+1}"] selector preserved on expanded-row advance button (12.4-09 invariant, Plan 05)',
  );
});
