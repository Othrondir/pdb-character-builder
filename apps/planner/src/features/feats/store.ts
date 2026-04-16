import { create } from 'zustand';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import { compiledFeatCatalog } from './compiled-feat-catalog';
import {
  PROGRESSION_LEVELS,
  type ProgressionLevel,
} from '../level-progression/progression-fixture';

export interface FeatLevelRecord {
  classFeatId: CanonicalId | null;
  generalFeatId: CanonicalId | null;
  level: ProgressionLevel;
}

export interface FeatStoreState {
  activeLevel: ProgressionLevel;
  datasetId: string;
  lastEditedLevel: ProgressionLevel | null;
  levels: FeatLevelRecord[];
  clearClassFeat: (level: ProgressionLevel) => void;
  clearGeneralFeat: (level: ProgressionLevel) => void;
  resetFeatSelections: () => void;
  resetLevel: (level: ProgressionLevel) => void;
  setActiveLevel: (level: ProgressionLevel) => void;
  setClassFeat: (level: ProgressionLevel, featId: CanonicalId) => void;
  setGeneralFeat: (level: ProgressionLevel, featId: CanonicalId) => void;
}

export function createEmptyFeatLevels(): FeatLevelRecord[] {
  return PROGRESSION_LEVELS.map((level) => ({
    classFeatId: null,
    generalFeatId: null,
    level,
  }));
}

export function createInitialFeatState() {
  return {
    activeLevel: 1 as ProgressionLevel,
    datasetId: compiledFeatCatalog.datasetId,
    lastEditedLevel: null,
    levels: createEmptyFeatLevels(),
  };
}

export const useFeatStore = create<FeatStoreState>((set) => ({
  ...createInitialFeatState(),
  clearClassFeat: (level) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: state.levels.map((r) =>
        r.level === level ? { ...r, classFeatId: null } : r,
      ),
    })),
  clearGeneralFeat: (level) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: state.levels.map((r) =>
        r.level === level ? { ...r, generalFeatId: null } : r,
      ),
    })),
  resetFeatSelections: () => set(createInitialFeatState()),
  resetLevel: (level) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: state.levels.map((r) =>
        r.level === level
          ? { ...r, classFeatId: null, generalFeatId: null }
          : r,
      ),
    })),
  setActiveLevel: (activeLevel) => set({ activeLevel }),
  setClassFeat: (level, featId) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: state.levels.map((r) =>
        r.level === level ? { ...r, classFeatId: featId } : r,
      ),
    })),
  setGeneralFeat: (level, featId) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: state.levels.map((r) =>
        r.level === level ? { ...r, generalFeatId: featId } : r,
      ),
    })),
}));
