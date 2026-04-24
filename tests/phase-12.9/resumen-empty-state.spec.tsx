// @vitest-environment jsdom

/**
 * Phase 12.9 R4 — Empty-state surface pre-race/alignment.
 *
 * Uses createElement (not JSX) per phase-12.x convention — Vitest default
 * esbuild does not auto-inject the React runtime.
 */

import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ResumenBoard } from '@planner/features/summary/resumen-board';
import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

function resetStores(): void {
  useCharacterFoundationStore.getState().resetFoundation();
  useLevelProgressionStore.getState().resetProgression();
  useFeatStore.getState().resetFeatSelections();
  useSkillStore.getState().resetSkillAllocations();
}

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

describe('Phase 12.9 — Resumen empty-state (SPEC R4)', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    resetStores();
  });
  afterEach(() => cleanup());

  it('R4: pre-race renders 1 empty-state frame and 0 progression/skill tables', () => {
    const { container } = render(createElement(ResumenBoard));
    expect(
      container.querySelectorAll('.resumen-board__empty-state').length,
    ).toBe(1);
    expect(
      container.querySelectorAll('.resumen-table__progression').length,
    ).toBe(0);
    expect(container.querySelectorAll('.resumen-table__skills').length).toBe(0);
  });

  it('R4: post-race + alignment, empty-state disappears and ResumenTable mounts', () => {
    setupElfoNeutralGuerreroL1();
    const { container } = render(createElement(ResumenBoard));
    expect(
      container.querySelectorAll('.resumen-board__empty-state').length,
    ).toBe(0);
    expect(
      container.querySelectorAll('.resumen-table__progression').length,
    ).toBe(1);
  });

  it('R4: emptyState.heading + body keys resolve and are distinct from stepper voice (D-04)', () => {
    expect(shellCopyEs.resumen.emptyState.heading).toBeTruthy();
    expect(shellCopyEs.resumen.emptyState.body).toBeTruthy();
    expect(shellCopyEs.resumen.emptyState.heading).not.toBe(
      shellCopyEs.stepper.emptySheetHeading,
    );
    expect(shellCopyEs.resumen.emptyState.body).not.toBe(
      shellCopyEs.stepper.emptySheetBody,
    );
  });

  it('R4: Cargar + Importar buttons remain clickable in empty state (R5 carry-over)', () => {
    const { container } = render(createElement(ResumenBoard));
    // Cargar (onClick={() => setLoadOpen(true)}) and Importar (onClick={() =>
    // fileInputRef.current?.click()}) have no `disabled` attribute even when
    // !isProjectable — only Guardar / Exportar / Compartir gate.
    const enabled = container.querySelectorAll<HTMLButtonElement>(
      '.resumen-board__actions button:not([disabled])',
    );
    expect(enabled.length).toBeGreaterThanOrEqual(2);
    // Disabled triad (Guardar / Exportar / Compartir) still present with
    // incompleteBuild tooltip.
    const disabled = container.querySelectorAll<HTMLButtonElement>(
      '.resumen-board__actions button[disabled]',
    );
    expect(disabled.length).toBeGreaterThanOrEqual(3);
  });
});
