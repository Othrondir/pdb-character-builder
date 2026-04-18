import { create } from 'zustand';
import type {
  LevelSubStep,
  OriginStep,
  PlannerView,
  ProgressionLevel,
  SheetTab,
} from '@planner/lib/sections';

export type PlannerValidationStatus = 'blocked' | 'illegal' | 'legal' | 'pending';

interface PlannerShellState {
  activeOriginStep: OriginStep | null;
  activeLevelSubStep: LevelSubStep | null;
  activeView: PlannerView;
  characterSheetTab: SheetTab;
  datasetId: string;
  expandedLevel: ProgressionLevel | null;
  mobileNavOpen: boolean;

  setActiveOriginStep: (step: OriginStep | null) => void;
  setActiveLevelSubStep: (subStep: LevelSubStep | null) => void;
  setActiveView: (view: PlannerView) => void;
  setCharacterSheetTab: (tab: SheetTab) => void;
  setExpandedLevel: (level: ProgressionLevel | null) => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
}

export const usePlannerShellStore = create<PlannerShellState>((set) => ({
  activeOriginStep: 'race',
  activeLevelSubStep: null,
  activeView: 'creation',
  characterSheetTab: 'stats',
  datasetId: 'dataset:pendiente',
  expandedLevel: null,
  mobileNavOpen: false,

  setActiveOriginStep: (activeOriginStep) =>
    set({
      activeOriginStep,
      activeLevelSubStep: null,
      expandedLevel: null,
      activeView: 'creation',
    }),
  setActiveLevelSubStep: (activeLevelSubStep) =>
    set({ activeLevelSubStep, activeOriginStep: null, activeView: 'creation' }),
  setActiveView: (activeView) =>
    set({
      activeView,
      // Non-creation views must clear the creation cursors so center-content routes
      // cleanly. Creation view restores the default Raza step.
      activeOriginStep: activeView === 'creation' ? 'race' : null,
      activeLevelSubStep: null,
      expandedLevel: null,
      mobileNavOpen: false,
    }),
  setCharacterSheetTab: (characterSheetTab) => set({ characterSheetTab }),
  setExpandedLevel: (expandedLevel) =>
    set((state) => ({
      activeOriginStep: null,
      activeLevelSubStep: expandedLevel ? (state.activeLevelSubStep ?? 'class') : null,
      expandedLevel,
      activeView: 'creation',
    })),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),
}));
