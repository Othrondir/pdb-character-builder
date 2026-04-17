import { create } from 'zustand';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import {
  PROGRESSION_LEVELS,
  type ProgressionLevel,
} from '../level-progression/progression-fixture';

import { compiledSpellCatalog } from './compiled-magic-catalog';

/**
 * A single sorcerer/bard spell swap record (D-15). Stored on the level the swap
 * was applied at so cascade revalidation can verify the swap only fired on a
 * legal swap cadence level.
 */
export interface SwapRecord {
  appliedAtLevel: ProgressionLevel;
  forgotten: CanonicalId;
  learned: CanonicalId;
}

/**
 * Per-level magic slice. Every store level carries all four selection kinds;
 * paradigm dispatch in the selector decides which buckets are relevant for the
 * active level (domains for cleric-L1, spellbookAdditions for wizard, ...).
 */
export interface MagicLevelRecord {
  domains: CanonicalId[];
  knownSpells: Record<number, CanonicalId[]>;
  level: ProgressionLevel;
  spellbookAdditions: Record<number, CanonicalId[]>;
  swapsApplied: SwapRecord[];
}

export interface MagicStoreState {
  activeLevel: ProgressionLevel;
  datasetId: string;
  lastEditedLevel: ProgressionLevel | null;
  levels: MagicLevelRecord[];

  addKnownSpell: (
    level: ProgressionLevel,
    spellLevel: number,
    spellId: CanonicalId,
  ) => void;
  addSpellbookEntry: (
    level: ProgressionLevel,
    spellLevel: number,
    spellId: CanonicalId,
  ) => void;
  applySwap: (
    level: ProgressionLevel,
    forgotten: CanonicalId,
    learned: CanonicalId,
  ) => void;
  removeKnownSpell: (
    level: ProgressionLevel,
    spellLevel: number,
    spellId: CanonicalId,
  ) => void;
  removeSpellbookEntry: (
    level: ProgressionLevel,
    spellLevel: number,
    spellId: CanonicalId,
  ) => void;
  resetLevel: (level: ProgressionLevel) => void;
  resetMagicSelections: () => void;
  setActiveLevel: (level: ProgressionLevel) => void;
  setDomains: (level: ProgressionLevel, domains: CanonicalId[]) => void;
}

export function createEmptyMagicLevels(): MagicLevelRecord[] {
  return PROGRESSION_LEVELS.map((level) => ({
    domains: [],
    knownSpells: {},
    level,
    spellbookAdditions: {},
    swapsApplied: [],
  }));
}

export function createInitialMagicState() {
  return {
    activeLevel: 1 as ProgressionLevel,
    datasetId: compiledSpellCatalog.datasetId,
    lastEditedLevel: null as ProgressionLevel | null,
    levels: createEmptyMagicLevels(),
  };
}

function updateLevel(
  levels: MagicLevelRecord[],
  level: ProgressionLevel,
  mutator: (record: MagicLevelRecord) => MagicLevelRecord,
): MagicLevelRecord[] {
  return levels.map((record) =>
    record.level === level ? mutator(record) : record,
  );
}

export const useMagicStore = create<MagicStoreState>((set) => ({
  ...createInitialMagicState(),

  addKnownSpell: (level, spellLevel, spellId) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: updateLevel(state.levels, level, (record) => {
        const existing = record.knownSpells[spellLevel] ?? [];

        if (existing.includes(spellId)) {
          return record;
        }

        return {
          ...record,
          knownSpells: {
            ...record.knownSpells,
            [spellLevel]: [...existing, spellId],
          },
        };
      }),
    })),

  addSpellbookEntry: (level, spellLevel, spellId) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: updateLevel(state.levels, level, (record) => {
        const existing = record.spellbookAdditions[spellLevel] ?? [];

        if (existing.includes(spellId)) {
          return record;
        }

        return {
          ...record,
          spellbookAdditions: {
            ...record.spellbookAdditions,
            [spellLevel]: [...existing, spellId],
          },
        };
      }),
    })),

  applySwap: (level, forgotten, learned) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: updateLevel(state.levels, level, (record) => {
        // Drop forgotten id from whichever spell-level bucket holds it, then
        // append learned at the same bucket.
        const nextKnown: Record<number, CanonicalId[]> = {};
        let spellLevelOfForgotten: number | null = null;
        for (const [slKey, list] of Object.entries(record.knownSpells)) {
          const sl = Number(slKey);
          if (list.includes(forgotten)) spellLevelOfForgotten = sl;
          nextKnown[sl] = list.filter((id) => id !== forgotten);
        }
        if (spellLevelOfForgotten != null) {
          nextKnown[spellLevelOfForgotten] = [
            ...(nextKnown[spellLevelOfForgotten] ?? []),
            learned,
          ];
        }
        return {
          ...record,
          knownSpells: nextKnown,
          swapsApplied: [
            ...record.swapsApplied,
            { appliedAtLevel: level, forgotten, learned },
          ],
        };
      }),
    })),

  removeKnownSpell: (level, spellLevel, spellId) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: updateLevel(state.levels, level, (record) => {
        const existing = record.knownSpells[spellLevel] ?? [];

        return {
          ...record,
          knownSpells: {
            ...record.knownSpells,
            [spellLevel]: existing.filter((id) => id !== spellId),
          },
        };
      }),
    })),

  removeSpellbookEntry: (level, spellLevel, spellId) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: updateLevel(state.levels, level, (record) => {
        const existing = record.spellbookAdditions[spellLevel] ?? [];

        return {
          ...record,
          spellbookAdditions: {
            ...record.spellbookAdditions,
            [spellLevel]: existing.filter((id) => id !== spellId),
          },
        };
      }),
    })),

  resetLevel: (level) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: updateLevel(state.levels, level, () => ({
        domains: [],
        knownSpells: {},
        level,
        spellbookAdditions: {},
        swapsApplied: [],
      })),
    })),

  resetMagicSelections: () => set(createInitialMagicState()),

  setActiveLevel: (activeLevel) => set({ activeLevel }),

  setDomains: (level, domains) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: updateLevel(state.levels, level, (record) => ({
        ...record,
        domains: [...domains],
      })),
    })),
}));
