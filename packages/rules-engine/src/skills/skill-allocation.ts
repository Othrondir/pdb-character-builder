import type { CanonicalId } from '../contracts/canonical-id';
import {
  type ValidationOutcome,
  resolveValidationOutcome,
} from '../contracts/validation-outcome';
import type {
  SkillCatalog,
  SkillRestrictionOverride,
} from '@data-extractor/contracts/skill-catalog';
import { getSkillPointBudget, getSkillPointCarryover } from './skill-budget';

export type SkillEvaluationStatus = 'blocked' | 'illegal' | 'legal' | 'pending';
export type SkillCostType = 'class' | 'cross-class';
export type ArmorCategory = 'light' | 'medium' | 'heavy' | null;

export interface SkillAllocationEntry {
  rank: number;
  skillId: CanonicalId;
}

export interface SkillLevelInput {
  allocations: SkillAllocationEntry[];
  armorCategory?: ArmorCategory;
  bonusSkillPointsPerLevel?: number;
  classId: CanonicalId | null;
  intelligenceModifier: number;
  level: number;
  skillPointsBase: number;
}

export interface EvaluateSkillLevelInput {
  catalog: SkillCatalog;
  carriedPoints?: number;
  cumulativeRanks: Partial<Record<CanonicalId, number>>;
  level: SkillLevelInput;
}

export interface EvaluateSkillSnapshotInput {
  catalog: SkillCatalog;
  levels: SkillLevelInput[];
}

export interface EvaluatedSkillAllocation {
  cap: number;
  costType: SkillCostType;
  issues: ValidationOutcome[];
  rank: number;
  resultingRank: number;
  skillId: CanonicalId;
  spentPoints: number;
  status: SkillEvaluationStatus;
}

export interface EvaluatedSkillLevel {
  allocations: EvaluatedSkillAllocation[];
  availablePoints: number;
  issues: ValidationOutcome[];
  level: number;
  remainingPoints: number;
  spentPoints: number;
  status: SkillEvaluationStatus;
}

export interface EvaluatedSkillSnapshot {
  levels: EvaluatedSkillLevel[];
}

function getStatusFromIssues(issues: ValidationOutcome[]): Exclude<SkillEvaluationStatus, 'pending'> {
  if (issues.some((issue) => issue.status === 'illegal')) {
    return 'illegal';
  }

  if (issues.some((issue) => issue.status === 'blocked')) {
    return 'blocked';
  }

  return 'legal';
}

function createBlockedIssue(
  affectedIds: CanonicalId[],
  evidence: SkillRestrictionOverride['provenance'],
) {
  return resolveValidationOutcome({
    affectedIds,
    blockKind: 'missing-source',
    evidence: evidence.map((entry) => ({
      evidenceId: entry.evidence,
      label: entry.note,
      layer:
        entry.source === 'manual-override'
          ? 'manual-override'
          : entry.source === 'puerta-snapshot'
            ? 'puerta-snapshot'
            : 'base-game',
    })),
    hasConflict: false,
    hasMissingEvidence: true,
    passesRule: false,
    ruleKnown: true,
  });
}

function createIllegalIssue(affectedIds: CanonicalId[]) {
  return resolveValidationOutcome({
    affectedIds,
    hasConflict: false,
    hasMissingEvidence: false,
    passesRule: false,
    ruleKnown: true,
  });
}

function getAvailablePoints(level: SkillLevelInput, carriedPoints = 0) {
  return getSkillPointBudget({
    bonusSkillPointsPerLevel: level.bonusSkillPointsPerLevel,
    carriedPoints,
    intelligenceModifier: level.intelligenceModifier,
    level: level.level,
    skillPointsBase: level.skillPointsBase,
  });
}

function getCostType(skillId: CanonicalId, classId: CanonicalId, catalog: SkillCatalog) {
  const skill = catalog.skills.find((entry) => entry.id === skillId) ?? null;

  if (!skill) {
    return null;
  }

  return skill.defaultClassIds.includes(classId) ? 'class' : 'cross-class';
}

function getCap(level: number, costType: SkillCostType) {
  return costType === 'class' ? level + 3 : (level + 3) / 2;
}

function getSpentPoints(rank: number, costType: SkillCostType) {
  return costType === 'class' ? rank : rank * 2;
}

function getApplicableOverrides(
  catalog: SkillCatalog,
  skillId: CanonicalId,
  level: SkillLevelInput,
) {
  return catalog.restrictionOverrides.filter((override) => {
    if (override.skillId !== skillId) {
      return false;
    }

    if (
      override.condition?.armorCategory &&
      override.condition.armorCategory !== level.armorCategory
    ) {
      return false;
    }

    if (
      override.affectedClassIds &&
      level.classId &&
      !override.affectedClassIds.includes(level.classId)
    ) {
      return false;
    }

    return true;
  });
}

export function evaluateSkillLevel(
  input: EvaluateSkillLevelInput,
): EvaluatedSkillLevel {
  if (!input.level.classId) {
    return {
      allocations: [],
      availablePoints: 0,
      issues: [],
      level: input.level.level,
      remainingPoints: 0,
      spentPoints: 0,
      status: 'pending',
    };
  }

  const classId = input.level.classId;

  const allocations: EvaluatedSkillAllocation[] = input.level.allocations.map(
    (allocation): EvaluatedSkillAllocation => {
    const skillRecord =
      input.catalog.skills.find((entry) => entry.id === allocation.skillId) ?? null;

    if (!skillRecord) {
      const issues = [
        resolveValidationOutcome({
          affectedIds: [allocation.skillId],
          blockKind: 'unsupported',
          hasConflict: false,
          hasMissingEvidence: false,
          passesRule: false,
          ruleKnown: false,
        }),
      ];

      return {
        cap: 0,
        costType: 'class' as const,
        issues,
        rank: allocation.rank,
        resultingRank: 0,
        skillId: allocation.skillId,
        spentPoints: 0,
        status: 'blocked' as const,
      };
    }

    const costType = getCostType(
      allocation.skillId,
      classId,
      input.catalog,
    );

    if (!costType) {
      const issues = [
        resolveValidationOutcome({
          affectedIds: [allocation.skillId],
          blockKind: 'unsupported',
          hasConflict: false,
          hasMissingEvidence: false,
          passesRule: false,
          ruleKnown: false,
        }),
      ];

      return {
        cap: 0,
        costType: 'class' as const,
        issues,
        rank: allocation.rank,
        resultingRank: 0,
        skillId: allocation.skillId,
        spentPoints: 0,
        status: 'blocked' as const,
      };
    }

    const previousRank = input.cumulativeRanks[allocation.skillId] ?? 0;
    const resultingRank = previousRank + allocation.rank;
    const cap = getCap(input.level.level, costType);
    const spentPoints = getSpentPoints(allocation.rank, costType);
    const issues: ValidationOutcome[] = [];

    if (allocation.rank <= 0) {
      issues.push(createIllegalIssue([allocation.skillId]));
    }

    const rankStep = costType === 'class' ? 1 : 0.5;
    const normalizedRank = Math.round(allocation.rank / rankStep) * rankStep;

    if (Math.abs(normalizedRank - allocation.rank) > 0.001) {
      issues.push(createIllegalIssue([allocation.skillId]));
    }

    if (resultingRank > cap) {
      issues.push(createIllegalIssue([allocation.skillId]));
    }

    for (const override of getApplicableOverrides(
      input.catalog,
      allocation.skillId,
      input.level,
    )) {
      issues.push(createBlockedIssue([allocation.skillId], override.provenance));
    }

    return {
      cap,
      costType,
      issues,
      rank: allocation.rank,
      resultingRank,
      skillId: allocation.skillId,
      spentPoints,
      status: getStatusFromIssues(issues),
    };
    },
  );

  const spentPoints = allocations.reduce(
    (total, allocation) => total + allocation.spentPoints,
    0,
  );
  const availablePoints = getAvailablePoints(
    input.level,
    getSkillPointCarryover(input.carriedPoints ?? 0),
  );
  const issues = allocations.flatMap((allocation) => allocation.issues);

  if (spentPoints > availablePoints) {
    issues.push(
      createIllegalIssue(
        allocations.map((allocation) => allocation.skillId) as CanonicalId[],
      ),
    );
  }

  return {
    allocations,
    availablePoints,
    issues,
    level: input.level.level,
    remainingPoints: availablePoints - spentPoints,
    spentPoints,
    status: issues.length === 0 ? 'legal' : getStatusFromIssues(issues),
  };
}

export function evaluateSkillSnapshot(
  input: EvaluateSkillSnapshotInput,
): EvaluatedSkillSnapshot {
  const cumulativeRanks: Partial<Record<CanonicalId, number>> = {};
  let previousRemainingPoints = 0;
  let previousStatus: SkillEvaluationStatus = 'pending';
  const levels = input.levels.map((level) => {
    const carriedPoints =
      previousStatus === 'legal' ? getSkillPointCarryover(previousRemainingPoints) : 0;
    const evaluatedLevel = evaluateSkillLevel({
      catalog: input.catalog,
      carriedPoints,
      cumulativeRanks,
      level,
    });

    for (const allocation of level.allocations) {
      cumulativeRanks[allocation.skillId] =
        (cumulativeRanks[allocation.skillId] ?? 0) + allocation.rank;
    }

    previousRemainingPoints = evaluatedLevel.remainingPoints;
    previousStatus = evaluatedLevel.status;

    return evaluatedLevel;
  });

  return { levels };
}
