import type { CanonicalId } from '../contracts/canonical-id';
import {
  type ValidationOutcome,
  resolveValidationOutcome,
} from '../contracts/validation-outcome';

import { evaluateClassEntry } from './class-entry-rules';
import { evaluateMulticlassLegality } from './multiclass-rules';

interface MinimumAbilityScore {
  key: string;
  score: number;
}

interface ImplementedRequirements {
  allowedAlignmentIds?: CanonicalId[];
  minimumAbilityScores?: MinimumAbilityScore[];
  requiresDeity?: boolean;
}

interface ExceptionOverrideRecord {
  code: string;
  sourceClassId: CanonicalId;
  targetClassId: CanonicalId;
}

interface RevalidationClassRecord {
  deferredRequirementLabels: string[];
  exceptionOverrides?: ExceptionOverrideRecord[];
  exclusiveClassIds?: CanonicalId[];
  id: CanonicalId;
  implementedRequirements: ImplementedRequirements;
  kind: 'base' | 'prestige';
  label: string;
  minimumClassCommitment?: number;
}

interface FoundationSnapshot {
  alignmentId: CanonicalId | null;
  baseAttributes: Record<string, number>;
  deityId: CanonicalId | null;
}

interface ProgressionLevelRecord {
  classId: CanonicalId | null;
  level: number;
}

export interface RevalidateProgressionAfterLevelChangeInput {
  classes: RevalidationClassRecord[];
  foundation: FoundationSnapshot;
  levels: ProgressionLevelRecord[];
}

export interface RevalidatedProgressionLevel {
  inheritedFromLevel: number | null;
  issues: ValidationOutcome[];
  level: number;
  status: 'blocked' | 'illegal' | 'legal' | 'pending';
}

function dedupeIssues(issues: ValidationOutcome[]) {
  const seen = new Set<string>();

  return issues.filter((issue) => {
    const issueKey = JSON.stringify([
      issue.status,
      issue.code,
      [...issue.affectedIds].sort(),
      'blockKind' in issue ? issue.blockKind : null,
    ]);

    if (seen.has(issueKey)) {
      return false;
    }

    seen.add(issueKey);
    return true;
  });
}

function getOwnStatus(issues: ValidationOutcome[]) {
  if (issues.some((issue) => issue.status === 'illegal')) {
    return 'illegal' as const;
  }

  if (issues.some((issue) => issue.status === 'blocked')) {
    return 'blocked' as const;
  }

  return 'legal' as const;
}

function getInheritedIssue(classId: CanonicalId) {
  return resolveValidationOutcome({
    affectedIds: [classId],
    blockKind: 'missing-source',
    hasConflict: false,
    hasMissingEvidence: true,
    passesRule: false,
    ruleKnown: true,
  });
}

function getEarliestMissingLevel(
  levels: ProgressionLevelRecord[],
  currentLevel: number,
) {
  return (
    levels.find((record) => record.level < currentLevel && record.classId === null)
      ?.level ?? null
  );
}

export function revalidateProgressionAfterLevelChange(
  input: RevalidateProgressionAfterLevelChangeInput,
): RevalidatedProgressionLevel[] {
  let inheritedBreakLevel: number | null = null;

  return input.levels.map((record) => {
    if (!record.classId) {
      return {
        inheritedFromLevel: null,
        issues: [],
        level: record.level,
        status: 'pending',
      };
    }

    const classRecord =
      input.classes.find((candidate) => candidate.id === record.classId) ?? null;

    if (!classRecord) {
      const issues = [
        resolveValidationOutcome({
          affectedIds: [record.classId],
          blockKind: 'unsupported',
          hasConflict: false,
          hasMissingEvidence: false,
          passesRule: false,
          ruleKnown: false,
        }),
      ];

      if (inheritedBreakLevel === null) {
        inheritedBreakLevel = record.level;
      }

      return {
        inheritedFromLevel: null,
        issues,
        level: record.level,
        status: 'blocked',
      };
    }

    const entryEvaluation = evaluateClassEntry({
      classRecord,
      foundation: input.foundation,
    });
    const multiclassEvaluation = evaluateMulticlassLegality({
      classRecord,
      classes: input.classes,
      level: record.level,
      levels: input.levels,
    });
    const ownIssues = dedupeIssues([
      ...entryEvaluation.issues,
      ...multiclassEvaluation.issues,
    ]);
    const ownStatus = getOwnStatus(ownIssues);
    const firstMissingLevel = getEarliestMissingLevel(input.levels, record.level);
    const inheritedFromLevel = firstMissingLevel ?? inheritedBreakLevel;

    if (ownStatus === 'illegal') {
      if (inheritedBreakLevel === null) {
        inheritedBreakLevel = record.level;
      }

      return {
        inheritedFromLevel: null,
        issues: ownIssues,
        level: record.level,
        status: 'illegal',
      };
    }

    if (ownStatus === 'blocked') {
      if (inheritedBreakLevel === null) {
        inheritedBreakLevel = record.level;
      }

      return {
        inheritedFromLevel,
        issues:
          inheritedFromLevel !== null && inheritedFromLevel !== record.level
            ? dedupeIssues([...ownIssues, getInheritedIssue(record.classId)])
            : ownIssues,
        level: record.level,
        status: 'blocked',
      };
    }

    if (inheritedFromLevel !== null) {
      if (inheritedBreakLevel === null) {
        inheritedBreakLevel = inheritedFromLevel;
      }

      return {
        inheritedFromLevel,
        issues: [getInheritedIssue(record.classId)],
        level: record.level,
        status: 'blocked',
      };
    }

    return {
      inheritedFromLevel: null,
      issues: ownIssues,
      level: record.level,
      status: 'legal',
    };
  });
}
