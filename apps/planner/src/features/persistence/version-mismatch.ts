import { CURRENT_DATASET_ID, RULESET_VERSION } from '@planner/data/ruleset-version';
import type { BuildDocument } from './build-document-schema';

export interface RulesetDiff {
  incomingRulesetVersion: string;
  currentRulesetVersion: string;
  incomingDatasetId: string;
  currentDatasetId: string;
  mismatchFields: Array<'rulesetVersion' | 'datasetId'>;
}

/**
 * D-07 fail-closed version check.
 * Returns null when incoming matches current on BOTH rulesetVersion AND datasetId.
 * Returns structured diff when EITHER differs. Caller must NOT hydrate on non-null.
 *
 * schemaVersion is validated separately by Zod (`z.literal(2)` in buildDocumentSchema).
 * If schema shape ever diverges across versions, the Zod parse fails before this function runs.
 *
 * plannerVersion is informational metadata stamped at projection time; it is NOT compared
 * by this helper because the runtime fail-closed gate only blocks ruleset/dataset drift
 * (skill rules, feat tables, class progressions). Surfacing plannerVersion drift to the
 * user is a UX concern, not a correctness one.
 *
 * Version header parity (Phase 14-06 audit): the canonical 4-field set is
 * `schemaVersion`, `plannerVersion`, `rulesetVersion`, `datasetId`. See
 * `build-document-schema.ts:30-33`. ALL four are stamped at projection time and
 * round-tripped through every persistence path (Dexie, JSON export/import, share URL).
 */
export function diffRuleset(incoming: BuildDocument): RulesetDiff | null {
  const mismatchFields: Array<'rulesetVersion' | 'datasetId'> = [];
  if (incoming.rulesetVersion !== RULESET_VERSION) {
    mismatchFields.push('rulesetVersion');
  }
  if (incoming.datasetId !== CURRENT_DATASET_ID) {
    mismatchFields.push('datasetId');
  }
  if (mismatchFields.length === 0) {
    return null;
  }
  return {
    incomingRulesetVersion: incoming.rulesetVersion,
    currentRulesetVersion: RULESET_VERSION,
    incomingDatasetId: incoming.datasetId,
    currentDatasetId: CURRENT_DATASET_ID,
    mismatchFields,
  };
}
