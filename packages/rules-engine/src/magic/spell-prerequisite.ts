import type {
  CompiledSpell,
  SpellCatalog,
} from '@data-extractor/contracts/spell-catalog';
import type {
  BuildStateAtLevel,
  PrerequisiteCheck,
  PrerequisiteCheckResult,
} from '../feats/feat-prerequisite';
import { computeSpellSlots } from './caster-level';

export type {
  BuildStateAtLevel,
  PrerequisiteCheck,
  PrerequisiteCheckResult,
} from '../feats/feat-prerequisite';

/**
 * Spanish class labels used by spell prerequisite checks. Mirrors the ABILITY_LABELS
 * pattern from `feat-prerequisite.ts` and keeps spell checks readable for Spanish-first
 * UI copy without duplicating feat translation maps.
 *
 * Unknown class IDs (e.g. Puerta-custom prestige classes) fall back to the canonical id
 * until a class-label map is promoted to a shared contract.
 */
const CLASS_LABELS_ES: Record<string, string> = {
  'class:cleric': 'Clérigo',
  'class:wizard': 'Mago',
  'class:sorcerer': 'Hechicero',
  'class:druid': 'Druida',
  'class:bard': 'Bardo',
  'class:paladin': 'Paladín',
  'class:ranger': 'Explorador',
};

/**
 * Find the minimum caster-class level at which a class first unlocks a slot for the
 * given spellLevel, by scanning the spell-gain 2DA table directly. Returns the smallest
 * casterLevel L such that `slots[spellLevel] > 0`, or null if no row ever grants that
 * slot (e.g., half-casters never access 6th+ spells).
 *
 * Reading the table beats hand-coded formulas because Puerta custom classes can ship
 * their own progression curves — the data is always the source of truth.
 */
function spellAccessMinCasterLevel(
  classId: string,
  spellLevel: number,
  spellCatalog: SpellCatalog,
): number | null {
  const table = spellCatalog.spellGainTables[classId];
  if (!table || table.length === 0) return null;
  for (const row of table) {
    if (computeSpellSlots(classId, row.casterLevel, spellLevel, spellCatalog) > 0) {
      return row.casterLevel;
    }
  }
  return null;
}

/**
 * Evaluate whether a character can cast / learn a given spell.
 *
 * Returns a PrerequisiteCheckResult whose checks list one entry per class that has the
 * spell on its spell list, with Spanish labels (Mago, Clérigo, Hechicero, ...). The spell
 * is legal if ANY one of its class prerequisites passes — hence `met = checks.some(...)`,
 * unlike feats which require `every`.
 */
export function evaluateSpellPrerequisites(
  spell: CompiledSpell,
  buildState: BuildStateAtLevel,
  spellCatalog: SpellCatalog,
): PrerequisiteCheckResult {
  const checks: PrerequisiteCheck[] = [];

  for (const [classId, requiredSpellLevel] of Object.entries(spell.classLevels)) {
    const casterLevel = buildState.casterLevelByClass[classId] ?? 0;
    const minCasterLevel =
      spellAccessMinCasterLevel(classId, requiredSpellLevel, spellCatalog) ??
      // Fallback for classes without a gain table — conservative full-caster approximation
      // (Assumption A5): S==0 cantrips at 1, else 2*S-1. Keeps pre-extractor-only classes
      // evaluable rather than silently dropping the check.
      (requiredSpellLevel === 0 ? 1 : 2 * requiredSpellLevel - 1);
    const label = CLASS_LABELS_ES[classId] ?? classId;

    checks.push({
      type: 'class-level',
      label,
      met: casterLevel >= minCasterLevel,
      required: `Nivel ${minCasterLevel}`,
      current: casterLevel > 0 ? `Nivel ${casterLevel}` : 'Sin niveles',
    });
  }

  return {
    met: checks.some((c) => c.met),
    checks,
  };
}
