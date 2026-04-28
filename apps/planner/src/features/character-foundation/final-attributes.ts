import { applyRaceModifiers } from '@rules-engine/foundation/apply-race-modifiers';

import { ATTRIBUTE_KEYS, type AttributeKey } from './foundation-fixture';
import type { BaseAttributes } from './store';

type AbilityIncreaseRecord = {
  abilityIncrease: AttributeKey | null;
};

export type FinalAttributeTotals = Record<AttributeKey, number>;

function createEmptyAttributeTotals(): FinalAttributeTotals {
  return ATTRIBUTE_KEYS.reduce((totals, key) => {
    totals[key] = 0;
    return totals;
  }, {} as FinalAttributeTotals);
}

export function computeAbilityIncreaseTotals(
  levels: readonly AbilityIncreaseRecord[],
): FinalAttributeTotals {
  const totals = createEmptyAttributeTotals();
  for (const record of levels) {
    if (record.abilityIncrease) {
      totals[record.abilityIncrease] += 1;
    }
  }
  return totals;
}

export function computeFinalAttributeTotals(
  baseAttributes: BaseAttributes,
  racialModifiers: Record<AttributeKey, number> | null,
  levels: readonly AbilityIncreaseRecord[],
): FinalAttributeTotals {
  const totals = applyRaceModifiers(baseAttributes, racialModifiers);
  const levelBonuses = computeAbilityIncreaseTotals(levels);
  for (const key of ATTRIBUTE_KEYS) {
    totals[key] += levelBonuses[key];
  }
  return totals;
}
