import { create } from 'zustand';
import type { LevelSubStep, OriginStep, ProgressionLevel, SheetTab } from '@planner/lib/sections';

export type PlannerValidationStatus = 'blocked' | 'illegal' | 'legal' | 'pending' | 'repair_needed';

interface PlannerShellState {
  activeOriginStep: OriginStep | null;
  activeLevelSubStep: LevelSubStep | null;
  characterSheetTab: SheetTab;
  datasetId: string;
  expandedLevel: ProgressionLevel | null;
  mobileNavOpen: boolean;
  validationStatus: PlannerValidationStatus;

  setActiveOriginStep: (step: OriginStep | null) => void;
  setActiveLevelSubStep: (subStep: LevelSubStep | null) => void;
  setCharacterSheetTab: (tab: SheetTab) => void;
  setExpandedLevel: (level: ProgressionLevel | null) => void;
  toggleMobileNav: () => void;
}

export const usePlannerShellStore = create<PlannerShellState>((set) => ({
  activeOriginStep: 'race',
  activeLevelSubStep: null,
  characterSheetTab: 'stats',
  datasetId: 'dataset:pendiente',
  expandedLevel: null,
  mobileNavOpen: false,
  validationStatus: 'pending',

  setActiveOriginStep: (activeOriginStep) =>
    set({ activeOriginStep, activeLevelSubStep: null, expandedLevel: null }),
  setActiveLevelSubStep: (activeLevelSubStep) =>
    set({ activeLevelSubStep, activeOriginStep: null }),
  setCharacterSheetTab: (characterSheetTab) => set({ characterSheetTab }),
  setExpandedLevel: (expandedLevel) =>
    set((state) => ({
      activeOriginStep: null,
      activeLevelSubStep: expandedLevel ? (state.activeLevelSubStep ?? 'class') : null,
      expandedLevel,
    })),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
}));
