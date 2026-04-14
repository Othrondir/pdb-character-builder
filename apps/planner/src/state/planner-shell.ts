import { create } from 'zustand';
import type { PlannerSectionId } from '@planner/lib/sections';

export type PlannerValidationStatus = 'blocked' | 'illegal' | 'legal' | 'pending';

interface PlannerShellState {
  activeSection: PlannerSectionId;
  datasetId: string;
  mobileNavOpen: boolean;
  setActiveSection: (sectionId: PlannerSectionId) => void;
  setSummaryPanelOpen: (isOpen: boolean) => void;
  summaryPanelOpen: boolean;
  toggleMobileNav: () => void;
  toggleSummaryPanel: () => void;
  validationStatus: PlannerValidationStatus;
}

export const usePlannerShellStore = create<PlannerShellState>((set) => ({
  activeSection: 'build',
  datasetId: 'dataset:pendiente',
  mobileNavOpen: false,
  setActiveSection: (activeSection) => set({ activeSection }),
  setSummaryPanelOpen: (summaryPanelOpen) => set({ summaryPanelOpen }),
  summaryPanelOpen: true,
  toggleMobileNav: () =>
    set((state) => ({
      mobileNavOpen: !state.mobileNavOpen,
    })),
  toggleSummaryPanel: () =>
    set((state) => ({
      summaryPanelOpen: !state.summaryPanelOpen,
    })),
  validationStatus: 'pending',
}));
