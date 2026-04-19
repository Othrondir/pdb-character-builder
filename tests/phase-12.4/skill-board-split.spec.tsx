// @vitest-environment jsdom

/**
 * Phase 12.4-05 — R4 Habilidades class/transclase split + cost hint (SPEC R4).
 *
 * Root cause per SPEC.md §Requirements #4 + CONTEXT.md D-09 + UI-SPEC.md §"R4 —
 * Skill board split": the skill board currently renders a flat list grouped by
 * CATEGORY (athletic, discipline, lore...) with muted inline `Clase` /
 * `Transclase` tags per row — F4 UAT flagged these as "almost invisible".
 *
 * Target contract (verbatim from UI-SPEC.md L161-175):
 *   - Two `<section>` blocks rendered within the skill board.
 *   - First section: heading `Habilidades de clase` + cost hint span
 *     `· coste 1 pt/rango` at font-size ≥ 12px.
 *   - Second section: heading `Habilidades transclase` + cost hint span
 *     `· coste 2 pts/rango` at font-size ≥ 12px.
 *   - Rows bucket by `costType` (reuse existing field on `SkillSheetRowView`).
 *   - `Solo entrenada` badges remain per-row, orthogonal to section grouping.
 *
 * Suites:
 *   A — section headings + cost hint text present.
 *   B — cost hint font-size gate (≥ 12px — R4 acceptance criterion).
 *   C — row bucketing by costType for Humano + Guerrero L1 build.
 *   D — trained-only badge orthogonality.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SkillBoard } from '@planner/features/skills/skill-board';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function setupL1HumanoGuerrero(): void {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  useCharacterFoundationStore
    .getState()
    .setAlignment('alignment:lawful-good' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
  useSkillStore.getState().setActiveLevel(1 as ProgressionLevel);
}

// --------------------------------------------------------------------------
// Suite setup
// --------------------------------------------------------------------------

describe('Phase 12.4-05 — Habilidades class/transclase split (SPEC R4)', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    useLevelProgressionStore.getState().resetProgression();
    useFeatStore.getState().resetFeatSelections();
    useCharacterFoundationStore.getState().resetFoundation();
    useSkillStore.getState().resetSkillAllocations();
  });

  afterEach(() => cleanup());

  // ------------------------------------------------------------------
  // Suite A — section headings + cost hint text
  // ------------------------------------------------------------------
  describe('Suite A — two <section> headings with cost-hint text', () => {
    it('A1: renders heading `Habilidades de clase`', () => {
      setupL1HumanoGuerrero();
      render(createElement(SkillBoard));

      expect(
        screen.getByRole('heading', { name: /Habilidades de clase/ }),
      ).toBeTruthy();
    });

    it('A2: renders heading `Habilidades transclase`', () => {
      setupL1HumanoGuerrero();
      render(createElement(SkillBoard));

      expect(
        screen.getByRole('heading', { name: /Habilidades transclase/ }),
      ).toBeTruthy();
    });

    it('A3: class section includes cost hint `· coste 1 pt/rango`', () => {
      setupL1HumanoGuerrero();
      render(createElement(SkillBoard));

      const costHint = screen.getByText(/coste 1 pt\/rango/);
      expect(costHint).toBeTruthy();
    });

    it('A4: cross-class section includes cost hint `· coste 2 pts/rango`', () => {
      setupL1HumanoGuerrero();
      render(createElement(SkillBoard));

      const costHint = screen.getByText(/coste 2 pts\/rango/);
      expect(costHint).toBeTruthy();
    });
  });

  // ------------------------------------------------------------------
  // Suite B — cost hint font-size ≥ 12px (R4 acceptance)
  // ------------------------------------------------------------------
  describe('Suite B — cost hint font-size gate (≥ 12px)', () => {
    it('B1: class cost hint font-size resolves to ≥ 12px', () => {
      setupL1HumanoGuerrero();
      render(createElement(SkillBoard));

      const costHint = screen.getByText(/coste 1 pt\/rango/);
      const fontSize = parseFloat(
        window.getComputedStyle(costHint as Element).fontSize,
      );
      expect(fontSize).toBeGreaterThanOrEqual(12);
    });

    it('B2: cross-class cost hint font-size resolves to ≥ 12px', () => {
      setupL1HumanoGuerrero();
      render(createElement(SkillBoard));

      const costHint = screen.getByText(/coste 2 pts\/rango/);
      const fontSize = parseFloat(
        window.getComputedStyle(costHint as Element).fontSize,
      );
      expect(fontSize).toBeGreaterThanOrEqual(12);
    });
  });

  // ------------------------------------------------------------------
  // Suite C — row bucketing by costType for Guerrero L1
  // ------------------------------------------------------------------
  describe('Suite C — row bucketing by costType (Guerrero L1)', () => {
    it('C1: Intimidar lives in the class section (Guerrero class skill)', () => {
      setupL1HumanoGuerrero();
      render(createElement(SkillBoard));

      const classHeading = screen.getByRole('heading', {
        name: /Habilidades de clase/,
      });
      const classSection = classHeading.closest('section');
      expect(classSection).not.toBeNull();
      expect(classSection?.textContent ?? '').toMatch(/Intimidar/);
    });

    it('C2: Diplomacia lives in the cross-class section (non-Guerrero skill)', () => {
      setupL1HumanoGuerrero();
      render(createElement(SkillBoard));

      const crossClassHeading = screen.getByRole('heading', {
        name: /Habilidades transclase/,
      });
      const crossClassSection = crossClassHeading.closest('section');
      expect(crossClassSection).not.toBeNull();
      expect(crossClassSection?.textContent ?? '').toMatch(/Diplomacia/);
    });

    it('C3: Intimidar is NOT duplicated in the cross-class section', () => {
      setupL1HumanoGuerrero();
      render(createElement(SkillBoard));

      const crossClassSection = screen
        .getByRole('heading', { name: /Habilidades transclase/ })
        .closest('section');
      expect(crossClassSection?.textContent ?? '').not.toMatch(/Intimidar/);
    });
  });

  // ------------------------------------------------------------------
  // Suite D — Solo entrenada badge orthogonality
  // ------------------------------------------------------------------
  describe('Suite D — Solo entrenada badges are orthogonal to section grouping', () => {
    it('D1: at least one `data-trained-only="true"` badge renders somewhere', () => {
      setupL1HumanoGuerrero();
      render(createElement(SkillBoard));

      const badges = document.querySelectorAll('[data-trained-only="true"]');
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});
