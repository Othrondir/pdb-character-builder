import { beforeEach, describe, expect, it } from 'vitest';

import { applyRaceModifiers } from '@rules-engine/foundation/apply-race-modifiers';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { compiledRaceCatalog } from '@planner/data/compiled-races';

/**
 * Phase 12.2-02 — race ability modifier pipeline (RED spec).
 *
 * Locks CHAR-02 structural contract end-to-end:
 *  - Pure rules-engine selector `applyRaceModifiers(base, racial)`.
 *  - Foundation store exposes `racialModifiers: Record<AttributeKey, number> | null`
 *    populated via `setRace` from compiled race catalog `abilityAdjustments`.
 *  - Composed selector + store returns accurate Final attributes.
 */
describe('Phase 12.2-02 — race ability modifier pipeline', () => {
  const base = { str: 14, dex: 12, con: 13, int: 10, wis: 10, cha: 10 };

  describe('applyRaceModifiers pure selector', () => {
    it('returns base unchanged when racial is null', () => {
      expect(applyRaceModifiers(base, null)).toEqual(base);
    });

    it('applies Enano adjustments (CON +2 / CHA -2)', () => {
      const result = applyRaceModifiers(base, {
        str: 0,
        dex: 0,
        con: 2,
        int: 0,
        wis: 0,
        cha: -2,
      });
      expect(result).toEqual({
        str: 14,
        dex: 12,
        con: 15,
        int: 10,
        wis: 10,
        cha: 8,
      });
    });

    it('applies Elfo adjustments (DEX +2 / CON -2)', () => {
      const result = applyRaceModifiers(base, {
        str: 0,
        dex: 2,
        con: -2,
        int: 0,
        wis: 0,
        cha: 0,
      });
      expect(result).toEqual({
        str: 14,
        dex: 14,
        con: 11,
        int: 10,
        wis: 10,
        cha: 10,
      });
    });

    it('returns base unchanged when all racial adjustments are zero (Humano)', () => {
      const zeros = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
      expect(applyRaceModifiers(base, zeros)).toEqual(base);
    });
  });

  describe('foundation store — racialModifiers setter wiring', () => {
    beforeEach(() => {
      useCharacterFoundationStore.getState().resetFoundation();
    });

    it('initial state has racialModifiers === null', () => {
      expect(useCharacterFoundationStore.getState().racialModifiers).toBeNull();
    });

    it('setRace(dwarf) populates racialModifiers from compiledRaceCatalog abilityAdjustments', () => {
      const dwarf = compiledRaceCatalog.races.find((r) => r.id === 'race:dwarf');
      if (!dwarf) {
        expect.soft(dwarf, 'race:dwarf missing from compiled catalog').toBeDefined();
        return;
      }
      useCharacterFoundationStore.getState().setRace('race:dwarf' as never);
      expect(useCharacterFoundationStore.getState().racialModifiers).toEqual(
        dwarf.abilityAdjustments,
      );
    });

    it('setRace(elf) populates racialModifiers for elf', () => {
      const elf = compiledRaceCatalog.races.find((r) => r.id === 'race:elf');
      if (!elf) {
        expect.soft(elf, 'race:elf missing from compiled catalog').toBeDefined();
        return;
      }
      useCharacterFoundationStore.getState().setRace('race:elf' as never);
      expect(useCharacterFoundationStore.getState().racialModifiers).toEqual(
        elf.abilityAdjustments,
      );
    });

    it('setRace(null) clears racialModifiers to null', () => {
      useCharacterFoundationStore.getState().setRace('race:dwarf' as never);
      useCharacterFoundationStore.getState().setRace(null);
      expect(useCharacterFoundationStore.getState().racialModifiers).toBeNull();
    });

    it('resetFoundation clears racialModifiers', () => {
      useCharacterFoundationStore.getState().setRace('race:dwarf' as never);
      useCharacterFoundationStore.getState().resetFoundation();
      expect(useCharacterFoundationStore.getState().racialModifiers).toBeNull();
    });
  });

  describe('composed selector + store', () => {
    beforeEach(() => {
      useCharacterFoundationStore.getState().resetFoundation();
    });

    it('applyRaceModifiers(state.baseAttributes, state.racialModifiers) reflects dwarf bonuses over custom base', () => {
      const store = useCharacterFoundationStore.getState();
      (['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).forEach((k) =>
        store.setBaseAttribute(k, 14),
      );
      store.setRace('race:dwarf' as never);
      const state = useCharacterFoundationStore.getState();
      const final = applyRaceModifiers(state.baseAttributes, state.racialModifiers);
      expect(final.con).toBe(16);
      expect(final.cha).toBe(12);
    });
  });
});
