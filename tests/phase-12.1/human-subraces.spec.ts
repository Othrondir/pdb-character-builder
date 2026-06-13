import { beforeEach, describe, expect, it } from 'vitest';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import {
  plannerRaceCatalog,
  plannerSubraceMechanicsById,
} from '@planner/data/race-catalog';
import { phase03FoundationFixture } from '@planner/features/character-foundation/foundation-fixture';
import { computeFinalAttributeTotals } from '@planner/features/character-foundation/final-attributes';
import {
  selectFoundationSummary,
  selectOriginOptions,
} from '@planner/features/character-foundation/selectors';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';

const HUMAN_SUBRACE_IDS = [
  'subrace:liche',
  'subrace:licantropo',
  'subrace:tumulario',
  'subrace:umbra',
  'subrace:vampiro',
  'subrace:engendro-vampirico',
] as const;

const HUMAN_SUBRACE_LABELS = [
  'Liche',
  'Licántropo',
  'Tumulario',
  'Umbra',
  'Vampiro',
  'Engendro',
] as const;

const BASIC_SUBRACE_PARENT_RACE_IDS = [
  'race:human',
  'race:halfelf',
  'race:halforc',
  'race:elfo-solar',
  'race:elf',
  'race:elfo-silvano',
  'race:enano-dorado',
  'race:draconido',
  'race:halfling',
  'race:mediano-fortecor',
  'race:gnome',
  'race:tiefling',
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
    resetBaseAttributes: () => undefined,
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

describe('quick 260605-d4e / 260606-f6g — curated basic-race subraces', () => {
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

  it('projects all curated human-compatible subraces into the foundation fixture', () => {
    const fixtureHumanSubraces = phase03FoundationFixture.subraces.filter(
      (subrace) => subrace.parentRaceId === 'race:human',
    );

    expect(fixtureHumanSubraces.map((subrace) => subrace.id)).toEqual(
      expect.arrayContaining([...HUMAN_SUBRACE_IDS]),
    );
  });

  it('adds all six curated subrace labels under each applicable parent race', () => {
    for (const raceId of BASIC_SUBRACE_PARENT_RACE_IDS) {
      const subraces = plannerRaceCatalog.subraces.filter(
        (subrace) => subrace.parentRaceId === raceId,
      );

      expect(
        subraces.map((subrace) => subrace.label),
        `missing subraces for ${raceId}`,
      ).toEqual(expect.arrayContaining([...HUMAN_SUBRACE_LABELS]));
    }
  });

  it('does not generate curated subraces under Duergar', () => {
    const duergarSubraces = plannerRaceCatalog.subraces.filter(
      (subrace) => subrace.parentRaceId === 'race:duergar',
    );
    const duergarSubraceLabels = duergarSubraces.map((subrace) => subrace.label);

    for (const label of HUMAN_SUBRACE_LABELS) {
      expect(duergarSubraceLabels).not.toContain(label);
    }
  });

  it('shows the six curated subraces after selecting Humano', () => {
    const options = selectOriginOptions(
      createFoundationState({ raceId: 'race:human' as CanonicalId }),
    );

    expect(options.subraces.map((subrace) => subrace.id)).toEqual(
      expect.arrayContaining([...HUMAN_SUBRACE_IDS]),
    );
  });

  it('shows parent-specific subrace ids under Elfo, not the human ids', () => {
    const options = selectOriginOptions(
      createFoundationState({ raceId: 'race:elf' as CanonicalId }),
    );

    for (const subraceId of HUMAN_SUBRACE_IDS) {
      expect(
        options.subraces.some((subrace) => subrace.id === subraceId),
      ).toBe(false);
    }
    expect(options.subraces.map((subrace) => subrace.id)).toEqual(
      expect.arrayContaining([
        'subrace:elfo-lythari',
        'subrace:elf-liche',
        'subrace:elf-licantropo',
        'subrace:elf-tumulario',
        'subrace:elf-umbra',
        'subrace:elf-vampiro',
        'subrace:elf-engendro',
      ]),
    );
  });

  it('adds Elfo Lythari as a curated Elfo subrace without invented ability modifiers', () => {
    const lythari = plannerRaceCatalog.subraces.find(
      (subrace) => subrace.id === 'subrace:elfo-lythari',
    );

    expect(lythari).toMatchObject({
      label: 'Elfo Lythari',
      parentRaceId: 'race:elf',
    });
    expect(lythari?.description).toContain('Voluntad de hierro');
    expect(
      plannerSubraceMechanicsById.get('subrace:elfo-lythari')
        ?.abilityAdjustments,
    ).toEqual({
      cha: 0,
      con: 0,
      dex: 0,
      int: 0,
      str: 0,
      wis: 0,
    });
  });

  it('accepts a matching human subrace and drops it when the parent race changes', () => {
    const store = useCharacterFoundationStore.getState();
    store.setRace('race:human' as CanonicalId);
    store.setSubrace('subrace:vampiro' as CanonicalId);

    expect(useCharacterFoundationStore.getState().subraceId).toBe(
      'subrace:vampiro',
    );
    expect(
      selectFoundationSummary(useCharacterFoundationStore.getState())
        .selectedSubraceLabel,
    ).toBe('Vampiro');

    useCharacterFoundationStore.getState().setRace('race:elf' as CanonicalId);

    expect(useCharacterFoundationStore.getState().subraceId).toBeNull();
  });

  it('keeps subrace ability modifiers out of level-1 attribute assignment', () => {
    const store = useCharacterFoundationStore.getState();
    store.setRace('race:human' as CanonicalId);
    store.setSubrace('subrace:vampiro' as CanonicalId);

    const state = useCharacterFoundationStore.getState();
    expect(state.racialModifiers).toEqual({
      cha: 0,
      con: 0,
      dex: 0,
      int: 0,
      str: 0,
      wis: 0,
    });
    expect(
      computeFinalAttributeTotals(state.baseAttributes, state.racialModifiers, [], {
        characterLevel: 1,
        raceId: state.raceId,
        subraceId: state.subraceId,
      }),
    ).toEqual({
      cha: 8,
      con: 8,
      dex: 8,
      int: 8,
      str: 8,
      wis: 8,
    });
    expect(
      computeFinalAttributeTotals(state.baseAttributes, state.racialModifiers, [], {
        characterLevel: 2,
        raceId: state.raceId,
        subraceId: state.subraceId,
      }),
    ).toEqual({
      cha: 12,
      con: 8,
      dex: 12,
      int: 10,
      str: 14,
      wis: 10,
    });
  });

  it('applies generated subrace ability modifiers from level 2 after the basic parent race modifiers', () => {
    const store = useCharacterFoundationStore.getState();
    store.setRace('race:elf' as CanonicalId);
    store.setSubrace('subrace:elf-liche' as CanonicalId);

    const state = useCharacterFoundationStore.getState();
    expect(state.racialModifiers).toEqual({
      cha: 0,
      con: -2,
      dex: 2,
      int: 0,
      str: 0,
      wis: 0,
    });
    expect(
      computeFinalAttributeTotals(state.baseAttributes, state.racialModifiers, [], {
        characterLevel: 1,
        raceId: state.raceId,
        subraceId: state.subraceId,
      }),
    ).toEqual({
      cha: 8,
      con: 6,
      dex: 10,
      int: 8,
      str: 8,
      wis: 8,
    });
    expect(
      computeFinalAttributeTotals(state.baseAttributes, state.racialModifiers, [], {
        characterLevel: 2,
        raceId: state.raceId,
        subraceId: state.subraceId,
      }),
    ).toEqual({
      cha: 10,
      con: 6,
      dex: 10,
      int: 10,
      str: 8,
      wis: 10,
    });
  });

  it('stores manual mechanics for the generated parent-specific subrace ids', () => {
    expect(
      plannerSubraceMechanicsById.get('subrace:halfelf-liche')
        ?.abilityAdjustments,
    ).toEqual({
      cha: 2,
      con: 0,
      dex: 0,
      int: 2,
      str: 0,
      wis: 2,
    });
  });
});
