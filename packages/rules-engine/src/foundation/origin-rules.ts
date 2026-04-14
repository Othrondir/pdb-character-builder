import type { CanonicalId } from '../contracts/canonical-id';
import {
  type ValidationOutcome,
  type ValidationStatus,
  resolveValidationOutcome,
} from '../contracts/validation-outcome';

interface RaceRuleRecord {
  allowedAlignmentIds: CanonicalId[];
  deityPolicy: 'optional' | 'required';
  id: CanonicalId;
}

interface SubraceRuleRecord {
  allowedAlignmentIds: CanonicalId[];
  id: CanonicalId;
  parentRaceId: CanonicalId;
}

interface AlignmentRuleRecord {
  id: CanonicalId;
}

interface DeityRuleRecord {
  allowedAlignmentIds: CanonicalId[];
  id: CanonicalId;
}

export interface EvaluateOriginSelectionInput {
  alignmentId: CanonicalId | null;
  alignments: AlignmentRuleRecord[];
  deityId: CanonicalId | null;
  deities: DeityRuleRecord[];
  raceId: CanonicalId | null;
  races: RaceRuleRecord[];
  subraceId: CanonicalId | null;
  subraces: SubraceRuleRecord[];
}

export interface OriginSelectionEvaluation {
  issues: ValidationOutcome[];
  requiredDeityResolved: boolean;
  summaryStatus: ValidationStatus;
}

export function getAllowedSubraces(input: EvaluateOriginSelectionInput) {
  if (!input.raceId) {
    return input.subraces;
  }

  return input.subraces.filter((subrace) => subrace.parentRaceId === input.raceId);
}

export function evaluateOriginSelection(
  input: EvaluateOriginSelectionInput,
): OriginSelectionEvaluation {
  const issues: ValidationOutcome[] = [];
  const race = input.races.find((entry) => entry.id === input.raceId);
  const subrace = input.subraces.find((entry) => entry.id === input.subraceId);
  const alignment = input.alignments.find((entry) => entry.id === input.alignmentId);
  const deity = input.deities.find((entry) => entry.id === input.deityId);

  if (!race || !alignment || !deity) {
    return {
      issues,
      requiredDeityResolved: false,
      summaryStatus: 'blocked',
    };
  }

  if (!race.allowedAlignmentIds.includes(alignment.id)) {
    issues.push(
      resolveValidationOutcome({
        affectedIds: [race.id, alignment.id],
        hasConflict: false,
        hasMissingEvidence: false,
        passesRule: false,
        ruleKnown: true,
      }),
    );
  }

  if (subrace && subrace.parentRaceId !== race.id) {
    issues.push(
      resolveValidationOutcome({
        affectedIds: [race.id, subrace.id],
        hasConflict: false,
        hasMissingEvidence: false,
        passesRule: false,
        ruleKnown: true,
      }),
    );
  }

  if (subrace && !subrace.allowedAlignmentIds.includes(alignment.id)) {
    issues.push(
      resolveValidationOutcome({
        affectedIds: [subrace.id, alignment.id],
        hasConflict: false,
        hasMissingEvidence: false,
        passesRule: false,
        ruleKnown: true,
      }),
    );
  }

  const deityRequired = race.deityPolicy === 'required';
  const requiredDeityResolved = !deityRequired || deity.id !== 'deity:none';

  if (deityRequired && !requiredDeityResolved) {
    issues.push(
      resolveValidationOutcome({
        affectedIds: [race.id, deity.id],
        hasConflict: false,
        hasMissingEvidence: false,
        passesRule: false,
        ruleKnown: true,
      }),
    );
  }

  if (deity.id !== 'deity:none' && !deity.allowedAlignmentIds.includes(alignment.id)) {
    issues.push(
      resolveValidationOutcome({
        affectedIds: [deity.id, alignment.id],
        hasConflict: false,
        hasMissingEvidence: false,
        passesRule: false,
        ruleKnown: true,
      }),
    );
  }

  return {
    issues,
    requiredDeityResolved,
    summaryStatus:
      issues.length > 0
        ? issues.some((issue) => issue.status === 'illegal')
          ? 'illegal'
          : 'blocked'
        : 'legal',
  };
}
