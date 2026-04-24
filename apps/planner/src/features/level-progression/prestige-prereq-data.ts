import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ClassPrereqInput } from '@rules-engine/progression/prestige-gate';

type DecodedPrereqs = NonNullable<ClassPrereqInput['decodedPrereqs']>;

function feat(featId: string, featName: string) {
  return { featId, featName };
}

function skill(skillId: string, amount: number, skillName: string) {
  return { skillId, amount, skillName };
}

function race(raceId: string, raceName: string) {
  return { raceId, raceName };
}

function classLevel(classId: string, className: string, amount = 1) {
  return { classId, className, amount };
}

const MARTIAL_WEAPON_PROFICIENCIES = [
  feat(
    'feat:competenciaarmamarcial-espcorta',
    'Competencia con arma marcial (espada corta)',
  ),
  feat(
    'feat:competenciaarmamarcial-hacharr',
    'Competencia con arma marcial (hacha arrojadiza)',
  ),
  feat(
    'feat:competenciaarmamarcial-hachademano',
    'Competencia con arma marcial (hacha de mano)',
  ),
  feat(
    'feat:competenciaarmamarcial-kukri',
    'Competencia con arma marcial (kukri)',
  ),
  feat(
    'feat:competenciaarmamarcial-martlig',
    'Competencia con arma marcial (martillo ligero)',
  ),
  feat(
    'feat:competenciaarmamarcial-cimitarra',
    'Competencia con arma marcial (cimitarra)',
  ),
  feat(
    'feat:competenciaarmamarcial-esplarga',
    'Competencia con arma marcial (espada larga)',
  ),
  feat(
    'feat:competenciaarmamarcial-estoque',
    'Competencia con arma marcial (estoque)',
  ),
  feat(
    'feat:competenciaarmamarcial-hbatalla',
    'Competencia con arma marcial (hacha de batalla)',
  ),
  feat(
    'feat:competenciaarmamarcial-manglig',
    'Competencia con arma marcial (mangual ligero)',
  ),
  feat(
    'feat:competenciaarmamarcial-martigue',
    'Competencia con arma marcial (martillo de guerra)',
  ),
  feat(
    'feat:competenciaarmamarcial-alab',
    'Competencia con arma marcial (alabarda)',
  ),
  feat(
    'feat:competenciaarmamarcial-espadon',
    'Competencia con arma marcial (espadón)',
  ),
  feat(
    'feat:competenciaarmamarcial-ghacha',
    'Competencia con arma marcial (gran hacha)',
  ),
  feat(
    'feat:competenciaarmamarcial-gua',
    'Competencia con arma marcial (guadaña)',
  ),
  feat(
    'feat:competenciaarmamarcial-mangpes',
    'Competencia con arma marcial (mangual pesado)',
  ),
  feat(
    'feat:competenciaarmamarcial-arccor',
    'Competencia con arma marcial (arco corto)',
  ),
  feat(
    'feat:competenciaarmamarcial-arclarg',
    'Competencia con arma marcial (arco largo)',
  ),
  feat(
    'feat:competenciaarmamarcial-tridente',
    'Competencia con arma marcial (tridente)',
  ),
  feat(
    'feat:competenciaarmamarcial-picoligero',
    'Competencia con arma marcial (pico ligero)',
  ),
  feat(
    'feat:competenciaarmamarcial-picopesado',
    'Competencia con arma marcial (pico pesado)',
  ),
  feat(
    'feat:competenciaarmamarcial-alfanje',
    'Competencia con arma marcial (alfanje)',
  ),
  feat(
    'feat:competenciaarmamarcial-cachiporra',
    'Competencia con arma marcial (cachiporra)',
  ),
  feat(
    'feat:competenciaarmamarcial-mazo',
    'Competencia con arma marcial (mazo)',
  ),
  feat(
    'feat:competenciaarmamarcial-aguijada',
    'Competencia con arma marcial (aguijada)',
  ),
] as const;

const GREATER_SPELL_FOCUS_FEATS = [
  feat(
    'feat:grspllfcsabj',
    'Soltura mayor con una escuela de magia (Abjuración)',
  ),
  feat(
    'feat:grspllfcscnj',
    'Soltura mayor con una escuela de magia (Conjuración)',
  ),
  feat(
    'feat:grspllfcsdiv',
    'Soltura mayor con una escuela de magia (Adivinación)',
  ),
  feat(
    'feat:grspllfcsench',
    'Soltura mayor con una escuela de magia (Encantamiento)',
  ),
  feat(
    'feat:grspllfcsevc',
    'Soltura mayor con una escuela de magia (Evocación)',
  ),
  feat(
    'feat:grspllfcsill',
    'Soltura mayor con una escuela de magia (Ilusión)',
  ),
  feat(
    'feat:grspllfcsnec',
    'Soltura mayor con una escuela de magia (Nigromancia)',
  ),
  feat(
    'feat:grspllfcstran',
    'Soltura mayor con una escuela de magia (Transmutación)',
  ),
] as const;

const WILD_SHAPE_FEATS = [
  feat('feat:wildshape', 'Forma salvaje'),
  feat('feat:wildshape2', 'Forma salvaje (2/día)'),
  feat('feat:wildshape3', 'Forma salvaje (3/día)'),
  feat('feat:wildshape4', 'Forma salvaje (4/día)'),
  feat('feat:wildshape5', 'Forma salvaje (5/día)'),
  feat('feat:wildshape6', 'Forma salvaje (6/día)'),
] as const;

// Quick-260422-h9k — shared Weapon Focus disjunction lists for campeondivino
// and weaponmaster prestige prereqs. Canonical IDs verified against
// compiled-feats.ts (HIGH confidence per 260422-h9k-RESEARCH.md).
//
// Original cls_pres_divcha.2da FEATOR groups: 2070 (1HConcussion) / 2071
// (1HEdged) / 2072 (2Handed) / 2073 (Polearm) / 100 (Unarmed). The 4 category
// masters (2070-2073) are not in the Puerta player catalog; D-06 expands them
// to their constituent per-weapon Weapon Focus feats. Unarmed (FEATOR 100)
// survives as feat:weapfocunarm.
const MELEE_WEAPON_FOCUS_FEATS = [
  feat('feat:weapfocunarm', 'Soltura con un arma (impacto sin arma)'),
  // 1H Concussion (2070) → clubs/maces/warhammers/morningstars
  feat('feat:weapfocclub', 'Soltura con un arma (clava)'),
  feat('feat:weapfoclgmace', 'Soltura con un arma (maza)'),
  feat('feat:weapfoclgham', 'Soltura con un arma (martillo ligero)'),
  feat('feat:weapfocwham', 'Soltura con un arma (martillo de guerra)'),
  feat('feat:weapfocmorn', 'Soltura con un arma (maza de armas)'),
  feat('feat:weapfocdmace', 'Soltura con un arma (maza terrible)'),
  // 1H Edged (2071) → longsword/shortsword/rapier/scimitar/kukri/katana/bastard/sickle/dagger/kama/whip
  feat('feat:weapfoclsw', 'Soltura con un arma (espada larga)'),
  feat('feat:weapfocshortsword', 'Soltura con un arma (espada corta)'),
  feat('feat:weapfocrapier', 'Soltura con un arma (estoque)'),
  feat('feat:weapfocscim', 'Soltura con un arma (cimitarra)'),
  feat('feat:weapfockukri', 'Soltura con un arma (kukri)'),
  feat('feat:weapfockatana', 'Soltura con un arma (katana)'),
  feat('feat:weapfocbsw', 'Soltura con un arma (espada bastarda)'),
  feat('feat:weapfocsickle', 'Soltura con un arma (hoz)'),
  feat('feat:weapfocdagger', 'Soltura con un arma (daga)'),
  feat('feat:weapfockama', 'Soltura con un arma (kama)'),
  feat('feat:feat-weapon-focus-whip', 'Soltura con un arma (látigo)'),
  // 2-Handed (2072) → greatsword/great-axe/battle-axe/hand-axe/two-bladed/double-axe/dwaxe
  feat('feat:weapfocgsw', 'Soltura con un arma (espadón)'),
  feat('feat:weapfocgaxe', 'Soltura con un arma (gran hacha)'),
  feat('feat:weapfocbaxe', 'Soltura con un arma (hacha de batalla)'),
  feat('feat:weapfochaxe', 'Soltura con un arma (hacha de mano)'),
  feat('feat:weapfoc2sw', 'Soltura con un arma (espada de dos hojas)'),
  feat('feat:weapfocdaxe', 'Soltura con un arma (hacha doble)'),
  feat('feat:feat-weapon-focus-dwaxe', 'Soltura con un arma (hacha de guerra enana)'),
  // Polearm (2073) → halberd/staff/spear/scythe/trident/flails
  feat('feat:weapfochalb', 'Soltura con un arma (alabarda)'),
  feat('feat:weapfocstaff', 'Soltura con un arma (bastón)'),
  feat('feat:weapfocwspear', 'Soltura con un arma (lanza)'),
  feat('feat:weapfocscy', 'Soltura con un arma (guadaña)'),
  feat('feat:weapfoclgflail', 'Soltura con un arma (mangual ligero)'),
  feat('feat:weapfochflail', 'Soltura con un arma (mangual pesado)'),
  feat('feat:feat-weapon-focus-trident', 'Soltura con un arma (tridente)'),
] as const;

// Weaponmaster FEATOR (cls_pres_weaponmaster.2da): per-arma Weapon Focus
// WITHOUT Unarmed (FEATOR 100 is not in the weaponmaster list, unlike
// campeondivino). Category masters 2070-2073 + Lance 2056 dropped silently
// (D-07) — per-arma constituents already cover the same weapons.
const WEAPONMASTER_WEAPON_FOCUS_FEATS = MELEE_WEAPON_FOCUS_FEATS.filter(
  (entry) => entry.featId !== 'feat:weapfocunarm',
);

export const PRESTIGE_PREREQ_OVERRIDES: Partial<
  Record<CanonicalId, DecodedPrereqs>
> = {
  'class:shadowdancer': {
    minBab: 2,
    minSkillRanks: [
      skill('skill:moversesigilosamente', 8, 'Moverse sigilosamente'),
      skill('skill:equilibrio', 5, 'Equilibrio'),
    ],
    requiredFeats: [
      feat('feat:dodge', 'Esquiva'),
      feat('feat:mobility', 'Movilidad'),
    ],
  },
  'class:arcane-archer': {
    minBab: 4,
    requiredFeats: [feat('feat:disparoabocajarro', 'Disparo a bocajarro')],
    requiredAnyFeatGroups: [
      [
        feat(
          'feat:weapfoclongbow',
          'Soltura con un arma (arco largo)',
        ),
        feat(
          'feat:weapfocshortbow',
          'Soltura con un arma (arco corto)',
        ),
      ],
    ],
    requiredAnyRaceIds: [
      race('race:elf', 'Elfo'),
      race('race:halfelf', 'Semielfo'),
    ],
    requiredAnyClassLevels: [
      classLevel('class:bard', 'Bardo'),
      classLevel('class:sorcerer', 'Hechicero'),
      classLevel('class:wizard', 'Mago'),
      classLevel('class:warlock', 'Brujo'),
    ],
  },
  'class:assassin': {
    minSkillRanks: [
      skill('skill:moversesigilosamente', 8, 'Moverse sigilosamente'),
      skill('skill:esconderse', 8, 'Esconderse'),
    ],
  },
  'class:pale-master': {
    minArcaneSpellLevel: 3,
    excludedClassIds: [classLevel('class:druid', 'Druida')],
  },
  'class:shifter': {
    minSpellLevel: 3,
    requiredFeats: [feat('feat:alertness', 'Alerta')],
    requiredAnyFeatGroups: [WILD_SHAPE_FEATS],
  },
  'class:dwarven-defender': {
    minBab: 7,
    requiredFeats: [feat('feat:dureza', 'Dureza')],
    requiredAnyRaceIds: [
      race('race:dwarf', 'Enano Escudo'),
      race('race:gnome', 'Gnomo'),
      race('race:halfling', 'Mediano'),
    ],
  },
  'class:discipulodedragon': {
    minArcaneSpellLevel: 1,
    minSkillRanks: [skill('skill:saberarcano', 8, 'Saber (arcano)')],
    requiredAnyClassLevels: [
      classLevel('class:bard', 'Bardo'),
      classLevel('class:sorcerer', 'Hechicero'),
    ],
  },
  'class:tirador-espesura': {
    minBab: 5,
    minSkillRanks: [
      skill('skill:esconderse', 4, 'Esconderse'),
      skill('skill:moversesigilosamente', 4, 'Moverse sigilosamente'),
      skill('skill:avistar', 4, 'Avistar'),
    ],
    requiredFeats: [
      feat('feat:disparoabocajarro', 'Disparo a bocajarro'),
      feat('feat:disparolocalizado', 'Disparo localizado'),
    ],
    requiredAnyFeatGroups: [
      [
        feat(
          'feat:weapfoclongbow',
          'Soltura con un arma (arco largo)',
        ),
        feat(
          'feat:weapfocshortbow',
          'Soltura con un arma (arco corto)',
        ),
        feat(
          'feat:weapfochxbow',
          'Soltura con un arma (ballesta pesada)',
        ),
        feat(
          'feat:weapfoclgxbow',
          'Soltura con un arma (ballesta ligera)',
        ),
      ],
    ],
  },
  'class:bribon-arcano': {
    minArcaneSpellLevel: 5,
    minSkillRanks: [
      skill('skill:descifrarescritura', 6, 'Descifrar escritura'),
      skill('skill:escapismo', 6, 'Escapismo'),
      skill('skill:inutilizarmecanismo', 6, 'Inutilizar mecanismo'),
      skill('skill:saberarcano', 4, 'Saber (arcano)'),
    ],
    requiredAnyFeatGroups: [
      [
        feat('feat:sneakattack2', 'Ataque furtivo (+2d6)'),
        feat(
          'feat:feat-prestige-death-attack-2',
          'Ataque mortal (+2d6)',
        ),
      ],
    ],
  },
  'class:ladron-sombras-amn': {
    minSkillRanks: [
      skill('skill:engaar', 3, 'Engañar'),
      skill('skill:esconderse', 8, 'Esconderse'),
      skill('skill:intimidar', 3, 'Intimidar'),
      skill('skill:moversesigilosamente', 3, 'Moverse sigilosamente'),
      skill('skill:reunirinformacion', 3, 'Reunir información'),
    ],
    requiredFeats: [feat('feat:thug', 'Matón')],
  },
  'class:caballero-arcano': {
    minArcaneSpellLevel: 5,
    requiredFeats: [...MARTIAL_WEAPON_PROFICIENCIES],
  },
  'class:shadowadept': {
    minSkillRanks: [
      skill('skill:saberarcano', 8, 'Saber (arcano)'),
      skill('skill:conocimientoconjuros', 8, 'Conocimiento de conjuros'),
    ],
    requiredFeats: [
      feat('feat:feat-shadowweave', 'Magia Urdimbre Sombria'),
    ],
    requiredAnyClassLevels: [classLevel('class:cleric', 'Clérigo', 5)],
  },
  'class:teurgo': {
    minArcaneSpellLevel: 3,
    minSkillRanks: [
      skill('skill:saberreligion', 6, 'Saber (religión)'),
      skill('skill:saberarcano', 6, 'Saber (arcano)'),
    ],
  },
  'class:orc-warlord': {
    minBab: 5,
    minSkillRanks: [
      skill('skill:intimidar', 8, 'Intimidar'),
      skill('skill:superviviencia', 5, 'Superviviencia'),
      skill('skill:montar', 5, 'Montar'),
    ],
    requiredFeats: [feat('feat:barbarianrage', 'Furia')],
  },
  'class:cavalier': {
    minBab: 8,
    minSkillRanks: [
      skill('skill:montar', 6, 'Montar'),
      skill('skill:saberotros', 4, 'Saber (otros)'),
      skill('skill:tratoconanimales', 4, 'Trato con animales'),
    ],
    requiredFeats: [
      feat('feat:feat-mounted-combat', 'Combatir desde una montura'),
      feat('feat:weapfocwspear', 'Soltura con un arma (lanza)'),
      feat('feat:embestidamejorada', 'Embestida mejorada'),
    ],
  },
  'class:archmage': {
    minArcaneSpellLevel: 7,
    minSkillRanks: [
      skill('skill:saberarcano', 17, 'Saber (arcano)'),
      skill('skill:conocimientoconjuros', 17, 'Conocimiento de conjuros'),
    ],
    requiredFeats: [
      feat(
        'feat:skillfocusspell',
        'Soltura con una habilidad (Conocimiento de conjuros)',
      ),
    ],
    requiredAnyFeatGroups: [GREATER_SPELL_FOCUS_FEATS],
  },
  'class:frenzied-berserker': {
    minBab: 6,
    requiredFeats: [
      feat('feat:cleave', 'Hendedura'),
      feat('feat:ataquepoderoso', 'Ataque poderoso'),
      feat('feat:furiaintimidatoria', 'Furia Intimidatoria'),
    ],
  },
  'class:maestro-formas': {
    minSpellLevel: 5,
    requiredFeats: [
      feat('feat:alertness', 'Alerta'),
      feat('feat:aguante', 'Aguante'),
    ],
  },
  // Quick-260422-h9k — 3 new prestige overrides (harper + campeondivino +
  // weaponmaster). Warlock + Swashbuckler intentionally omitted: both only
  // have ScriptVar (PRC_AllowWarlock / PRC_AllowSwash) as a server-side gate
  // not reproducible from planner state. An empty override would flip
  // enriched=true with blockers=[] → reachable=true, contradicting CLAUDE.md
  // "strict validation — illegal server builds blocked, not warned". Both
  // stay fail-closed to 'Requisitos en revisión' until a future cross-package
  // plan introduces BlockerKind 'server-gate' (rules-engine + copy change).
  'class:harper': {
    minSkillRanks: [
      skill('skill:engaar', 6, 'Engañar'),
      skill('skill:buscar', 4, 'Buscar'),
      skill('skill:saberotros', 6, 'Saber (otros)'),
      // TODO(product): SKILL 3 (Discipline/Disciplina) omitida — no existe
      // skill:disciplina en el catálogo player de Puerta (38 skills). Pre-D-03
      // OPEN-QUESTION: reinstaurar en extractor vs dropear permanentemente.
    ],
    requiredFeats: [
      feat('feat:alertness', 'Alerta'),
      feat('feat:ironwill', 'Voluntad de hierro'),
    ],
    // NOTE: ScriptVar X1_AllowHarper (server gate) + CLASSNOT 75-78 (Harper_Mage/
    // Priest/Paragon/Master, NPC-only) omitidas — no reachable desde planner state.
    // KNOWN LIMITATION: compiled-classes.ts emite class:harper dos veces (Arcano
    // sourceRow 28, Divino sourceRow 54); first-wins dedupe en class-fixture.ts
    // mantiene sólo Arcano. Override aplica a Arcano únicamente (D-05).
  },
  'class:campeondivino': {
    minBab: 7,
    requiredAnyFeatGroups: [MELEE_WEAPON_FOCUS_FEATS],
    // NOTE: FEATOR 2070-2073 (category masters 1HConcussion/1HEdged/2Handed/
    // Polearm) expandidos a sus constituyentes per-arma (D-06). Unarmed
    // (FEATOR 100) incluido como feat:weapfocunarm. ScriptVar X2_AllowDivcha +
    // CLASSNOT 79 (Commoner) omitidas — server/NPC scope.
  },
  'class:weaponmaster': {
    minBab: 5,
    minSkillRanks: [skill('skill:intimidar', 4, 'Intimidar')],
    requiredFeats: [
      feat('feat:dodge', 'Esquiva'),
      feat('feat:mobility', 'Movilidad'),
      feat('feat:periciaencombate', 'Pericia en combate'),
      feat('feat:feat-whirlwind-attack', 'Ataque de torbellino'),
    ],
    requiredAnyFeatGroups: [WEAPONMASTER_WEAPON_FOCUS_FEATS],
    // NOTE: FEATOR 2070-2073 (category masters) + 2056 (Lance) dropeados
    // silenciosamente (D-07) — constituyentes per-arma ya en la lista.
    // ScriptVar X2_AllowWM + CLASSNOT 79 omitidas — server/NPC scope.
  },
};

export function getPrestigeDecodedPrereqs(classId: CanonicalId | null) {
  if (!classId) {
    return undefined;
  }

  return PRESTIGE_PREREQ_OVERRIDES[classId];
}
