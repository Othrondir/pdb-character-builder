/**
 * Phase 12.4-06 — RED fixture spec for `reachableAtLevelN` (SPEC R1 / D-02).
 *
 * Asserts the four decision branches per 12.4-PLAN.md <interfaces>:
 *   1. Base class → { reachable: true, blockers: [] }
 *   2. Prestige at L1 → { kind: 'l1', threshold: 2, label: truthful copy that
 *      states L1 is impossible and requirements still apply }
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

  it('prestige at L1: l1 blocker with threshold 2 + truthful exact copy', () => {
    const result = reachableAtLevelN(baseInput({ level: 1 }));
    expect(result.reachable).toBe(false);
    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0]).toMatchObject({
      kind: 'l1',
      threshold: 2,
      label: 'Clase de prestigio: no disponible en nivel 1; revisa sus requisitos',
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

  // ----------------------------------------------------------------------
  // Quick-260422-h9k — override fixture coverage for harper / campeondivino /
  // weaponmaster. These cases mock ClassPrereqInput.decodedPrereqs inline
  // (they do NOT read PRESTIGE_PREREQ_OVERRIDES). Integration coverage of the
  // override object is in class-picker-prestige-reachability.spec.tsx.
  // Warlock + Swashbuckler deliberately OUT OF SCOPE (see 260422-h9k-PLAN.md
  // <objective>): they require BlockerKind 'server-gate' cross-package change
  // and remain fail-closed to 'Requisitos en revisión'.
  // ----------------------------------------------------------------------

  // Shared feat groups for campeondivino / weaponmaster requiredAnyFeatGroups
  // assertions. Mirrors the RESEARCH canonical-ID mappings (HIGH confidence).
  const CAMPEON_WEAPON_FOCUS_GROUP = [
    { featId: 'feat:weapfocunarm', featName: 'Soltura con un arma (impacto sin arma)' },
    { featId: 'feat:weapfocclub', featName: 'Soltura con un arma (clava)' },
    { featId: 'feat:weapfoclgmace', featName: 'Soltura con un arma (maza)' },
    { featId: 'feat:weapfoclgham', featName: 'Soltura con un arma (martillo ligero)' },
    { featId: 'feat:weapfocwham', featName: 'Soltura con un arma (martillo de guerra)' },
    { featId: 'feat:weapfocmorn', featName: 'Soltura con un arma (maza de armas)' },
    { featId: 'feat:weapfocdmace', featName: 'Soltura con un arma (maza terrible)' },
    { featId: 'feat:weapfoclsw', featName: 'Soltura con un arma (espada larga)' },
    { featId: 'feat:weapfocshortsword', featName: 'Soltura con un arma (espada corta)' },
    { featId: 'feat:weapfocrapier', featName: 'Soltura con un arma (estoque)' },
    { featId: 'feat:weapfocscim', featName: 'Soltura con un arma (cimitarra)' },
    { featId: 'feat:weapfockukri', featName: 'Soltura con un arma (kukri)' },
    { featId: 'feat:weapfockatana', featName: 'Soltura con un arma (katana)' },
    { featId: 'feat:weapfocbsw', featName: 'Soltura con un arma (espada bastarda)' },
    { featId: 'feat:weapfocsickle', featName: 'Soltura con un arma (hoz)' },
    { featId: 'feat:weapfocdagger', featName: 'Soltura con un arma (daga)' },
    { featId: 'feat:weapfockama', featName: 'Soltura con un arma (kama)' },
    { featId: 'feat:feat-weapon-focus-whip', featName: 'Soltura con un arma (látigo)' },
    { featId: 'feat:weapfocgsw', featName: 'Soltura con un arma (espadón)' },
    { featId: 'feat:weapfocgaxe', featName: 'Soltura con un arma (gran hacha)' },
    { featId: 'feat:weapfocbaxe', featName: 'Soltura con un arma (hacha de batalla)' },
    { featId: 'feat:weapfochaxe', featName: 'Soltura con un arma (hacha de mano)' },
    { featId: 'feat:weapfoc2sw', featName: 'Soltura con un arma (espada de dos hojas)' },
    { featId: 'feat:weapfocdaxe', featName: 'Soltura con un arma (hacha doble)' },
    { featId: 'feat:feat-weapon-focus-dwaxe', featName: 'Soltura con un arma (hacha de guerra enana)' },
    { featId: 'feat:weapfochalb', featName: 'Soltura con un arma (alabarda)' },
    { featId: 'feat:weapfocstaff', featName: 'Soltura con un arma (bastón)' },
    { featId: 'feat:weapfocwspear', featName: 'Soltura con un arma (lanza)' },
    { featId: 'feat:weapfocscy', featName: 'Soltura con un arma (guadaña)' },
    { featId: 'feat:weapfoclgflail', featName: 'Soltura con un arma (mangual ligero)' },
    { featId: 'feat:weapfochflail', featName: 'Soltura con un arma (mangual pesado)' },
    { featId: 'feat:feat-weapon-focus-trident', featName: 'Soltura con un arma (tridente)' },
  ] as const;

  // Weaponmaster list: 31 items — identical to campeondivino's list EXCEPT
  // it excludes feat:weapfocunarm (unarmed is NOT in the FEATOR per cls_pres_
  // weaponmaster.2da — see 260422-h9k-RESEARCH.md §class:weaponmaster).
  const WEAPONMASTER_WEAPON_FOCUS_GROUP = CAMPEON_WEAPON_FOCUS_GROUP.filter(
    (entry) => entry.featId !== 'feat:weapfocunarm',
  );

  it('harper override: emite blockers skill + feat con copy exacto templateado', () => {
    const result = reachableAtLevelN(
      baseInput({
        level: 5,
        enriched: true,
        classRow: {
          id: 'class:harper',
          isBase: false,
          decodedPrereqs: {
            minSkillRanks: [
              { skillId: 'skill:engaar', amount: 6, skillName: 'Engañar' },
              { skillId: 'skill:buscar', amount: 4, skillName: 'Buscar' },
              { skillId: 'skill:saberotros', amount: 6, skillName: 'Saber (otros)' },
            ],
            requiredFeats: [
              { featId: 'feat:alertness', featName: 'Alerta' },
              { featId: 'feat:ironwill', featName: 'Voluntad de hierro' },
            ],
          },
        },
        skillRanks: {},
        featIds: new Set<string>(),
      }),
    );
    expect(result.reachable).toBe(false);
    expect(result.blockers).toHaveLength(5);

    const labels = result.blockers.map((b) => b.label);
    expect(labels).toContain('Requiere 6 rangos de Engañar');
    expect(labels).toContain('Requiere 4 rangos de Buscar');
    expect(labels).toContain('Requiere 6 rangos de Saber (otros)');
    expect(labels).toContain('Requiere dote: Alerta');
    expect(labels).toContain('Requiere dote: Voluntad de hierro');
  });

  it('campeondivino override: BAB 7 blocker + feat-or con 32 Weapon Focus per-arma (incluye unarmed)', () => {
    const result = reachableAtLevelN(
      baseInput({
        level: 5,
        enriched: true,
        bab: 3,
        classRow: {
          id: 'class:campeondivino',
          isBase: false,
          decodedPrereqs: {
            minBab: 7,
            requiredAnyFeatGroups: [CAMPEON_WEAPON_FOCUS_GROUP],
          },
        },
        featIds: new Set<string>(),
      }),
    );
    expect(result.reachable).toBe(false);

    const babBlocker = result.blockers.find((b) => b.kind === 'bab');
    expect(babBlocker).toMatchObject({
      kind: 'bab',
      threshold: 7,
      label: 'Requiere BAB ≥ 7',
    });

    const featOr = result.blockers.find((b) => b.kind === 'feat-or');
    expect(featOr, 'feat-or blocker must fire when no weapon focus owned').toBeDefined();
    expect(featOr?.label.startsWith('Requiere una de estas dotes: ')).toBe(true);
    // Proves the unarmed variant is part of the disjunction (distinguishes
    // campeondivino from weaponmaster).
    expect(featOr?.label).toContain('Soltura con un arma (impacto sin arma)');
  });

  it('campeondivino override: con weapfocunarm en featIds, feat-or satisfecho (sólo BAB blocker queda)', () => {
    const result = reachableAtLevelN(
      baseInput({
        level: 5,
        enriched: true,
        bab: 10,
        classRow: {
          id: 'class:campeondivino',
          isBase: false,
          decodedPrereqs: {
            minBab: 7,
            requiredAnyFeatGroups: [CAMPEON_WEAPON_FOCUS_GROUP],
          },
        },
        featIds: new Set<string>(['feat:weapfocunarm']),
      }),
    );
    expect(result).toEqual({ reachable: true, blockers: [] });
  });

  it('weaponmaster override: BAB 5 + skill intimidar 4 + 4 feats + feat-or sin unarmed', () => {
    const result = reachableAtLevelN(
      baseInput({
        level: 5,
        enriched: true,
        bab: 0,
        classRow: {
          id: 'class:weaponmaster',
          isBase: false,
          decodedPrereqs: {
            minBab: 5,
            minSkillRanks: [
              { skillId: 'skill:intimidar', amount: 4, skillName: 'Intimidar' },
            ],
            requiredFeats: [
              { featId: 'feat:dodge', featName: 'Esquiva' },
              { featId: 'feat:mobility', featName: 'Movilidad' },
              { featId: 'feat:periciaencombate', featName: 'Pericia en combate' },
              { featId: 'feat:feat-whirlwind-attack', featName: 'Ataque de torbellino' },
            ],
            requiredAnyFeatGroups: [WEAPONMASTER_WEAPON_FOCUS_GROUP],
          },
        },
        skillRanks: {},
        featIds: new Set<string>(),
      }),
    );
    expect(result.reachable).toBe(false);
    // 1 bab + 1 skill-rank + 4 feat + 1 feat-or = 7 blockers
    expect(result.blockers.map((b) => b.kind).sort()).toEqual(
      ['bab', 'feat', 'feat', 'feat', 'feat', 'feat-or', 'skill-rank'],
    );

    const featOr = result.blockers.find((b) => b.kind === 'feat-or');
    // Confirms weaponmaster FEATOR excludes unarmed (per cls_pres_weaponmaster.2da).
    expect(featOr?.label).not.toContain('Soltura con un arma (impacto sin arma)');
  });
});
