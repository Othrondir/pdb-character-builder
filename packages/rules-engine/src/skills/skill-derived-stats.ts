import type { CanonicalId } from '../contracts/canonical-id';
import type { ValidationOutcome } from '../contracts/validation-outcome';
import type { SkillCatalog } from '@data-extractor/contracts/skill-catalog';
import type {
  EvaluatedSkillAllocation,
  EvaluatedSkillLevel,
  SkillCostType,
  SkillEvaluationStatus,
  SkillLevelInput,
} from './skill-allocation';
import type { RevalidatedSkillLevel } from './skill-revalidation';

export interface SkillStatsTotal {
  key: 'allocatedSkills' | 'availablePoints' | 'remainingPoints' | 'spentPoints';
  value: number;
}

export interface SkillStatsCapCostRow {
  cap: number;
  costType: SkillCostType;
  currentRank: number;
  currentTotal: number;
  label: string;
  maxAssignableRank: number;
  nextCost: number;
  skillId: CanonicalId;
  status: SkillEvaluationStatus;
}

export interface SkillStatsPenalty {
  issue: ValidationOutcome;
  key: string;
  skillId: CanonicalId | null;
  source: 'allocation' | 'level' | 'repair';
  status: SkillEvaluationStatus;
}

export interface SkillStatsView {
  capsAndCosts: SkillStatsCapCostRow[];
  penalties: SkillStatsPenalty[];
  status: SkillEvaluationStatus;
  totals: SkillStatsTotal[];
}

function getCap(level: number, costType: SkillCostType) {
  return costType === 'class' ? level + 3 : (level + 3) / 2;
}

function getNextCost(costType: SkillCostType) {
  return costType === 'class' ? 1 : 1;
}

function getCurrentRank(
  levelInput: SkillLevelInput,
  allocation: EvaluatedSkillAllocation | null,
  skillId: CanonicalId,
) {
  if (allocation) {
    return allocation.rank;
  }

  return (
    levelInput.allocations.find((entry) => entry.skillId === skillId)?.rank ?? 0
  );
}

function buildCapCostRow(
  catalog: SkillCatalog,
  levelInput: SkillLevelInput,
  allocation: EvaluatedSkillAllocation | null,
  skillId: CanonicalId,
): SkillStatsCapCostRow | null {
  const skillRecord = catalog.skills.find((entry) => entry.id === skillId) ?? null;

  if (!skillRecord || !levelInput.classId) {
    return null;
  }

  const costType =
    allocation?.costType ??
    (skillRecord.defaultClassIds.includes(levelInput.classId) ? 'class' : 'cross-class');
  const currentRank = getCurrentRank(levelInput, allocation, skillId);
  const currentTotal =
    allocation?.resultingRank ??
    (levelInput.allocations
      .filter((entry) => entry.skillId === skillId)
      .reduce((total, entry) => total + entry.rank, 0));
  const priorTotal = currentTotal - currentRank;
  const cap = allocation?.cap ?? getCap(levelInput.level, costType);

  return {
    cap,
    costType,
    currentRank,
    currentTotal,
    label: skillRecord.label,
    maxAssignableRank: Math.max(0, cap - priorTotal),
    nextCost: getNextCost(costType),
    skillId,
    status: allocation?.status ?? 'pending',
  };
}

function buildPenaltyKey(
  source: SkillStatsPenalty['source'],
  skillId: CanonicalId | null,
  issue: ValidationOutcome,
  index: number,
) {
  return [
    source,
    skillId ?? 'level',
    issue.code,
    issue.status,
    index,
  ].join(':');
}

export function deriveSkillStatsView(input: {
  catalog: SkillCatalog;
  evaluatedLevel: EvaluatedSkillLevel;
  levelInput: SkillLevelInput;
  revalidatedLevel: RevalidatedSkillLevel | null;
}): SkillStatsView {
  const capsAndCosts = input.catalog.skills
    .map((skill) =>
      buildCapCostRow(
        input.catalog,
        input.levelInput,
        input.evaluatedLevel.allocations.find((entry) => entry.skillId === skill.id) ?? null,
        skill.id as CanonicalId,
      ),
    )
    .filter((row): row is SkillStatsCapCostRow => row !== null)
    .sort((left, right) => left.label.localeCompare(right.label));

  const penalties: SkillStatsPenalty[] = [];

  input.evaluatedLevel.allocations.forEach((allocation) => {
    allocation.issues.forEach((issue, index) => {
      penalties.push({
        issue,
        key: buildPenaltyKey('allocation', allocation.skillId, issue, index),
        skillId: allocation.skillId,
        source: 'allocation',
        status: allocation.status,
      });
    });
  });

  input.evaluatedLevel.issues.forEach((issue, index) => {
    penalties.push({
      issue,
      key: buildPenaltyKey('level', null, issue, index),
      skillId: (issue.affectedIds[0] as CanonicalId | undefined) ?? null,
      source: 'level',
      status: input.evaluatedLevel.status,
    });
  });

  input.revalidatedLevel?.issues.forEach((issue, index) => {
    penalties.push({
      issue,
      key: buildPenaltyKey(
        'repair',
        (issue.affectedIds[0] as CanonicalId | undefined) ?? null,
        issue,
        index,
      ),
      skillId: (issue.affectedIds[0] as CanonicalId | undefined) ?? null,
      source: 'repair',
      status: input.revalidatedLevel?.status ?? 'blocked',
    });
  });

  return {
    capsAndCosts,
    penalties,
    status: input.revalidatedLevel?.status ?? input.evaluatedLevel.status,
    totals: [
      {
        key: 'availablePoints',
        value: input.evaluatedLevel.availablePoints,
      },
      {
        key: 'spentPoints',
        value: input.evaluatedLevel.spentPoints,
      },
      {
        key: 'remainingPoints',
        value: input.evaluatedLevel.remainingPoints,
      },
      {
        key: 'allocatedSkills',
        value: input.evaluatedLevel.allocations.filter((entry) => entry.rank > 0).length,
      },
    ],
  };
}
