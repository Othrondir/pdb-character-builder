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

/**
 * Phase 12.2-03 (D-04) — decode the NWN hex alignment mask from a
 * CompiledClass.prerequisiteColumns.AlignRestrict entry. Returns the allowed
 * CanonicalId alignment list, or undefined when no gate applies.
 *
 * Hex-bit convention (NWN Aurora 2DA):
 *   0x001 = LG, 0x002 = LN, 0x004 = LE,
 *   0x008 = NG, 0x010 = TN, 0x020 = NE,
 *   0x040 = CG, 0x080 = CN, 0x100 = CE.
 *
 * `InvertRestrict === '1'` inverts the mask: the listed alignments are
 * FORBIDDEN; the allowed set is the complement over the 9-alignment
 * universe. `0x00` with or without inversion emits no gate.
 */
const ALIGNMENT_BITS: ReadonlyArray<readonly [number, CanonicalId]> = [
  [0x001, 'alignment:lawful-good' as CanonicalId],
  [0x002, 'alignment:lawful-neutral' as CanonicalId],
  [0x004, 'alignment:lawful-evil' as CanonicalId],
  [0x008, 'alignment:neutral-good' as CanonicalId],
  [0x010, 'alignment:true-neutral' as CanonicalId],
  [0x020, 'alignment:neutral-evil' as CanonicalId],
  [0x040, 'alignment:chaotic-good' as CanonicalId],
  [0x080, 'alignment:chaotic-neutral' as CanonicalId],
  [0x100, 'alignment:chaotic-evil' as CanonicalId],
];

export function decodeAlignRestrict(
  mask: string | null,
  inverted: string | null,
): CanonicalId[] | undefined {
  if (!mask) return undefined;
  const parsed = Number.parseInt(mask, 16);
  if (!Number.isFinite(parsed) || parsed === 0) return undefined;

  const allowed: CanonicalId[] = [];
  const forbidden: CanonicalId[] = [];
  for (const [bit, id] of ALIGNMENT_BITS) {
    if ((parsed & bit) !== 0) {
      allowed.push(id);
    } else {
      forbidden.push(id);
    }
  }

  return inverted === '1' ? forbidden : allowed;
}

export function decodePrerequisiteMaxLevel(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed === 0) return null;
  return parsed;
}

/**
 * Phase 12.2-03 (D-04) — curated allowlist of base classes reachable at L1
 * without server-specific prereqs (BAB / class-level / feat prereqs).
 * Classes tagged `isBase: true` in the compiled catalog but NOT in this
 * allowlist (e.g. Alma Predilecta, Caballero de Luz, Paladin Oscuro,
 * Paladin Vengador, Artífice) fall through to the fail-closed
 * deferred-label branch in `projectCompiledClass`.
 *
 * Long-term fix: extractor emits real PreReqTable decoding or a
 * `reachableAtLevelOne: boolean` field, and this allowlist shrinks to
 * empty. Tracked in 12.2-CONTEXT.md `<deferred>`.
 */
export const BASE_CLASS_ALLOWLIST: ReadonlyArray<CanonicalId> = [
  'class:barbarian' as CanonicalId,
  'class:bard' as CanonicalId,
  'class:cleric' as CanonicalId,
  'class:druid' as CanonicalId,
  'class:fighter' as CanonicalId,
  'class:monk' as CanonicalId,
  'class:paladin' as CanonicalId,
  'class:ranger' as CanonicalId,
  'class:rogue' as CanonicalId,
  'class:sorcerer' as CanonicalId,
  'class:wizard' as CanonicalId,
];

const DEFERRED_LABEL_PRESTIGE =
  'Pendiente de dotes o habilidades de fases posteriores.';
const DEFERRED_LABEL_UNVETTED_BASE =
  'Prerrequisitos específicos del servidor. Revisa las dotes, nivel de lanzador o atributos requeridos.';

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

  // Decode alignment gate from prerequisiteColumns.
  const decodedAlignmentIds = decodeAlignRestrict(
    compiled.prerequisiteColumns.AlignRestrict ?? null,
    compiled.prerequisiteColumns.InvertRestrict ?? null,
  );

  // Merge implementedRequirements: decoded first, overlay last so the
  // hand-authored server-rule overlay wins per-field (paladin LG-only,
  // cleric requiresDeity, wizard INT 11 stay intact).
  const implementedRequirements: PlannerClassImplementedRequirements = {
    ...(decodedAlignmentIds ? { allowedAlignmentIds: decodedAlignmentIds } : {}),
    ...(overlay.implementedRequirements ?? {}),
  };

  // Deferred-label union — fail closed when metadata is ambiguous.
  const deferredRequirementLabels: string[] = [];
  if (!isBase) {
    deferredRequirementLabels.push(DEFERRED_LABEL_PRESTIGE);
  } else if (!BASE_CLASS_ALLOWLIST.includes(compiled.id as CanonicalId)) {
    deferredRequirementLabels.push(DEFERRED_LABEL_UNVETTED_BASE);
  }

  return {
    deferredRequirementLabels,
    description: compiled.description,
    exceptionOverrides: overlay.exceptionOverrides ?? [],
    exclusiveClassIds: overlay.exclusiveClassIds ?? [],
    gainTable: [],
    hitDie: compiled.hitDie,
    id: compiled.id as CanonicalId,
    implementedRequirements,
    kind: isBase ? 'base' : 'prestige',
    label: compiled.label,
    ...(overlay.minimumClassCommitment !== undefined
      ? { minimumClassCommitment: overlay.minimumClassCommitment }
      : {}),
    tags: overlay.tags ?? [],
  };
}

/**
 * Phase 12.2-04 (D-05) — fixture-level first-wins dedupe. Mirrors the
 * race-fixture pattern at apps/planner/src/features/character-foundation/
 * foundation-fixture.ts:135-146. The compiled class catalog currently emits
 * duplicate canonical IDs for prestige variants that collapse to the same
 * slug (`class:harper` at sourceRows 28 + 54 for Arcano/Divino; and
 * `class:shadowadept` at sourceRows 46 + 55). First-wins keeps the lowest-
 * sourceRow occurrence; a console.warn records the dropped row so the
 * extractor backlog stays visible.
 *
 * Long-term fix: extractor emits slug-disambiguated IDs (class:harper-arcane,
 * class:harper-divine). Tracked in 12.2-CONTEXT.md `<deferred>`.
 */
function dedupeCompiledClassesByCanonicalId(
  entries: readonly CompiledClass[],
): CompiledClass[] {
  const seen = new Set<string>();
  const unique: CompiledClass[] = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      console.warn(
        `[12.2-04] Dropped duplicate class id \`${entry.id}\` from compiled-classes.ts (sourceRow=${entry.sourceRow}). Upstream extractor slug-disambiguation tracked in 12.2-CONTEXT.md deferred.`,
      );
      continue;
    }
    seen.add(entry.id);
    unique.push(entry);
  }
  return unique;
}

function projectCompiledClasses(catalog: ClassCatalog): PlannerClassRecord[] {
  return dedupeCompiledClassesByCanonicalId(catalog.classes).map(
    projectCompiledClass,
  );
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
