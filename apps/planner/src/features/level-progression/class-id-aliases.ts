import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

interface ClassVariantAlias {
  dataId: CanonicalId;
  label: string;
  plannerId: CanonicalId;
}

export const CLASS_VARIANT_ALIASES: readonly ClassVariantAlias[] = [
  {
    dataId: 'class:harper' as CanonicalId,
    label: 'Agente Custodio (Arcano)',
    plannerId: 'class:harper-arcane' as CanonicalId,
  },
  {
    dataId: 'class:harper' as CanonicalId,
    label: 'Agente Custodio (Divino)',
    plannerId: 'class:harper-divine' as CanonicalId,
  },
  {
    dataId: 'class:shadowadept' as CanonicalId,
    label: 'Adepto Sombrio (Arcano)',
    plannerId: 'class:shadowadept-arcane' as CanonicalId,
  },
  {
    dataId: 'class:shadowadept' as CanonicalId,
    label: 'Adepto Sombrio (Divino)',
    plannerId: 'class:shadowadept-divine' as CanonicalId,
  },
] as const;

const DATA_ID_BY_PLANNER_ID = new Map(
  CLASS_VARIANT_ALIASES.map((alias) => [alias.plannerId, alias.dataId] as const),
);

const PLANNER_ID_BY_DATA_ID_AND_LABEL = new Map<string, CanonicalId>(
  CLASS_VARIANT_ALIASES.map((alias) => [
    `${alias.dataId}\u0000${alias.label}`,
    alias.plannerId,
  ] as const),
);

const LEGACY_PLANNER_ID_BY_DATA_ID = new Map<CanonicalId, CanonicalId>([
  ['class:harper' as CanonicalId, 'class:harper-arcane' as CanonicalId],
  ['class:shadowadept' as CanonicalId, 'class:shadowadept-arcane' as CanonicalId],
]);

export function getPlannerClassIdForCompiledClass(input: {
  id: string;
  label: string;
}): CanonicalId {
  return (
    PLANNER_ID_BY_DATA_ID_AND_LABEL.get(`${input.id}\u0000${input.label}`) ??
    (input.id as CanonicalId)
  );
}

export function resolveClassDataId(classId: string | null): CanonicalId | null {
  if (!classId) {
    return null;
  }
  return DATA_ID_BY_PLANNER_ID.get(classId as CanonicalId) ?? (classId as CanonicalId);
}

export function resolveLegacyPlannerClassId(
  classId: string | null,
): CanonicalId | null {
  if (!classId) {
    return null;
  }
  return (
    LEGACY_PLANNER_ID_BY_DATA_ID.get(classId as CanonicalId) ??
    (classId as CanonicalId)
  );
}

export function getPlannerVariantIdsForDataId(dataId: string): CanonicalId[] {
  return CLASS_VARIANT_ALIASES.filter((alias) => alias.dataId === dataId).map(
    (alias) => alias.plannerId,
  );
}
