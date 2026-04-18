import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type {
  ClassCatalog,
  CompiledClass,
} from '@data-extractor/contracts/class-catalog';

import { compiledClassCatalog } from '@planner/data/compiled-classes';

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
  description: string;
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

/**
 * Server-rule overlay — per-class planner data that the compiled extractor
 * does not yet emit (Phase 12.1-01 D-01 "keep non-roster content"):
 *  - `minimumClassCommitment`: Puerta de Baldur multiclass commitment rules.
 *  - `exceptionOverrides`: server-specific prestige-entry bridges
 *    (e.g. `puerta.shadowdancer-rogue-bridge`).
 *  - `implementedRequirements`: alignment / ability / deity gates that
 *    `evaluateClassEntry` reads.
 *
 * The overlay is scoped to known server rules. Future extractor enrichment
 * (tracked in phase CONTEXT.md deferred section) will move these into
 * compiled-classes.ts; the overlay shrinks to empty in lockstep.
 */
interface ClassServerRuleOverlay {
  exceptionOverrides?: PlannerClassExceptionOverride[];
  exclusiveClassIds?: CanonicalId[];
  implementedRequirements?: PlannerClassImplementedRequirements;
  minimumClassCommitment?: number;
  tags?: string[];
}

const CLASS_SERVER_RULE_OVERLAY: Record<string, ClassServerRuleOverlay> = {
  'class:fighter': { tags: ['martial'] },
  'class:rogue': { minimumClassCommitment: 2, tags: ['skillful'] },
  'class:wizard': {
    implementedRequirements: { minimumAbilityScores: [{ key: 'int', score: 11 }] },
    tags: ['arcane'],
  },
  'class:cleric': {
    implementedRequirements: { requiresDeity: true },
    tags: ['divine'],
  },
  'class:paladin': {
    implementedRequirements: {
      allowedAlignmentIds: ['alignment:lawful-good' as CanonicalId],
    },
    minimumClassCommitment: 2,
    tags: ['divine', 'martial'],
  },
  'class:shadowdancer': {
    exceptionOverrides: [
      {
        code: 'puerta.shadowdancer-rogue-bridge',
        sourceClassId: 'class:rogue' as CanonicalId,
        targetClassId: 'class:shadowdancer' as CanonicalId,
      },
    ],
    tags: ['prestige', 'stealth'],
  },
  'class:weapon-master': { tags: ['martial', 'prestige'] },
};

/**
 * Projection adapter — bridges the compiled-extractor schema
 * (`CompiledClass`) to the planner's `PlannerClassRecord` shape consumed by
 * `selectClassOptionsForLevel` / `evaluateMulticlassLegality`.
 *
 * Per plan 12.1-01 D-01/D-02:
 *  - Keep non-roster content (abilityIncreaseLevels, getPhase04ClassRecord).
 *  - Input swap only: no rules-engine contract change.
 *
 * Prestige classes synthesize a single deferred-requirement label so
 * `evaluateClassEntry` continues to gate them as `blocked` at L1 for
 * unqualified foundations, mirroring the hand-authored shadowdancer /
 * weapon-master pattern. Base classes receive an empty deferred list.
 */
function projectCompiledClass(compiled: CompiledClass): PlannerClassRecord {
  const isBase = compiled.isBase;
  const overlay = CLASS_SERVER_RULE_OVERLAY[compiled.id] ?? {};

  return {
    deferredRequirementLabels: isBase
      ? []
      : ['Pendiente de dotes o habilidades de fases posteriores.'],
    description: compiled.description,
    exceptionOverrides: overlay.exceptionOverrides ?? [],
    exclusiveClassIds: overlay.exclusiveClassIds ?? [],
    gainTable: [],
    hitDie: compiled.hitDie,
    id: compiled.id as CanonicalId,
    implementedRequirements: overlay.implementedRequirements ?? {},
    kind: isBase ? 'base' : 'prestige',
    label: compiled.label,
    ...(overlay.minimumClassCommitment !== undefined
      ? { minimumClassCommitment: overlay.minimumClassCommitment }
      : {}),
    tags: overlay.tags ?? [],
  };
}

function projectCompiledClasses(catalog: ClassCatalog): PlannerClassRecord[] {
  return catalog.classes.map(projectCompiledClass);
}

export const phase04ClassFixture: Phase04ClassFixture = {
  abilityIncreaseLevels: [4, 8, 12, 16],
  classes: projectCompiledClasses(compiledClassCatalog),
};

export function getPhase04ClassRecord(classId: CanonicalId | null) {
  if (!classId) {
    return null;
  }

  return phase04ClassFixture.classes.find((entry) => entry.id === classId) ?? null;
}
