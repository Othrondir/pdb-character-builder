import { create } from 'zustand';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import { compiledSkillCatalog } from './compiled-skill-catalog';
import {
  PROGRESSION_LEVELS,
  type ProgressionLevel,
} from '../level-progression/progression-fixture';

export interface SkillAllocationRecord {
  rank: number;
  skillId: CanonicalId;
}

export interface SkillLevelRecord {
  allocations: SkillAllocationRecord[];
  level: ProgressionLevel;
}

export interface SkillStoreState {
  activeLevel: ProgressionLevel;
  datasetId: string;
  decrementSkillRank: (
    level: ProgressionLevel,
    skillId: CanonicalId,
    step?: number,
  ) => void;
  incrementSkillRank: (
    level: ProgressionLevel,
    skillId: CanonicalId,
    step?: number,
  ) => void;
  lastEditedLevel: ProgressionLevel | null;
  levels: SkillLevelRecord[];
  resetSkillAllocations: () => void;
  setSkillRank: (
    level: ProgressionLevel,
    skillId: CanonicalId,
    rank: number,
  ) => void;
  setActiveLevel: (level: ProgressionLevel) => void;
  setLevelSkillRank: (
    level: ProgressionLevel,
    skillId: CanonicalId,
    rank: number,
  ) => void;
}

export function createEmptySkillLevels(): SkillLevelRecord[] {
  return PROGRESSION_LEVELS.map((level) => ({
    allocations: [],
    level,
  }));
}

export function createInitialSkillState() {
  return {
    activeLevel: 1 as ProgressionLevel,
    datasetId: compiledSkillCatalog.datasetId,
    lastEditedLevel: null,
    levels: createEmptySkillLevels(),
  };
}

function updateLevelSkillRank(
  levels: SkillLevelRecord[],
  level: ProgressionLevel,
  skillId: CanonicalId,
  rank: number,
) {
  return levels.map((record) => {
    if (record.level !== level) {
      return record;
    }

    const nextAllocations = record.allocations.filter(
      (allocation) => allocation.skillId !== skillId,
    );

    if (rank > 0) {
      nextAllocations.push({ rank, skillId });
    }

    nextAllocations.sort((left, right) => left.skillId.localeCompare(right.skillId));

    return {
      ...record,
      allocations: nextAllocations,
    };
  });
}

function getCurrentLevelSkillRank(
  levels: SkillLevelRecord[],
  level: ProgressionLevel,
  skillId: CanonicalId,
) {
  return (
    levels
      .find((record) => record.level === level)
      ?.allocations.find((allocation) => allocation.skillId === skillId)?.rank ?? 0
  );
}

export const useSkillStore = create<SkillStoreState>((set) => ({
  ...createInitialSkillState(),
  decrementSkillRank: (level, skillId, step = 1) =>
    set((state) => {
      const currentRank = getCurrentLevelSkillRank(state.levels, level, skillId);

      return {
        lastEditedLevel: level,
        levels: updateLevelSkillRank(
          state.levels,
          level,
          skillId,
          Math.max(0, currentRank - step),
        ),
      };
    }),
  incrementSkillRank: (level, skillId, step = 1) =>
    set((state) => {
      const currentRank = getCurrentLevelSkillRank(state.levels, level, skillId);

      return {
        lastEditedLevel: level,
        levels: updateLevelSkillRank(state.levels, level, skillId, currentRank + step),
      };
    }),
  resetSkillAllocations: () => set(createInitialSkillState()),
  setSkillRank: (level, skillId, rank) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: updateLevelSkillRank(state.levels, level, skillId, Math.max(0, rank)),
    })),
  setActiveLevel: (activeLevel) => set({ activeLevel }),
  setLevelSkillRank: (level, skillId, rank) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: updateLevelSkillRank(
        state.levels,
        level,
        skillId,
        Math.max(0, rank),
      ),
    })),
}));
