import type { SpellCatalog } from '@data-extractor/contracts/spell-catalog';
import type { DomainCatalog } from '@data-extractor/contracts/domain-catalog';
import type { ValidationOutcome } from '../contracts/validation-outcome';
import {
  revalidateMagicSnapshotAfterChange,
  type MagicEvaluationStatus,
  type MagicLevelInput,
  type RevalidatedMagicLevel,
} from './magic-revalidation';

/**
 * Status priority for the full-build rollup. Lower value = more severe; the
 * worst severity across all levels becomes the aggregate status. Mirrors the
 * selector STATUS_ORDER exactly so the aggregator and runtime summary stay
 * consistent.
 */
const STATUS_ORDER: Record<MagicEvaluationStatus, number> = {
  illegal: 0,
  blocked: 1,
  legal: 2,
  pending: 3,
};

export interface MagicAggregateInput {
  levels: MagicLevelInput[];
  spellCatalog: SpellCatalog;
  domainCatalog: DomainCatalog;
}

export interface PerLevelMagicView {
  level: number;
  status: MagicEvaluationStatus;
  inheritedFromLevel: number | null;
  issueCount: number;
}

export interface MagicAggregateView {
  status: MagicEvaluationStatus;
  illegalLevels: number[];
  repairLevels: number[];
  issues: ValidationOutcome[];
  perLevel: PerLevelMagicView[];
  illegalCount: number;
  repairCount: number;
}

/**
 * Roll up per-level magic legality into a single build-wide view. Runs the
 * cascade revalidator once and walks the result collecting illegal / blocked
 * levels, a flattened issue list, and per-level issue counts. The aggregate
 * status is the worst (lowest-order) status across all levels.
 *
 * - `illegalLevels`: levels whose own selections fail prereqs (the cascade
 *   break points).
 * - `repairLevels`: levels whose selections are held blocked pending repair
 *   of an earlier level, OR whose selections hit a catalog fail-closed gate
 *   (missing spell description, missing domain data).
 * - `issues`: every ValidationOutcome from every level, in order.
 */
export function aggregateMagicLegality(
  input: MagicAggregateInput,
): MagicAggregateView {
  const revalidated: RevalidatedMagicLevel[] = revalidateMagicSnapshotAfterChange({
    levels: input.levels,
    spellCatalog: input.spellCatalog,
    domainCatalog: input.domainCatalog,
  });

  const issues: ValidationOutcome[] = [];
  const illegalLevels: number[] = [];
  const repairLevels: number[] = [];
  const perLevel: PerLevelMagicView[] = [];

  let worst: MagicEvaluationStatus = 'pending';

  for (const r of revalidated) {
    if (STATUS_ORDER[r.status] < STATUS_ORDER[worst]) worst = r.status;
    if (r.status === 'illegal') illegalLevels.push(r.level);
    if (r.status === 'blocked') repairLevels.push(r.level);
    for (const issue of r.issues) issues.push(issue);
    perLevel.push({
      level: r.level,
      status: r.status,
      inheritedFromLevel: r.inheritedFromLevel,
      issueCount: r.issues.length,
    });
  }

  return {
    status: worst,
    illegalLevels,
    repairLevels,
    issues,
    perLevel,
    illegalCount: illegalLevels.length,
    repairCount: repairLevels.length,
  };
}
