import { create } from 'zustand';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { CURRENT_DATASET_ID } from '@planner/data/ruleset-version';

import {
  ATTRIBUTE_KEYS,
  phase03FoundationFixture,
  type AttributeKey,
} from './foundation-fixture';

export type BaseAttributes = Record<AttributeKey, number>;

export interface CharacterFoundationStoreState {
  alignmentId: CanonicalId | null;
  baseAttributes: BaseAttributes;
  datasetId: string;
  raceId: CanonicalId | null;
  racialModifiers: Record<AttributeKey, number> | null;
  resetFoundation: () => void;
  setAlignment: (alignmentId: CanonicalId | null) => void;
  setBaseAttribute: (key: AttributeKey, value: number) => void;
  setRace: (raceId: CanonicalId | null) => void;
  setSubrace: (subraceId: CanonicalId | null) => void;
  subraceId: CanonicalId | null;
}

export function createBaseAttributes(): BaseAttributes {
  const baseScore = phase03FoundationFixture.attributeRules.baseScore;

  return ATTRIBUTE_KEYS.reduce((attributes, key) => {
    attributes[key] = baseScore;
    return attributes;
  }, {} as BaseAttributes);
}

function createInitialFoundationState() {
  return {
    alignmentId: null,
    baseAttributes: createBaseAttributes(),
    datasetId: CURRENT_DATASET_ID,
    raceId: null,
    racialModifiers: null as Record<AttributeKey, number> | null,
    subraceId: null,
  };
}

function subraceMatchesRace(
  raceId: CanonicalId | null,
  subraceId: CanonicalId | null,
): boolean {
  if (!raceId || !subraceId) {
    return false;
  }

  return phase03FoundationFixture.subraces.some(
    (subrace) => subrace.id === subraceId && subrace.parentRaceId === raceId,
  );
}

/**
 * Phase 12.2-02 — look up the projected race option's `racialModifiers` by id.
 * Returns null when `raceId` is null or the id does not match any projected
 * race (defensive: the planner's fixture dedupes + projects the full catalog,
 * so misses should not happen in normal flow but must not crash the setter).
 */
function lookupRacialModifiers(
  raceId: CanonicalId | null,
): Record<AttributeKey, number> | null {
  if (!raceId) {
    return null;
  }
  const race = phase03FoundationFixture.races.find((r) => r.id === raceId);
  return race ? { ...race.racialModifiers } : null;
}

export const useCharacterFoundationStore = create<CharacterFoundationStoreState>(
  (set) => ({
    ...createInitialFoundationState(),
    resetFoundation: () => set(createInitialFoundationState()),
    setAlignment: (alignmentId) => set({ alignmentId }),
    setBaseAttribute: (key, value) =>
      set((state) => ({
        baseAttributes: {
          ...state.baseAttributes,
          [key]: value,
        },
      })),
    setRace: (raceId) =>
      set((state) => ({
        raceId,
        racialModifiers: lookupRacialModifiers(raceId),
        subraceId: subraceMatchesRace(raceId, state.subraceId)
          ? state.subraceId
          : null,
      })),
    setSubrace: (subraceId) =>
      set((state) => ({
        subraceId: subraceMatchesRace(state.raceId, subraceId) ? subraceId : null,
      })),
  }),
);
