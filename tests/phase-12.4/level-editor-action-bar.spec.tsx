// @vitest-environment jsdom

/**
 * Phase 12.4-09 — <LevelEditorActionBar> sticky footer (SPEC R2 / CONTEXT D-06).
 *
 * Contract locked by this spec (RED-first, per CONTEXT.md D-08):
 *   1. Fresh L1 Humano+Guerrero: label is `Faltan 3 dotes que asignar en este nivel`, disabled.
 *      (Budget total=3 via computePerLevelBudget — Humano L1 general + classBonus + raceBonus.)
 *   2. L1 non-Humano Guerrero with all 2 feat slots chosen but 0 skill points spent:
 *      label is `Faltan 8 puntos de habilidad por gastar`, disabled
 *      (Budget=8 for non-Humano Guerrero INT 10: (2+0)*4=8 at L1.)
 *   3. L1 non-Humano Guerrero with 2/2 feats + 8/8 skills: label is `Continuar al nivel 2`, enabled.
 *   4. Clicking enabled button dispatches atomically:
 *        useLevelProgressionStore.activeLevel → 2
 *        usePlannerShellStore.expandedLevel   → 2
 *        usePlannerShellStore.activeLevelSubStep → 'class'
 *   5. L16 terminal: component returns null (no footer, no button).
 *   6. Deficit priority: feat-deficit copy wins over skill-deficit when both exist.
 *   7. Plural edge — singular copy:
 *        `Falta 1 dote que asignar en este nivel`
 *        `Falta 1 punto de habilidad por gastar`
 *   8. Sticky-footer CSS: `.level-editor__action-bar` has `position: sticky` and non-zero
 *      `border-top-width` when app.css is injected into jsdom.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';

import { LevelEditorActionBar } from '@planner/features/level-progression/level-editor-action-bar';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';

// --------------------------------------------------------------------------
// Source-of-truth: app.css as text (mirrors 12.4-07 injectAppCss pattern)
// --------------------------------------------------------------------------

const appCssPath = resolve(process.cwd(), 'apps/planner/src/styles/app.css');
const appCss = readFileSync(appCssPath, 'utf8');

function injectAppCss(): void {
  const style = document.createElement('style');
  style.setAttribute('data-test-id', 'phase-12.4-09-app-css');
  style.textContent = appCss;
  document.head.appendChild(style);
}

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------

function resetAllStores(): void {
  useLevelProgressionStore.getState().resetProgression();
  useFeatStore.getState().resetFeatSelections();
  useSkillStore.getState().resetSkillAllocations();
  useCharacterFoundationStore.getState().resetFoundation();
  usePlannerShellStore.setState({
    activeOriginStep: null,
    activeLevelSubStep: null,
    activeView: 'creation',
    expandedLevel: 1 as ProgressionLevel,
    mobileNavOpen: false,
  });
}

/** L1 Humano+Guerrero — budget.featSlots.total = 3 (general + classBonus + humano raceBonus). */
function setupL1HumanoGuerrero(): void {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  useCharacterFoundationStore.getState().setAlignment('alignment:lawful-good' as CanonicalId);
  useLevelProgressionStore.getState().setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
}

/** L1 non-Humano Guerrero — budget.featSlots.total = 2 (general + classBonus, no raceBonus). */
function setupL1ElfoGuerrero(): void {
  useCharacterFoundationStore.getState().setRace('race:elf' as CanonicalId);
  useCharacterFoundationStore.getState().setAlignment('alignment:true-neutral' as CanonicalId);
  useLevelProgressionStore.getState().setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
}

/** Fill 2/2 feat slots with real feat IDs (Guerrero class-bonus pool + general pool). */
function fillL1ElfoGuerreroFeats(): void {
  useFeatStore.getState().setClassFeat(1 as ProgressionLevel, 'feat:carrera' as CanonicalId);
  useFeatStore.getState().setGeneralFeat(1 as ProgressionLevel, 'feat:alertness' as CanonicalId);
}

function fillL1HumanoGuerreroFeats(): void {
  useFeatStore.getState().setClassFeat(1 as ProgressionLevel, 'feat:carrera' as CanonicalId);
  useFeatStore.getState().setGeneralFeat(1 as ProgressionLevel, 'feat:alertness' as CanonicalId);
  useFeatStore.getState().setGeneralFeat(1 as ProgressionLevel, 'feat:ironwill' as CanonicalId, 1);
}

/**
 * Fill all 4 skill points at L1 Elfo+Guerrero (INT base=8 → mod=-1 → max(1, 2-1)=1 base;
 * L1 ×4 = 4 total). Default fixture baseScore=8 drives the floor-1 branch.
 */
function fillL1ElfoGuerreroSkills(): void {
  useSkillStore.getState().setSkillRank(1 as ProgressionLevel, 'skill:trepar' as CanonicalId, 4);
}

// --------------------------------------------------------------------------
// Suite
// --------------------------------------------------------------------------

describe('Phase 12.4-09 — LevelEditorActionBar (SPEC R2)', () => {
  beforeEach(() => {
    cleanup();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    resetAllStores();
  });

  afterEach(() => cleanup());

  // ------------------------------------------------------------------
  // Suite A — Three label states + deficit priority
  // ------------------------------------------------------------------

  describe('Suite A — Three label states', () => {
    it('A1: fresh L1 Humano+Guerrero — label `Faltan 3 dotes…`, disabled', () => {
      setupL1HumanoGuerrero();
      render(createElement(LevelEditorActionBar));
      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/Faltan 3 dotes que asignar en este nivel/);
      expect(button).toBeDisabled();
    });

    it('A2: L1 Elfo+Guerrero with all feats chosen, 0 skills — label `Faltan 4 puntos de habilidad por gastar`, disabled (deficit priority feat→skill)', () => {
      // Elfo INT base 8 (foundation-fixture baseScore=8) → mod=-1 → max(1, 2-1)=1
      // base; L1 ×4 = 4 skill points. Locks priority: feat deficit cleared first,
      // then skill deficit copy surfaces.
      setupL1ElfoGuerrero();
      fillL1ElfoGuerreroFeats();
      render(createElement(LevelEditorActionBar));
      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/Faltan 4 puntos de habilidad por gastar/);
      expect(button).toBeDisabled();
    });

    it('A3: L1 Elfo+Guerrero with 2/2 feats + 4/4 skills — label `Continuar al nivel 2`, enabled', () => {
      setupL1ElfoGuerrero();
      fillL1ElfoGuerreroFeats();
      fillL1ElfoGuerreroSkills();
      render(createElement(LevelEditorActionBar));
      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/Continuar al nivel 2/);
      expect(button).not.toBeDisabled();
    });

    it('A4: L1 Humano+Guerrero with 3/3 feats + 8/8 skills — label `Continuar al nivel 2`, enabled', () => {
      setupL1HumanoGuerrero();
      fillL1HumanoGuerreroFeats();
      useSkillStore
        .getState()
        .setSkillRank(1 as ProgressionLevel, 'skill:trepar' as CanonicalId, 8);
      render(createElement(LevelEditorActionBar));
      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/Continuar al nivel 2/);
      expect(button).not.toBeDisabled();
    });
  });

  // ------------------------------------------------------------------
  // Suite B — Atomic dispatch on click
  // ------------------------------------------------------------------

  describe('Suite B — Atomic dispatch on click', () => {
    it('B1: enabled click fires setActiveLevel(N+1) + setExpandedLevel(N+1) + setActiveLevelSubStep("class") atomically', () => {
      setupL1ElfoGuerrero();
      fillL1ElfoGuerreroFeats();
      fillL1ElfoGuerreroSkills();
      render(createElement(LevelEditorActionBar));
      fireEvent.click(screen.getByRole('button'));

      expect(useLevelProgressionStore.getState().activeLevel).toBe(2);
      expect(usePlannerShellStore.getState().expandedLevel).toBe(2);
      expect(usePlannerShellStore.getState().activeLevelSubStep).toBe('class');
    });

    it('B2: disabled click does NOT advance the level (short-circuit guard)', () => {
      setupL1HumanoGuerrero();
      render(createElement(LevelEditorActionBar));
      fireEvent.click(screen.getByRole('button'));
      expect(useLevelProgressionStore.getState().activeLevel).toBe(1);
    });
  });

  // ------------------------------------------------------------------
  // Suite C — L20 terminal render (UAT-2026-04-20 P6 — was L16 pre-extension)
  // ------------------------------------------------------------------

  describe('Suite C — L20 terminal', () => {
    it('C1: at L20 the component returns null — no footer, no button', () => {
      // Fill all 20 levels with a class so navigation is clean.
      setupL1HumanoGuerrero();
      for (let l = 1 as ProgressionLevel; l <= 20; l++) {
        useLevelProgressionStore
          .getState()
          .setLevelClassId(l as ProgressionLevel, 'class:fighter' as CanonicalId);
      }
      useLevelProgressionStore.getState().setActiveLevel(20 as ProgressionLevel);

      const { container } = render(createElement(LevelEditorActionBar));
      expect(container.querySelector('.level-editor__action-bar')).toBeNull();
      expect(container.querySelector('button')).toBeNull();
      expect(container.innerHTML).toBe('');
    });

    it('C2: at L19 the component still renders (boundary: only L20 is terminal)', () => {
      setupL1ElfoGuerrero();
      for (let l = 1 as ProgressionLevel; l <= 19; l++) {
        useLevelProgressionStore
          .getState()
          .setLevelClassId(l as ProgressionLevel, 'class:fighter' as CanonicalId);
      }
      useLevelProgressionStore.getState().setActiveLevel(19 as ProgressionLevel);

      render(createElement(LevelEditorActionBar));
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  // ------------------------------------------------------------------
  // Suite D — Plural / singular edge cases
  // ------------------------------------------------------------------

  describe('Suite D — Plural / singular edge cases', () => {
    it('D1: when feat deficit === 1 → singular label `Falta 1 dote que asignar en este nivel`', () => {
      // L1 Elfo+Guerrero has budget.featSlots.total=2. Pick one feat to leave deficit=1.
      setupL1ElfoGuerrero();
      useFeatStore.getState().setClassFeat(1 as ProgressionLevel, 'feat:carrera' as CanonicalId);
      render(createElement(LevelEditorActionBar));
      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/Falta 1 dote que asignar en este nivel/);
    });

    it('D2: when skill deficit === 1 → singular label `Falta 1 punto de habilidad por gastar`', () => {
      // L1 Elfo+Guerrero: 2/2 feats filled + 3/4 skill points spent → deficit=1.
      setupL1ElfoGuerrero();
      fillL1ElfoGuerreroFeats();
      useSkillStore
        .getState()
        .setSkillRank(1 as ProgressionLevel, 'skill:trepar' as CanonicalId, 3);
      render(createElement(LevelEditorActionBar));
      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/Falta 1 punto de habilidad por gastar/);
    });
  });

  // ------------------------------------------------------------------
  // Suite E — Sticky footer CSS contract
  // ------------------------------------------------------------------

  describe('Suite E — Sticky footer CSS', () => {
    it('E1: container has class `.level-editor__action-bar` and emits `data-testid="level-editor-action-bar"`', () => {
      setupL1HumanoGuerrero();
      const { container } = render(createElement(LevelEditorActionBar));
      const footer = container.querySelector('.level-editor__action-bar');
      expect(footer).not.toBeNull();
      expect(footer!.getAttribute('data-testid')).toBe('level-editor-action-bar');
    });

    it('E2: app.css declares `.level-editor__action-bar` with `position: sticky` + `border-top` using `--color-panel-edge`', () => {
      // jsdom's getComputedStyle does not cascade `position: sticky` or
      // border-top from a sibling <style> tag for class selectors reliably —
      // 12.4-07 parses app.css as text (source-of-truth pattern). We mirror
      // that contract here so the CSS rule regression is caught at the
      // text-source level without depending on jsdom cascade fidelity.
      expect(appCss).toMatch(
        /\.level-editor__action-bar\s*\{[^}]*position:\s*sticky/,
      );
      expect(appCss).toMatch(
        /\.level-editor__action-bar\s*\{[^}]*border-top:\s*1px\s+solid\s+var\(--color-panel-edge\)/,
      );
    });

    it('E3: advance button carries `data-testid="advance-to-level-{N+1}"` for deterministic E2E selection', () => {
      setupL1HumanoGuerrero();
      render(createElement(LevelEditorActionBar));
      const button = document.querySelector('[data-testid="advance-to-level-2"]');
      expect(button).not.toBeNull();
      expect(button!.tagName).toBe('BUTTON');
    });
  });
});
