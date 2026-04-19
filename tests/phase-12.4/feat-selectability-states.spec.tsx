// @vitest-environment jsdom

/**
 * Phase 12.4-07 — Dotes selectability states + slot counter + collapse-on-complete
 * (SPEC R5 / CONTEXT D-03 + D-04).
 *
 * Contract:
 *   1. Four row states resolved by the feat-board selector and driven into DOM:
 *        - selectable          (default, aria-disabled="false", full opacity)
 *        - blocked-prereq      (aria-disabled="true", opacity 0.55, italic reason,
 *                               pill "Bloqueada"; reason + pill remain opacity:1
 *                               per UI-SPEC.md contrast mitigation)
 *        - blocked-already-taken (pill "Tomada en N{level}")
 *        - blocked-budget       (pill "Sin slots")
 *   2. Visibility lock: blocked rows NEVER get display:none; `toBeVisible()` passes.
 *   3. Panel header counter: `Dotes del nivel {N}: {chosen}/{slots}` with tabular-nums.
 *   4. Collapse-on-complete: when chosen === slots, list body is replaced by
 *      <FeatSummaryCard> (chosen-feats list + `Modificar selección` button).
 *   5. Modificar selección re-expands the list, chosen rows carry `.feat-picker__row--chosen`.
 *
 * RED gate: none of the `.feat-picker__row`, `.feat-picker__row--blocked`,
 * `.feat-picker__row--chosen`, `.feat-picker__reason`, `.feat-picker__pill`,
 * `Dotes del nivel`, `Modificar selección` markers exist yet in feat-board /
 * feat-sheet output. All Suites below fail before Task 1's GREEN lands.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';

import { FeatBoard } from '@planner/features/feats/feat-board';
import { useFeatStore } from '@planner/features/feats/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useSkillStore } from '@planner/features/skills/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

// --------------------------------------------------------------------------
// Source-of-truth: app.css as text (theme-contract / 12.4-02 pattern).
// --------------------------------------------------------------------------

const appCssPath = resolve(
  process.cwd(),
  'apps/planner/src/styles/app.css',
);
const appCss = readFileSync(appCssPath, 'utf8');

function injectAppCss(): void {
  const style = document.createElement('style');
  style.setAttribute('data-test-id', 'phase-12.4-07-app-css');
  style.textContent = appCss;
  document.head.appendChild(style);
}

// --------------------------------------------------------------------------
// Fixtures
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

/** Non-Humano Guerrero L1 — store holds exactly 2 selectable slots (classBonus + general). */
function setupL1Guerrero(): void {
  useCharacterFoundationStore
    .getState()
    .setRace('race:elf' as CanonicalId); // Elf: no race bonus feat, so store's 2 slots match budget total.
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
// Suite
// --------------------------------------------------------------------------

describe('Phase 12.4-07 — Dotes selectability states (SPEC R5)', () => {
  beforeEach(() => {
    cleanup();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    useLevelProgressionStore.getState().resetProgression();
    useFeatStore.getState().resetFeatSelections();
    useCharacterFoundationStore.getState().resetFoundation();
    useSkillStore.getState().resetSkillAllocations();
  });

  afterEach(() => cleanup());

  // ------------------------------------------------------------------
  // Suite A — Slot counter in panel header
  // ------------------------------------------------------------------
  describe('Suite A — Slot counter', () => {
    it('A1: L1 Humano+Guerrero renders "Dotes del nivel 1: 0/3" counter', () => {
      setupL1HumanoGuerrero();
      render(createElement(FeatBoard));
      expect(screen.getByText(/Dotes del nivel 1:\s*0\/3/)).toBeInTheDocument();
    });

    it('A2: L1 Guerrero (non-Humano) renders "Dotes del nivel 1: 0/2" counter', () => {
      setupL1Guerrero();
      render(createElement(FeatBoard));
      expect(screen.getByText(/Dotes del nivel 1:\s*0\/2/)).toBeInTheDocument();
    });

    it('A3: after selecting 1 feat at L1 non-Humano Guerrero, counter shows 1/2', () => {
      setupL1Guerrero();
      useFeatStore
        .getState()
        .setClassFeat(1 as ProgressionLevel, 'feat:derribo' as CanonicalId);
      render(createElement(FeatBoard));
      expect(screen.getByText(/Dotes del nivel 1:\s*1\/2/)).toBeInTheDocument();
    });
  });

  // ------------------------------------------------------------------
  // Suite B — Four row states
  // ------------------------------------------------------------------
  describe('Suite B — Four row states', () => {
    it('B1: selectable row has aria-disabled="false" and no blocked class', () => {
      setupL1Guerrero();
      render(createElement(FeatBoard));
      // feat:carrera is in Guerrero's class-bonus pool (list=1, no prereqs).
      // At L1 Guerrero sequentialStep='class-bonus' so the class-bonus section
      // renders — feat:carrera must show up as selectable.
      const row = document.querySelector<HTMLElement>(
        '[data-feat-id="feat:carrera"]',
      );
      expect(row).not.toBeNull();
      expect(row!.getAttribute('aria-disabled')).toBe('false');
      expect(row!.classList.contains('feat-picker__row')).toBe(true);
      expect(row!.classList.contains('feat-picker__row--blocked')).toBe(false);
    });

    it('B2: blocked-prereq row has aria-disabled="true", blocked class, inline reason + "Bloqueada" pill', () => {
      setupL1Guerrero();
      render(createElement(FeatBoard));
      // feat:dodge (Esquiva) requires minDex 13 — with default base 8 it is blocked by prereq.
      const row = document.querySelector<HTMLElement>(
        '[data-feat-id="feat:dodge"]',
      );
      expect(row).not.toBeNull();
      expect(row!.getAttribute('aria-disabled')).toBe('true');
      expect(row!.classList.contains('feat-picker__row--blocked')).toBe(true);
      expect(row!).toBeVisible();
      // Reason text — UI-SPEC copy template "Requiere {ability} {N}" or similar.
      const reasonEl = row!.querySelector('.feat-picker__reason');
      expect(reasonEl).not.toBeNull();
      expect(reasonEl!.textContent).toMatch(/Requiere/i);
      // Pill badge with "Bloqueada".
      const pillEl = row!.querySelector('.feat-picker__pill');
      expect(pillEl).not.toBeNull();
      expect(pillEl!.textContent).toMatch(/Bloqueada/);
    });

    it('B3: blocked-prereq reason and pill render at opacity 1 (cascade defeat)', () => {
      injectAppCss();
      setupL1Guerrero();
      render(createElement(FeatBoard));
      const row = document.querySelector<HTMLElement>(
        '[data-feat-id="feat:dodge"]',
      );
      expect(row).not.toBeNull();
      // Row itself is 0.55 opacity.
      expect(window.getComputedStyle(row!).opacity).toBe('0.55');
      const reasonEl = row!.querySelector<HTMLElement>('.feat-picker__reason');
      expect(reasonEl).not.toBeNull();
      expect(window.getComputedStyle(reasonEl!).opacity).toBe('1');
      const pillEl = row!.querySelector<HTMLElement>('.feat-picker__pill');
      expect(pillEl).not.toBeNull();
      expect(window.getComputedStyle(pillEl!).opacity).toBe('1');
    });

    it('B4: blocked-already-taken pill reads "Tomada en N1" for feat chosen at L1 when editing L2', () => {
      setupL1Guerrero();
      // Take feat:carrera as the L1 class-bonus feat (list=1 for Guerrero).
      useFeatStore
        .getState()
        .setClassFeat(1 as ProgressionLevel, 'feat:carrera' as CanonicalId);
      useLevelProgressionStore
        .getState()
        .setLevelClassId(2 as ProgressionLevel, 'class:fighter' as CanonicalId);
      useLevelProgressionStore
        .getState()
        .setActiveLevel(2 as ProgressionLevel);
      useFeatStore.getState().setActiveLevel(2 as ProgressionLevel);
      render(createElement(FeatBoard));
      // At L2 Guerrero classBonus slot is available; feat:carrera appears in
      // the class-bonus section but MUST be `blocked-already-taken` because
      // it was chosen at L1.
      const row = document.querySelector<HTMLElement>(
        '[data-feat-id="feat:carrera"]',
      );
      expect(row).not.toBeNull();
      expect(row!.classList.contains('feat-picker__row--blocked')).toBe(true);
      const pillEl = row!.querySelector('.feat-picker__pill');
      expect(pillEl).not.toBeNull();
      expect(pillEl!.textContent).toMatch(/Tomada en N1/);
    });

    it('B5: visibility lock — any blocked row is visible (no display:none)', () => {
      injectAppCss();
      setupL1Guerrero();
      render(createElement(FeatBoard));
      const blockedRows = document.querySelectorAll<HTMLElement>(
        '.feat-picker__row--blocked',
      );
      expect(blockedRows.length).toBeGreaterThan(0);
      for (const row of Array.from(blockedRows)) {
        expect(row).toBeVisible();
        expect(window.getComputedStyle(row).display).not.toBe('none');
      }
    });
  });

  // ------------------------------------------------------------------
  // Suite C — Collapse-on-complete + Modificar selección
  // ------------------------------------------------------------------
  describe('Suite C — Collapse-on-complete + Modificar selección', () => {
    function fillBothL1GuerreroSlots(): void {
      // L1 non-Humano Guerrero has exactly 2 store slots: class-bonus + general.
      // `feat:carrera` = Guerrero class-bonus pool (list=1, no prereqs).
      // `feat:alertness` = general pool (allClassesCanUse=true, no prereqs).
      useFeatStore
        .getState()
        .setClassFeat(1 as ProgressionLevel, 'feat:carrera' as CanonicalId);
      useFeatStore
        .getState()
        .setGeneralFeat(1 as ProgressionLevel, 'feat:alertness' as CanonicalId);
    }

    it('C1: when chosen === slots, panel body shows FeatSummaryCard + "Modificar selección"', () => {
      setupL1Guerrero();
      fillBothL1GuerreroSlots();
      render(createElement(FeatBoard));
      expect(
        screen.getByText(/Dotes del nivel 1:\s*2\/2/),
      ).toBeInTheDocument();
      // Summary card present.
      const summaryCard = document.querySelector('.feat-summary-card');
      expect(summaryCard).not.toBeNull();
      // Modificar selección button.
      const modifyBtn = screen.getByRole('button', {
        name: /Modificar selección/,
      });
      expect(modifyBtn).toBeInTheDocument();
      // Summary card lists both chosen feat labels.
      const summaryText = summaryCard!.textContent ?? '';
      expect(summaryText).toMatch(/Carrera/);
      expect(summaryText).toMatch(/Alerta/);
    });

    it('C2: Modificar selección click restores full list with chosen rows highlighted via .feat-picker__row--chosen', () => {
      setupL1Guerrero();
      fillBothL1GuerreroSlots();
      render(createElement(FeatBoard));
      const modifyBtn = screen.getByRole('button', {
        name: /Modificar selección/,
      });
      fireEvent.click(modifyBtn);
      // After click the list re-renders — chosen rows carry `.feat-picker__row--chosen`.
      const chosenRow = document.querySelector('.feat-picker__row--chosen');
      expect(chosenRow).not.toBeNull();
    });

    it('C3: in the re-expanded list, chosen feat rows carry data-feat-id matching store state', () => {
      setupL1Guerrero();
      fillBothL1GuerreroSlots();
      render(createElement(FeatBoard));
      fireEvent.click(
        screen.getByRole('button', { name: /Modificar selección/ }),
      );
      // feat:carrera (class-bonus) + feat:alertness (general) — both chosen rows
      // must render in the re-expanded list.
      const chosenRows = document.querySelectorAll<HTMLElement>(
        '.feat-picker__row--chosen',
      );
      const ids = Array.from(chosenRows).map((r) =>
        r.getAttribute('data-feat-id'),
      );
      expect(ids).toEqual(
        expect.arrayContaining(['feat:carrera', 'feat:alertness']),
      );
    });
  });

  // ------------------------------------------------------------------
  // Suite D — CSS contract (theme-contract / 12.4-02 pattern)
  // ------------------------------------------------------------------
  describe('Suite D — CSS rule contract', () => {
    it('D1: app.css declares `.feat-picker__row--blocked` with `opacity: 0.55`', () => {
      expect(appCss).toMatch(
        /\.feat-picker__row--blocked\s*\{[^}]*opacity\s*:\s*0\.55/,
      );
    });

    it('D2: app.css declares cascade-defeat rule for blocked reason at opacity 1', () => {
      // Shape per PLAN.md Step 6: `.feat-picker__row--blocked .feat-picker__reason { opacity: 1 }`
      const cascadeRule =
        /\.feat-picker__row--blocked\s+\.feat-picker__(reason|pill)[^{]*\{[^}]*opacity\s*:\s*1/;
      expect(appCss).toMatch(cascadeRule);
    });

    it('D3: app.css declares `.feat-picker__row--chosen` with gold selection border', () => {
      expect(appCss).toMatch(
        /\.feat-picker__row--chosen\s*\{[^}]*var\(--color-selection-border\)/,
      );
    });

    it('D4: app.css declares tabular-nums scoped to the Dotes panel header', () => {
      // The header counter must render with tabular-nums (UI-SPEC typography block).
      // Scope the assertion to the `.feat-picker__header` block so pre-existing
      // tabular-nums rules elsewhere do not satisfy this contract vacuously.
      expect(appCss).toMatch(
        /\.feat-picker__header[^}]*\{[^}]*tabular-nums/,
      );
    });
  });
});
