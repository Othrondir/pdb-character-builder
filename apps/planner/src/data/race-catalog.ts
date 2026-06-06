import {
  raceCatalogSchema,
  type CompiledRace,
  type CompiledSubrace,
  type RaceCatalog,
} from '@data-extractor/contracts/race-catalog';

import { compiledRaceCatalog } from './compiled-races';

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

type AbilityKey = (typeof ABILITY_KEYS)[number];
export type PlannerSubraceAbilityAdjustments = Record<AbilityKey, number>;
export type PlannerSkillBonuses = Partial<Record<string, number>>;

export interface PlannerSubraceMechanics {
  abilityAdjustments: PlannerSubraceAbilityAdjustments;
  skillBonuses: PlannerSkillBonuses;
}

interface CuratedSubraceTemplate {
  abilityAdjustments: PlannerSubraceAbilityAdjustments;
  description: string;
  humanId: string;
  key: string;
  label: string;
  skillBonuses: PlannerSkillBonuses;
  sourceRow: number;
}

interface CuratedSubraceParentRace {
  id: string;
}

interface CuratedStandaloneSubrace {
  abilityAdjustments: PlannerSubraceAbilityAdjustments;
  description: string;
  id: string;
  label: string;
  parentRaceId: string;
  skillBonuses: PlannerSkillBonuses;
  sourceRow: number;
}

interface RaceTraitOverride {
  revisedTraits?: string;
  size?: CompiledRace['size'];
}

const ZERO_ABILITY_ADJUSTMENTS: PlannerSubraceAbilityAdjustments = {
  cha: 0,
  con: 0,
  dex: 0,
  int: 0,
  str: 0,
  wis: 0,
};

const RACE_SKILL_BONUSES_BY_ID: Record<string, PlannerSkillBonuses> = {
  'race:aasimar': {
    'skill:avistar': 2,
    'skill:escuchar': 2,
  },
  'race:azerblood': {
    'skill:artesania': 2,
    'skill:tasacion': 2,
  },
  'race:drow': {
    'skill:avistar': 2,
    'skill:buscar': 2,
    'skill:escuchar': 2,
  },
  'race:duergar': {
    'skill:avistar': 1,
    'skill:escuchar': 1,
    'skill:moversesigilosamente': 4,
    'skill:saberarcano': 2,
  },
  'race:dwarf': {
    'skill:saberarcano': 2,
  },
  'race:elf': {
    'skill:avistar': 2,
    'skill:buscar': 2,
    'skill:escuchar': 2,
  },
  'race:elfo-avariel': {
    'skill:avistar': 2,
    'skill:buscar': 2,
    'skill:escuchar': 2,
    'skill:piruetas': 4,
  },
  'race:elfo-estrellas': {
    'skill:avistar': 2,
    'skill:buscar': 2,
    'skill:escuchar': 2,
  },
  'race:elfo-salvaje': {
    'skill:avistar': 2,
    'skill:buscar': 2,
    'skill:escuchar': 2,
  },
  'race:elfo-silvano': {
    'skill:avistar': 2,
    'skill:buscar': 2,
    'skill:escuchar': 2,
  },
  'race:elfo-solar': {
    'skill:avistar': 2,
    'skill:buscar': 2,
    'skill:escuchar': 2,
  },
  'race:enano-artico': {
    'skill:esconderse': 4,
  },
  'race:enano-dorado': {
    'skill:saberarcano': 2,
  },
  'race:gnome': {
    'skill:concentracion': 2,
    'skill:escuchar': 2,
  },
  'race:goliat': {
    'skill:averiguarintenciones': 2,
    'skill:equilibrio': 4,
    'skill:trepar': 4,
  },
  'race:gran-trasgo': {
    'skill:moversesigilosamente': 2,
  },
  'race:halfelf': {
    'skill:avistar': 1,
    'skill:buscar': 1,
    'skill:diplomacia': 2,
    'skill:escuchar': 1,
    'skill:reunirinformacion': 2,
  },
  'race:halfling': {
    'skill:esconderse': 4,
    'skill:escuchar': 2,
    'skill:moversesigilosamente': 2,
  },
  'race:kenku': {
    'skill:esconderse': 2,
    'skill:moversesigilosamente': 2,
  },
  'race:kobold': {
    'skill:artesania': 2,
    'skill:buscar': 2,
    'skill:esconderse': 8,
  },
  'race:mediano-fortecor': {
    'skill:escuchar': 2,
    'skill:moversesigilosamente': 2,
  },
  'race:minotauro': {
    'skill:avistar': 4,
    'skill:buscar': 4,
    'skill:escuchar': 4,
    'skill:esconderse': -4,
  },
  'race:ogro': {
    'skill:esconderse': -4,
  },
  'race:ogro-hechicero': {
    'skill:esconderse': -4,
  },
  'race:osgo': {
    'skill:moversesigilosamente': 4,
  },
  'race:semiogro': {
    'skill:esconderse': -4,
  },
  'race:shadarkai': {
    'skill:avistar': 2,
    'skill:buscar': 2,
    'skill:escuchar': 2,
  },
  'race:trasgo': {
    'skill:esconderse': 4,
    'skill:moversesigilosamente': 2,
  },
  'race:yuanti': {
    'skill:disfrazarse': 5,
  },
};

const RACE_TRAIT_OVERRIDES_BY_ID: Record<string, RaceTraitOverride> = {
  'race:duergar': {
    revisedTraits: '- Corrección: Afinidad con una habilidad (Saber Arcano).',
  },
  'race:dwarf': {
    revisedTraits: '- Corrección: Afinidad con una habilidad (Saber Arcano).',
  },
  'race:elf': {
    revisedTraits: '- Identidad revisada: Alto elfo lunar.',
  },
  'race:enano-artico': {
    size: 'small',
  },
  'race:enano-dorado': {
    revisedTraits: '- Corrección: Afinidad con una habilidad (Saber Arcano).',
  },
  'race:gran-trasgo': {
    revisedTraits: '- Identidad equivalente: Hobgoblin.',
  },
  'race:halfelf': {
    revisedTraits: '- Habilidoso: 4 puntos de habilidad adicionales a 1.er nivel.',
  },
  'race:halfling': {
    revisedTraits: '- Identidad revisada: Mediano piesligeros.',
  },
  'race:kobold': {
    revisedTraits: '- Corrección: Artesanía en lugar de Aresanía.',
  },
  'race:minotauro': {
    revisedTraits:
      '- Detalle de tamaño grande: -1 a la CA y al ataque, -4 a las tiradas de Esconderse; puede empuñar armas grandes con una sola mano.',
  },
  'race:ogro': {
    revisedTraits:
      '- Detalle de tamaño grande: -1 a la CA y al ataque, -4 a las tiradas de Esconderse; puede empuñar armas grandes con una sola mano.',
  },
  'race:ogro-hechicero': {
    revisedTraits:
      '- Identidad revisada: Oni.\n- Aprendizaje rápido: gana 1 dote adicional a 1.er nivel.\n- Habilidoso: 4 puntos de habilidad adicionales a 1.er nivel.\n- Detalle de tamaño grande: -1 a la CA y al ataque, -4 a las tiradas de Esconderse; puede empuñar armas grandes con una sola mano.',
  },
  'race:semiogro': {
    revisedTraits:
      '- Detalle de tamaño grande: -1 a la CA y al ataque, -4 a las tiradas de Esconderse; puede empuñar armas grandes con una sola mano.',
  },
  'race:trasgo': {
    revisedTraits:
      '- Identidad equivalente: Goblin.\n- Detalle de tamaño pequeño: +1 a la CA, +1 al ataque, +4 a las pruebas de Esconderse; deben utilizar armas más pequeñas que las utilizadas por los humanos.',
  },
};

const BASIC_SUBRACE_PARENT_RACES: CuratedSubraceParentRace[] = [
  { id: 'race:human' },
  { id: 'race:halfelf' },
  { id: 'race:halforc' },
  { id: 'race:elfo-solar' },
  { id: 'race:elf' },
  { id: 'race:elfo-silvano' },
  { id: 'race:duergar' },
  { id: 'race:enano-dorado' },
  { id: 'race:draconido' },
  { id: 'race:halfling' },
  { id: 'race:mediano-fortecor' },
  { id: 'race:gnome' },
  { id: 'race:tiefling' },
];

const CURATED_SUBRACE_TEMPLATES: CuratedSubraceTemplate[] = [
  {
    abilityAdjustments: {
      ...ZERO_ABILITY_ADJUSTMENTS,
      cha: 2,
      int: 2,
      wis: 2,
    },
    description:
      'Liche\n\nAjustes: +2 Inteligencia, +2 Sabiduría, +2 Carisma.\nCA natural: +5.\nHabilidades: +8 Avistar, +8 Escuchar, +8 Esconderse, +8 Moverse sigilosamente, +8 Buscar, +8 Averiguar intenciones.',
    humanId: 'subrace:liche',
    key: 'liche',
    label: 'Liche',
    skillBonuses: {
      'skill:averiguarintenciones': 8,
      'skill:avistar': 8,
      'skill:buscar': 8,
      'skill:escuchar': 8,
      'skill:esconderse': 8,
      'skill:moversesigilosamente': 8,
    },
    sourceRow: 900001,
  },
  {
    abilityAdjustments: {
      ...ZERO_ABILITY_ADJUSTMENTS,
      con: 2,
      wis: 2,
    },
    description:
      'Licántropo\n\nAjustes: +2 Sabiduría, +2 Constitución.\nCA natural: +2.\nDotes adicionales: Voluntad de hierro.\nHabilidades: +2 Buscar.',
    humanId: 'subrace:licantropo',
    key: 'licantropo',
    label: 'Licántropo',
    skillBonuses: {
      'skill:buscar': 2,
    },
    sourceRow: 900002,
  },
  {
    abilityAdjustments: {
      ...ZERO_ABILITY_ADJUSTMENTS,
      dex: 2,
    },
    description:
      'Tumulario\n\nAjustes: +2 Destreza.\nHabilidades: +8 Moverse sigilosamente.',
    humanId: 'subrace:tumulario',
    key: 'tumulario',
    label: 'Tumulario',
    skillBonuses: {
      'skill:moversesigilosamente': 8,
    },
    sourceRow: 900003,
  },
  {
    abilityAdjustments: {
      ...ZERO_ABILITY_ADJUSTMENTS,
      cha: 2,
      con: 2,
    },
    description:
      'Umbra\n\nAjustes: +2 Constitución, +2 Carisma.\nCA natural: +4.\nTiros de salvación: +4 de suerte.\nResistencia mágica: 11 + nivel de personaje.\nAtaque: +2 a las tiradas de ataque.\nHabilidades: +4 Avistar, +4 Escuchar, +8 Esconderse, +8 Moverse sigilosamente.',
    humanId: 'subrace:umbra',
    key: 'umbra',
    label: 'Umbra',
    skillBonuses: {
      'skill:avistar': 4,
      'skill:escuchar': 4,
      'skill:esconderse': 8,
      'skill:moversesigilosamente': 8,
    },
    sourceRow: 900006,
  },
  {
    abilityAdjustments: {
      ...ZERO_ABILITY_ADJUSTMENTS,
      cha: 4,
      dex: 4,
      int: 2,
      str: 6,
      wis: 2,
    },
    description:
      'Vampiro\n\nAjustes: +6 Fuerza, +4 Destreza, +2 Inteligencia, +2 Sabiduría, +4 Carisma.\nCA natural: +6.\nDotes adicionales: Alerta, Esquiva, Iniciativa mejorada, Reflejos rápidos, Competencia con arma (criatura).',
    humanId: 'subrace:vampiro',
    key: 'vampiro',
    label: 'Vampiro',
    skillBonuses: {},
    sourceRow: 900004,
  },
  {
    abilityAdjustments: { ...ZERO_ABILITY_ADJUSTMENTS },
    description:
      'Engendro\n\nHabilidades: +2 Avistar, +2 Esconderse, +2 Moverse sigilosamente, +2 Buscar, +2 Engañar, +2 Escuchar, +2 Averiguar intenciones.',
    humanId: 'subrace:engendro-vampirico',
    key: 'engendro',
    label: 'Engendro',
    skillBonuses: {
      'skill:averiguarintenciones': 2,
      'skill:avistar': 2,
      'skill:buscar': 2,
      'skill:engaar': 2,
      'skill:escuchar': 2,
      'skill:esconderse': 2,
      'skill:moversesigilosamente': 2,
    },
    sourceRow: 900005,
  },
];

const CURATED_STANDALONE_SUBRACES: CuratedStandaloneSubrace[] = [
  {
    abilityAdjustments: { ...ZERO_ABILITY_ADJUSTMENTS },
    description:
      'Elfo Lythari\n\nCA natural: +2.\nDotes adicionales: Voluntad de hierro.\nHabilidades: +2 Buscar.\nAfinidad con una habilidad: Escuchar, Buscar, Avistar.\nSentidos agudos.',
    id: 'subrace:elfo-lythari',
    label: 'Elfo Lythari',
    parentRaceId: 'race:elf',
    skillBonuses: {
      'skill:avistar': 2,
      'skill:buscar': 4,
      'skill:escuchar': 2,
    },
    sourceRow: 901900,
  },
];

function createCuratedSubraceId(
  parentRaceId: string,
  template: CuratedSubraceTemplate,
): string {
  if (parentRaceId === 'race:human') {
    return template.humanId;
  }
  return `subrace:${parentRaceId.replace(/^race:/, '')}-${template.key}`;
}

function createCuratedSubraces() {
  const subraces: CompiledSubrace[] = [];
  const mechanics = new Map<string, PlannerSubraceMechanics>();

  BASIC_SUBRACE_PARENT_RACES.forEach((parentRace, parentIndex) => {
    CURATED_SUBRACE_TEMPLATES.forEach((template, templateIndex) => {
      const id = createCuratedSubraceId(parentRace.id, template);
      subraces.push({
        description: template.description,
        id,
        isDeprecated: false,
        label: template.label,
        parentRaceId: parentRace.id,
        sourceRow:
          parentRace.id === 'race:human'
            ? template.sourceRow
            : 901000 + parentIndex * 100 + templateIndex,
      });
      mechanics.set(id, {
        abilityAdjustments: { ...template.abilityAdjustments },
        skillBonuses: { ...template.skillBonuses },
      });
    });
  });

  CURATED_STANDALONE_SUBRACES.forEach((subrace) => {
    subraces.push({
      description: subrace.description,
      id: subrace.id,
      isDeprecated: false,
      label: subrace.label,
      parentRaceId: subrace.parentRaceId,
      sourceRow: subrace.sourceRow,
    });
    mechanics.set(subrace.id, {
      abilityAdjustments: { ...subrace.abilityAdjustments },
      skillBonuses: { ...subrace.skillBonuses },
    });
  });

  return { mechanics, subraces };
}

const CURATED_BASIC_SUBRACES = createCuratedSubraces();

export const plannerSubraceMechanicsById: ReadonlyMap<
  string,
  PlannerSubraceMechanics
> = CURATED_BASIC_SUBRACES.mechanics;

export const plannerRaceSkillBonusesById: ReadonlyMap<
  string,
  PlannerSkillBonuses
> = new Map(
  Object.entries(RACE_SKILL_BONUSES_BY_ID).map(([raceId, skillBonuses]) => [
    raceId,
    { ...skillBonuses },
  ]),
);

function mergeSubraces(
  extracted: readonly CompiledSubrace[],
  curated: readonly CompiledSubrace[],
): CompiledSubrace[] {
  const byId = new Map<string, CompiledSubrace>();
  for (const subrace of extracted) {
    byId.set(subrace.id, subrace);
  }
  for (const subrace of curated) {
    byId.set(subrace.id, subrace);
  }
  return [...byId.values()];
}

function applyRaceTraitOverrides(
  extracted: readonly CompiledRace[],
): CompiledRace[] {
  return extracted.map((race) => {
    const override = RACE_TRAIT_OVERRIDES_BY_ID[race.id];
    if (!override) {
      return race;
    }

    const revisedTraits = override.revisedTraits?.trim();
    const description = revisedTraits
      ? `${race.description}\n\nRasgos revisados de Puerta:\n${revisedTraits}`
      : race.description;

    return {
      ...race,
      description,
      size: override.size ?? race.size,
    };
  });
}

export const plannerRaceCatalog: RaceCatalog = raceCatalogSchema.parse({
  ...compiledRaceCatalog,
  races: applyRaceTraitOverrides(compiledRaceCatalog.races),
  subraces: mergeSubraces(
    compiledRaceCatalog.subraces,
    CURATED_BASIC_SUBRACES.subraces,
  ),
});
