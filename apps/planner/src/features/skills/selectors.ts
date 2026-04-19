import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ValidationOutcome } from '@rules-engine/contracts/validation-outcome';
import {
  evaluateSkillSnapshot,
  type ArmorCategory,
  type EvaluatedSkillAllocation,
  type EvaluatedSkillLevel,
  type SkillCostType,
  type SkillEvaluationStatus,
  type SkillLevelInput,
} from '@rules-engine/skills/skill-allocation';
import {
  deriveSkillStatsView,
  type SkillStatsCapCostRow,
  type SkillStatsPenalty,
  type SkillStatsView,
} from '@rules-engine/skills/skill-derived-stats';
import { revalidateSkillSnapshotAfterChange } from '@rules-engine/skills/skill-revalidation';

import { shellCopyEs } from '@planner/lib/copy/es';
import { selectOriginReadyForAbilities } from '@planner/features/character-foundation/selectors';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';
import { getPhase04ClassRecord } from '@planner/features/level-progression/class-fixture';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { LevelProgressionStoreState } from '@planner/features/level-progression/store';

import { compiledSkillCatalog } from './compiled-skill-catalog';
import type { SkillLevelRecord, SkillStoreState } from './store';

const CLASS_SKILL_POINTS: Partial<Record<CanonicalId, number>> = {
  'class:bard': 6,
  'class:cleric': 2,
  'class:druid': 4,
  'class:fighter': 2,
  'class:monk': 4,
  'class:paladin': 2,
  'class:ranger': 4,
  'class:rogue': 8,
  'class:shadowdancer': 6,
  'class:weapon-master': 2,
  'class:wizard': 2,
};

const CATEGORY_LABELS: Record<string, string> = {
  athletic: 'Atletismo y movilidad',
  discipline: 'Disciplina y control',
  lore: 'Conocimiento',
  perception: 'Percepción',
  social: 'Interacción',
  stealth: 'Sigilo',
  utility: 'Utilidad',
};

const STATUS_ORDER: Record<SkillEvaluationStatus, number> = {
  blocked: 1,
  illegal: 0,
  legal: 2,
  pending: 3,
};

export interface SkillRailEntryView {
  active: boolean;
  classId: CanonicalId | null;
  classLabel: string | null;
  inheritedFromLevel: number | null;
  issueCount: number;
  level: ProgressionLevel;
  status: SkillEvaluationStatus;
}

export interface SkillSummaryStripView {
  activeLevel: number;
  availablePoints: number;
  classLabel: string | null;
  datasetId: string;
  remainingPoints: number;
  spentPoints: number;
  status: SkillEvaluationStatus;
}

export interface SkillRowIssueView {
  key: string;
  text: string;
}

export interface SkillSheetRowView {
  cap: number;
  costType: SkillCostType;
  costTypeLabel: string;
  currentRank: number;
  currentTotal: number;
  disabled: boolean;
  issues: SkillRowIssueView[];
  label: string;
  maxAssignableRank: number;
  nextCost: number;
  nextCostLabel: string;
  skillId: CanonicalId;
  status: SkillEvaluationStatus;
  step: number;
  trainedOnly: boolean;
}

export interface SkillStatsTotalsItemView {
  key: string;
  label: string;
  value: string;
}

export interface SkillStatsCapsCostsRowView {
  capLabel: string;
  costTypeLabel: string;
  currentTotalLabel: string;
  key: string;
  label: string;
  nextCostLabel: string;
  status: SkillEvaluationStatus;
}

export interface SkillStatsPenaltyView {
  key: string;
  label: string;
  status: SkillEvaluationStatus;
  text: string;
}

export interface SkillStatsViewModel {
  activeLevel: number;
  emptyStateBody: string | null;
  penalties: SkillStatsPenaltyView[];
  penaltiesHeading: string;
  status: SkillEvaluationStatus;
  summary: SkillSummaryStripView;
  technicalDescription: string;
  title: string;
  totals: SkillStatsTotalsItemView[];
  totalsHeading: string;
  capsAndCosts: SkillStatsCapsCostsRowView[];
  capsAndCostsHeading: string;
}

export interface SkillSummaryView {
  blockedLevels: number[];
  highestConfiguredLevel: number;
  planState: string;
  remainingPoints: number;
  spentPoints: number;
  summaryStatus: SkillEvaluationStatus;
}

export type SkillSectionId = 'class' | 'cross-class';

export interface SkillSheetGroupView {
  /**
   * Phase 12.4-05 — R4 Habilidades split (SPEC R4, CONTEXT D-09).
   * Grouping flipped from category-keyed to costType-keyed; `sectionId`
   * drives section render order + heading choice in skill-sheet.tsx.
   */
  sectionId: SkillSectionId;
  heading: string;
  costHint: string;
  rows: SkillSheetRowView[];
}

export interface ActiveSkillSheetView {
  availablePoints: number;
  classId: CanonicalId | null;
  classLabel: string | null;
  emptyMessage: string;
  groups: SkillSheetGroupView[];
  inheritedFromLevel: number | null;
  issues: string[];
  level: ProgressionLevel;
  remainingPoints: number;
  repairMessage: string | null;
  spentPoints: number;
  status: SkillEvaluationStatus;
  title: string;
}

export interface SkillBoardView {
  activeSheet: ActiveSkillSheetView;
  emptyStateBody: string | null;
  rail: SkillRailEntryView[];
  summaryStrip: SkillSummaryStripView;
}

function getSkillPointsBase(classId: CanonicalId | null) {
  if (!classId) {
    return 0;
  }

  return CLASS_SKILL_POINTS[classId] ?? 2;
}

function getArmorCategory(
  _progressionState: LevelProgressionStoreState,
  _level: ProgressionLevel,
): ArmorCategory {
  return null;
}

function getIntelligenceModifier(
  foundationState: CharacterFoundationStoreState,
  progressionState: LevelProgressionStoreState,
  level: ProgressionLevel,
) {
  const baseIntelligence = foundationState.baseAttributes.int;
  const intelligenceIncreases = progressionState.levels.filter(
    (record) => record.level <= level && record.abilityIncrease === 'int',
  ).length;

  return Math.floor((baseIntelligence + intelligenceIncreases - 10) / 2);
}

function createSkillLevelInput(
  skillRecord: SkillLevelRecord,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): SkillLevelInput {
  const progressionRecord =
    progressionState.levels.find((record) => record.level === skillRecord.level) ?? null;

  return {
    allocations: skillRecord.allocations,
    armorCategory: getArmorCategory(progressionState, skillRecord.level),
    classId: progressionRecord?.classId ?? null,
    intelligenceModifier: getIntelligenceModifier(
      foundationState,
      progressionState,
      skillRecord.level,
    ),
    level: skillRecord.level,
    skillPointsBase: getSkillPointsBase(progressionRecord?.classId ?? null),
  };
}

function createSkillLevelInputs(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
) {
  return skillState.levels.map((level) =>
    createSkillLevelInput(level, progressionState, foundationState),
  );
}

function createIssueText(
  issue: ValidationOutcome,
  allocation: EvaluatedSkillAllocation,
): string {
  const evidenceLabel =
    issue.evidence.find((entry) => entry.label)?.label ??
    issue.evidence.find((entry) => entry.evidenceId)?.evidenceId ??
    null;

  if (issue.status === 'blocked') {
    if (evidenceLabel) {
      return evidenceLabel;
    }

    return shellCopyEs.skills.errorState;
  }

  if (allocation.resultingRank > allocation.cap) {
    return `${shellCopyEs.skills.capLabel}: ${allocation.cap}`;
  }

  return shellCopyEs.skills.invalidRankHint;
}

function formatNumericValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

function formatPointLabel(value: number) {
  const numericValue = formatNumericValue(value);

  return `${numericValue} punto${value === 1 ? '' : 's'}`;
}

function formatNextCostLabel(costType: SkillCostType, value: number) {
  if (costType === 'cross-class') {
    return `${formatPointLabel(value * 2)} / 1 rango`;
  }

  return `${formatPointLabel(value)} / 1 rango`;
}

function formatCapLabel(value: number) {
  return `${shellCopyEs.skills.capLabel}: ${formatNumericValue(value)}`;
}

function formatCurrentTotalLabel(value: number) {
  return `${shellCopyEs.skills.rankLabel}: ${formatNumericValue(value)}`;
}

function compareStatuses(left: SkillEvaluationStatus, right: SkillEvaluationStatus) {
  return STATUS_ORDER[left] - STATUS_ORDER[right];
}

function selectBoardArtifacts(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
) {
  const skillInputs = createSkillLevelInputs(skillState, progressionState, foundationState);
  const evaluation = evaluateSkillSnapshot({
    catalog: compiledSkillCatalog,
    levels: skillInputs,
  });
  const revalidated = revalidateSkillSnapshotAfterChange({
    catalog: compiledSkillCatalog,
    levels: skillInputs,
  });

  return {
    evaluation,
    revalidated,
    skillInputs,
  };
}

function getActiveArtifacts(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
) {
  const artifacts = selectBoardArtifacts(skillState, progressionState, foundationState);
  const activeIndex = skillState.levels.findIndex(
    (entry) => entry.level === skillState.activeLevel,
  );

  return {
    ...artifacts,
    activeIndex,
    activeInput: artifacts.skillInputs[activeIndex] ?? null,
    activeLevel: artifacts.evaluation.levels[activeIndex] ?? null,
    activeRepair: artifacts.revalidated[activeIndex] ?? null,
  };
}

function mapSkillStatsPenalty(
  penalty: SkillStatsPenalty,
  capsAndCosts: SkillStatsCapsCostsRowView[],
): SkillStatsPenaltyView {
  const rowLabel =
    capsAndCosts.find((row) => row.key === penalty.skillId)?.label ??
    shellCopyEs.sections.stats.label;
  const evidenceLabel =
    penalty.issue.evidence.find((entry) => entry.label)?.label ??
    penalty.issue.evidence.find((entry) => entry.evidenceId)?.evidenceId ??
    null;
  const text =
    penalty.source === 'repair'
      ? shellCopyEs.skills.repairCallout
      : evidenceLabel ??
        (penalty.issue.status === 'blocked'
          ? shellCopyEs.skills.errorState
          : shellCopyEs.skills.invalidRankHint);

  return {
    key: penalty.key,
    label: penalty.skillId ? rowLabel : shellCopyEs.sections.stats.label,
    status: penalty.status,
    text,
  };
}

function mapSkillStatsCapsCosts(rows: SkillStatsCapCostRow[]): SkillStatsCapsCostsRowView[] {
  return rows.map((row) => ({
    capLabel: formatCapLabel(row.cap),
    costTypeLabel:
      row.costType === 'class'
        ? shellCopyEs.skills.classSkillLabel
        : shellCopyEs.skills.crossClassSkillLabel,
    currentTotalLabel: formatCurrentTotalLabel(row.currentTotal),
    key: row.skillId,
    label: row.label,
    nextCostLabel: formatNextCostLabel(row.costType, row.nextCost),
    status: row.status,
  }));
}

function mapSkillStatsTotals(statsView: SkillStatsView): SkillStatsTotalsItemView[] {
  return statsView.totals.map((item) => ({
    key: item.key,
    label:
      item.key === 'availablePoints'
        ? shellCopyEs.skills.availablePointsLabel
        : item.key === 'spentPoints'
          ? shellCopyEs.skills.spentPointsLabel
          : item.key === 'remainingPoints'
            ? shellCopyEs.skills.remainingPointsLabel
            : shellCopyEs.skills.statsAllocatedSkillsLabel,
    value: formatNumericValue(item.value),
  }));
}

export function selectSkillRail(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): SkillRailEntryView[] {
  const { evaluation, revalidated } = selectBoardArtifacts(
    skillState,
    progressionState,
    foundationState,
  );

  return skillState.levels.map((levelRecord, index) => {
    const progressionRecord =
      progressionState.levels.find((entry) => entry.level === levelRecord.level) ?? null;
    const evaluatedLevel = evaluation.levels[index];
    const revalidatedLevel = revalidated[index];

    return {
      active: skillState.activeLevel === levelRecord.level,
      classId: progressionRecord?.classId ?? null,
      classLabel: getPhase04ClassRecord(progressionRecord?.classId ?? null)?.label ?? null,
      inheritedFromLevel: revalidatedLevel?.inheritedFromLevel ?? null,
      issueCount: revalidatedLevel?.issues.length ?? evaluatedLevel?.issues.length ?? 0,
      level: levelRecord.level,
      status: revalidatedLevel?.status ?? evaluatedLevel?.status ?? 'pending',
    };
  });
}

export function selectSkillSummaryStrip(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): SkillSummaryStripView {
  const { evaluation, revalidated } = selectBoardArtifacts(
    skillState,
    progressionState,
    foundationState,
  );
  const activeIndex = skillState.levels.findIndex(
    (entry) => entry.level === skillState.activeLevel,
  );
  const activeLevel = evaluation.levels[activeIndex];
  const activeRepair = revalidated[activeIndex];
  const activeProgression =
    progressionState.levels.find((entry) => entry.level === skillState.activeLevel) ?? null;

  return {
    activeLevel: skillState.activeLevel,
    availablePoints: activeLevel?.availablePoints ?? 0,
    classLabel: getPhase04ClassRecord(activeProgression?.classId ?? null)?.label ?? null,
    datasetId: skillState.datasetId,
    remainingPoints: activeLevel?.remainingPoints ?? 0,
    spentPoints: activeLevel?.spentPoints ?? 0,
    status: activeRepair?.status ?? activeLevel?.status ?? 'pending',
  };
}

function buildActiveSkillRows(
  evaluatedLevel: EvaluatedSkillLevel,
  levelInput: SkillLevelInput,
): Array<SkillSheetRowView & { category: string }> {
  return compiledSkillCatalog.skills
    .map((skill) => {
      const allocation =
        evaluatedLevel.allocations.find((entry) => entry.skillId === skill.id) ?? null;
      const currentRank =
        levelInput.allocations.find((entry) => entry.skillId === skill.id)?.rank ?? 0;
      const costType =
        allocation?.costType ??
        (skill.defaultClassIds.includes(levelInput.classId ?? '')
          ? 'class'
          : 'cross-class');
      const priorRank = allocation ? allocation.resultingRank - allocation.rank : 0;
      const cap =
        allocation?.cap ??
        (costType === 'class'
          ? levelInput.level + 3
          : Math.floor((levelInput.level + 3) / 2));
      const maxAssignableRank = Math.max(0, cap - priorRank);
      const step = 1;
      const status = allocation?.status ?? 'pending';

      return {
        cap,
        category: skill.category,
        costType,
        costTypeLabel:
          costType === 'class'
            ? shellCopyEs.skills.classSkillLabel
            : shellCopyEs.skills.crossClassSkillLabel,
        currentRank,
        currentTotal: priorRank + currentRank,
        disabled: !levelInput.classId,
        issues:
          allocation?.issues.map((issue, issueIndex) => ({
            key: `${skill.id}-${issue.code}-${issueIndex}`,
            text: createIssueText(issue, allocation),
          })) ?? [],
        label: skill.label,
        maxAssignableRank,
        nextCost: costType === 'class' ? 1 : 2,
        nextCostLabel: formatNextCostLabel(costType, 1),
        skillId: skill.id as CanonicalId,
        status,
        step,
        trainedOnly: skill.trainedOnly,
      };
    })
    .sort((left, right) => {
      const statusDelta = compareStatuses(left.status, right.status);

      return statusDelta !== 0 ? statusDelta : left.label.localeCompare(right.label);
    });
}

export function selectActiveSkillSheetView(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): ActiveSkillSheetView {
  const { evaluation, revalidated, skillInputs } = selectBoardArtifacts(
    skillState,
    progressionState,
    foundationState,
  );
  const activeIndex = skillState.levels.findIndex(
    (entry) => entry.level === skillState.activeLevel,
  );
  const activeLevel = evaluation.levels[activeIndex];
  const activeRepair = revalidated[activeIndex];
  const activeInput = skillInputs[activeIndex];
  const activeProgression =
    progressionState.levels.find((entry) => entry.level === skillState.activeLevel) ?? null;
  const classLabel = getPhase04ClassRecord(activeProgression?.classId ?? null)?.label ?? null;
  const rows = activeLevel && activeInput ? buildActiveSkillRows(activeLevel, activeInput) : [];
  // Phase 12.4-05 — R4 Habilidades split (SPEC R4 / CONTEXT D-09).
  // Bucket rows by `costType` (class | cross-class) instead of category so
  // skill-sheet.tsx can render two headered sections with cost-per-rank copy.
  const groupedRows = rows.reduce<Record<SkillSectionId, SkillSheetRowView[]>>(
    (accumulator, row) => {
      const sectionId: SkillSectionId =
        row.costType === 'class' ? 'class' : 'cross-class';
      accumulator[sectionId].push(row);
      return accumulator;
    },
    { class: [], 'cross-class': [] } as Record<SkillSectionId, SkillSheetRowView[]>,
  );

  return {
    availablePoints: activeLevel?.availablePoints ?? 0,
    classId: activeProgression?.classId ?? null,
    classLabel,
    emptyMessage: selectOriginReadyForAbilities(foundationState)
      ? shellCopyEs.skills.emptyStateBody
      : shellCopyEs.skills.lockedBody,
    // Phase 12.4-05 — two-section emission. Section order is locked:
    // class (1 pt/rango) above cross-class (2 pts/rango) per UI-SPEC.md §"R4".
    groups: [
      {
        sectionId: 'class' as const,
        heading: shellCopyEs.skills.sectionClassHeading,
        costHint: shellCopyEs.skills.sectionClassCostHint,
        rows: groupedRows.class,
      },
      {
        sectionId: 'cross-class' as const,
        heading: shellCopyEs.skills.sectionCrossClassHeading,
        costHint: shellCopyEs.skills.sectionCrossClassCostHint,
        rows: groupedRows['cross-class'],
      },
    ],
    inheritedFromLevel: activeRepair?.inheritedFromLevel ?? null,
    issues:
      activeLevel?.issues.map((issue) =>
        issue.status === 'blocked'
          ? issue.evidence.find((entry) => entry.label)?.label ?? shellCopyEs.skills.errorState
          : shellCopyEs.skills.invalidLevelHint,
      ) ?? [],
    level: skillState.activeLevel,
    remainingPoints: activeLevel?.remainingPoints ?? 0,
    repairMessage:
      activeRepair?.inheritedFromLevel !== null
        ? shellCopyEs.skills.repairCallout
        : null,
    spentPoints: activeLevel?.spentPoints ?? 0,
    status: activeRepair?.status ?? activeLevel?.status ?? 'pending',
    title: shellCopyEs.skills.sheetHeading,
  };
}

export function selectSkillBoardView(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): SkillBoardView {
  const progressionHasClass = progressionState.levels.some((level) => level.classId !== null);

  return {
    activeSheet: selectActiveSkillSheetView(
      skillState,
      progressionState,
      foundationState,
    ),
    emptyStateBody: progressionHasClass ? null : shellCopyEs.skills.emptyStateBody,
    rail: selectSkillRail(skillState, progressionState, foundationState),
    summaryStrip: selectSkillSummaryStrip(
      skillState,
      progressionState,
      foundationState,
    ),
  };
}

export function selectSkillStatsView(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): SkillStatsViewModel {
  const { activeInput, activeLevel, activeRepair } = getActiveArtifacts(
    skillState,
    progressionState,
    foundationState,
  );
  const summary = selectSkillSummaryStrip(skillState, progressionState, foundationState);
  const progressionHasClass = progressionState.levels.some((level) => level.classId !== null);

  if (!activeInput || !activeLevel || !activeInput.classId) {
    return {
      activeLevel: skillState.activeLevel,
      capsAndCosts: [],
      capsAndCostsHeading: shellCopyEs.skills.statsCapsCostsHeading,
      emptyStateBody: progressionHasClass ? shellCopyEs.skills.emptyStateBody : shellCopyEs.skills.lockedBody,
      penalties: [],
      penaltiesHeading: shellCopyEs.skills.statsPenaltiesHeading,
      status: 'pending',
      summary,
      technicalDescription: shellCopyEs.sections.stats.description,
      title: shellCopyEs.sections.stats.heading,
      totals: [],
      totalsHeading: shellCopyEs.skills.statsTotalsHeading,
    };
  }

  const statsView = deriveSkillStatsView({
    catalog: compiledSkillCatalog,
    evaluatedLevel: activeLevel,
    levelInput: activeInput,
    revalidatedLevel: activeRepair,
  });
  const capsAndCosts = mapSkillStatsCapsCosts(statsView.capsAndCosts);

  return {
    activeLevel: skillState.activeLevel,
    capsAndCosts,
    capsAndCostsHeading: shellCopyEs.skills.statsCapsCostsHeading,
    emptyStateBody: null,
    penalties: statsView.penalties.map((penalty) => mapSkillStatsPenalty(penalty, capsAndCosts)),
    penaltiesHeading: shellCopyEs.skills.statsPenaltiesHeading,
    status: statsView.status,
    summary,
    technicalDescription: shellCopyEs.skills.statsDescription,
    title: shellCopyEs.sections.stats.heading,
    totals: mapSkillStatsTotals(statsView),
    totalsHeading: shellCopyEs.skills.statsTotalsHeading,
  };
}

export function selectSkillSummary(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): SkillSummaryView {
  const highestProgressionLevel = progressionState.levels.reduce(
    (highestLevel, record) => (record.classId ? Math.max(highestLevel, record.level) : highestLevel),
    0,
  );
  const highestConfiguredLevel = skillState.levels.reduce(
    (highestLevel, record) =>
      record.allocations.length > 0 ? Math.max(highestLevel, record.level) : highestLevel,
    0,
  );

  if (highestConfiguredLevel === 0) {
    return {
      blockedLevels: [],
      highestConfiguredLevel: 0,
      planState: shellCopyEs.skills.planStates.empty,
      remainingPoints: 0,
      spentPoints: 0,
      summaryStatus: 'pending',
    };
  }

  const { evaluation, revalidated } = selectBoardArtifacts(
    skillState,
    progressionState,
    foundationState,
  );
  const relevantLevels = skillState.levels
    .filter((record) => record.level <= highestConfiguredLevel)
    .map((record) => record.level);
  const blockedLevels = relevantLevels.filter((level) => {
    const index = level - 1;
    const status = revalidated[index]?.status ?? evaluation.levels[index]?.status ?? 'pending';
    return status === 'blocked' || status === 'illegal';
  });
  const spentPoints = relevantLevels.reduce(
    (total, level) => total + (evaluation.levels[level - 1]?.spentPoints ?? 0),
    0,
  );
  const remainingPoints = relevantLevels.reduce(
    (total, level) => total + (evaluation.levels[level - 1]?.remainingPoints ?? 0),
    0,
  );
  const hasIllegal = relevantLevels.some(
    (level) => (revalidated[level - 1]?.status ?? evaluation.levels[level - 1]?.status) === 'illegal',
  );
  const hasBlocked = relevantLevels.some(
    (level) => (revalidated[level - 1]?.status ?? evaluation.levels[level - 1]?.status) === 'blocked',
  );
  const summaryStatus: SkillEvaluationStatus =
    hasIllegal ? 'illegal' : hasBlocked ? 'blocked' : 'legal';
  const planState =
    summaryStatus === 'illegal' || summaryStatus === 'blocked'
      ? shellCopyEs.skills.planStates.repair
      : highestConfiguredLevel < highestProgressionLevel
        ? shellCopyEs.skills.planStates.inProgress
        : shellCopyEs.skills.planStates.ready;

  return {
    blockedLevels,
    highestConfiguredLevel,
    planState,
    remainingPoints,
    spentPoints,
    summaryStatus,
  };
}
