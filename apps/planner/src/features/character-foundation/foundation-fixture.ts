import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { CURRENT_DATASET_ID } from '@planner/data/ruleset-version';

export const ATTRIBUTE_KEYS = [
  'str',
  'dex',
  'con',
  'int',
  'wis',
  'cha',
] as const;

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];
export type FoundationStatus = 'blocked' | 'illegal' | 'legal';

export interface FoundationRaceOption {
  allowedAlignmentIds: CanonicalId[];
  deityPolicy: 'optional' | 'required';
  id: CanonicalId;
  label: string;
}

export interface FoundationSubraceOption {
  allowedAlignmentIds: CanonicalId[];
  id: CanonicalId;
  label: string;
  parentRaceId: CanonicalId;
}

export interface FoundationAlignmentOption {
  goodEvil: 'evil' | 'good' | 'neutral';
  id: CanonicalId;
  label: string;
  lawChaos: 'chaotic' | 'lawful' | 'neutral';
}

export interface AttributeRules {
  baseScore: number;
  budget: number;
  costByScore: Record<string, number>;
  maximum: number;
  minimum: number;
}

export interface Phase03FoundationFixture {
  alignments: FoundationAlignmentOption[];
  attributeRules: AttributeRules;
  datasetId: string;
  races: FoundationRaceOption[];
  subraces: FoundationSubraceOption[];
}

const ALL_ALIGNMENT_IDS: CanonicalId[] = [
  'alignment:lawful-good',
  'alignment:neutral-good',
  'alignment:chaotic-good',
  'alignment:lawful-neutral',
  'alignment:true-neutral',
  'alignment:chaotic-neutral',
  'alignment:lawful-evil',
  'alignment:neutral-evil',
  'alignment:chaotic-evil',
];

export const phase03FoundationFixture: Phase03FoundationFixture = {
  alignments: [
    {
      goodEvil: 'good',
      id: 'alignment:lawful-good',
      label: 'Legal bueno',
      lawChaos: 'lawful',
    },
    {
      goodEvil: 'good',
      id: 'alignment:neutral-good',
      label: 'Neutral bueno',
      lawChaos: 'neutral',
    },
    {
      goodEvil: 'good',
      id: 'alignment:chaotic-good',
      label: 'Caótico bueno',
      lawChaos: 'chaotic',
    },
    {
      goodEvil: 'neutral',
      id: 'alignment:lawful-neutral',
      label: 'Legal neutral',
      lawChaos: 'lawful',
    },
    {
      goodEvil: 'neutral',
      id: 'alignment:true-neutral',
      label: 'Neutral puro',
      lawChaos: 'neutral',
    },
    {
      goodEvil: 'neutral',
      id: 'alignment:chaotic-neutral',
      label: 'Caótico neutral',
      lawChaos: 'chaotic',
    },
    {
      goodEvil: 'evil',
      id: 'alignment:lawful-evil',
      label: 'Legal maligno',
      lawChaos: 'lawful',
    },
    {
      goodEvil: 'evil',
      id: 'alignment:neutral-evil',
      label: 'Neutral maligno',
      lawChaos: 'neutral',
    },
    {
      goodEvil: 'evil',
      id: 'alignment:chaotic-evil',
      label: 'Caótico maligno',
      lawChaos: 'chaotic',
    },
  ],
  attributeRules: {
    baseScore: 8,
    budget: 30,
    costByScore: {
      '10': 2,
      '11': 3,
      '12': 4,
      '13': 5,
      '14': 6,
      '15': 8,
      '16': 10,
      '17': 13,
      '18': 16,
      '8': 0,
      '9': 1,
    },
    maximum: 18,
    minimum: 8,
  },
  datasetId: CURRENT_DATASET_ID,
  races: [
    {
      allowedAlignmentIds: ALL_ALIGNMENT_IDS,
      deityPolicy: 'optional',
      id: 'race:human',
      label: 'Humano',
    },
    {
      allowedAlignmentIds: [
        'alignment:neutral-good',
        'alignment:chaotic-good',
        'alignment:true-neutral',
        'alignment:chaotic-neutral',
      ],
      deityPolicy: 'optional',
      id: 'race:elf',
      label: 'Elfo',
    },
    {
      allowedAlignmentIds: [
        'alignment:lawful-good',
        'alignment:neutral-good',
        'alignment:lawful-neutral',
        'alignment:true-neutral',
      ],
      deityPolicy: 'optional',
      id: 'race:dwarf',
      label: 'Enano',
    },
  ],
  subraces: [
    {
      allowedAlignmentIds: [
        'alignment:neutral-good',
        'alignment:chaotic-good',
        'alignment:true-neutral',
      ],
      id: 'subrace:moon-elf',
      label: 'Elfo lunar',
      parentRaceId: 'race:elf',
    },
    {
      allowedAlignmentIds: [
        'alignment:neutral-good',
        'alignment:chaotic-good',
        'alignment:chaotic-neutral',
      ],
      id: 'subrace:wild-elf',
      label: 'Elfo salvaje',
      parentRaceId: 'race:elf',
    },
    {
      allowedAlignmentIds: [
        'alignment:lawful-good',
        'alignment:neutral-good',
        'alignment:lawful-neutral',
      ],
      id: 'subrace:shield-dwarf',
      label: 'Enano escudero',
      parentRaceId: 'race:dwarf',
    },
  ],
};
