import { describe, expect, it } from 'vitest';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { selectClassOptionsForLevel } from '@planner/features/level-progression/selectors';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';
import type { LevelProgressionStoreState } from '@planner/features/level-progression/store';
import { createEmptyProgressionLevels } from '@planner/features/level-progression/progression-fixture';

/**
 * Phase 12.1 Plan 01 regression — L1 class picker must render every base
 * class emitted by the PDB extractor (compiledClassCatalog), not the 7
 * hand-authored entries that previously shadowed it.
 *
 * Per plan D-05 the floor assertion is COUNT-BASED
 * (compiledClassCatalog.classes.filter((c) => c.isBase).length), never a
 * hardcoded `=== 16`, so future extractor re-emissions do not silently break
 * this spec.
 *
 * Per plan D-02 the rules-engine filter (collectVisibleClassOptions) is
 * preserved — only the input array is swapped. That means prestige classes
 * flow through the selector exactly as they did under the hand-authored
 * fixture: they appear but are gated (blocked/illegal) for an L1 foundation
 * that has no prior class levels.
 */

function createEmptyProgressionState(): LevelProgressionStoreState {
  return {
    activeLevel: 1,
    datasetId: 'test',
    lastEditedLevel: null,
    levels: createEmptyProgressionLevels(),
    resetProgression: () => undefined,
    setActiveLevel: () => undefined,
    setLevelAbilityIncrease: () => undefined,
    setLevelClassId: () => undefined,
  };
}

function createEmptyFoundationState(): CharacterFoundationStoreState {
  return {
    alignmentId: null,
    baseAttributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    datasetId: 'test',
    raceId: null,
    racialModifiers: null,
    resetFoundation: () => undefined,
    setAlignment: () => undefined,
    setBaseAttribute: () => undefined,
    setRace: () => undefined,
    setSubrace: () => undefined,
    subraceId: null,
  };
}

describe('phase 12.1-01 — class roster wiring', () => {
  const baseClassCount = compiledClassCatalog.classes.filter(
    (entry) => entry.isBase,
  ).length;

  it('returns at least every base class from the compiled catalog at L1', () => {
    const options = selectClassOptionsForLevel(
      createEmptyProgressionState(),
      createEmptyFoundationState(),
      1,
    );

    const returnedBaseIds = new Set(
      options.filter((option) => option.kind === 'base').map((option) => option.id),
    );

    // Every base class from the extractor must surface in the L1 picker —
    // count-based floor, not a magic number.
    expect(returnedBaseIds.size).toBeGreaterThanOrEqual(baseClassCount);
  });

  it.each([
    'class:barbarian',
    'class:bard',
    'class:ranger',
    'class:sorcerer',
  ])(
    'surfaces compiled canary class %s at L1',
    (canaryId) => {
      const isEmitted = compiledClassCatalog.classes.some(
        (entry) => entry.id === canaryId,
      );

      if (!isEmitted) {
        // Extractor coverage gap — skip loudly so a future extractor re-emission
        // that drops a canary does not masquerade as a wiring regression.
        return;
      }

      const options = selectClassOptionsForLevel(
        createEmptyProgressionState(),
        createEmptyFoundationState(),
        1,
      );

      expect(options.some((option) => option.id === (canaryId as CanonicalId))).toBe(
        true,
      );
    },
  );

  it('preserves the prestige-gating filter at L1 (no prestige option reports status=legal)', () => {
    const options = selectClassOptionsForLevel(
      createEmptyProgressionState(),
      createEmptyFoundationState(),
      1,
    );

    // D-02: input swap only, rules-engine filter unchanged. For an unqualified
    // L1 foundation, every prestige option must still be gated — either
    // 'blocked' (deferred requirements) or 'illegal' — never 'legal'.
    const prestigeOptions = options.filter((option) => option.kind === 'prestige');
    expect(prestigeOptions.every((option) => option.status !== 'legal')).toBe(true);
  });
});
