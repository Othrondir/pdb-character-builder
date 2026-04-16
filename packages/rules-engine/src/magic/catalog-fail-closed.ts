import type { SpellCatalog } from '@data-extractor/contracts/spell-catalog';
import type { DomainCatalog } from '@data-extractor/contracts/domain-catalog';
import {
  resolveValidationOutcome,
  type ValidationOutcome,
} from '../contracts/validation-outcome';

/**
 * Produce a `blocked + missing-source` ValidationOutcome when a spell is unknown to the
 * catalog OR its localized description is empty. Used as a fail-closed gate by the
 * magic revalidation cascade so that incomplete extraction data can never masquerade
 * as a legal selection (Threat T-07-03, VALI-02 partial gate).
 *
 * Returns null when the spell exists and has usable data.
 */
export function detectMissingSpellData(
  spellId: string,
  catalog: SpellCatalog,
): ValidationOutcome | null {
  const sp = catalog.spells.find((s) => s.id === spellId);

  if (!sp) {
    return resolveValidationOutcome({
      affectedIds: [spellId],
      blockKind: 'missing-source',
      hasConflict: false,
      hasMissingEvidence: true,
      passesRule: false,
      ruleKnown: true,
    });
  }

  if (sp.description === '') {
    return resolveValidationOutcome({
      affectedIds: [spellId],
      blockKind: 'missing-source',
      hasConflict: false,
      hasMissingEvidence: true,
      passesRule: false,
      ruleKnown: true,
    });
  }

  return null;
}

/**
 * Produce a `blocked + missing-source` ValidationOutcome when a domain is unknown or
 * lacks granted-feat data. Mirrors `detectMissingSpellData` for domain fail-closed.
 *
 * Returns null when the domain exists and has at least one granted feat id.
 */
export function detectMissingDomainData(
  domainId: string,
  catalog: DomainCatalog,
): ValidationOutcome | null {
  const dom = catalog.domains.find((d) => d.id === domainId);

  if (!dom) {
    return resolveValidationOutcome({
      affectedIds: [domainId],
      blockKind: 'missing-source',
      hasConflict: false,
      hasMissingEvidence: true,
      passesRule: false,
      ruleKnown: true,
    });
  }

  if (dom.grantedFeatIds.length === 0) {
    return resolveValidationOutcome({
      affectedIds: [domainId],
      blockKind: 'missing-source',
      hasConflict: false,
      hasMissingEvidence: true,
      passesRule: false,
      ruleKnown: true,
    });
  }

  return null;
}
