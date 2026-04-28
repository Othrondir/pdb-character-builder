import type { ValidationOutcome, ValidationStatus } from '../contracts/validation-outcome';
import { resolveValidationOutcome } from '../contracts/validation-outcome';

// Phase 12.6 (Rule 2 auto-fix) — `baseScore` was declared here but never
// consumed by any function in this module. It lived on the planner-side
// fixture's `AttributeRules` type (foundation-fixture.ts:45) and was read
// by `createBaseAttributes` in the store. Removing it from the rules-engine
// interface lets `PointBuyCurve` (which has no baseScore) satisfy this
// contract structurally, preserving the plan's "per-race selector threads
// the snapshot output into the existing helpers" boundary.
export interface AbilityBudgetRules {
  budget: number;
  costByScore: Record<string, number>;
  maximum: number;
  minimum: number;
}

export interface CalculateAbilityBudgetSnapshotInput {
  attributeRules: AbilityBudgetRules | null;
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

/**
 * Phase 17 (ATTR-02 D-02) — NWN1 hardcoded engine point-buy cost step.
 *
 * Source-of-truth: NWN1 EE engine binary (not 2DA-driven). User-confirmed
 * 2026-04-20 in-game verification. See git history of
 * `packages/rules-engine/src/foundation/data/puerta-point-buy.md § "Plan 06
 * Source Resolution"` (deleted in Phase 17 Wave 3; commit `bf55129` and
 * earlier 12.6 commits preserve the provenance text).
 *
 * Bands: 1:1 from 8→14 (6 pts), 2:1 from 14→16 (4 pts), 3:1 from 16→18 (6 pts).
 * Total 8→18 = 16 cost.
 */
export const NWN1_POINT_BUY_COST_TABLE = {
  minimum: 8,
  maximum: 18,
  costByScore: {
    '8': 0, '9': 1, '10': 2, '11': 3, '12': 4, '13': 5,
    '14': 6, '15': 8, '16': 10, '17': 13, '18': 16,
  },
} as const satisfies {
  minimum: number;
  maximum: number;
  costByScore: Record<string, number>;
};

/**
 * Phase 17 (ATTR-02 D-02a) — compose race + cost-table → AbilityBudgetRules
 * or null. Pure, framework-agnostic. Selector composes the call.
 *
 * Returns null when race.abilitiesPointBuyNumber is null/undefined,
 * preserving Phase 12.6 D-05 fail-closed contract for rule:point-buy-missing
 * via calculateAbilityBudgetSnapshot's null branch.
 *
 * Input type is structural — does NOT import CompiledRace from
 * @data-extractor. Selector at planner edge enforces type compatibility.
 * Mirrors Phase 16-02 B-01 architectural decision.
 */
export function deriveAbilityBudgetRules(
  race: { abilitiesPointBuyNumber: number | null | undefined },
  costTable: {
    minimum: number;
    maximum: number;
    costByScore: Record<string, number>;
  } = NWN1_POINT_BUY_COST_TABLE,
): AbilityBudgetRules | null {
  if (race.abilitiesPointBuyNumber == null) return null;
  return {
    budget: race.abilitiesPointBuyNumber,
    minimum: costTable.minimum,
    maximum: costTable.maximum,
    costByScore: costTable.costByScore,
  };
}

export function calculateAbilityBudgetSnapshot(
  input: CalculateAbilityBudgetSnapshotInput,
): AbilityBudgetSnapshot {
  // Phase 12.6 (D-05, ATTR-01 R3) — fail-closed: no point-buy curve → block.
  if (input.attributeRules === null) {
    return {
      issues: [
        resolveValidationOutcome({
          affectedIds: ['rule:point-buy-missing'],
          blockKind: 'missing-source',
          hasConflict: false,
          hasMissingEvidence: true,
          passesRule: false,
          ruleKnown: true,
        }),
      ],
      remainingPoints: 0,
      spentPoints: 0,
      status: 'blocked',
    };
  }

  // Local non-null binding so the closure below narrows correctly after the
  // fail-closed early-return above.
  const attributeRules = input.attributeRules;
  const issues: ValidationOutcome[] = [];
  const spentPoints = Object.entries(input.baseAttributes).reduce(
    (total, [key, value]) => {
      if (
        value < attributeRules.minimum ||
        value > attributeRules.maximum ||
        attributeRules.costByScore[String(value)] === undefined
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

      return total + (attributeRules.costByScore[String(value)] ?? 0);
    },
    0,
  );
  const remainingPoints = attributeRules.budget - spentPoints;

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
