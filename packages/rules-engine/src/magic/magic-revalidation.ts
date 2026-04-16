import type { SpellCatalog } from '@data-extractor/contracts/spell-catalog';
import type { DomainCatalog } from '@data-extractor/contracts/domain-catalog';
import type { BuildStateAtLevel } from '../feats/feat-prerequisite';
import {
  resolveValidationOutcome,
  type ValidationOutcome,
} from '../contracts/validation-outcome';
import { evaluateSpellPrerequisites } from './spell-prerequisite';
import { evaluateDomainSelection } from './domain-rules';
import {
  detectMissingSpellData,
  detectMissingDomainData,
} from './catalog-fail-closed';

export type MagicEvaluationStatus = 'legal' | 'illegal' | 'blocked' | 'pending';

export interface MagicLevelInput {
  buildState: BuildStateAtLevel;
  level: number;
  domainsSelected: string[];
  spellbookAdditions: Record<number, string[]>;
  knownSpells: Record<number, string[]>;
  swapsApplied: Array<{
    forgotten: string;
    learned: string;
    appliedAtLevel: number;
  }>;
}

export interface RevalidatedMagicLevel {
  inheritedFromLevel: number | null;
  issues: ValidationOutcome[];
  level: number;
  status: MagicEvaluationStatus;
}

/**
 * Remove duplicate ValidationOutcomes by (status, code, sorted affectedIds, blockKind).
 *
 * Copied byte-for-byte from feat-revalidation.ts to preserve the exact dedupe key
 * contract the cascade pattern relies on (07-RESEARCH Shared Patterns).
 */
function dedupeIssues(issues: ValidationOutcome[]): ValidationOutcome[] {
  const seen = new Set<string>();

  return issues.filter((issue) => {
    const key = JSON.stringify([
      issue.status,
      issue.code,
      [...issue.affectedIds].sort(),
      'blockKind' in issue ? issue.blockKind : null,
    ]);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/**
 * Produce the missing-source outcome used for later levels that inherit a break from
 * an earlier illegal level. Mirrors feat-revalidation::getInheritedIssue.
 */
function getInheritedIssue(affectedIds: string[]): ValidationOutcome {
  return resolveValidationOutcome({
    affectedIds,
    blockKind: 'missing-source',
    hasConflict: false,
    hasMissingEvidence: true,
    passesRule: false,
    ruleKnown: true,
  });
}

/**
 * Produce the illegal outcome for a selection whose own prerequisites failed. Mirrors
 * feat-revalidation::createIllegalIssue.
 */
function createIllegalIssue(affectedIds: string[]): ValidationOutcome {
  return resolveValidationOutcome({
    affectedIds,
    hasConflict: false,
    hasMissingEvidence: false,
    passesRule: false,
    ruleKnown: true,
  });
}

/**
 * Sequentially revalidate magic selections across levels. Cascades breaks: once an
 * earlier level is illegal, later levels with selections become blocked with
 * `inheritedFromLevel` pointing at the break. Later levels without any selections
 * remain blocked but carry no issues (user hasn't drawn attention to them yet).
 *
 * Mirrors feat-revalidation::revalidateFeatSnapshotAfterChange. Diff summary:
 *   - evaluates spell/domain prereqs + catalog fail-closed
 *   - dedupe + inheritance helpers are copies of feat-revalidation's versions
 *   - pending state: no selections and no caster class levels
 */
export function revalidateMagicSnapshotAfterChange(input: {
  levels: MagicLevelInput[];
  spellCatalog: SpellCatalog;
  domainCatalog: DomainCatalog;
}): RevalidatedMagicLevel[] {
  let inheritedBreakLevel: number | null = null;

  return input.levels.map((lvl) => {
    const issues: ValidationOutcome[] = [];
    const affectedIds: string[] = [];

    for (const d of lvl.domainsSelected) affectedIds.push(d);
    for (const list of Object.values(lvl.spellbookAdditions))
      for (const s of list) affectedIds.push(s);
    for (const list of Object.values(lvl.knownSpells))
      for (const s of list) affectedIds.push(s);

    const hasAnySelection = affectedIds.length > 0;
    const hasCaster =
      Object.keys(lvl.buildState.casterLevelByClass ?? {}).length > 0;

    if (inheritedBreakLevel !== null) {
      if (hasAnySelection) {
        return {
          inheritedFromLevel: inheritedBreakLevel,
          issues: dedupeIssues([getInheritedIssue(affectedIds)]),
          level: lvl.level,
          status: 'blocked',
        };
      }
      return {
        inheritedFromLevel: inheritedBreakLevel,
        issues: [],
        level: lvl.level,
        status: 'blocked',
      };
    }

    // Catalog fail-closed pass (VALI-02 / LANG-02)
    for (const domainId of lvl.domainsSelected) {
      const missing = detectMissingDomainData(domainId, input.domainCatalog);
      if (missing) issues.push(missing);
    }
    for (const list of Object.values(lvl.spellbookAdditions)) {
      for (const spellId of list) {
        const missing = detectMissingSpellData(spellId, input.spellCatalog);
        if (missing) issues.push(missing);
      }
    }
    for (const list of Object.values(lvl.knownSpells)) {
      for (const spellId of list) {
        const missing = detectMissingSpellData(spellId, input.spellCatalog);
        if (missing) issues.push(missing);
      }
    }

    // Domain prerequisite evaluation (VALI-01 hard block)
    for (const domainId of lvl.domainsSelected) {
      const dom = input.domainCatalog.domains.find((d) => d.id === domainId);
      if (!dom) continue;
      const siblings = lvl.domainsSelected.filter((x) => x !== domainId);
      const result = evaluateDomainSelection(
        domainId,
        siblings,
        lvl.buildState,
        input.domainCatalog,
      );
      if (!result.met) issues.push(createIllegalIssue([domainId]));
    }

    // Spell prerequisite evaluation (VALI-02)
    const checkSpell = (spellId: string) => {
      const sp = input.spellCatalog.spells.find((s) => s.id === spellId);
      if (!sp) return;
      const result = evaluateSpellPrerequisites(
        sp,
        lvl.buildState,
        input.spellCatalog,
      );
      if (!result.met) issues.push(createIllegalIssue([spellId]));
    };
    for (const list of Object.values(lvl.spellbookAdditions))
      list.forEach(checkSpell);
    for (const list of Object.values(lvl.knownSpells)) list.forEach(checkSpell);

    const deduped = dedupeIssues(issues);
    const hasIllegal = deduped.some((i) => i.status === 'illegal');
    const hasBlocked = deduped.some((i) => i.status === 'blocked');

    if (hasIllegal) {
      inheritedBreakLevel = lvl.level;
      return {
        inheritedFromLevel: null,
        issues: deduped,
        level: lvl.level,
        status: 'illegal',
      };
    }

    if (hasBlocked) {
      return {
        inheritedFromLevel: null,
        issues: deduped,
        level: lvl.level,
        status: 'blocked',
      };
    }

    if (!hasAnySelection && !hasCaster) {
      return {
        inheritedFromLevel: null,
        issues: [],
        level: lvl.level,
        status: 'pending',
      };
    }

    return {
      inheritedFromLevel: null,
      issues: [],
      level: lvl.level,
      status: 'legal',
    };
  });
}
