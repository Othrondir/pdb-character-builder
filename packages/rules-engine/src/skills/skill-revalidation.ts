import type { CanonicalId } from '../contracts/canonical-id';
import {
  type ValidationOutcome,
  resolveValidationOutcome,
} from '../contracts/validation-outcome';
import type { SkillCatalog } from '../../data-extractor/src/contracts/skill-catalog';
import {
  evaluateSkillSnapshot,
  type SkillLevelInput,
  type SkillEvaluationStatus,
} from './skill-allocation';

export interface RevalidateSkillSnapshotAfterChangeInput {
  catalog: SkillCatalog;
  levels: SkillLevelInput[];
}

export interface RevalidatedSkillLevel {
  inheritedFromLevel: number | null;
  issues: ValidationOutcome[];
  level: number;
  status: SkillEvaluationStatus;
}

function dedupeIssues(issues: ValidationOutcome[]) {
  const seen = new Set<string>();

  return issues.filter((issue) => {
    const key = JSON.stringify([
      issue.status,
      issue.code,
      [...issue.affectedIds].sort(),
      'blockKind' in issue ? issue.blockKind : null,
    ]);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getInheritedIssue(affectedIds: CanonicalId[]) {
  return resolveValidationOutcome({
    affectedIds,
    blockKind: 'missing-source',
    hasConflict: false,
    hasMissingEvidence: true,
    passesRule: false,
    ruleKnown: true,
  });
}

export function revalidateSkillSnapshotAfterChange(
  input: RevalidateSkillSnapshotAfterChangeInput,
): RevalidatedSkillLevel[] {
  const evaluated = evaluateSkillSnapshot(input);
  let inheritedBreakLevel: number | null = null;

  return input.levels.map((level, index) => {
    const evaluatedLevel = evaluated.levels[index];
    const affectedIds = level.allocations.map((allocation) => allocation.skillId);

    if (!level.classId) {
      return {
        inheritedFromLevel: null,
        issues: [],
        level: level.level,
        status: 'pending',
      };
    }

    if (evaluatedLevel.status === 'illegal') {
      if (inheritedBreakLevel === null) {
        inheritedBreakLevel = level.level;
      }

      return {
        inheritedFromLevel: null,
        issues: dedupeIssues(evaluatedLevel.issues),
        level: level.level,
        status: 'illegal',
      };
    }

    if (evaluatedLevel.status === 'blocked') {
      if (inheritedBreakLevel === null) {
        inheritedBreakLevel = level.level;
      }

      return {
        inheritedFromLevel:
          inheritedBreakLevel === level.level ? null : inheritedBreakLevel,
        issues: dedupeIssues(
          inheritedBreakLevel !== null && inheritedBreakLevel !== level.level
            ? [...evaluatedLevel.issues, getInheritedIssue(affectedIds)]
            : evaluatedLevel.issues,
        ),
        level: level.level,
        status: 'blocked',
      };
    }

    if (inheritedBreakLevel !== null) {
      return {
        inheritedFromLevel: inheritedBreakLevel,
        issues: dedupeIssues([getInheritedIssue(affectedIds)]),
        level: level.level,
        status: 'blocked',
      };
    }

    return {
      inheritedFromLevel: null,
      issues: [],
      level: level.level,
      status: 'legal',
    };
  });
}
