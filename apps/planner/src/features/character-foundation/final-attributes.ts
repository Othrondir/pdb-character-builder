import { applyRaceModifiers } from '@rules-engine/foundation/apply-race-modifiers';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import {
  ATTRIBUTE_KEYS,
  phase03FoundationFixture,
  type AttributeKey,
} from './foundation-fixture';
import type { BaseAttributes } from './store';

type AbilityIncreaseRecord = {
  abilityIncrease: AttributeKey | null;
  classId?: string | null;
  level?: number;
};

export type FinalAttributeTotals = Record<AttributeKey, number>;

export type RacialModifierTiming = {
  characterLevel?: number;
  raceId?: CanonicalId | null;
  subraceId?: CanonicalId | null;
};

function createEmptyAttributeTotals(): FinalAttributeTotals {
  return ATTRIBUTE_KEYS.reduce((totals, key) => {
    totals[key] = 0;
    return totals;
  }, {} as FinalAttributeTotals);
}

function createZeroAttributeModifiers(): FinalAttributeTotals {
  return createEmptyAttributeTotals();
}

function addAttributeModifiers(
  first: Record<AttributeKey, number>,
  second: Record<AttributeKey, number>,
): FinalAttributeTotals {
  const combined = createZeroAttributeModifiers();
  for (const key of ATTRIBUTE_KEYS) {
    combined[key] = first[key] + second[key];
  }
  return combined;
}

function findSubraceModifiers(
  raceId: CanonicalId | null | undefined,
  subraceId: CanonicalId | null | undefined,
): Record<AttributeKey, number> | null {
  if (!raceId || !subraceId) {
    return null;
  }

  const subrace =
    phase03FoundationFixture.subraces.find(
      (entry) => entry.id === subraceId && entry.parentRaceId === raceId,
    ) ?? null;

  return subrace ? subrace.racialModifiers : null;
}

function inferCharacterLevel(
  levels: readonly AbilityIncreaseRecord[],
): number {
  let configuredLevel = 1;

  for (const record of levels) {
    if (
      record.level != null &&
      (record.classId != null || record.abilityIncrease != null)
    ) {
      configuredLevel = Math.max(configuredLevel, record.level);
    }
  }

  return configuredLevel;
}

export function computeEffectiveRacialModifiersAtLevel(
  baseRaceModifiers: Record<AttributeKey, number> | null,
  timing: RacialModifierTiming = {},
): Record<AttributeKey, number> | null {
  if (baseRaceModifiers == null) {
    return null;
  }

  const characterLevel = timing.characterLevel ?? 1;
  const subraceModifiers =
    characterLevel >= 2
      ? findSubraceModifiers(timing.raceId, timing.subraceId)
      : null;

  return subraceModifiers
    ? addAttributeModifiers(baseRaceModifiers, subraceModifiers)
    : { ...baseRaceModifiers };
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
  timing: RacialModifierTiming = {},
): FinalAttributeTotals {
  const effectiveRacialModifiers = computeEffectiveRacialModifiersAtLevel(
    racialModifiers,
    {
      ...timing,
      characterLevel: timing.characterLevel ?? inferCharacterLevel(levels),
    },
  );
  const totals = applyRaceModifiers(baseAttributes, effectiveRacialModifiers);
  const levelBonuses = computeAbilityIncreaseTotals(levels);
  for (const key of ATTRIBUTE_KEYS) {
    totals[key] += levelBonuses[key];
  }
  return totals;
}
