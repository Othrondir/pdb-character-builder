import { shellCopyEs } from '@planner/lib/copy/es';

export type OriginStep = 'race' | 'alignment' | 'attributes';
export type LevelSubStep = 'class' | 'skills' | 'feats' | 'spells';
export type SheetTab = 'stats' | 'skills' | 'feats' | 'spells';

export interface OriginStepDefinition {
  readonly id: OriginStep;
  readonly label: string;
}

export interface LevelSubStepDefinition {
  readonly id: LevelSubStep;
  readonly label: string;
}

export interface SheetTabDefinition {
  readonly id: SheetTab;
  readonly label: string;
}

export const originSteps: readonly OriginStepDefinition[] = [
  { id: 'race', label: shellCopyEs.stepper.originSteps.race },
  { id: 'alignment', label: shellCopyEs.stepper.originSteps.alignment },
  { id: 'attributes', label: shellCopyEs.stepper.originSteps.attributes },
] as const;

export const levelSubSteps: readonly LevelSubStepDefinition[] = [
  { id: 'class', label: shellCopyEs.stepper.levelSubSteps.class },
  { id: 'skills', label: shellCopyEs.stepper.levelSubSteps.skills },
  { id: 'feats', label: shellCopyEs.stepper.levelSubSteps.feats },
  { id: 'spells', label: shellCopyEs.stepper.levelSubSteps.spells },
] as const;

export const sheetTabs: readonly SheetTabDefinition[] = [
  { id: 'stats', label: shellCopyEs.stepper.sheetTabs.stats },
  { id: 'skills', label: shellCopyEs.stepper.sheetTabs.skills },
  { id: 'feats', label: shellCopyEs.stepper.sheetTabs.feats },
  { id: 'spells', label: shellCopyEs.stepper.sheetTabs.spells },
] as const;

export type ProgressionLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
