import type {
  CompiledSpell,
  SpellCatalog,
} from '@data-extractor/contracts/spell-catalog';

export interface SpellEligibilityInput {
  classId: string;
  casterLevel: number;
  spellLevel: number;
  catalog: SpellCatalog;
  alreadyKnown: Set<string>;
}

export interface SpellEligibilityResult {
  eligible: CompiledSpell[];
  ineligible: Array<{ spell: CompiledSpell; reason: string }>;
}

/**
 * Filter compiled spells to those a character of the given (class, casterLevel, spellLevel)
 * is eligible to learn, splitting the catalog into eligible and ineligible buckets with
 * Spanish reasons for ineligibility (currently just "Ya conocido" for alreadyKnown entries).
 *
 * Mirrors the pattern of `feat-eligibility.ts::getEligibleFeats` but with the much simpler
 * access rule: a spell is eligible iff the compiled `classLevels[classId]` equals the target
 * spellLevel and the spell is not already in the `alreadyKnown` set.
 */
export function getEligibleSpellsAtLevel(
  input: SpellEligibilityInput,
): SpellEligibilityResult {
  const { classId, spellLevel, catalog, alreadyKnown } = input;

  const eligible: CompiledSpell[] = [];
  const ineligible: Array<{ spell: CompiledSpell; reason: string }> = [];

  for (const spell of catalog.spells) {
    const requiredLevel = spell.classLevels[classId];
    if (requiredLevel == null) continue;
    if (requiredLevel !== spellLevel) continue;

    if (alreadyKnown.has(spell.id)) {
      ineligible.push({ spell, reason: 'Ya conocido' });
      continue;
    }

    eligible.push(spell);
  }

  return { eligible, ineligible };
}
