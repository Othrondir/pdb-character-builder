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
  // Phase 14-03 — buildName lives on the foundation store so hydrate can persist
  // `doc.build.name` and project can echo it back. Bounding (max 80 chars) is the
  // persistence boundary's job (build-document-schema.ts), NOT the store's.
  buildName: string | null;
  datasetId: string;
  raceId: CanonicalId | null;
  racialModifiers: Record<AttributeKey, number> | null;
  resetBaseAttributes: () => void;
  resetFoundation: () => void;
  setAlignment: (alignmentId: CanonicalId | null) => void;
  setBaseAttribute: (key: AttributeKey, value: number) => void;
  setBuildName: (name: string | null) => void;
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
    buildName: null as string | null,
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
 * The foundation store keeps only the parent/base race modifiers here. Curated
 * basic-race subrace ability modifiers are delayed until character level 2 and
 * are applied by level-aware selectors in `final-attributes.ts`.
 *
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
  if (!race) {
    return null;
  }

  return { ...race.racialModifiers };
}

export const useCharacterFoundationStore = create<CharacterFoundationStoreState>(
  (set) => ({
    ...createInitialFoundationState(),
    resetBaseAttributes: () => set({ baseAttributes: createBaseAttributes() }),
    resetFoundation: () => set(createInitialFoundationState()),
    setAlignment: (alignmentId) => set({ alignmentId }),
    setBaseAttribute: (key, value) =>
      set((state) => ({
        baseAttributes: {
          ...state.baseAttributes,
          [key]: value,
        },
      })),
    setBuildName: (buildName) => set({ buildName }),
    setRace: (raceId) =>
      set((state) => {
        const subraceId = subraceMatchesRace(raceId, state.subraceId)
          ? state.subraceId
          : null;
        return {
          raceId,
          racialModifiers: lookupRacialModifiers(raceId),
          subraceId,
        };
      }),
    setSubrace: (subraceId) =>
      set((state) => {
        const nextSubraceId = subraceMatchesRace(state.raceId, subraceId)
          ? subraceId
          : null;
        return {
          racialModifiers: lookupRacialModifiers(state.raceId),
          subraceId: nextSubraceId,
        };
      }),
  }),
);
