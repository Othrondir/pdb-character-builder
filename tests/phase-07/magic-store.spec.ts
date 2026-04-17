import { beforeEach, describe, expect, it } from 'vitest';

import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { compiledSpellCatalog } from '@planner/data/compiled-spells';
import {
  createEmptyMagicLevels,
  createInitialMagicState,
  useMagicStore,
} from '@planner/features/magic/store';

describe('phase 07 magic store', () => {
  beforeEach(() => {
    useMagicStore.setState(createInitialMagicState());
  });

  it('createEmptyMagicLevels returns 16 records', () => {
    const levels = createEmptyMagicLevels();

    expect(levels).toHaveLength(16);
    expect(levels[0]).toMatchObject({
      domains: [],
      knownSpells: {},
      level: 1,
      spellbookAdditions: {},
      swapsApplied: [],
    });
  });

  it('createInitialMagicState wires datasetId from compiled catalog', () => {
    const initial = createInitialMagicState();

    expect(initial.datasetId).toBe(compiledSpellCatalog.datasetId);
    expect(initial.activeLevel).toBe(1);
    expect(initial.lastEditedLevel).toBeNull();
  });

  it('setDomains updates only the target level', () => {
    useMagicStore
      .getState()
      .setDomains(1, ['domain:air' as CanonicalId, 'domain:fire' as CanonicalId]);

    const state = useMagicStore.getState();
    expect(state.levels[0].domains).toEqual(['domain:air', 'domain:fire']);
    expect(state.levels[1].domains).toEqual([]);
    expect(state.lastEditedLevel).toBe(1);
  });

  it('addSpellbookEntry dedupes by spellId per spellLevel', () => {
    useMagicStore
      .getState()
      .addSpellbookEntry(1, 1, 'spell:misil-magico' as CanonicalId);
    useMagicStore
      .getState()
      .addSpellbookEntry(1, 1, 'spell:misil-magico' as CanonicalId);

    expect(useMagicStore.getState().levels[0].spellbookAdditions[1]).toEqual([
      'spell:misil-magico',
    ]);
  });

  it('removeSpellbookEntry removes the target spell', () => {
    useMagicStore.getState().addSpellbookEntry(1, 1, 'spell:a' as CanonicalId);
    useMagicStore.getState().addSpellbookEntry(1, 1, 'spell:b' as CanonicalId);
    useMagicStore
      .getState()
      .removeSpellbookEntry(1, 1, 'spell:a' as CanonicalId);

    expect(useMagicStore.getState().levels[0].spellbookAdditions[1]).toEqual([
      'spell:b',
    ]);
  });

  it('addKnownSpell and removeKnownSpell round-trip', () => {
    useMagicStore.getState().addKnownSpell(1, 0, 'spell:luz' as CanonicalId);
    expect(useMagicStore.getState().levels[0].knownSpells[0]).toEqual([
      'spell:luz',
    ]);

    useMagicStore.getState().removeKnownSpell(1, 0, 'spell:luz' as CanonicalId);
    expect(useMagicStore.getState().levels[0].knownSpells[0]).toEqual([]);
  });

  it('applySwap appends a SwapRecord at the target level', () => {
    useMagicStore
      .getState()
      .applySwap(4, 'spell:a' as CanonicalId, 'spell:b' as CanonicalId);

    const rec = useMagicStore.getState().levels[3].swapsApplied;
    expect(rec).toHaveLength(1);
    expect(rec[0]).toMatchObject({
      appliedAtLevel: 4,
      forgotten: 'spell:a',
      learned: 'spell:b',
    });
    expect(useMagicStore.getState().lastEditedLevel).toBe(4);
  });

  it('resetLevel clears all state for the target level', () => {
    useMagicStore.getState().setDomains(1, ['domain:air' as CanonicalId]);
    useMagicStore.getState().addSpellbookEntry(1, 1, 'spell:x' as CanonicalId);
    useMagicStore.getState().resetLevel(1);

    expect(useMagicStore.getState().levels[0]).toMatchObject({
      domains: [],
      knownSpells: {},
      level: 1,
      spellbookAdditions: {},
      swapsApplied: [],
    });
  });

  it('resetMagicSelections restores initial state', () => {
    useMagicStore.getState().setDomains(1, ['domain:air' as CanonicalId]);
    useMagicStore.getState().resetMagicSelections();

    const state = useMagicStore.getState();
    expect(state.levels[0].domains).toEqual([]);
    expect(state.lastEditedLevel).toBeNull();
    expect(state.activeLevel).toBe(1);
  });

  it('setActiveLevel updates activeLevel without mutating levels', () => {
    const before = useMagicStore.getState().levels;
    useMagicStore.getState().setActiveLevel(7);

    const state = useMagicStore.getState();
    expect(state.activeLevel).toBe(7);
    // levels reference is preserved (no mutation on activeLevel change)
    expect(state.levels).toBe(before);
  });
});
