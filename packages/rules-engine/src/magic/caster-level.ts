import type { ClassCatalog } from '@data-extractor/contracts/class-catalog';
import type { SpellCatalog } from '@data-extractor/contracts/spell-catalog';

/**
 * Per-class caster level map. Multiclass casters do NOT pool — a cleric 5 / wizard 5
 * build returns { 'class:cleric': 5, 'class:wizard': 5 }, never 10 summed across classes
 * (07-RESEARCH Pitfall 3 — summing corrupts multiclass spell access checks).
 *
 * NWN1 convention (Assumption A4): caster level == class level for all caster classes.
 * Half-caster slot curves (paladin/ranger) are encoded in the class's spell-gain 2DA
 * table itself — the curve lives in the data, not in this function.
 */
export function computeCasterLevelByClass(
  classLevels: Record<string, number>,
  classCatalog: ClassCatalog,
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const [classId, level] of Object.entries(classLevels)) {
    if (level <= 0) continue;

    const classDef = classCatalog.classes.find((c) => c.id === classId);
    if (!classDef) continue;
    if (!classDef.spellCaster) continue;
    if (classDef.spellGainTableRef == null) continue;

    result[classId] = level;
  }

  return result;
}

/**
 * Look up the slot count for a specific (class, casterLevel, spellLevel) tuple.
 *
 * Reads from `spellCatalog.spellGainTables[classId][casterLevel-1].slots[spellLevel]`.
 * Returns 0 if the class has no spell-gain table, the caster level is out of bounds,
 * or the slot level is not granted at that caster level (e.g., level-4 slots at
 * wizard level 3).
 */
export function computeSpellSlots(
  classId: string,
  casterLevel: number,
  spellLevel: number,
  spellCatalog: SpellCatalog,
): number {
  if (casterLevel < 1 || spellLevel < 0 || spellLevel > 9) return 0;

  const table = spellCatalog.spellGainTables[classId];
  if (!table || table.length === 0) return 0;

  const row = table[casterLevel - 1];
  if (!row) return 0;

  const key = String(spellLevel) as
    | '0'
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9';
  return row.slots[key] ?? 0;
}

/**
 * Max spell level accessible across all caster classes the build has levels in.
 *
 * Used by feat prereqs that genuinely want a max across classes (e.g., epic
 * feats requiring "9th-level spell access"). Most feat `minSpellLevel` checks
 * should use this helper rather than reading any single class's caster level.
 */
export function getMaxSpellLevelAcrossClasses(
  casterLevelByClass: Record<string, number>,
  spellCatalog: SpellCatalog,
): number {
  let max = 0;

  for (const [classId, casterLevel] of Object.entries(casterLevelByClass)) {
    for (let spellLevel = 9; spellLevel >= 0; spellLevel--) {
      if (computeSpellSlots(classId, casterLevel, spellLevel, spellCatalog) > 0) {
        if (spellLevel > max) max = spellLevel;
        break;
      }
    }
  }

  return max;
}
