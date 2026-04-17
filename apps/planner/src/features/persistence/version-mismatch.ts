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
 * schemaVersion is validated separately by Zod (`z.literal(1)` in buildDocumentSchema).
 * If schema shape ever diverges across versions, the Zod parse fails before this function runs.
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
