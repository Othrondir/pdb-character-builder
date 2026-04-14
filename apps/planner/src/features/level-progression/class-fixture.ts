import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

export type PlannerAbilityKey = 'cha' | 'con' | 'dex' | 'int' | 'str' | 'wis';
export type PlannerClassKind = 'base' | 'prestige';

export interface PlannerClassAbilityRequirement {
  key: PlannerAbilityKey;
  score: number;
}

export interface PlannerClassImplementedRequirements {
  allowedAlignmentIds?: CanonicalId[];
  minimumAbilityScores?: PlannerClassAbilityRequirement[];
  requiresDeity?: boolean;
}

export interface PlannerClassGainRow {
  choicePrompts: string[];
  classLevel: number;
  features: string[];
}

export interface PlannerClassExceptionOverride {
  code: string;
  sourceClassId: CanonicalId;
  targetClassId: CanonicalId;
}

export interface PlannerClassRecord {
  deferredRequirementLabels: string[];
  exceptionOverrides?: PlannerClassExceptionOverride[];
  exclusiveClassIds?: CanonicalId[];
  gainTable: PlannerClassGainRow[];
  hitDie: number;
  id: CanonicalId;
  implementedRequirements: PlannerClassImplementedRequirements;
  kind: PlannerClassKind;
  label: string;
  minimumClassCommitment?: number;
  tags: string[];
}

export interface Phase04ClassFixture {
  abilityIncreaseLevels: number[];
  classes: PlannerClassRecord[];
}

export const phase04ClassFixture: Phase04ClassFixture = {
  abilityIncreaseLevels: [4, 8, 12, 16],
  classes: [
    {
      deferredRequirementLabels: [],
      exceptionOverrides: [],
      exclusiveClassIds: [],
      gainTable: [
        {
          choicePrompts: [],
          classLevel: 1,
          features: ['Dado de golpe d10', 'Competencias marciales'],
        },
        {
          choicePrompts: [],
          classLevel: 2,
          features: ['Dado de golpe d10', 'Mejora de ataque base'],
        },
        {
          choicePrompts: [],
          classLevel: 3,
          features: ['Dado de golpe d10', 'Afinar especialización marcial'],
        },
        {
          choicePrompts: [],
          classLevel: 4,
          features: ['Dado de golpe d10', 'Talento adicional de combate'],
        },
      ],
      hitDie: 10,
      id: 'class:fighter',
      implementedRequirements: {},
      kind: 'base',
      label: 'Guerrero',
      tags: ['martial'],
    },
    {
      deferredRequirementLabels: [],
      exceptionOverrides: [],
      exclusiveClassIds: [],
      gainTable: [
        {
          choicePrompts: [],
          classLevel: 1,
          features: ['Dado de golpe d6', 'Ataque furtivo +1d6'],
        },
        {
          choicePrompts: [],
          classLevel: 2,
          features: ['Dado de golpe d6', 'Evasión'],
        },
        {
          choicePrompts: [],
          classLevel: 3,
          features: ['Dado de golpe d6', 'Ataque furtivo +2d6'],
        },
        {
          choicePrompts: [],
          classLevel: 4,
          features: ['Dado de golpe d6', 'Sentido de las trampas +1'],
        },
      ],
      hitDie: 6,
      id: 'class:rogue',
      implementedRequirements: {},
      kind: 'base',
      label: 'Pícaro',
      minimumClassCommitment: 2,
      tags: ['skillful'],
    },
    {
      deferredRequirementLabels: [],
      exceptionOverrides: [],
      exclusiveClassIds: [],
      gainTable: [
        {
          choicePrompts: ['Seleccionar escuela o enfoque futuro'],
          classLevel: 1,
          features: ['Dado de golpe d4', 'Libro de conjuros'],
        },
        {
          choicePrompts: [],
          classLevel: 2,
          features: ['Dado de golpe d4', 'Talento adicional de magia futura'],
        },
        {
          choicePrompts: [],
          classLevel: 3,
          features: ['Dado de golpe d4', 'Progresión arcana'],
        },
        {
          choicePrompts: ['Reservar especialización adicional para fases posteriores'],
          classLevel: 4,
          features: ['Dado de golpe d4', 'Nivel de conjuro aumentado'],
        },
      ],
      hitDie: 4,
      id: 'class:wizard',
      implementedRequirements: {
        minimumAbilityScores: [{ key: 'int', score: 11 }],
      },
      kind: 'base',
      label: 'Mago',
      tags: ['arcane'],
    },
    {
      deferredRequirementLabels: [],
      exceptionOverrides: [],
      exclusiveClassIds: [],
      gainTable: [
        {
          choicePrompts: ['Reservar dominios para fases posteriores'],
          classLevel: 1,
          features: ['Dado de golpe d8', 'Canalización divina'],
        },
        {
          choicePrompts: [],
          classLevel: 2,
          features: ['Dado de golpe d8', 'Progresión divina'],
        },
        {
          choicePrompts: [],
          classLevel: 3,
          features: ['Dado de golpe d8', 'Mejora de lanzamiento divino'],
        },
        {
          choicePrompts: ['Preparar incremento de conjuros de dominio'],
          classLevel: 4,
          features: ['Dado de golpe d8', 'Canalización fortalecida'],
        },
      ],
      hitDie: 8,
      id: 'class:cleric',
      implementedRequirements: {
        requiresDeity: true,
      },
      kind: 'base',
      label: 'Clérigo',
      tags: ['divine'],
    },
    {
      deferredRequirementLabels: [],
      exceptionOverrides: [],
      exclusiveClassIds: [],
      gainTable: [
        {
          choicePrompts: [],
          classLevel: 1,
          features: ['Dado de golpe d10', 'Gracia divina'],
        },
        {
          choicePrompts: [],
          classLevel: 2,
          features: ['Dado de golpe d10', 'Salud divina'],
        },
        {
          choicePrompts: [],
          classLevel: 3,
          features: ['Dado de golpe d10', 'Aura de valentía'],
        },
        {
          choicePrompts: [],
          classLevel: 4,
          features: ['Dado de golpe d10', 'Imposición de manos reforzada'],
        },
      ],
      hitDie: 10,
      id: 'class:paladin',
      implementedRequirements: {
        allowedAlignmentIds: ['alignment:lawful-good'],
      },
      kind: 'base',
      label: 'Paladín',
      minimumClassCommitment: 2,
      tags: ['divine', 'martial'],
    },
    {
      deferredRequirementLabels: [
        'Pendiente de dotes o habilidades de fases posteriores.',
      ],
      exceptionOverrides: [
        {
          code: 'puerta.shadowdancer-rogue-bridge',
          sourceClassId: 'class:rogue',
          targetClassId: 'class:shadowdancer',
        },
      ],
      exclusiveClassIds: [],
      gainTable: [
        {
          choicePrompts: [],
          classLevel: 1,
          features: ['Esquiva asombrosa'],
        },
      ],
      hitDie: 8,
      id: 'class:shadowdancer',
      implementedRequirements: {},
      kind: 'prestige',
      label: 'Sombra danzante',
      tags: ['prestige', 'stealth'],
    },
    {
      deferredRequirementLabels: [
        'Pendiente de dotes o habilidades de fases posteriores.',
      ],
      exceptionOverrides: [],
      exclusiveClassIds: [],
      gainTable: [
        {
          choicePrompts: [],
          classLevel: 1,
          features: ['Arma predilecta futura'],
        },
      ],
      hitDie: 10,
      id: 'class:weapon-master',
      implementedRequirements: {},
      kind: 'prestige',
      label: 'Maestro de armas',
      tags: ['martial', 'prestige'],
    },
  ],
};

export function getPhase04ClassRecord(classId: CanonicalId | null) {
  if (!classId) {
    return null;
  }

  return phase04ClassFixture.classes.find((entry) => entry.id === classId) ?? null;
}
