// @vitest-environment jsdom

/**
 * Phase 16-02 — race-bonus feat slot UI surface (FEAT-06, D-04 + D-06).
 *
 * Locks the new `data-slot-card="race-bonus-0"` slot card + `data-slot-kind="race-bonus"`
 * chip discriminator + Spanish "Dote racial: Humano" / "Dote racial: Mediano Fortecor"
 * section heading + onDeselect dispatch through `clearGeneralFeat(level, 1)`.
 *
 * Test 6 (W-01) — at Humano L1 Guerrero with all 3 feats picked + 8/8 skills,
 * <LevelEditorActionBar> resolves `legal` and surfaces "Continuar al nivel 2"
 * (ROADMAP success criterion #3 / FEAT-06 acceptance).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';

import { FeatBoard } from '@planner/features/feats/feat-board';
import { LevelEditorActionBar } from '@planner/features/level-progression/level-editor-action-bar';
import { useFeatStore } from '@planner/features/feats/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useSkillStore } from '@planner/features/skills/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

// --------------------------------------------------------------------------
// Fixtures
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
  useFeatStore.getState().setActiveLevel(1 as ProgressionLevel);
}

function setupL1MedianoFortecorGuerrero(): void {
  useCharacterFoundationStore
    .getState()
    .setRace('race:mediano-fortecor' as CanonicalId);
  useCharacterFoundationStore
    .getState()
    .setAlignment('alignment:lawful-good' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
  useFeatStore.getState().setActiveLevel(1 as ProgressionLevel);
}

function setupL1ElfoGuerrero(): void {
  useCharacterFoundationStore.getState().setRace('race:elf' as CanonicalId);
  useCharacterFoundationStore
    .getState()
    .setAlignment('alignment:true-neutral' as CanonicalId);
  useLevelProgressionStore
    .getState()
    .setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
  useFeatStore.getState().setActiveLevel(1 as ProgressionLevel);
}

/** Fill class-bonus + general primary + race-bonus (bonusGeneralFeatIds[0]) at L1. */
function fillL1HumanoGuerreroFeats(): void {
  useFeatStore
    .getState()
    .setClassFeat(1 as ProgressionLevel, 'feat:carrera' as CanonicalId);
  useFeatStore
    .getState()
    .setGeneralFeat(1 as ProgressionLevel, 'feat:alertness' as CanonicalId);
  useFeatStore
    .getState()
    .setGeneralFeat(
      1 as ProgressionLevel,
      'feat:ironwill' as CanonicalId,
      1,
    );
}

// --------------------------------------------------------------------------
// Suite
// --------------------------------------------------------------------------

describe('Phase 16-02 — Dote racial section (FEAT-06, D-04 + D-06)', () => {
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

  it('Humano L1 Guerrero renders three slot status cards: class-bonus, race-bonus, general', () => {
    setupL1HumanoGuerrero();
    render(createElement(FeatBoard));
    expect(
      document.querySelector('[data-slot-card="class-bonus-0"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-slot-card="race-bonus-0"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-slot-card="general-0"]'),
    ).not.toBeNull();
  });

  it('Humano L1 Guerrero with all three feats selected → counter 3/3, race-bonus chip in DOM', () => {
    setupL1HumanoGuerrero();
    fillL1HumanoGuerreroFeats();
    render(createElement(FeatBoard));
    expect(screen.getByText(/Dotes del nivel 1:\s*3\/3/)).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot-kind="race-bonus"]'),
    ).not.toBeNull();
  });

  it('Mediano Fortecor L1 Guerrero renders the section heading "Dote racial: Mediano Fortecor" (D-06)', () => {
    setupL1MedianoFortecorGuerrero();
    render(createElement(FeatBoard));
    // The race-bonus slot status card carries the per-race heading text.
    const card = document.querySelector('[data-slot-card="race-bonus-0"]');
    expect(card).not.toBeNull();
    expect(card!.textContent).toMatch(/Dote racial: Mediano Fortecor/);
  });

  it('Elfo L1 Guerrero renders only TWO slot status cards (no race-bonus card)', () => {
    setupL1ElfoGuerrero();
    render(createElement(FeatBoard));
    expect(
      document.querySelector('[data-slot-card="class-bonus-0"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-slot-card="general-0"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-slot-card="race-bonus-0"]'),
    ).toBeNull();
  });

  it('deselecting the race-bonus chip clears bonusGeneralFeatIds[0]', () => {
    setupL1HumanoGuerrero();
    fillL1HumanoGuerreroFeats();
    expect(
      useFeatStore.getState().levels[0]!.bonusGeneralFeatIds.length,
    ).toBe(1);

    // Imperative dispatch: feat-board.tsx routes `slotKind === 'race-bonus'`
    // to clearGeneralFeat(level, 1). Test the wiring contract directly.
    useFeatStore.getState().clearGeneralFeat(1 as ProgressionLevel, 1);
    expect(
      useFeatStore.getState().levels[0]!.bonusGeneralFeatIds.length,
    ).toBe(0);
  });

  it('W-01: Humano L1 Guerrero with 3/3 feats + 8/8 skills → LevelEditorActionBar legal', () => {
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
