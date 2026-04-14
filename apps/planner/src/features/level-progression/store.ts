import { create } from 'zustand';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import {
  FOUNDATION_DATASET_ID,
  type AttributeKey,
} from '@planner/features/character-foundation/foundation-fixture';

import {
  createEmptyProgressionLevels,
  type ProgressionLevel,
  type ProgressionLevelRecord,
} from './progression-fixture';

export interface LevelProgressionStoreState {
  activeLevel: ProgressionLevel;
  datasetId: string;
  lastEditedLevel: ProgressionLevel | null;
  levels: ProgressionLevelRecord[];
  resetProgression: () => void;
  setActiveLevel: (level: ProgressionLevel) => void;
  setLevelAbilityIncrease: (
    level: ProgressionLevel,
    abilityIncrease: AttributeKey | null,
  ) => void;
  setLevelClassId: (level: ProgressionLevel, classId: CanonicalId | null) => void;
}

export function createInitialProgressionState() {
  return {
    activeLevel: 1 as ProgressionLevel,
    datasetId: FOUNDATION_DATASET_ID,
    lastEditedLevel: null,
    levels: createEmptyProgressionLevels(),
  };
}

function updateLevelRecord(
  levels: ProgressionLevelRecord[],
  level: ProgressionLevel,
  updater: (record: ProgressionLevelRecord) => ProgressionLevelRecord,
) {
  return levels.map((record) => (record.level === level ? updater(record) : record));
}

export const useLevelProgressionStore = create<LevelProgressionStoreState>((set) => ({
  ...createInitialProgressionState(),
  resetProgression: () => set(createInitialProgressionState()),
  setActiveLevel: (activeLevel) => set({ activeLevel }),
  setLevelAbilityIncrease: (level, abilityIncrease) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: updateLevelRecord(state.levels, level, (record) => ({
        ...record,
        abilityIncrease,
      })),
    })),
  setLevelClassId: (level, classId) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: updateLevelRecord(state.levels, level, (record) => ({
        ...record,
        classId,
      })),
    })),
}));
