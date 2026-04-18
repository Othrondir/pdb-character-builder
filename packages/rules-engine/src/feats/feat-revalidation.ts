import type { CanonicalId } from '../contracts/canonical-id';
import {
  type ValidationOutcome,
  resolveValidationOutcome,
} from '../contracts/validation-outcome';
import type { FeatCatalog } from '@data-extractor/contracts/feat-catalog';
import type { ClassCatalog } from '@data-extractor/contracts/class-catalog';
import {
  evaluateFeatPrerequisites,
  type BuildStateAtLevel,
} from './feat-prerequisite';

export type FeatEvaluationStatus = 'legal' | 'illegal' | 'blocked' | 'pending';

export interface RevalidatedFeatLevel {
  inheritedFromLevel: number | null;
  issues: ValidationOutcome[];
  level: number;
  status: FeatEvaluationStatus;
}

export interface FeatLevelInput {
  buildState: BuildStateAtLevel;
  classFeatId: string | null;
  generalFeatId: string | null;
  level: number;
}

function dedupeIssues(issues: ValidationOutcome[]): ValidationOutcome[] {
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

function getInheritedIssue(affectedIds: string[]): ValidationOutcome {
  return resolveValidationOutcome({
    affectedIds,
    blockKind: 'missing-source',
    hasConflict: false,
    hasMissingEvidence: true,
    passesRule: false,
    ruleKnown: true,
  });
}

function createIllegalIssue(affectedIds: string[]): ValidationOutcome {
  return resolveValidationOutcome({
    affectedIds,
    hasConflict: false,
    hasMissingEvidence: false,
    passesRule: false,
    ruleKnown: true,
  });
}

/**
 * Revalidate all feat selections after an upstream change (class, ability, skills).
 * Processes levels sequentially and cascades breaks from illegal levels to later levels.
 * Follows the exact pattern of skill-revalidation.ts.
 */
export function revalidateFeatSnapshotAfterChange(input: {
  levels: FeatLevelInput[];
  featCatalog: FeatCatalog;
  classCatalog: ClassCatalog;
}): RevalidatedFeatLevel[] {
  let inheritedBreakLevel: number | null = null;

  return input.levels.map((levelInput) => {
    const affectedIds: string[] = [];

    if (levelInput.classFeatId) {
      affectedIds.push(levelInput.classFeatId);
    }

    if (levelInput.generalFeatId) {
      affectedIds.push(levelInput.generalFeatId);
    }

    // Pending: no class selected and no feats chosen
    const hasNoClass = Object.keys(levelInput.buildState.classLevels).length === 0;
    const hasNoSelections =
      levelInput.classFeatId === null && levelInput.generalFeatId === null;

    if (hasNoClass && hasNoSelections) {
      return {
        inheritedFromLevel: null,
        issues: [],
        level: levelInput.level,
        status: 'pending' as FeatEvaluationStatus,
      };
    }

    // Evaluate each selected feat's prerequisites
    const issues: ValidationOutcome[] = [];
    let hasIllegal = false;

    if (levelInput.classFeatId) {
      const feat = input.featCatalog.feats.find(
        (f) => f.id === levelInput.classFeatId,
      );

      if (feat) {
        const result = evaluateFeatPrerequisites(
          feat,
          levelInput.buildState,
          input.featCatalog,
          input.classCatalog,
        );

        if (!result.met) {
          hasIllegal = true;
          issues.push(createIllegalIssue([levelInput.classFeatId]));
        }
      }
    }

    if (levelInput.generalFeatId) {
      const feat = input.featCatalog.feats.find(
        (f) => f.id === levelInput.generalFeatId,
      );

      if (feat) {
        const result = evaluateFeatPrerequisites(
          feat,
          levelInput.buildState,
          input.featCatalog,
          input.classCatalog,
        );

        if (!result.met) {
          hasIllegal = true;
          issues.push(createIllegalIssue([levelInput.generalFeatId]));
        }
      }
    }

    // Illegal: own prerequisites failed
    if (hasIllegal) {
      if (inheritedBreakLevel === null) {
        inheritedBreakLevel = levelInput.level;
      }

      return {
        inheritedFromLevel: null,
        issues: dedupeIssues(issues),
        level: levelInput.level,
        status: 'illegal' as FeatEvaluationStatus,
      };
    }

    // Blocked: inherited from an earlier illegal level
    if (inheritedBreakLevel !== null && affectedIds.length > 0) {
      return {
        inheritedFromLevel: inheritedBreakLevel,
        issues: dedupeIssues([getInheritedIssue(affectedIds)]),
        level: levelInput.level,
        status: 'blocked' as FeatEvaluationStatus,
      };
    }

    // Inherited break but no selections at this level
    if (inheritedBreakLevel !== null) {
      return {
        inheritedFromLevel: inheritedBreakLevel,
        issues: [],
        level: levelInput.level,
        status: 'blocked' as FeatEvaluationStatus,
      };
    }

    // Legal: all good
    return {
      inheritedFromLevel: null,
      issues: [],
      level: levelInput.level,
      status: hasNoSelections
        ? ('pending' as FeatEvaluationStatus)
        : ('legal' as FeatEvaluationStatus),
    };
  });
}
