import { create } from 'zustand';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import { compiledFeatCatalog } from './compiled-feat-catalog';
import {
  PROGRESSION_LEVELS,
  type ProgressionLevel,
} from '../level-progression/progression-fixture';

export interface FeatLevelRecord {
  bonusGeneralFeatIds: CanonicalId[];
  classFeatId: CanonicalId | null;
  generalFeatId: CanonicalId | null;
  level: ProgressionLevel;
}

export interface FeatStoreState {
  activeLevel: ProgressionLevel;
  datasetId: string;
  lastEditedLevel: ProgressionLevel | null;
  levels: FeatLevelRecord[];
  clearClassFeat: (level: ProgressionLevel, slotIndex?: number) => void;
  clearGeneralFeat: (level: ProgressionLevel, slotIndex?: number) => void;
  resetFeatSelections: () => void;
  resetLevel: (level: ProgressionLevel) => void;
  setActiveLevel: (level: ProgressionLevel) => void;
  setClassFeat: (
    level: ProgressionLevel,
    featId: CanonicalId,
    slotIndex?: number,
  ) => void;
  setGeneralFeat: (
    level: ProgressionLevel,
    featId: CanonicalId,
    slotIndex?: number,
  ) => void;
}

export function getGeneralFeatIds(record: FeatLevelRecord | null | undefined): CanonicalId[] {
  if (!record) {
    return [];
  }

  return [
    ...(record.generalFeatId ? [record.generalFeatId] : []),
    ...record.bonusGeneralFeatIds,
  ];
}

export function getClassFeatIds(record: FeatLevelRecord | null | undefined): CanonicalId[] {
  if (!record || record.classFeatId === null) {
    return [];
  }

  return [record.classFeatId];
}

export function getChosenFeatIds(record: FeatLevelRecord | null | undefined): CanonicalId[] {
  return [...getClassFeatIds(record), ...getGeneralFeatIds(record)];
}

function withoutDuplicateFeat(
  record: FeatLevelRecord,
  featId: CanonicalId,
): FeatLevelRecord {
  const bonusGeneralFeatIds = record.bonusGeneralFeatIds.filter((id) => id !== featId);

  return {
    ...record,
    bonusGeneralFeatIds,
    classFeatId: record.classFeatId === featId ? null : record.classFeatId,
    generalFeatId: record.generalFeatId === featId ? null : record.generalFeatId,
  };
}

export function createEmptyFeatLevels(): FeatLevelRecord[] {
  return PROGRESSION_LEVELS.map((level) => ({
    bonusGeneralFeatIds: [],
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
  clearClassFeat: (level, slotIndex = 0) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: state.levels.map((r) =>
        r.level === level
          ? slotIndex === 0
            ? { ...r, classFeatId: null }
            : r
          : r,
      ),
    })),
  clearGeneralFeat: (level, slotIndex = 0) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: state.levels.map((r) =>
        r.level === level
          ? slotIndex === 0
            ? { ...r, generalFeatId: null }
            : {
                ...r,
                bonusGeneralFeatIds: r.bonusGeneralFeatIds.filter(
                  (_, index) => index !== slotIndex - 1,
                ),
              }
          : r,
      ),
    })),
  resetFeatSelections: () => set(createInitialFeatState()),
  resetLevel: (level) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: state.levels.map((r) =>
        r.level === level
          ? {
              ...r,
              bonusGeneralFeatIds: [],
              classFeatId: null,
              generalFeatId: null,
            }
          : r,
      ),
    })),
  setActiveLevel: (activeLevel) => set({ activeLevel }),
  setClassFeat: (level, featId, slotIndex = 0) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: state.levels.map((r) =>
        r.level === level
          ? slotIndex === 0
            ? { ...withoutDuplicateFeat(r, featId), classFeatId: featId }
            : r
          : r,
      ),
    })),
  setGeneralFeat: (level, featId, slotIndex = 0) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: state.levels.map((r) =>
        r.level === level
          ? (() => {
              const next = withoutDuplicateFeat(r, featId);
              if (slotIndex === 0) {
                return { ...next, generalFeatId: featId };
              }

              const bonusGeneralFeatIds = [...next.bonusGeneralFeatIds];
              bonusGeneralFeatIds[slotIndex - 1] = featId;
              return { ...next, bonusGeneralFeatIds };
            })()
          : r,
      ),
    })),
}));
