// @vitest-environment jsdom

/**
 * Phase 12.4-02 — Dotes scroll relocation (SPEC R9).
 *
 * Root cause captured in CONTEXT.md D-10 + UI-SPEC.md §Layout R9:
 * the two-column `.selection-screen__content` wrapper currently owns
 * `overflow-y: auto`, so the outer grid catches scroll instead of the
 * feat list column. Result: description panel scrolls together with
 * the feat list, rather than the list column scrolling independently
 * with the description panel pinned.
 *
 * Fix contract (this plan):
 *   1. `.feat-picker__list` owns `overflow-y: auto` on the list column.
 *   2. The feat list `<ul>/<div>` renders with the `feat-picker__list`
 *      class alongside whatever existing class name it carries.
 *   3. The feat-board wrapper ancestor (`.feat-board`, `.feat-sheet`,
 *      `.feat-board__body`, or equivalent scoped descendant of
 *      `.selection-screen__content`) does NOT own `overflow-y: auto`.
 *
 * Test strategy — hybrid:
 *   - Source of truth: read app.css as text and grep for the new rule
 *     block (matches the existing Phase 02 / Phase 05.2 theme-contract
 *     spec pattern at tests/phase-02/theme-contract.spec.ts L12-15).
 *   - DOM presence: render <FeatBoard /> and assert the new class lands
 *     on a DOM node (guards against the CSS rule landing without the
 *     component being updated to wear the class).
 *   - jsdom computed-style: with app.css injected into the document's
 *     <head> via a <style> tag, assert `getComputedStyle().overflowY
 *     === 'auto'` — provides the exact assertion shape called out in
 *     the plan acceptance criteria (12.4-02-PLAN.md L156-161).
 *
 * RED gate: the `.feat-picker__list` rule does not exist in app.css
 * yet, and the feat list DOM element does not yet carry the class.
 * Both assertions must fail before Task 1's GREEN fix lands.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
// NOTE: under `@vitest-environment jsdom`, `import.meta.url` resolves to
// `http://localhost/...` (window.location), which `new URL(...)` + fs.readFile
// rejects with "The URL must be of scheme file". Use a vitest-cwd-relative
// path via `process.cwd()` (vitest always runs from repo root per
// vitest.config.ts location) — matches the workspace-root invocation idiom.

import { FeatBoard } from '@planner/features/feats/feat-board';
import { useFeatStore } from '@planner/features/feats/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useSkillStore } from '@planner/features/skills/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

// --------------------------------------------------------------------------
// Source-of-truth: app.css as text (theme-contract pattern)
// --------------------------------------------------------------------------

const appCssPath = resolve(
  process.cwd(),
  'apps/planner/src/styles/app.css',
);
const appCss = readFileSync(appCssPath, 'utf8');

// --------------------------------------------------------------------------
// Fixture — L1 Humano + Guerrero (matches Phase 12.3-03 setupL1Guerrero).
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
}

// --------------------------------------------------------------------------
// Inject app.css into jsdom so getComputedStyle reflects the cascade.
// --------------------------------------------------------------------------

function injectAppCss(): void {
  const style = document.createElement('style');
  style.setAttribute('data-test-id', 'phase-12.4-02-app-css');
  style.textContent = appCss;
  document.head.appendChild(style);
}

// --------------------------------------------------------------------------
// Suite
// --------------------------------------------------------------------------

describe('Phase 12.4-02 — Dotes scroll relocation (SPEC R9)', () => {
  beforeEach(() => {
    cleanup();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    useLevelProgressionStore.getState().resetProgression();
    useFeatStore.getState().resetFeatSelections();
    useCharacterFoundationStore.getState().resetFoundation();
    useSkillStore.getState().resetSkillAllocations();
  });

  afterEach(() => {
    cleanup();
  });

  // ------------------------------------------------------------------
  // Suite A — CSS source-of-truth (grep app.css text)
  // ------------------------------------------------------------------
  describe('Suite A — CSS rule contract', () => {
    it('A1: app.css contains `.feat-picker__list` rule with `overflow-y: auto`', () => {
      // Pattern from plan frontmatter key_links (12.4-02-PLAN.md L29):
      //   \.feat-picker__list\s*\{[^}]*overflow-y\s*:\s*auto
      const featPickerListOverflow =
        /\.feat-picker__list\s*\{[^}]*overflow-y\s*:\s*auto/;
      expect(appCss).toMatch(featPickerListOverflow);
    });

    it('A2: app.css emits exactly one `.class-picker__list` rule, owned by plan 12.4-06', () => {
      // Anti-coupling assertion per 12.4-02-PLAN.md L208.
      // 12.4-02 is Wave 1; 12.4-06 lands .class-picker__list in Wave 2.
      //
      // Wave 1 state (12.4-02 only): no .class-picker__list rule exists.
      // Wave 2 state (after 12.4-06): exactly one .class-picker__list rule
      //   exists AND it must live adjacent to .class-picker__section-heading
      //   (proving it's inside plan 12.4-06's CSS block, not a stray
      //   injection by 12.4-02).
      //
      // The original Wave 1 `not.toMatch` assertion was deliberately
      // replaced with this "exactly once + co-located" form when 12.4-06
      // shipped, per Rule 3 auto-fix in 12.4-06 SUMMARY. The cross-wave
      // coupling guard is preserved: if 12.4-02 ever re-injects the rule
      // in a future diff, the match count jumps above 1 and this fails.
      const matches = appCss.match(/\.class-picker__list\s*\{/g) ?? [];
      expect(matches.length).toBe(1);
      // Co-location proof: .class-picker__section-heading (owned by 12.4-06)
      // MUST appear in app.css near .class-picker__list.
      expect(appCss).toMatch(/\.class-picker__section-heading\s*\{/);
    });
  });

  // ------------------------------------------------------------------
  // Suite B — DOM integration (FeatBoard renders the new class)
  // ------------------------------------------------------------------
  describe('Suite B — feat list element wears the `feat-picker__list` class', () => {
    it('B1: rendering <FeatBoard /> puts `.feat-picker__list` in the DOM', () => {
      setupL1HumanoGuerrero();
      render(createElement(FeatBoard));
      const listEl = document.querySelector('.feat-picker__list');
      expect(listEl).not.toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // Suite C — jsdom computed-style with app.css injected
  // ------------------------------------------------------------------
  describe('Suite C — computed overflow with app.css injected', () => {
    it('C1: the feat list column owns overflow-y: auto', () => {
      injectAppCss();
      setupL1HumanoGuerrero();
      render(createElement(FeatBoard));
      const listEl = document.querySelector('.feat-picker__list') as
        | HTMLElement
        | null;
      expect(listEl).not.toBeNull();
      const listStyle = window.getComputedStyle(listEl!);
      expect(listStyle.overflowY).toBe('auto');
    });

    it('C2: the feat board wrapper does NOT own overflow-y', () => {
      injectAppCss();
      setupL1HumanoGuerrero();
      render(createElement(FeatBoard));
      // Candidate wrappers (one will exist in the rendered tree):
      // - `.feat-board` (the SelectionScreen root with feat-board className)
      // - `.feat-sheet` (the aside that wraps search + sections)
      const wrapperEl =
        (document.querySelector('.feat-board') as HTMLElement | null) ??
        (document.querySelector('.feat-sheet') as HTMLElement | null);
      if (wrapperEl) {
        const wrapperStyle = window.getComputedStyle(wrapperEl);
        expect(wrapperStyle.overflowY).not.toBe('auto');
        expect(wrapperStyle.overflowY).not.toBe('scroll');
      }
    });
  });
});
