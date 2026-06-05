import { beforeEach, describe, expect, it } from 'vitest';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import { plannerRaceCatalog } from '@planner/data/race-catalog';
import { phase03FoundationFixture } from '@planner/features/character-foundation/foundation-fixture';
import { selectFoundationSummary, selectOriginOptions } from '@planner/features/character-foundation/selectors';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';

const HUMAN_SUBRACE_IDS = [
  'subrace:liche',
  'subrace:licantropo',
  'subrace:tumulario',
  'subrace:vampiro',
  'subrace:engendro-vampirico',
] as const;

const HUMAN_SUBRACE_LABELS = [
  'Liche',
  'Licántropo',
  'Tumulario',
  'Vampiro',
  'Engendro vampírico',
] as const;

function createFoundationState(
  overrides: Partial<CharacterFoundationStoreState> = {},
): CharacterFoundationStoreState {
  return {
    alignmentId: null,
    baseAttributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    buildName: null,
    datasetId: 'test',
    raceId: null,
    racialModifiers: null,
    resetFoundation: () => undefined,
    setAlignment: () => undefined,
    setBaseAttribute: () => undefined,
    setBuildName: () => undefined,
    setRace: () => undefined,
    setSubrace: () => undefined,
    subraceId: null,
    ...overrides,
  };
}

describe('quick 260605-d4e — human subraces', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
  });

  it('adds the curated subraces under race:human in the runtime race catalog', () => {
    const humanSubraces = plannerRaceCatalog.subraces.filter(
      (subrace) => subrace.parentRaceId === 'race:human',
    );

    expect(humanSubraces.map((subrace) => subrace.id)).toEqual(
      expect.arrayContaining([...HUMAN_SUBRACE_IDS]),
    );
    expect(humanSubraces.map((subrace) => subrace.label)).toEqual(
      expect.arrayContaining([...HUMAN_SUBRACE_LABELS]),
    );
  });

  it('projects all curated human subraces into the foundation fixture', () => {
    const fixtureHumanSubraces = phase03FoundationFixture.subraces.filter(
      (subrace) => subrace.parentRaceId === 'race:human',
    );

    expect(fixtureHumanSubraces.map((subrace) => subrace.id)).toEqual(
      expect.arrayContaining([...HUMAN_SUBRACE_IDS]),
    );
  });

  it('shows the five curated subraces after selecting Humano', () => {
    const options = selectOriginOptions(
      createFoundationState({ raceId: 'race:human' as CanonicalId }),
    );

    expect(options.subraces.map((subrace) => subrace.id)).toEqual(
      expect.arrayContaining([...HUMAN_SUBRACE_IDS]),
    );
  });

  it('does not show human subraces under Elfo', () => {
    const options = selectOriginOptions(
      createFoundationState({ raceId: 'race:elf' as CanonicalId }),
    );

    for (const subraceId of HUMAN_SUBRACE_IDS) {
      expect(options.subraces.some((subrace) => subrace.id === subraceId)).toBe(false);
    }
  });

  it('accepts a matching human subrace and drops it when the parent race changes', () => {
    const store = useCharacterFoundationStore.getState();
    store.setRace('race:human' as CanonicalId);
    store.setSubrace('subrace:vampiro' as CanonicalId);

    expect(useCharacterFoundationStore.getState().subraceId).toBe('subrace:vampiro');
    expect(selectFoundationSummary(useCharacterFoundationStore.getState()).selectedSubraceLabel).toBe('Vampiro');

    useCharacterFoundationStore.getState().setRace('race:elf' as CanonicalId);

    expect(useCharacterFoundationStore.getState().subraceId).toBeNull();
  });
});
