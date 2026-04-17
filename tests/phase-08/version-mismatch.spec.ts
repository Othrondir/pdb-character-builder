import { describe, it, expect } from 'vitest';
import './setup';
import { sampleBuildDocument } from './setup';
import { diffRuleset } from '@planner/features/persistence';
import {
  CURRENT_DATASET_ID,
  RULESET_VERSION,
} from '@planner/data/ruleset-version';
import type { BuildDocument } from '@planner/features/persistence/build-document-schema';

describe('diffRuleset (D-07)', () => {
  it('returns null when incoming matches current constants', () => {
    expect(diffRuleset(sampleBuildDocument())).toBeNull();
  });

  it('flags rulesetVersion mismatch only', () => {
    const base = sampleBuildDocument();
    const incoming: BuildDocument = { ...base, rulesetVersion: '9.9.9' };
    const diff = diffRuleset(incoming);
    expect(diff).not.toBeNull();
    expect(diff!.mismatchFields).toEqual(['rulesetVersion']);
    expect(diff!.incomingRulesetVersion).toBe('9.9.9');
    expect(diff!.currentRulesetVersion).toBe(RULESET_VERSION);
    expect(diff!.incomingDatasetId).toBe(base.datasetId);
    expect(diff!.currentDatasetId).toBe(CURRENT_DATASET_ID);
  });

  it('flags datasetId mismatch only', () => {
    const base = sampleBuildDocument();
    const incoming: BuildDocument = {
      ...base,
      datasetId: 'puerta-ee-2099-01-01+deadbeef',
    };
    const diff = diffRuleset(incoming);
    expect(diff).not.toBeNull();
    expect(diff!.mismatchFields).toEqual(['datasetId']);
    expect(diff!.incomingDatasetId).toBe('puerta-ee-2099-01-01+deadbeef');
    expect(diff!.currentDatasetId).toBe(CURRENT_DATASET_ID);
  });

  it('flags both fields when both differ', () => {
    const base = sampleBuildDocument();
    const incoming: BuildDocument = {
      ...base,
      rulesetVersion: '9.9.9',
      datasetId: 'puerta-ee-2099-01-01+deadbeef',
    };
    const diff = diffRuleset(incoming);
    expect(diff).not.toBeNull();
    expect(diff!.mismatchFields).toHaveLength(2);
    expect(diff!.mismatchFields).toContain('rulesetVersion');
    expect(diff!.mismatchFields).toContain('datasetId');
  });
});
