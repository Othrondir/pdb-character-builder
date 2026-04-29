import { beforeEach, describe, it, expect } from 'vitest';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useFeatStore } from '@planner/features/feats/store';
import {
  projectBuildDocument,
  IncompleteBuildError,
  isBuildProjectable,
} from '@planner/features/persistence/project-build-document';

/**
 * Phase 08 Task 4 UAT regression: Guardar slot dialog surfaced a raw ZodError
 * ("build.raceId expected string, received null") because the foundation store
 * defaults raceId/alignmentId to null while buildDocumentSchema requires them
 * as non-nullable canonicalId strings.
 *
 * Contract locked by this spec (see .planning/debug/resolved/guardar-slot-zoderror.md):
 *   - When the build is not projectable (raceId or alignmentId is null), the projection
 *     MUST throw a typed IncompleteBuildError listing the missing fields, NOT a Zod error.
 *   - isBuildProjectable() is the pure predicate used by the UI to gate the
 *     Exportar / Compartir buttons.
 *
 * Preserves D-07 / SHAR-05: schema stays strict; the projection boundary never emits
 * or accepts a partial BuildDocument.
 */
describe('projectBuildDocument — incomplete-build guard (regression)', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    useSkillStore.getState().resetSkillAllocations();
    useFeatStore.getState().resetFeatSelections();
  });

  it('throws IncompleteBuildError when store is at default state (both race and alignment null)', () => {
    // Default state — no race, no alignment. This IS the UAT repro: save dialog
    // clicked while the foundation store still holds nulls.
    expect(() => projectBuildDocument('mi-guerrero')).toThrowError(IncompleteBuildError);
    try {
      projectBuildDocument('mi-guerrero');
      throw new Error('expected projectBuildDocument to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(IncompleteBuildError);
      const e = err as IncompleteBuildError;
      expect(e.missingFields).toEqual(
        expect.arrayContaining(['raceId', 'alignmentId']),
      );
      // Must be a plain actionable message, not a ZodError dump.
      expect(e.message).not.toMatch(/zod/i);
    }
  });

  it('throws IncompleteBuildError when only raceId is null', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setAlignment('alignment:lawful-good');
    // raceId still null.
    expect(() => projectBuildDocument()).toThrowError(IncompleteBuildError);
    try {
      projectBuildDocument();
    } catch (err) {
      expect(err).toBeInstanceOf(IncompleteBuildError);
      expect((err as IncompleteBuildError).missingFields).toEqual(['raceId']);
    }
  });

  it('throws IncompleteBuildError when only alignmentId is null', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human');
    // alignmentId still null.
    expect(() => projectBuildDocument()).toThrowError(IncompleteBuildError);
    try {
      projectBuildDocument();
    } catch (err) {
      expect(err).toBeInstanceOf(IncompleteBuildError);
      expect((err as IncompleteBuildError).missingFields).toEqual(['alignmentId']);
    }
  });

  it('succeeds normally once both race and alignment are set', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human');
    foundation.setAlignment('alignment:lawful-neutral');

    const doc = projectBuildDocument('mi-guerrero');
    expect(doc.build.raceId).toBe('race:human');
    expect(doc.build.alignmentId).toBe('alignment:lawful-neutral');
    expect(doc.build.name).toBe('mi-guerrero');
  });

  describe('isBuildProjectable()', () => {
    it('returns false at default state', () => {
      expect(isBuildProjectable()).toBe(false);
    });

    it('returns false with only race set', () => {
      useCharacterFoundationStore.getState().setRace('race:human');
      expect(isBuildProjectable()).toBe(false);
    });

    it('returns false with only alignment set', () => {
      useCharacterFoundationStore.getState().setAlignment('alignment:lawful-good');
      expect(isBuildProjectable()).toBe(false);
    });

    it('returns true with both race and alignment set', () => {
      const foundation = useCharacterFoundationStore.getState();
      foundation.setRace('race:human');
      foundation.setAlignment('alignment:lawful-good');
      expect(isBuildProjectable()).toBe(true);
    });
  });
});
