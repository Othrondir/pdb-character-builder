// @vitest-environment jsdom

/**
 * Phase 12.9 R2 — Identidad dedup + single compact header line.
 *
 * Uses createElement (not JSX) per phase-12.x convention — Vitest default
 * esbuild does not auto-inject the React runtime.
 */

import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ResumenBoard } from '@planner/features/summary/resumen-board';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

function setupElfoNeutralGuerreroL1(): void {
  useCharacterFoundationStore.getState().setRace('race:elf' as CanonicalId);
  useCharacterFoundationStore
    .getState()
    .setAlignment('alignment:true-neutral' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
}

describe('Phase 12.9 — Identidad dedup (SPEC R2)', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    useLevelProgressionStore.getState().resetProgression();
    useFeatStore.getState().resetFeatSelections();
    useCharacterFoundationStore.getState().resetFoundation();
    useSkillStore.getState().resetSkillAllocations();
  });
  afterEach(() => cleanup());

  it('R2: rendered DOM contains 0 .resumen-table__attrs nodes', () => {
    setupElfoNeutralGuerreroL1();
    const { container } = render(createElement(ResumenBoard));
    expect(container.querySelectorAll('.resumen-table__attrs').length).toBe(0);
  });

  it('R2: rendered DOM contains exactly 1 .resumen-table__identity-header element', () => {
    setupElfoNeutralGuerreroL1();
    const { container } = render(createElement(ResumenBoard));
    expect(
      container.querySelectorAll('.resumen-table__identity-header').length,
    ).toBe(1);
  });

  it('R2: identity-header textContent has at least 3 U+00B7 middot separators', () => {
    setupElfoNeutralGuerreroL1();
    const { container } = render(createElement(ResumenBoard));
    const header = container.querySelector('.resumen-table__identity-header');
    expect(header).not.toBeNull();
    const middotCount = (header!.textContent!.match(/·/g) ?? []).length;
    // 4 pieces (name · race · alignment · dataset) ⇒ 3 middots when subrace is null.
    // Elfo parent fixture has no subrace wired; assertion is >= 3.
    expect(middotCount).toBeGreaterThanOrEqual(3);
  });
});
