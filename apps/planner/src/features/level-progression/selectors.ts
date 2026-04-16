import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import {
  collectVisibleClassOptions,
  evaluateClassEntry,
  type ClassRequirementRow,
} from '@rules-engine/progression/class-entry-rules';
import { getLevelGainsForSelection } from '@rules-engine/progression/level-gains';
import { evaluateMulticlassLegality } from '@rules-engine/progression/multiclass-rules';
import { revalidateProgressionAfterLevelChange } from '@rules-engine/progression/progression-revalidation';

import { shellCopyEs } from '@planner/lib/copy/es';
import {
  ATTRIBUTE_KEYS,
  type AttributeKey,
} from '@planner/features/character-foundation/foundation-fixture';
import {
  selectFoundationSummary,
  selectOriginReadyForAbilities,
} from '@planner/features/character-foundation/selectors';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';

import {
  getPhase04ClassRecord,
  phase04ClassFixture,
  type PlannerClassKind,
} from './class-fixture';
import type { LevelProgressionStoreState } from './store';
import type { ProgressionLevel, ProgressionStatus } from './progression-fixture';

const ATTRIBUTE_LABELS: Record<AttributeKey, 'CAR' | 'CON' | 'DES' | 'FUE' | 'INT' | 'SAB'> =
  {
    cha: 'CAR',
    con: 'CON',
    dex: 'DES',
    int: 'INT',
    str: 'FUE',
    wis: 'SAB',
  };

export interface FoundationSummaryStripView {
  attributes: Array<{
    key: AttributeKey;
    label: 'CAR' | 'CON' | 'DES' | 'FUE' | 'INT' | 'SAB';
    value: number;
  }>;
  characterLabel: string;
  datasetId: string;
  selectedAlignmentLabel: string | null;
  selectedRaceLabel: string | null;
  selectedSubraceLabel: string | null;
}

export interface LevelRailEntryView {
  active: boolean;
  classId: CanonicalId | null;
  classLabel: string | null;
  inheritedFromLevel: number | null;
  issueCount: number;
  level: ProgressionLevel;
  status: ProgressionStatus;
}

export interface ActiveLevelSheetView {
  abilityIncrease: AttributeKey | null;
  abilityIncreaseAvailable: boolean;
  classId: CanonicalId | null;
  classOptions: ClassOptionView[];
  choicePrompts: string[];
  gains: string[];
  inheritedFromLevel: number | null;
  level: number;
  placeholderBody: string;
  repairMessage: string | null;
  requirementRows: RequirementRowView[];
  status: ProgressionStatus;
  title: string;
}

export interface ClassOptionView {
  id: CanonicalId;
  kind: PlannerClassKind;
  label: string;
  selected: boolean;
  status: ProgressionStatus;
}

export interface RequirementRowView extends ClassRequirementRow {}

export interface ProgressionSummaryView {
  activeLevel: number;
  highestConfiguredLevel: number;
  planState: string;
  summaryStatus: ProgressionStatus;
}

function combineStatuses(
  statuses: Array<'blocked' | 'illegal' | 'legal'>,
): ProgressionStatus {
  if (statuses.includes('illegal')) {
    return 'illegal';
  }

  if (statuses.includes('blocked')) {
    return 'blocked';
  }

  return 'legal';
}

function createFoundationSnapshot(foundationState: CharacterFoundationStoreState) {
  return {
    alignmentId: foundationState.alignmentId,
    baseAttributes: foundationState.baseAttributes,
    deityId: null,
  };
}

function selectRevalidatedProgression(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
) {
  return revalidateProgressionAfterLevelChange({
    classes: phase04ClassFixture.classes,
    foundation: createFoundationSnapshot(foundationState),
    levels: progressionState.levels,
  });
}

export function selectFoundationSummaryStrip(
  foundationState: CharacterFoundationStoreState,
): FoundationSummaryStripView {
  const summary = selectFoundationSummary(foundationState);

  return {
    attributes: ATTRIBUTE_KEYS.map((key) => ({
      key,
      label: ATTRIBUTE_LABELS[key],
      value: foundationState.baseAttributes[key],
    })),
    characterLabel: summary.characterLabel,
    datasetId: summary.datasetId,
    selectedAlignmentLabel: summary.selectedAlignmentLabel,
    selectedRaceLabel: summary.selectedRaceLabel,
    selectedSubraceLabel: summary.selectedSubraceLabel,
  };
}

export function selectLevelRail(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): LevelRailEntryView[] {
  const revalidatedLevels = selectRevalidatedProgression(
    progressionState,
    foundationState,
  );

  return progressionState.levels.map((record) => {
    const revalidatedRecord =
      revalidatedLevels.find((entry) => entry.level === record.level) ?? null;

    return {
      active: progressionState.activeLevel === record.level,
      classId: record.classId,
      classLabel: getPhase04ClassRecord(record.classId)?.label ?? null,
      inheritedFromLevel: revalidatedRecord?.inheritedFromLevel ?? null,
      issueCount: revalidatedRecord?.issues.length ?? 0,
      level: record.level,
      status: (revalidatedRecord?.status ?? 'pending') as ProgressionStatus,
    };
  });
}

export function selectClassOptionsForLevel(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  level: ProgressionLevel,
): ClassOptionView[] {
  const selectedClassId =
    progressionState.levels.find((record) => record.level === level)?.classId ?? null;

  return collectVisibleClassOptions({
    classes: phase04ClassFixture.classes,
    foundation: createFoundationSnapshot(foundationState),
    selectedClassId,
  }).map((option) => {
    const classRecord = getPhase04ClassRecord(option.id);
    const multiclassStatus = classRecord
      ? evaluateMulticlassLegality({
          classRecord,
          classes: phase04ClassFixture.classes,
          level,
          levels: progressionState.levels,
        }).summaryStatus
      : 'blocked';

    return {
      id: option.id,
      kind: option.kind,
      label: option.label,
      selected: option.selected,
      status: combineStatuses([
        option.status,
        multiclassStatus,
      ]) as ProgressionStatus,
    };
  });
}

export function selectActiveLevelSheetView(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): ActiveLevelSheetView {
  const activeRecord =
    progressionState.levels.find(
      (record) => record.level === progressionState.activeLevel,
    ) ?? progressionState.levels[0];
  const classOptions = selectClassOptionsForLevel(
    progressionState,
    foundationState,
    activeRecord.level,
  );
  const classRecord = getPhase04ClassRecord(activeRecord.classId);
  const classEvaluation = classRecord
    ? evaluateClassEntry({
        classRecord,
        foundation: createFoundationSnapshot(foundationState),
      })
    : null;
  const gains = getLevelGainsForSelection({
    abilityIncreaseLevels: phase04ClassFixture.abilityIncreaseLevels,
    classRecord,
    level: activeRecord.level,
    levels: progressionState.levels,
  });
  const revalidatedRecord =
    selectRevalidatedProgression(progressionState, foundationState).find(
      (entry) => entry.level === activeRecord.level,
    ) ?? null;

  return {
    abilityIncrease: activeRecord.abilityIncrease,
    abilityIncreaseAvailable: gains.abilityIncreaseAvailable,
    choicePrompts: gains.choicePrompts,
    classId: activeRecord.classId,
    classOptions,
    gains: gains.features,
    inheritedFromLevel: revalidatedRecord?.inheritedFromLevel ?? null,
    level: activeRecord.level,
    placeholderBody: shellCopyEs.progression.placeholderBody,
    repairMessage:
      revalidatedRecord?.inheritedFromLevel !== null
        ? shellCopyEs.progression.repairCallout
        : null,
    requirementRows: classEvaluation?.requirementRows ?? [],
    status: (revalidatedRecord?.status ?? 'pending') as ProgressionStatus,
    title: shellCopyEs.progression.levelSheetHeading,
  };
}

export function selectActiveLevelSheet(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
) {
  return selectActiveLevelSheetView(progressionState, foundationState);
}

export function selectProgressionSummary(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): ProgressionSummaryView {
  const highestConfiguredLevel = progressionState.levels.reduce(
    (highestLevel, record) =>
      record.classId ? Math.max(highestLevel, record.level) : highestLevel,
    0,
  );
  const foundationReady = selectOriginReadyForAbilities(foundationState);
  const rail = selectLevelRail(progressionState, foundationState).filter(
    (entry) => entry.level <= highestConfiguredLevel,
  );
  const hasIllegal = rail.some((entry) => entry.status === 'illegal');
  const hasBlocked = rail.some((entry) => entry.status === 'blocked');

  const summaryStatus: ProgressionStatus =
    hasIllegal
      ? 'illegal'
      : hasBlocked
        ? 'blocked'
        : highestConfiguredLevel === 0
          ? 'pending'
          : highestConfiguredLevel === progressionState.levels.length &&
              foundationReady
            ? 'legal'
            : 'pending';

  const planState =
    highestConfiguredLevel === 0
      ? shellCopyEs.progression.planStates.empty
      : summaryStatus === 'legal'
        ? shellCopyEs.progression.planStates.ready
        : summaryStatus === 'illegal'
          ? shellCopyEs.progression.planStates.invalid
          : summaryStatus === 'blocked'
            ? shellCopyEs.progression.planStates.repair
            : shellCopyEs.progression.planStates.inProgress;

  return {
    activeLevel: progressionState.activeLevel,
    highestConfiguredLevel,
    planState,
    summaryStatus,
  };
}
