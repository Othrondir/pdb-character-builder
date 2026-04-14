import type { ValidationOutcome, ValidationStatus } from '../contracts/validation-outcome';
import { resolveValidationOutcome } from '../contracts/validation-outcome';

interface AbilityBudgetRules {
  baseScore: number;
  budget: number;
  costByScore: Record<string, number>;
  maximum: number;
  minimum: number;
}

export interface CalculateAbilityBudgetSnapshotInput {
  attributeRules: AbilityBudgetRules;
  baseAttributes: Record<string, number>;
  originReady: boolean;
}

export interface AbilityBudgetSnapshot {
  issues: ValidationOutcome[];
  remainingPoints: number;
  spentPoints: number;
  status: ValidationStatus;
}

export function calculateAbilityBudgetSnapshot(
  input: CalculateAbilityBudgetSnapshotInput,
): AbilityBudgetSnapshot {
  const issues: ValidationOutcome[] = [];
  const spentPoints = Object.entries(input.baseAttributes).reduce(
    (total, [key, value]) => {
      if (
        value < input.attributeRules.minimum ||
        value > input.attributeRules.maximum ||
        input.attributeRules.costByScore[String(value)] === undefined
      ) {
        issues.push(
          resolveValidationOutcome({
            affectedIds: [`rule:ability-${key}`],
            hasConflict: false,
            hasMissingEvidence: false,
            passesRule: false,
            ruleKnown: true,
          }),
        );
      }

      return total + (input.attributeRules.costByScore[String(value)] ?? 0);
    },
    0,
  );
  const remainingPoints = input.attributeRules.budget - spentPoints;

  if (!input.originReady) {
    issues.push(
      resolveValidationOutcome({
        affectedIds: ['rule:origin-incomplete'],
        blockKind: 'missing-source',
        hasConflict: false,
        hasMissingEvidence: true,
        passesRule: false,
        ruleKnown: true,
      }),
    );
  }

  if (remainingPoints < 0) {
    issues.push(
      resolveValidationOutcome({
        affectedIds: ['rule:ability-budget'],
        hasConflict: false,
        hasMissingEvidence: false,
        passesRule: false,
        ruleKnown: true,
      }),
    );
  }

  const status: ValidationStatus = issues.some((issue) => issue.status === 'illegal')
    ? 'illegal'
    : issues.some((issue) => issue.status === 'blocked')
      ? 'blocked'
      : 'legal';

  return {
    issues,
    remainingPoints,
    spentPoints,
    status,
  };
}
