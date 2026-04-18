import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type {
  CompiledRace,
  CompiledSubrace,
} from '@data-extractor/contracts/race-catalog';
import { compiledRaceCatalog } from '@planner/data/compiled-races';
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
  description: string;
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

/**
 * Phase 12.1 Plan 02 — projection adapters that bridge the compiled-extractor
 * race catalog (`CompiledRace` / `CompiledSubrace`) to the planner's
 * `FoundationRaceOption` / `FoundationSubraceOption` shape consumed by
 * `selectOriginOptions`.
 *
 * Per plan D-01 (compiled catalog has no alignment/deity fields):
 *  - `allowedAlignmentIds` defaults to ALL_ALIGNMENT_IDS. Alignment gating
 *    for PDB-custom races is upstream in extractor overrides (tracked in
 *    12.1-CONTEXT.md deferred section).
 *  - `deityPolicy` defaults to `'optional'` — CHAR-03 was descoped v1 → v2
 *    per REQUIREMENTS.md; `'optional'` is the safe no-op default that
 *    foundation selectors already treat as "no deity required".
 */
function projectCompiledRace(compiled: CompiledRace): FoundationRaceOption {
  return {
    allowedAlignmentIds: ALL_ALIGNMENT_IDS,
    deityPolicy: 'optional',
    description: compiled.description,
    id: compiled.id as CanonicalId,
    label: compiled.label,
  };
}

function projectCompiledSubrace(
  compiled: CompiledSubrace,
): FoundationSubraceOption {
  return {
    allowedAlignmentIds: ALL_ALIGNMENT_IDS,
    id: compiled.id as CanonicalId,
    label: compiled.label,
    parentRaceId: compiled.parentRaceId as CanonicalId,
  };
}

/**
 * Phase 12.1 Plan 02 Rule 2 auto-fix — the compiled race catalog emitted by
 * the extractor on 2026-04-17 contains duplicate IDs (e.g. `race:drow`
 * appears at rows 196 + 676). The hand-authored 3-race fixture never
 * surfaced this because those IDs were not rendered. Projecting the full
 * catalog exposes the duplicates as React-key collisions in the picker.
 *
 * Dedupe at the projection boundary (first-wins) so the UI stays safe
 * regardless of when the extractor backlog lands a canonical-ID uniqueness
 * gate. Tracked as an extractor-side follow-up in 12.1-CONTEXT.md deferred.
 */
function dedupeByCanonicalId<T extends { id: CanonicalId }>(entries: T[]): T[] {
  const seen = new Set<CanonicalId>();
  const unique: T[] = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      continue;
    }
    seen.add(entry.id);
    unique.push(entry);
  }
  return unique;
}

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
  races: dedupeByCanonicalId(compiledRaceCatalog.races.map(projectCompiledRace)),
  subraces: dedupeByCanonicalId(
    compiledRaceCatalog.subraces.map(projectCompiledSubrace),
  ),
};
