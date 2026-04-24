import { describe, it, expect } from 'vitest';
import {
  reachableAtLevelN,
  type PrestigeGateInput,
} from '@rules-engine/progression/prestige-gate';

function baseInput(overrides: Partial<PrestigeGateInput> = {}): PrestigeGateInput {
  return {
    classRow: { id: 'class:test', isBase: false, decodedPrereqs: {} },
    level: 5,
    abilityScores: {},
    bab: 10,
    skillRanks: {},
    featIds: new Set<string>(),
    classLevels: {},
    enriched: true,
    ...overrides,
  };
}

describe('Phase 12.8-02 — new evaluator branches', () => {
  describe('minArcaneSpellLevel', () => {
    it('blocks when highestArcaneSpellLevel is undefined', () => {
      const input = baseInput({
        classRow: {
          id: 'class:pale-master',
          isBase: false,
          decodedPrereqs: { minArcaneSpellLevel: 3 },
        },
      });
      const result = reachableAtLevelN(input);
      expect(result.reachable).toBe(false);
      expect(result.blockers.map((b) => b.kind)).toContain('arcane-spell-level');
      expect(result.blockers[0].label).toMatch(/conjuros arcanos de nivel 3/);
    });

    it('passes when highestArcaneSpellLevel meets threshold', () => {
      const input = baseInput({
        classRow: {
          id: 'class:pale-master',
          isBase: false,
          decodedPrereqs: { minArcaneSpellLevel: 3 },
        },
        highestArcaneSpellLevel: 5,
      });
      const result = reachableAtLevelN(input);
      expect(result.blockers.find((b) => b.kind === 'arcane-spell-level')).toBeUndefined();
    });
  });

  describe('minSpellLevel (always fail-closed per Phase 07.2 magic descope)', () => {
    it('emits spell-level blocker regardless of input', () => {
      const input = baseInput({
        classRow: {
          id: 'class:shifter',
          isBase: false,
          decodedPrereqs: { minSpellLevel: 3 },
        },
      });
      const result = reachableAtLevelN(input);
      expect(result.blockers.map((b) => b.kind)).toContain('spell-level');
    });
  });

  describe('excludedClassIds', () => {
    it('blocks when user has any level in an excluded class', () => {
      const input = baseInput({
        classRow: {
          id: 'class:pale-master',
          isBase: false,
          decodedPrereqs: {
            excludedClassIds: [{ classId: 'class:druid', className: 'Druida' }],
          },
        },
        classLevels: { 'class:druid': 1 },
      });
      const result = reachableAtLevelN(input);
      expect(result.blockers.map((b) => b.kind)).toContain('excluded-class');
      expect(result.blockers[0].label).toBe('Incompatible con Druida');
    });

    it('passes when user has zero levels in excluded class', () => {
      const input = baseInput({
        classRow: {
          id: 'class:pale-master',
          isBase: false,
          decodedPrereqs: {
            excludedClassIds: [{ classId: 'class:druid', className: 'Druida' }],
          },
        },
        classLevels: { 'class:druid': 0 },
      });
      const result = reachableAtLevelN(input);
      expect(result.blockers.find((b) => b.kind === 'excluded-class')).toBeUndefined();
    });
  });

  describe('requiredAnyFeatGroups', () => {
    it('blocks when no feat in the group is owned', () => {
      const input = baseInput({
        classRow: {
          id: 'class:arcane-archer',
          isBase: false,
          decodedPrereqs: {
            requiredAnyFeatGroups: [
              [
                { featId: 'feat:weapfoclongbow', featName: 'Soltura (arco largo)' },
                { featId: 'feat:weapfocshortbow', featName: 'Soltura (arco corto)' },
              ],
            ],
          },
        },
        featIds: new Set<string>(),
      });
      const result = reachableAtLevelN(input);
      expect(result.blockers.map((b) => b.kind)).toContain('any-feat-group');
      expect(result.blockers[0].label).toMatch(/Soltura \(arco largo\).*Soltura \(arco corto\)/);
    });

    it('passes when at least one group feat is owned', () => {
      const input = baseInput({
        classRow: {
          id: 'class:arcane-archer',
          isBase: false,
          decodedPrereqs: {
            requiredAnyFeatGroups: [
              [
                { featId: 'feat:weapfoclongbow', featName: 'Soltura (arco largo)' },
                { featId: 'feat:weapfocshortbow', featName: 'Soltura (arco corto)' },
              ],
            ],
          },
        },
        featIds: new Set(['feat:weapfoclongbow']),
      });
      const result = reachableAtLevelN(input);
      expect(result.blockers.find((b) => b.kind === 'any-feat-group')).toBeUndefined();
    });
  });

  describe('requiredAnyRaceIds', () => {
    it('blocks when raceId is not in allowed set', () => {
      const input = baseInput({
        classRow: {
          id: 'class:arcane-archer',
          isBase: false,
          decodedPrereqs: {
            requiredAnyRaceIds: [
              { raceId: 'race:elf', raceName: 'Elfo' },
              { raceId: 'race:halfelf', raceName: 'Semielfo' },
            ],
          },
        },
        raceId: 'race:human',
      });
      const result = reachableAtLevelN(input);
      expect(result.blockers.map((b) => b.kind)).toContain('any-race');
      expect(result.blockers[0].label).toBe('Requiere raza: Elfo o Semielfo');
    });

    it('passes when raceId is in allowed set', () => {
      const input = baseInput({
        classRow: {
          id: 'class:arcane-archer',
          isBase: false,
          decodedPrereqs: {
            requiredAnyRaceIds: [{ raceId: 'race:elf', raceName: 'Elfo' }],
          },
        },
        raceId: 'race:elf',
      });
      const result = reachableAtLevelN(input);
      expect(result.blockers.find((b) => b.kind === 'any-race')).toBeUndefined();
    });
  });

  describe('requiredAnyClassLevels', () => {
    it('blocks when no class meets its required level', () => {
      const input = baseInput({
        classRow: {
          id: 'class:arcane-archer',
          isBase: false,
          decodedPrereqs: {
            requiredAnyClassLevels: [
              { classId: 'class:wizard', className: 'Mago', amount: 1 },
              { classId: 'class:sorcerer', className: 'Hechicero', amount: 1 },
            ],
          },
        },
        classLevels: {},
      });
      const result = reachableAtLevelN(input);
      expect(result.blockers.map((b) => b.kind)).toContain('any-class-level');
    });

    it('passes when any class meets its amount', () => {
      const input = baseInput({
        classRow: {
          id: 'class:arcane-archer',
          isBase: false,
          decodedPrereqs: {
            requiredAnyClassLevels: [
              { classId: 'class:wizard', className: 'Mago', amount: 1 },
            ],
          },
        },
        classLevels: { 'class:wizard': 1 },
      });
      const result = reachableAtLevelN(input);
      expect(result.blockers.find((b) => b.kind === 'any-class-level')).toBeUndefined();
    });
  });

  describe('fail-closed branch is UNCHANGED (D-10)', () => {
    it('unenriched prestige at L2 still returns unvetted sentinel', () => {
      const input = baseInput({
        classRow: { id: 'class:unknown', isBase: false },
        level: 2,
        enriched: false,
      });
      const result = reachableAtLevelN(input);
      expect(result.reachable).toBe(false);
      expect(result.blockers).toHaveLength(1);
      expect(result.blockers[0].kind).toBe('unvetted');
      expect(result.blockers[0].label).toBe('Requisitos en revisión');
    });
  });
});
