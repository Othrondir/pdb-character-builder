/**
 * Phase 12.4-06 — RED fixture spec for `reachableAtLevelN` (SPEC R1 / D-02).
 *
 * Asserts the four decision branches per 12.4-PLAN.md <interfaces>:
 *   1. Base class → { reachable: true, blockers: [] }
 *   2. Prestige at L1 → { kind: 'l1', threshold: 2, label: 'Disponible a partir del nivel 2' }
 *   3. Prestige + !enriched → { kind: 'unvetted', label: 'Requisitos en revisión' }
 *   4. Prestige + enriched → decode blockers per-requirement; empty → reachable.
 *
 * Pure helper contract: no React, no store, no @data-extractor imports.
 * Inline ClassPrereqInput (structural) — mirrors 12.4-03 per-level-budget pattern.
 */

import { describe, expect, it } from 'vitest';

import {
  reachableAtLevelN,
  type PrestigeGateInput,
} from '@rules-engine/progression/prestige-gate';

function baseInput(overrides: Partial<PrestigeGateInput> = {}): PrestigeGateInput {
  return {
    classRow: { id: 'class:assassin', isBase: false },
    level: 5,
    abilityScores: { int: 10, str: 10, dex: 10, con: 10, wis: 10, cha: 10 },
    bab: 0,
    skillRanks: {},
    featIds: new Set<string>(),
    classLevels: {},
    enriched: false,
    ...overrides,
  };
}

describe('Phase 12.4-06 — reachableAtLevelN (SPEC R1 / D-02)', () => {
  it('base class always reachable regardless of other inputs', () => {
    const input = baseInput({
      classRow: { id: 'class:fighter', isBase: true },
      level: 1,
    });
    expect(reachableAtLevelN(input)).toEqual({ reachable: true, blockers: [] });
  });

  it('base class at L16 with empty everything still reachable', () => {
    const input = baseInput({
      classRow: { id: 'class:cleric', isBase: true },
      level: 16,
      enriched: false,
    });
    expect(reachableAtLevelN(input)).toEqual({ reachable: true, blockers: [] });
  });

  it('prestige at L1: l1 blocker with threshold 2 + exact copy', () => {
    const result = reachableAtLevelN(baseInput({ level: 1 }));
    expect(result.reachable).toBe(false);
    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0]).toMatchObject({
      kind: 'l1',
      threshold: 2,
      label: 'Disponible a partir del nivel 2',
    });
  });

  it('prestige at L2+ without enrichment: unvetted blocker with exact copy', () => {
    const result = reachableAtLevelN(baseInput({ level: 5, enriched: false }));
    expect(result.reachable).toBe(false);
    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0]).toMatchObject({
      kind: 'unvetted',
      label: 'Requisitos en revisión',
    });
  });

  it('prestige at L2+ with enrichment + BAB deficit: bab blocker with exact copy', () => {
    const result = reachableAtLevelN(
      baseInput({
        level: 5,
        enriched: true,
        bab: 3,
        classRow: {
          id: 'class:assassin',
          isBase: false,
          decodedPrereqs: { minBab: 5 },
        },
      }),
    );
    expect(result.reachable).toBe(false);
    const babBlocker = result.blockers.find((b) => b.kind === 'bab');
    expect(babBlocker).toMatchObject({
      kind: 'bab',
      threshold: 5,
      label: 'Requiere BAB ≥ 5',
    });
  });

  it('skill-rank blocker: plural copy ("8 rangos")', () => {
    const result = reachableAtLevelN(
      baseInput({
        level: 5,
        enriched: true,
        classRow: {
          id: 'class:assassin',
          isBase: false,
          decodedPrereqs: {
            minSkillRanks: [
              { skillId: 'skill:hide', amount: 8, skillName: 'Sigilo' },
            ],
          },
        },
        skillRanks: { 'skill:hide': 2 },
      }),
    );
    const skillBlocker = result.blockers.find((b) => b.kind === 'skill-rank');
    expect(skillBlocker?.label).toBe('Requiere 8 rangos de Sigilo');
    expect(skillBlocker?.threshold).toBe(8);
  });

  it('skill-rank blocker: singular copy ("1 rango")', () => {
    const result = reachableAtLevelN(
      baseInput({
        level: 5,
        enriched: true,
        classRow: {
          id: 'class:assassin',
          isBase: false,
          decodedPrereqs: {
            minSkillRanks: [
              { skillId: 'skill:hide', amount: 1, skillName: 'Sigilo' },
            ],
          },
        },
        skillRanks: { 'skill:hide': 0 },
      }),
    );
    const skillBlocker = result.blockers.find((b) => b.kind === 'skill-rank');
    expect(skillBlocker?.label).toBe('Requiere 1 rango de Sigilo');
  });

  it('class-level blocker: plural ("5 niveles")', () => {
    const result = reachableAtLevelN(
      baseInput({
        level: 5,
        enriched: true,
        classRow: {
          id: 'class:assassin',
          isBase: false,
          decodedPrereqs: {
            minClassLevel: {
              classId: 'class:fighter',
              amount: 5,
              className: 'Guerrero',
            },
          },
        },
        classLevels: { 'class:fighter': 2 },
      }),
    );
    const blocker = result.blockers.find((b) => b.kind === 'class-level');
    expect(blocker?.label).toBe('Requiere 5 niveles de Guerrero');
  });

  it('class-level blocker: singular ("1 nivel")', () => {
    const result = reachableAtLevelN(
      baseInput({
        level: 5,
        enriched: true,
        classRow: {
          id: 'class:assassin',
          isBase: false,
          decodedPrereqs: {
            minClassLevel: {
              classId: 'class:fighter',
              amount: 1,
              className: 'Guerrero',
            },
          },
        },
        classLevels: { 'class:fighter': 0 },
      }),
    );
    const blocker = result.blockers.find((b) => b.kind === 'class-level');
    expect(blocker?.label).toBe('Requiere 1 nivel de Guerrero');
  });

  it('feat blocker: exact copy', () => {
    const result = reachableAtLevelN(
      baseInput({
        level: 5,
        enriched: true,
        classRow: {
          id: 'class:assassin',
          isBase: false,
          decodedPrereqs: {
            requiredFeats: [{ featId: 'feat:dodge', featName: 'Esquiva' }],
          },
        },
        featIds: new Set<string>(),
      }),
    );
    const blocker = result.blockers.find((b) => b.kind === 'feat');
    expect(blocker?.label).toBe('Requiere dote: Esquiva');
  });

  it('all prereqs met → reachable true, blockers empty', () => {
    const result = reachableAtLevelN(
      baseInput({
        level: 8,
        enriched: true,
        bab: 10,
        classRow: {
          id: 'class:assassin',
          isBase: false,
          decodedPrereqs: { minBab: 5 },
        },
      }),
    );
    expect(result).toEqual({ reachable: true, blockers: [] });
  });

  it('multiple unmet prereqs surface each blocker (combined BAB + skill)', () => {
    const result = reachableAtLevelN(
      baseInput({
        level: 5,
        enriched: true,
        bab: 2,
        classRow: {
          id: 'class:assassin',
          isBase: false,
          decodedPrereqs: {
            minBab: 5,
            minSkillRanks: [
              { skillId: 'skill:hide', amount: 8, skillName: 'Sigilo' },
            ],
          },
        },
        skillRanks: { 'skill:hide': 1 },
      }),
    );
    expect(result.reachable).toBe(false);
    expect(result.blockers.map((b) => b.kind).sort()).toEqual(['bab', 'skill-rank']);
  });
});
