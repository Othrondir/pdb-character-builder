import type { DomainCatalog } from '@data-extractor/contracts/domain-catalog';
import type {
  BuildStateAtLevel,
  PrerequisiteCheck,
  PrerequisiteCheckResult,
} from '../feats/feat-prerequisite';
import type { ValidationOutcome } from '../contracts/validation-outcome';
import { detectMissingDomainData } from './catalog-fail-closed';

/**
 * Maximum number of domains a cleric may select (D-11: "Selecciona 2 dominios").
 * Exported so the UI and tests reference the same literal.
 */
export const MAX_DOMAINS_PER_CLERIC = 2;

/**
 * Evaluate whether a given domain can be added to the cleric's already-selected domain
 * set. Returns a PrerequisiteCheckResult whose checks capture two gates:
 *   1. Caller must have at least 1 cleric level.
 *   2. Selecting this domain must not push the total over MAX_DOMAINS_PER_CLERIC.
 *
 * Both gates must pass for `met = true`, mirroring feat prereq semantics.
 */
export function evaluateDomainSelection(
  domainId: string,
  alreadySelected: ReadonlyArray<string>,
  buildState: BuildStateAtLevel,
  _domainCatalog: DomainCatalog,
): PrerequisiteCheckResult {
  const checks: PrerequisiteCheck[] = [];

  const clericLevel = buildState.classLevels['class:cleric'] ?? 0;
  checks.push({
    type: 'class-level',
    label: 'Clérigo',
    met: clericLevel >= 1,
    required: 'Nivel 1',
    current: clericLevel > 0 ? `Nivel ${clericLevel}` : 'Sin niveles',
  });

  const wouldBeCount = alreadySelected.includes(domainId)
    ? alreadySelected.length
    : alreadySelected.length + 1;
  checks.push({
    type: 'level',
    label: 'Dominios seleccionados',
    met: wouldBeCount <= MAX_DOMAINS_PER_CLERIC,
    required: `<= ${MAX_DOMAINS_PER_CLERIC}`,
    current: `${wouldBeCount}`,
  });

  return {
    met: checks.every((c) => c.met),
    checks,
  };
}

/**
 * Result row for `getEligibleDomains`. Carries the compiled domain alongside any
 * missing-source ValidationOutcome so the UI can display the item with a blocked badge
 * instead of silently dropping it.
 */
export interface EligibleDomainRow {
  domain: DomainCatalog['domains'][number];
  missingData: ValidationOutcome | null;
}

/**
 * Enumerate every domain in the catalog with a fail-closed missing-data marker. Returns
 * an empty array for non-cleric builds — domains are cleric-only in NWN1 EE / Puerta.
 */
export function getEligibleDomains(
  buildState: BuildStateAtLevel,
  domainCatalog: DomainCatalog,
): EligibleDomainRow[] {
  const clericLevel = buildState.classLevels['class:cleric'] ?? 0;
  if (clericLevel < 1) return [];

  return domainCatalog.domains.map((d) => ({
    domain: d,
    missingData: detectMissingDomainData(d.id, domainCatalog),
  }));
}
