// @vitest-environment jsdom

/**
 * Phase 12.4-08 — Feat-family fold + inline <fieldset> expander (SPEC R7 / CONTEXT D-05).
 *
 * Contract:
 *   1. Extractor emits an OPTIONAL backward-compat `parameterizedFeatFamily`
 *      field on CompiledFeat. Zod schema accepts rows WITH and WITHOUT it
 *      (Open Question 4 resolution — no schema version bump per SPEC SHAR-05).
 *   2. Families fold in the main Dotes list: one row per family with an
 *      "{N} objetivos" pill instead of ~N rows (one per target variant).
 *   3. Clicking the family row opens an inline <fieldset class="feat-family-expander">
 *      with a <legend> "Elige {paramLabel}" and a radio list of targets.
 *   4. Already-taken targets show disabled radio + "Tomada en N{level}" pill.
 *   5. Selecting a radio persists a target-qualified feat id via the store
 *      (BuildDocument.featsByLevel schema unchanged).
 *   6. Esc collapses the expander (fieldset removed from DOM).
 *
 * RED gate: none of `.feat-family-expander`, `parameterizedFeatFamily`, or the
 * "{N} objetivos" pill exist before Task 1's GREEN lands.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';

import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { compiledFeatSchema } from '@data-extractor/contracts/feat-catalog';
import { FeatBoard } from '@planner/features/feats/feat-board';
import { useFeatStore } from '@planner/features/feats/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useSkillStore } from '@planner/features/skills/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------

/**
 * L1 Humano+Guerrero — most feats are selectable so the family row lands in
 * the general section. Guerrero is used so `sequentialStep` eventually flows
 * to 'general' (where Soltura con una habilidad lives via allClassesCanUse).
 */
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
// Suite
// --------------------------------------------------------------------------

describe('Phase 12.4-08 — feat-family fold + inline expander (SPEC R7)', () => {
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

  // -----------------------------------------------------------------
  // Suite A — Extractor catalog shape
  // -----------------------------------------------------------------
  describe('Suite A — Extractor catalog shape', () => {
    it('A1: skill-focus family emitted with groupKey + paramLabel on Soltura con una habilidad variants', () => {
      const skillFocusVariants = compiledFeatCatalog.feats.filter(
        (f) => f.parameterizedFeatFamily?.groupKey === 'feat:skill-focus',
      );
      expect(skillFocusVariants.length).toBeGreaterThan(10);
      expect(skillFocusVariants[0].parameterizedFeatFamily?.paramLabel).toBe(
        'habilidad',
      );
      // canonicalId matches groupKey (one family per row inside this family)
      expect(skillFocusVariants[0].parameterizedFeatFamily?.canonicalId).toBe(
        'feat:skill-focus',
      );
    });

    it('A2: spell-focus family emitted for the 8 schools of magic', () => {
      const spellFocusVariants = compiledFeatCatalog.feats.filter(
        (f) => f.parameterizedFeatFamily?.groupKey === 'feat:spell-focus',
      );
      expect(spellFocusVariants.length).toBeGreaterThanOrEqual(8);
      expect(spellFocusVariants[0].parameterizedFeatFamily?.paramLabel).toBe(
        'escuela de magia',
      );
    });

    it('A3: weapon-focus + weapon-specialization + greater-weapon-focus families emitted', () => {
      const weaponFocus = compiledFeatCatalog.feats.filter(
        (f) => f.parameterizedFeatFamily?.groupKey === 'feat:weapon-focus',
      );
      const weaponSpec = compiledFeatCatalog.feats.filter(
        (f) =>
          f.parameterizedFeatFamily?.groupKey === 'feat:weapon-specialization',
      );
      const greaterWeaponFocus = compiledFeatCatalog.feats.filter(
        (f) =>
          f.parameterizedFeatFamily?.groupKey === 'feat:greater-weapon-focus',
      );
      expect(weaponFocus.length).toBeGreaterThan(5);
      expect(weaponSpec.length).toBeGreaterThan(5);
      expect(greaterWeaponFocus.length).toBeGreaterThan(5);
      expect(weaponFocus[0].parameterizedFeatFamily?.paramLabel).toBe('arma');
    });

    it('A4: Zod schema accepts rows WITH the new optional field', () => {
      const sample = compiledFeatCatalog.feats.find(
        (f) => f.parameterizedFeatFamily != null,
      );
      expect(sample).toBeDefined();
      expect(() => compiledFeatSchema.parse(sample)).not.toThrow();
    });

    it('A5: Zod schema accepts rows WITHOUT the new field (backward compat)', () => {
      const nonFamilyFeat = compiledFeatCatalog.feats.find(
        (f) => !f.parameterizedFeatFamily,
      );
      expect(nonFamilyFeat).toBeDefined();
      expect(() => compiledFeatSchema.parse(nonFamilyFeat)).not.toThrow();
    });
  });

  // -----------------------------------------------------------------
  // Suite B — UI family row + expander
  // -----------------------------------------------------------------
  describe('Suite B — Main-list family row + inline expander', () => {
    it('B1: main list contains exactly ONE row for "Soltura con una habilidad" (family-folded)', () => {
      setupL1HumanoGuerrero();
      render(createElement(FeatBoard));
      // Find all buttons whose label column starts with "Soltura con una habilidad"
      // (no trailing "(X)" — the folded family row).
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>(
          'button[data-family-id="feat:skill-focus"]',
        ),
      );
      expect(candidates.length).toBe(1);
    });

    it('B2: family row carries an "{N} objetivos" pill (plural-aware)', () => {
      setupL1HumanoGuerrero();
      render(createElement(FeatBoard));
      const familyRow = document.querySelector<HTMLElement>(
        'button[data-family-id="feat:skill-focus"]',
      );
      expect(familyRow).not.toBeNull();
      // Pill text must match "{N} objetivos" (or "1 objetivo" when N===1).
      expect(familyRow!.textContent).toMatch(/\d+ objetivos?/);
    });

    it('B3: clicking the family row opens inline <fieldset class="feat-family-expander"> with legend "Elige habilidad"', () => {
      setupL1HumanoGuerrero();
      render(createElement(FeatBoard));
      const familyRow = document.querySelector<HTMLElement>(
        'button[data-family-id="feat:skill-focus"]',
      );
      expect(familyRow).not.toBeNull();
      fireEvent.click(familyRow!);

      const fieldset = document.querySelector<HTMLFieldSetElement>(
        'fieldset.feat-family-expander',
      );
      expect(fieldset).not.toBeNull();
      const legend = fieldset!.querySelector('legend');
      expect(legend).not.toBeNull();
      expect(legend!.textContent).toMatch(/Elige\s+habilidad/i);
    });

    it('B4: expander renders one radio input per valid target (> 10 for skill-focus)', () => {
      setupL1HumanoGuerrero();
      render(createElement(FeatBoard));
      fireEvent.click(
        document.querySelector<HTMLElement>(
          'button[data-family-id="feat:skill-focus"]',
        )!,
      );
      const radios = document.querySelectorAll<HTMLInputElement>(
        'fieldset.feat-family-expander input[type="radio"]',
      );
      expect(radios.length).toBeGreaterThan(10);
    });

    it('B5: selecting a radio persists a target-qualified feat id via the store', () => {
      setupL1HumanoGuerrero();
      render(createElement(FeatBoard));
      fireEvent.click(
        document.querySelector<HTMLElement>(
          'button[data-family-id="feat:skill-focus"]',
        )!,
      );
      const firstRadio = document.querySelector<HTMLInputElement>(
        'fieldset.feat-family-expander input[type="radio"]',
      );
      expect(firstRadio).not.toBeNull();
      fireEvent.click(firstRadio!);

      const featsAtL1 = useFeatStore
        .getState()
        .levels.find((r) => r.level === 1);
      expect(featsAtL1).toBeDefined();
      const chosenIds = [
        featsAtL1!.classFeatId,
        featsAtL1!.generalFeatId,
      ].filter(Boolean) as string[];
      const hasSkillFocusTarget = chosenIds.some((id) =>
        id.startsWith('feat:skillfocus'),
      );
      expect(hasSkillFocusTarget).toBe(true);
    });

    it('B6: pressing Esc inside the fieldset closes it (fieldset removed from DOM)', () => {
      setupL1HumanoGuerrero();
      render(createElement(FeatBoard));
      fireEvent.click(
        document.querySelector<HTMLElement>(
          'button[data-family-id="feat:skill-focus"]',
        )!,
      );
      const fieldsetOpen = document.querySelector('fieldset.feat-family-expander');
      expect(fieldsetOpen).not.toBeNull();

      fireEvent.keyDown(fieldsetOpen!, { key: 'Escape' });

      expect(
        document.querySelector('fieldset.feat-family-expander'),
      ).toBeNull();
    });
  });
});
