import type { CanonicalId } from '../contracts/canonical-id';
import {
  type ValidationOutcome,
  type ValidationStatus,
  resolveValidationOutcome,
} from '../contracts/validation-outcome';

interface ExceptionOverrideRecord {
  code: string;
  sourceClassId: CanonicalId;
  targetClassId: CanonicalId;
}

interface MulticlassClassRecord {
  deferredRequirementLabels: string[];
  exceptionOverrides?: ExceptionOverrideRecord[];
  exclusiveClassIds?: CanonicalId[];
  id: CanonicalId;
  minimumClassCommitment?: number;
}

interface MulticlassLevelRecord {
  classId: CanonicalId | null;
  level: number;
}

export interface ApplyExceptionOverridesInput {
  currentClassRecord: MulticlassClassRecord;
  previousClassId: CanonicalId | null;
}

export interface ApplyExceptionOverridesResult {
  appliedCodes: string[];
  issues: ValidationOutcome[];
}

export interface EvaluateMulticlassLegalityInput {
  classRecord: MulticlassClassRecord;
  classes: MulticlassClassRecord[];
  level: number;
  levels: MulticlassLevelRecord[];
}

export interface MulticlassLegalityResult {
  appliedOverrides: string[];
  issues: ValidationOutcome[];
  summaryStatus: ValidationStatus;
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

function getPriorLevels(
  levels: MulticlassLevelRecord[],
  level: number,
): MulticlassLevelRecord[] {
  return levels.filter((record) => record.level < level && record.classId !== null);
}

function getImmediatePreviousRecord(
  levels: MulticlassLevelRecord[],
  level: number,
) {
  return levels.find((record) => record.level === level - 1) ?? null;
}

function countCommittedLevels(
  levels: MulticlassLevelRecord[],
  level: number,
  classId: CanonicalId,
) {
  let committedLevels = 0;

  for (let currentLevel = level - 1; currentLevel >= 1; currentLevel -= 1) {
    const record = levels.find((entry) => entry.level === currentLevel) ?? null;

    if (!record || record.classId !== classId) {
      break;
    }

    committedLevels += 1;
  }

  return committedLevels;
}

export function applyExceptionOverrides(
  input: ApplyExceptionOverridesInput,
): ApplyExceptionOverridesResult {
  const overrides =
    input.currentClassRecord.exceptionOverrides?.filter(
      (override) =>
        override.sourceClassId === input.previousClassId &&
        override.targetClassId === input.currentClassRecord.id,
    ) ?? [];

  return {
    appliedCodes: overrides.map((override) => override.code),
    issues: overrides.map((override) =>
      resolveValidationOutcome({
        affectedIds: [override.sourceClassId, override.targetClassId],
        hasConflict: false,
        hasMissingEvidence: false,
        passesRule: true,
        ruleKnown: true,
      }),
    ),
  };
}

export function evaluateMulticlassLegality(
  input: EvaluateMulticlassLegalityInput,
): MulticlassLegalityResult {
  const issues: ValidationOutcome[] = [];
  const priorLevels = getPriorLevels(input.levels, input.level);

  for (const deferredLabel of input.classRecord.deferredRequirementLabels) {
    void deferredLabel;
    issues.push(
      resolveValidationOutcome({
        affectedIds: [input.classRecord.id],
        blockKind: 'missing-source',
        hasConflict: false,
        hasMissingEvidence: true,
        passesRule: false,
        ruleKnown: true,
      }),
    );
  }

  const previousRecord = getImmediatePreviousRecord(input.levels, input.level);
  const previousClassRecord =
    input.classes.find((record) => record.id === previousRecord?.classId) ?? null;
  const overrideResult = applyExceptionOverrides({
    currentClassRecord: input.classRecord,
    previousClassId: previousClassRecord?.id ?? null,
  });

  if (
    previousClassRecord &&
    previousClassRecord.id !== input.classRecord.id &&
    previousClassRecord.minimumClassCommitment
  ) {
    const committedLevels = countCommittedLevels(
      input.levels,
      input.level,
      previousClassRecord.id,
    );

    if (
      committedLevels < previousClassRecord.minimumClassCommitment &&
      overrideResult.appliedCodes.length === 0
    ) {
      issues.push(
        resolveValidationOutcome({
          affectedIds: [previousClassRecord.id, input.classRecord.id],
          hasConflict: false,
          hasMissingEvidence: false,
          passesRule: false,
          ruleKnown: true,
        }),
      );
    }
  }

  const isExclusiveByCurrent = Boolean(
    input.classRecord.exclusiveClassIds?.some((exclusiveClassId) =>
      priorLevels.some((record) => record.classId === exclusiveClassId),
    ),
  );
  const isExclusiveByHistory = priorLevels.some((record) => {
    const priorClassRecord =
      input.classes.find((classRecord) => classRecord.id === record.classId) ?? null;

    return Boolean(
      priorClassRecord?.exclusiveClassIds?.includes(input.classRecord.id),
    );
  });

  if (isExclusiveByCurrent || isExclusiveByHistory) {
    issues.push(
      resolveValidationOutcome({
        affectedIds: [input.classRecord.id],
        hasConflict: false,
        hasMissingEvidence: false,
        passesRule: false,
        ruleKnown: true,
      }),
    );
  }

  return {
    appliedOverrides: overrideResult.appliedCodes,
    issues: [...issues, ...overrideResult.issues],
    summaryStatus: getSummaryStatus(issues),
  };
}
