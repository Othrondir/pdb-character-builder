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

/**
 * Phase 12.3-01 (D-01) — cost delta of raising `currentValue` by 1 on the
 * point-buy table. Returns null when at/above maximum or when either
 * cost-table key is missing (defensive: out-of-range values should never
 * be bumpable).
 *
 * Framework-agnostic: no React, no store reads. Safe to call from
 * selectors, tests, and UI.
 */
export function nextIncrementCost(
  currentValue: number,
  costByScore: Record<string, number>,
  maximum: number,
): number | null {
  if (currentValue >= maximum) return null;
  const nextValue = currentValue + 1;
  const currentCost = costByScore[String(currentValue)];
  const nextCost = costByScore[String(nextValue)];
  if (currentCost === undefined || nextCost === undefined) return null;
  return nextCost - currentCost;
}

/**
 * Phase 12.3-01 (D-01) — UAT B1 overspend gate. Returns false when the
 * `+` button would push `remainingPoints` negative OR when the attribute
 * is already at maximum. The UI mirrors this at the button's `disabled`
 * prop; the store never rejects setter calls, so UI gating is the single
 * source of truth for the user-driven path.
 */
export function canIncrementAttribute(
  currentValue: number,
  remainingPoints: number,
  costByScore: Record<string, number>,
  maximum: number,
): boolean {
  const nextCost = nextIncrementCost(currentValue, costByScore, maximum);
  if (nextCost === null) return false;
  return remainingPoints - nextCost >= 0;
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
