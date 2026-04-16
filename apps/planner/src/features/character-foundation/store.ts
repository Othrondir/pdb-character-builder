import { create } from 'zustand';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import {
  ATTRIBUTE_KEYS,
  FOUNDATION_DATASET_ID,
  phase03FoundationFixture,
  type AttributeKey,
} from './foundation-fixture';

export type BaseAttributes = Record<AttributeKey, number>;

export interface CharacterFoundationStoreState {
  alignmentId: CanonicalId | null;
  baseAttributes: BaseAttributes;
  datasetId: string;
  raceId: CanonicalId | null;
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
    datasetId: FOUNDATION_DATASET_ID,
    raceId: null,
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
