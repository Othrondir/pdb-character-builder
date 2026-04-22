import type { LevelSubStep } from '@planner/lib/sections';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';

import {
  PROGRESSION_LEVEL_CAP,
  type ProgressionLevel,
} from './progression-fixture';
import { useLevelProgressionStore } from './store';

export function syncPlannerLevel(level: ProgressionLevel) {
  useLevelProgressionStore.getState().setActiveLevel(level);
  useSkillStore.getState().setActiveLevel(level);
  useFeatStore.getState().setActiveLevel(level);
}

export function openPlannerLevel(
  level: ProgressionLevel,
  subStep: LevelSubStep = 'class',
) {
  syncPlannerLevel(level);
  usePlannerShellStore.getState().setActiveLevelSubStep(subStep);
  usePlannerShellStore.getState().setExpandedLevel(level);
}

export function advancePlannerLevel(level: ProgressionLevel) {
  if (level >= PROGRESSION_LEVEL_CAP) {
    usePlannerShellStore.getState().setActiveView('resumen');
    return;
  }

  openPlannerLevel((level + 1) as ProgressionLevel, 'class');
}
