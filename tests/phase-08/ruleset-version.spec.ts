import { describe, it, expect } from 'vitest';
import {
  PLANNER_VERSION,
  RULESET_VERSION,
  BUILD_ENCODING_VERSION,
  CURRENT_DATASET_ID,
  formatDatasetLabel,
} from '@planner/data/ruleset-version';
import { compiledClassCatalog } from '@planner/data/compiled-classes';

describe('ruleset-version', () => {
  it('CURRENT_DATASET_ID matches compiled catalog', () => {
    expect(CURRENT_DATASET_ID).toBe(compiledClassCatalog.datasetId);
  });

  it('CURRENT_DATASET_ID matches datasetId regex', () => {
    expect(CURRENT_DATASET_ID).toMatch(/^puerta-ee-\d{4}-\d{2}-\d{2}\+[a-z0-9]+$/);
  });

  it('version constants are non-empty strings', () => {
    expect(PLANNER_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(RULESET_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('BUILD_ENCODING_VERSION is literal 1', () => {
    expect(BUILD_ENCODING_VERSION).toBe(1);
  });

  it('formatDatasetLabel returns a human-readable one-liner', () => {
    const label = formatDatasetLabel();
    expect(label).toMatch(/^Ruleset v\d+\.\d+\.\d+ · Dataset /);
    expect(label).toContain(RULESET_VERSION);
  });

  it('formatDatasetLabel includes the dataset ISO date and hash when shape matches', () => {
    const label = formatDatasetLabel();
    // Current compiled catalogs emit puerta-ee-YYYY-MM-DD+hash. Label must reflect both.
    expect(label).toMatch(/Dataset \d{4}-\d{2}-\d{2} \([a-z0-9]+\)/);
  });
});
