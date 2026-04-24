// @vitest-environment jsdom

/**
 * Phase 12.9 R1 — Progresion full-width breakout (structural invariants).
 *
 * Uses createElement (not JSX) per phase-12.x convention — Vitest default
 * esbuild does not auto-inject the React runtime.
 *
 * R1 scroll-free rendering verified manually via live MCP Chrome UAT per D-10;
 * jsdom cannot measure layout. The assertions below lock the structural
 * invariants that make the scroll-free claim achievable at the browser layer:
 * the BEM modifier that triggers `grid-column: 1 / -1`, the 8-column thead
 * contract that governs the measured width, and the 20-row tbody contract
 * that governs the measured height.
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

describe('Phase 12.9 — Progresion full-width breakout (SPEC R1, structural)', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    useLevelProgressionStore.getState().resetProgression();
    useFeatStore.getState().resetFeatSelections();
    useCharacterFoundationStore.getState().resetFoundation();
    useSkillStore.getState().resetSkillAllocations();
  });
  afterEach(() => cleanup());

  it('R1: .resumen-table__block--progresion modifier is present in DOM', () => {
    setupElfoNeutralGuerreroL1();
    const { container } = render(createElement(ResumenBoard));
    expect(
      container.querySelector('.resumen-table__block--progresion'),
    ).not.toBeNull();
  });

  it('R1: Progresion <th> count === 8 (thead column contract)', () => {
    setupElfoNeutralGuerreroL1();
    const { container } = render(createElement(ResumenBoard));
    const ths = container.querySelectorAll(
      '.resumen-table__progression thead th',
    );
    expect(ths.length).toBe(8);
  });

  it('R1 structural: Progresion block carries .resumen-table__block--progresion modifier and renders 8 <th> columns at 20 <tr> rows', () => {
    // R1 scroll-free rendering verified manually via live MCP Chrome UAT per D-10;
    // jsdom cannot measure layout. This block locks the three structural
    // invariants the scroll-free claim depends on (and which jsdom CAN measure):
    //   1. BEM modifier presence (triggers `grid-column: 1 / -1` at the CSS layer).
    //   2. 8 <th scope=col> in thead (column count that drives measured width).
    //   3. 20 <tr> in tbody (row count for full 1..20 progression — locked fixture).
    setupElfoNeutralGuerreroL1();
    const { container } = render(createElement(ResumenBoard));

    const progression = container.querySelector<HTMLTableElement>(
      '.resumen-table__block--progresion .resumen-table__progression',
    );
    expect(progression).not.toBeNull();

    const headerThs = progression!.querySelectorAll('thead th');
    expect(headerThs.length).toBe(8);

    const bodyTrs = progression!.querySelectorAll('tbody tr');
    expect(bodyTrs.length).toBe(20);
  });
});
