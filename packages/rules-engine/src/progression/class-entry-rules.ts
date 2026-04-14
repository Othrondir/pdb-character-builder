import type { CanonicalId } from '../contracts/canonical-id';
import {
  type ValidationOutcome,
  type ValidationStatus,
  resolveValidationOutcome,
} from '../contracts/validation-outcome';

interface MinimumAbilityScore {
  key: string;
  score: number;
}

interface ImplementedRequirements {
  allowedAlignmentIds?: CanonicalId[];
  minimumAbilityScores?: MinimumAbilityScore[];
  requiresDeity?: boolean;
}

interface ClassEntryRecord {
  deferredRequirementLabels: string[];
  id: CanonicalId;
  implementedRequirements: ImplementedRequirements;
  kind: 'base' | 'prestige';
  label: string;
}

interface FoundationSnapshot {
  alignmentId: CanonicalId | null;
  baseAttributes: Record<string, number>;
  deityId: CanonicalId | null;
}

export interface ClassRequirementRow {
  label: string;
  status: ValidationStatus;
}

export interface ClassEntryEvaluation {
  issues: ValidationOutcome[];
  requirementRows: ClassRequirementRow[];
  summaryStatus: ValidationStatus;
}

export interface CollectVisibleClassOptionView {
  id: CanonicalId;
  kind: 'base' | 'prestige';
  label: string;
  selected: boolean;
  status: ValidationStatus;
}

export interface CollectVisibleClassOptionsInput {
  classes: ClassEntryRecord[];
  foundation: FoundationSnapshot;
  selectedClassId: CanonicalId | null;
}

export interface EvaluateClassEntryInput {
  classRecord: ClassEntryRecord;
  foundation: FoundationSnapshot;
}

const ALIGNMENT_LABELS: Record<string, string> = {
  'alignment:lawful-good': 'Alineamiento: Legal bueno',
};

const ABILITY_LABELS: Record<string, string> = {
  cha: 'CAR',
  con: 'CON',
  dex: 'DES',
  int: 'INT',
  str: 'FUE',
  wis: 'SAB',
};

function pushIssue(
  issues: ValidationOutcome[],
  status: ValidationStatus,
  affectedIds: string[],
) {
  if (status === 'blocked') {
    issues.push(
      resolveValidationOutcome({
        affectedIds,
        blockKind: 'missing-source',
        hasConflict: false,
        hasMissingEvidence: true,
        passesRule: false,
        ruleKnown: true,
      }),
    );
    return;
  }

  issues.push(
    resolveValidationOutcome({
      affectedIds,
      hasConflict: false,
      hasMissingEvidence: false,
      passesRule: false,
      ruleKnown: true,
    }),
  );
}

function getSummaryStatus(issues: ValidationOutcome[]): ValidationStatus {
  if (issues.some((issue) => issue.status === 'illegal')) {
    return 'illegal';
  }

  if (issues.some((issue) => issue.status === 'blocked')) {
    return 'blocked';
  }

  return 'legal';
}

export function evaluateClassEntry(
  input: EvaluateClassEntryInput,
): ClassEntryEvaluation {
  const issues: ValidationOutcome[] = [];
  const requirementRows: ClassRequirementRow[] = [];

  for (const deferredLabel of input.classRecord.deferredRequirementLabels) {
    requirementRows.push({
      label: deferredLabel,
      status: 'blocked',
    });
    pushIssue(issues, 'blocked', [input.classRecord.id]);
  }

  for (const abilityRequirement of input.classRecord.implementedRequirements
    .minimumAbilityScores ?? []) {
    const currentScore = input.foundation.baseAttributes[abilityRequirement.key] ?? 0;
    const status: ValidationStatus =
      currentScore >= abilityRequirement.score ? 'legal' : 'illegal';

    requirementRows.push({
      label: `${ABILITY_LABELS[abilityRequirement.key] ?? abilityRequirement.key.toUpperCase()} ${abilityRequirement.score}`,
      status,
    });

    if (status !== 'legal') {
      pushIssue(issues, status, [input.classRecord.id]);
    }
  }

  if (input.classRecord.implementedRequirements.requiresDeity) {
    const status: ValidationStatus =
      input.foundation.deityId === null
        ? 'blocked'
        : input.foundation.deityId === 'deity:none'
          ? 'illegal'
          : 'legal';

    requirementRows.push({
      label: 'Requiere deidad',
      status,
    });

    if (status !== 'legal') {
      pushIssue(issues, status, [input.classRecord.id]);
    }
  }

  if (input.classRecord.implementedRequirements.allowedAlignmentIds) {
    const alignmentId = input.foundation.alignmentId;
    const status: ValidationStatus =
      alignmentId === null
        ? 'blocked'
        : input.classRecord.implementedRequirements.allowedAlignmentIds.includes(
              alignmentId,
            )
          ? 'legal'
          : 'illegal';

    requirementRows.push({
      label:
        ALIGNMENT_LABELS[
          input.classRecord.implementedRequirements.allowedAlignmentIds[0]
        ] ?? 'Alineamiento válido',
      status,
    });

    if (status !== 'legal') {
      pushIssue(issues, status, [input.classRecord.id]);
    }
  }

  return {
    issues,
    requirementRows,
    summaryStatus: getSummaryStatus(issues),
  };
}

export function collectVisibleClassOptions(
  input: CollectVisibleClassOptionsInput,
): CollectVisibleClassOptionView[] {
  return input.classes.map((classRecord) => {
    const evaluation = evaluateClassEntry({
      classRecord,
      foundation: input.foundation,
    });

    return {
      id: classRecord.id,
      kind: classRecord.kind,
      label: classRecord.label,
      selected: input.selectedClassId === classRecord.id,
      status: evaluation.summaryStatus,
    };
  });
}
