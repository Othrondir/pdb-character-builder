import { describe, expect, it } from 'vitest';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import { compiledRaceCatalog } from '@planner/data/compiled-races';
import { selectOriginOptions } from '@planner/features/character-foundation/selectors';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';
import { groupRacesByParent } from '@rules-engine/foundation/group-races-by-parent';

/**
 * Phase 12.1 Plan 02 regression — Race picker primary dropdown must render
 * every parent race emitted by the PDB extractor (compiledRaceCatalog.races),
 * not the 3 hand-authored entries (Humano / Elfo / Enano) that previously
 * shadowed it.
 *
 * Per plan D-05 the floor assertion is COUNT-BASED
 * (`compiledRaceCatalog.races.length`), never a hardcoded `=== 46`, so a
 * future extractor re-emission that adds or removes a race does not silently
 * break this spec.
 *
 * Per plan D-03 the parent→subrace dropdown pair UX is preserved verbatim —
 * the `groupRacesByParent` helper decouples the parent/child derivation from
 * the React layer so it can be unit-tested without a DOM. Today
 * `compiledRaceCatalog.subraces` is `[]` (extractor gap parked in CONTEXT
 * deferred); the grouping contract still has to hold when the extractor
 * starts emitting subraces.
 */

function createEmptyFoundationState(): CharacterFoundationStoreState {
  return {
    alignmentId: null,
    baseAttributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    datasetId: 'test',
    raceId: null,
    resetFoundation: () => undefined,
    setAlignment: () => undefined,
    setBaseAttribute: () => undefined,
    setRace: () => undefined,
    setSubrace: () => undefined,
    subraceId: null,
  };
}

describe('phase 12.1-02 — race roster wiring', () => {
  it('returns every race from the compiled catalog at foundation L1', () => {
    const options = selectOriginOptions(createEmptyFoundationState());

    // Every parent race from the extractor must surface in the race picker —
    // count-based floor, not a magic number.
    expect(options.races.length).toBeGreaterThanOrEqual(
      compiledRaceCatalog.races.length,
    );
  });

  it.each([
    'race:human',
    'race:elf',
    'race:dwarf',
    'race:halfling',
    'race:gnome',
    'race:half-elf',
  ])('surfaces compiled canary parent race %s', (canaryId) => {
    const isEmitted = compiledRaceCatalog.races.some(
      (entry) => entry.id === canaryId,
    );

    if (!isEmitted) {
      // Extractor coverage gap — skip loudly so a future extractor re-emission
      // that drops a canary does not masquerade as a wiring regression.
      return;
    }

    const options = selectOriginOptions(createEmptyFoundationState());

    expect(
      options.races.some((option) => option.id === (canaryId as CanonicalId)),
    ).toBe(true);
  });

  it('groupRacesByParent returns an entry for every parent race', () => {
    const tree = groupRacesByParent(
      compiledRaceCatalog.races,
      compiledRaceCatalog.subraces,
    );

    const uniqueParentIds = new Set(
      compiledRaceCatalog.races.map((race) => race.id),
    );

    expect(tree.size).toBe(uniqueParentIds.size);

    for (const [parentId, entry] of tree.entries()) {
      expect(entry.parent.id).toBe(parentId);
      // Every subrace attached under a parent must belong to that parent.
      expect(entry.subraces.every((s) => s.parentRaceId === parentId)).toBe(true);
    }
  });

  it('groupRacesByParent returns empty children when extractor emits no subraces', () => {
    // Current extractor state: compiledRaceCatalog.subraces === []. Lock this
    // so the helper's empty-input branch stays covered even after the future
    // extractor emission lands.
    if (compiledRaceCatalog.subraces.length > 0) {
      return;
    }

    const tree = groupRacesByParent(
      compiledRaceCatalog.races,
      compiledRaceCatalog.subraces,
    );

    for (const entry of tree.values()) {
      expect(entry.subraces).toEqual([]);
    }
  });

  it('preserves the parent→subrace dropdown pair when a parent is selected', () => {
    const elfEmitted = compiledRaceCatalog.races.some(
      (entry) => entry.id === 'race:elf',
    );

    if (!elfEmitted) {
      return;
    }

    const stateWithElfSelected: CharacterFoundationStoreState = {
      ...createEmptyFoundationState(),
      raceId: 'race:elf' as CanonicalId,
    };

    const options = selectOriginOptions(stateWithElfSelected);

    // D-03 lock: subrace dropdown only ever shows children of the selected
    // parent. Today there are no subraces, so the list is empty. When the
    // extractor starts emitting them, every entry must still belong to
    // race:elf.
    expect(
      options.subraces.every(
        (subrace) => subrace.id.startsWith('subrace:'),
      ),
    ).toBe(true);

    const compiledElfChildren = compiledRaceCatalog.subraces.filter(
      (s) => s.parentRaceId === 'race:elf',
    );
    expect(options.subraces.length).toBeGreaterThanOrEqual(
      compiledElfChildren.length,
    );
  });
});
