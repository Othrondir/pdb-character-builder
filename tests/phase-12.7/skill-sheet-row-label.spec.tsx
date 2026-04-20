// @vitest-environment jsdom

/**
 * Phase 12.7-03 (F3 R4) — drop per-row Clase/Transclase label RED spec.
 *
 * UAT-2026-04-20 post-12.6 finding: each skill row prints a redundant
 * "Clase" or "Transclase" text node between the skill name and the
 * +/- steppers, duplicating the section headers
 * ("HABILIDADES DE CLASE" / "HABILIDADES TRANSCLASE") that already
 * segment the list by category.
 *
 * R4 deletes the per-row span. This spec locks three invariants:
 *
 * - D1: no standalone "Clase" or "Transclase" text node appears inside
 *       any `.skill-sheet__row-label` span. The category source of truth
 *       after R4 is the section heading only.
 * - D2: section headings ("Habilidades de clase" and "Habilidades
 *       transclase") remain in the DOM. Threat T-12.7-03-01 mitigation:
 *       a future refactor that deletes the section heading AFTER R4
 *       would remove all category info from the UI; this suite blocks it.
 * - D3: "Solo entrenada" badge count is preserved. Phase 12.4-05 locked
 *       the badge as per-row metadata orthogonal to category; R4 must not
 *       regress it.
 *
 * Test isolation: mirrors tests/phase-12.7/skill-sheet-disabled-gate.spec.tsx.
 * Baseline (pre-GREEN): D1 fails because skill-sheet.tsx still renders
 * `<span>{row.costTypeLabel}</span>`; D2 + D3 pass today and must stay passing.
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
// Fixture
// --------------------------------------------------------------------------

// Clérigo L1 with Humano race. Cleric class skills + non-class skills
// both render so the test covers the "Clase" + "Transclase" buckets
// simultaneously. compiled-skills.ts has >=1 trainedOnly=true skill in
// the catalog (verified by grep: 12 skills with trainedOnly: true).
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

describe('Phase 12.7-03 — drop per-row Clase/Transclase labels (F3 R4)', () => {
  beforeEach(resetStores);
  afterEach(cleanup);

  // D1 — per-row label deletion. RED baseline: row-label spans include
  // `<span>{row.costTypeLabel}</span>` → textContent === 'Clase' or
  // 'Transclase' → filter returns > 0. GREEN: span deleted → filter = 0.
  it('Suite D1: zero standalone "Clase" / "Transclase" spans inside .skill-sheet__row-label', () => {
    setupHumanoClerigoL1();
    const { container } = render(createElement(SkillSheet));

    const rowLabelSpans = Array.from(
      container.querySelectorAll<HTMLSpanElement>(
        '.skill-sheet__row-label .skill-sheet__meta-inline > span',
      ),
    );
    // Some rows have zero meta-inline children (non-trainedOnly class skills
    // after R4), others have one (trainedOnly badge). Neither should ever be
    // the bare "Clase" or "Transclase" text.
    const clase = rowLabelSpans.filter(
      (el) => el.textContent?.trim() === 'Clase',
    );
    const transclase = rowLabelSpans.filter(
      (el) => el.textContent?.trim() === 'Transclase',
    );
    expect(clase.length).toBe(0);
    expect(transclase.length).toBe(0);
  });

  // D2 — section heading preservation. Threat T-12.7-03-01 mitigation.
  it('Suite D2: section headings "Habilidades de clase" and "Habilidades transclase" present', () => {
    setupHumanoClerigoL1();
    const { container } = render(createElement(SkillSheet));

    // Section headings live under .skill-board__section-heading; their
    // text contains the shellCopyEs.skills.sectionClassHeading etc.
    const headings = Array.from(
      container.querySelectorAll<HTMLElement>('.skill-board__section-heading'),
    );
    const texts = headings.map((h) => h.textContent ?? '');
    expect(texts.some((t) => t.includes('Habilidades de clase'))).toBe(true);
    expect(texts.some((t) => t.includes('Habilidades transclase'))).toBe(true);
  });

  // D3 — trainedOnly badge preservation. Phase 12.4-05 R4 invariant.
  // compiled-skills catalog includes >=1 trainedOnly skill; at minimum
  // one row in either the class or transclase section renders the badge.
  it('Suite D3: "Solo entrenada" badge count ≥ 1 (Phase 12.4-05 preserved)', () => {
    setupHumanoClerigoL1();
    const { container } = render(createElement(SkillSheet));

    const trainedOnlyBadges = container.querySelectorAll(
      '[data-trained-only="true"]',
    );
    expect(trainedOnlyBadges.length).toBeGreaterThanOrEqual(1);
  });
});
